import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string, isArabic: boolean = false): Promise<boolean> {
  try {
    const subject = isArabic ? "رمز التحقق - Inferixe" : "Verification Code - Inferixe";
    const html = isArabic
      ? `
        <div dir="rtl" style="font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1a365d; margin-bottom: 20px;">رمز التحقق</h2>
            <p style="color: #666; margin-bottom: 20px;">رمز التحقق الخاص بك هو:</p>
            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; padding: 20px; background: #f0f9ff; border-radius: 8px; margin-bottom: 20px;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 12px;">هذا الرمز صالح لمدة 10 دقائق</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1a365d; margin-bottom: 20px;">Verification Code</h2>
            <p style="color: #666; margin-bottom: 20px;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; padding: 20px; background: #f0f9ff; border-radius: 8px; margin-bottom: 20px;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 12px;">This code is valid for 10 minutes</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this code, please ignore this email</p>
          </div>
        </div>
      `;

    await transporter.sendMail({
      from: `"Inferixe" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendPasswordResetEmail(to: string, resetToken: string, isArabic: boolean = false): Promise<boolean> {
  try {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "http://localhost:5000";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const subject = isArabic ? "إعادة تعيين كلمة المرور - Inferixe" : "Password Reset - Inferixe";
    const html = isArabic
      ? `
        <div dir="rtl" style="font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1a365d; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #666; margin-bottom: 20px;">لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك.</p>
            <p style="color: #666; margin-bottom: 30px;">اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              إعادة تعيين كلمة المرور
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">هذا الرابط صالح لمدة ساعة واحدة فقط</p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 11px;">إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:</p>
            <p style="color: #2563eb; font-size: 11px; word-break: break-all;">${resetLink}</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1a365d; margin-bottom: 20px;">Password Reset</h2>
            <p style="color: #666; margin-bottom: 20px;">We received a request to reset your password.</p>
            <p style="color: #666; margin-bottom: 30px;">Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link is valid for 1 hour only</p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">If you didn't request a password reset, please ignore this email</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 11px;">If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="color: #2563eb; font-size: 11px; word-break: break-all;">${resetLink}</p>
          </div>
        </div>
      `;

    await transporter.sendMail({
      from: `"Inferixe" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
