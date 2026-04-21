import nodemailer from 'nodemailer';

/**
 * FIX: createTransport now properly handles missing credentials
 * and logs a warning instead of silently failing.
 */
function createTransport() {
  // Priority 1: SendGrid (if configured)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    });
  }

  // Priority 2: Gmail with App Password
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass ||
      gmailUser === 'your-email@gmail.com' ||
      gmailPass === 'your-app-password') {
    console.warn(
      '⚠️  Email credentials not configured. OTP emails will fail.\n' +
      '   Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env\n' +
      '   Generate an App Password at: https://myaccount.google.com/apppasswords'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

function otpBlock(otp) {
  return `
    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;background:#EFF6FF;border:2px dashed #2563EB;border-radius:10px;padding:18px 40px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#1D4ED8;">${otp}</span>
      </div>
    </div>`;
}

function emailWrapper(title, subtitle, bodyHTML) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">
      <div style="background:#2563EB;padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">MeetCut</h1>
        <p style="margin:4px 0 0;color:#BFDBFE;font-size:13px;">${subtitle}</p>
      </div>
      <div style="padding:32px;">${bodyHTML}</div>
      <div style="background:#F3F4F6;padding:16px 32px;text-align:center;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} MeetCut. All rights reserved.</p>
      </div>
    </div>
  </body></html>`;
}

/** Send signup / email-verification OTP */
export async function sendOtpEmail(email, otp) {
  const transporter = createTransport();
  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 28px;">Use the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
    ${otpBlock(otp)}
    <p style="color:#6B7280;font-size:13px;margin:0 0 4px;">If you didn't create a MeetCut account, you can safely ignore this email.</p>
    <p style="color:#6B7280;font-size:13px;margin:0;">Never share this code with anyone.</p>`;

  try {
    await transporter.sendMail({
      from:    `"MeetCut" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: 'Verify your MeetCut account – OTP',
      html:    emailWrapper('Email Verification', 'Signup Verification', body),
    });
    console.log(`[Email] OTP sent to ${email}`);
  } catch (err) {
    console.error(`[Email] Failed to send OTP to ${email}:`, err.message);
    throw new Error(`Failed to send verification email. Please check email configuration.\n${err.message}`);
  }
}

/** Send password-reset OTP */
export async function sendPasswordResetEmail(email, otp) {
  const transporter = createTransport();
  const body = `
    <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 28px;">We received a request to reset your MeetCut password. Use the OTP below. It expires in <strong>10 minutes</strong>.</p>
    ${otpBlock(otp)}
    <p style="color:#6B7280;font-size:13px;margin:0 0 4px;">If you didn't request this, please ignore this email — your password won't change.</p>
    <p style="color:#6B7280;font-size:13px;margin:0;">Never share this code with anyone.</p>`;

  try {
    await transporter.sendMail({
      from:    `"MeetCut" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: 'MeetCut – Password Reset OTP',
      html:    emailWrapper('Password Reset', 'Account Security', body),
    });
    console.log(`[Email] Password reset OTP sent to ${email}`);
  } catch (err) {
    console.error(`[Email] Failed to send reset OTP to ${email}:`, err.message);
    throw new Error(`Failed to send reset email. Please check email configuration.\n${err.message}`);
  }
}
