import bcrypt from "bcryptjs";
import { generateSecret, verify as verifyToken, generate as generateToken } from "otplib";
import QRCode from "qrcode";
import { db } from "../db";
import { authUsers, type AuthUser, type UserRole } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { sendOTPEmail, generateOTP } from "./emailService";

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string): Promise<AuthUser | undefined> {
  const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email.toLowerCase()));
  return user;
}

export async function getUserById(id: string): Promise<AuthUser | undefined> {
  const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
  return user;
}

export async function getAllAuthUsers(): Promise<AuthUser[]> {
  return db.select().from(authUsers);
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullNameAr?: string;
  role?: UserRole;
}): Promise<AuthUser> {
  const passwordHash = await hashPassword(data.password);
  const [user] = await db
    .insert(authUsers)
    .values({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      fullNameAr: data.fullNameAr,
      role: data.role || "employee",
      emailVerified: false,
    })
    .returning();
  return user;
}

export async function updateUser(id: string, data: Partial<AuthUser>): Promise<AuthUser | undefined> {
  const [user] = await db
    .update(authUsers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(authUsers.id, id))
    .returning();
  return user;
}

export async function validateLogin(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string; requiresOTP?: boolean; requiresTOTP?: boolean }> {
  const user = await getUserByEmail(email);

  if (!user) {
    return { success: false, error: "invalid_credentials" };
  }

  if (!user.isActive) {
    return { success: false, error: "account_disabled" };
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return { success: false, error: "account_locked" };
  }

  if (!user.passwordHash) {
    return { success: false, error: "no_password_set" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const lockUntil = attempts >= MAX_FAILED_ATTEMPTS 
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) 
      : null;

    await updateUser(user.id, {
      failedLoginAttempts: attempts,
      lockedUntil: lockUntil,
    });

    return { success: false, error: "invalid_credentials" };
  }

  await updateUser(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  if (user.totpEnabled && user.totpSecret) {
    return { success: true, user, requiresTOTP: true };
  }

  return { success: true, user };
}

export async function sendEmailOTP(userId: string, isArabic: boolean = false): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.email) return false;

  const otp = generateOTP();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await updateUser(userId, {
    emailOtpCode: otp,
    emailOtpExpiry: expiry,
  });

  return sendOTPEmail(user.email, otp, isArabic);
}

export async function verifyEmailOTP(userId: string, otp: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  if (!user.emailOtpCode || !user.emailOtpExpiry) return false;
  if (new Date(user.emailOtpExpiry) < new Date()) return false;
  if (user.emailOtpCode !== otp) return false;

  await updateUser(userId, {
    emailOtpCode: null,
    emailOtpExpiry: null,
    emailVerified: true,
  });

  return true;
}

export async function generateTOTPSecret(userId: string): Promise<{ secret: string; qrCode: string } | null> {
  const user = await getUserById(userId);
  if (!user || !user.email) return null;

  const secret = generateSecret();
  const otpauth = `otpauth://totp/Inferixe:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Inferixe`;
  const qrCode = await QRCode.toDataURL(otpauth);

  await updateUser(userId, { totpSecret: secret });

  return { secret, qrCode };
}

export async function enableTOTP(userId: string, token: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.totpSecret) return false;

  try {
    const result = await verifyToken({ secret: user.totpSecret, token });
    if (!result.valid) return false;

    await updateUser(userId, { totpEnabled: true });
    return true;
  } catch (error) {
    console.error("TOTP enable verification error:", error);
    return false;
  }
}

export async function disableTOTP(userId: string): Promise<boolean> {
  await updateUser(userId, { totpEnabled: false, totpSecret: null });
  return true;
}

export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.totpSecret) return false;

  try {
    const result = await verifyToken({ secret: user.totpSecret, token });
    return result.valid;
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

export async function completeLogin(userId: string): Promise<AuthUser | undefined> {
  return updateUser(userId, { lastLoginAt: new Date() });
}

const RESET_TOKEN_EXPIRY_HOURS = 1;

export function generateResetToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createPasswordResetToken(email: string): Promise<{ token: string; user: AuthUser } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = generateResetToken();
  const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await updateUser(user.id, {
    passwordResetToken: token,
    passwordResetExpiry: expiry,
  });

  return { token, user };
}

export async function verifyResetToken(token: string): Promise<AuthUser | null> {
  const [user] = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.passwordResetToken, token));

  if (!user) return null;
  if (!user.passwordResetExpiry || new Date(user.passwordResetExpiry) < new Date()) {
    return null;
  }

  return user;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const user = await verifyResetToken(token);
  if (!user) return false;

  const passwordHash = await hashPassword(newPassword);
  await updateUser(user.id, {
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiry: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  return true;
}
