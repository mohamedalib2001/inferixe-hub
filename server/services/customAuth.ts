import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import * as authService from "./authService";
import { sendPasswordResetEmail } from "./emailService";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    pendingUserId?: string;
    requiresTOTP?: boolean;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: "inferixe.sid",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
      path: "/",
    },
  });
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function cleanupRateLimits() {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [ip, record] of entries) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

setInterval(cleanupRateLimits, 5 * 60 * 1000);

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function setupCustomAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ message: "Too many login attempts. Please try again later." });
      }

      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await authService.validateLogin(email, password);

      if (!result.success) {
        const messages: Record<string, string> = {
          invalid_credentials: "Invalid email or password",
          account_disabled: "Account is disabled",
          account_locked: "Account is temporarily locked due to too many failed attempts",
          no_password_set: "Please set a password first",
        };
        return res.status(401).json({ message: messages[result.error!] || "Login failed" });
      }

      if (result.requiresTOTP) {
        req.session.pendingUserId = result.user!.id;
        req.session.requiresTOTP = true;
        return res.json({ requiresTOTP: true, message: "Please enter your authenticator code" });
      }

      req.session.userId = result.user!.id;
      await authService.completeLogin(result.user!.id);

      const { passwordHash, totpSecret, emailOtpCode, passwordResetToken, passwordResetExpiry, ...safeUser } = result.user!;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-totp", async (req, res) => {
    try {
      const { code } = req.body;
      const pendingUserId = req.session.pendingUserId;

      if (!pendingUserId || !req.session.requiresTOTP) {
        return res.status(400).json({ message: "No pending authentication" });
      }

      const isValid = await authService.verifyTOTP(pendingUserId, code);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid authenticator code" });
      }

      req.session.userId = pendingUserId;
      req.session.pendingUserId = undefined;
      req.session.requiresTOTP = undefined;

      await authService.completeLogin(pendingUserId);
      const user = await authService.getUserById(pendingUserId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { passwordHash, totpSecret, emailOtpCode, passwordResetToken, passwordResetExpiry, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("TOTP verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/send-otp", isAuthenticated, async (req, res) => {
    try {
      const isArabic = req.body.language === "ar";
      const sent = await authService.sendEmailOTP(req.session.userId!, isArabic);
      
      if (!sent) {
        return res.status(500).json({ message: "Failed to send verification code" });
      }
      
      res.json({ message: "Verification code sent" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-email", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const isValid = await authService.verifyEmailOTP(req.session.userId!, code);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid or expired verification code" });
      }
      
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/setup-totp", isAuthenticated, async (req, res) => {
    try {
      const result = await authService.generateTOTPSecret(req.session.userId!);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to generate authenticator secret" });
      }
      
      res.json({ qrCode: result.qrCode, secret: result.secret });
    } catch (error) {
      console.error("TOTP setup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/enable-totp", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const success = await authService.enableTOTP(req.session.userId!, code);
      
      if (!success) {
        return res.status(401).json({ message: "Invalid authenticator code" });
      }
      
      res.json({ message: "Authenticator enabled successfully" });
    } catch (error) {
      console.error("Enable TOTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/disable-totp", isAuthenticated, async (req, res) => {
    try {
      await authService.disableTOTP(req.session.userId!);
      res.json({ message: "Authenticator disabled" });
    } catch (error) {
      console.error("Disable TOTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await authService.getUserById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      const { passwordHash, totpSecret, emailOtpCode, passwordResetToken, passwordResetExpiry, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("inferixe.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, fullNameAr } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await authService.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await authService.createUser({
        email,
        password,
        firstName,
        lastName,
        fullNameAr,
      });

      req.session.userId = user.id;
      
      const { passwordHash, totpSecret, emailOtpCode, passwordResetToken, passwordResetExpiry, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await authService.getUserById(req.session.userId!);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Unable to change password" });
      }

      const isValid = await authService.verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const newHash = await authService.hashPassword(newPassword);
      await authService.updateUser(user.id, { passwordHash: newHash });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }

      const { email } = req.body;
      const isArabic = req.body.language === "ar";
      
      if (!email) {
        return res.status(400).json({ message: isArabic ? "البريد الإلكتروني مطلوب" : "Email is required" });
      }

      const result = await authService.createPasswordResetToken(email);
      
      if (result) {
        await sendPasswordResetEmail(result.user.email!, result.token, isArabic);
      }

      res.json({ 
        message: isArabic 
          ? "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور" 
          : "If this email is registered, a password reset link will be sent" 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const user = await authService.verifyResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      const isArabic = req.body.language === "ar";
      
      if (!token || !password) {
        return res.status(400).json({ 
          message: isArabic ? "الرمز وكلمة المرور مطلوبان" : "Token and password are required" 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          message: isArabic ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters" 
        });
      }

      const success = await authService.resetPassword(token, password);
      
      if (!success) {
        return res.status(400).json({ 
          message: isArabic ? "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" : "Invalid or expired reset link" 
        });
      }

      res.json({ 
        message: isArabic ? "تم إعادة تعيين كلمة المرور بنجاح" : "Password has been reset successfully" 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
