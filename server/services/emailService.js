// server/services/emailService.js

const nodemailer = require('nodemailer');

// ── Transporter (Gmail via OAuth-compatible App Password) ──
// Supports Gmail (App Password) or Brevo SMTP
// Gmail:  host=smtp.gmail.com, port=587
// Brevo:  host=smtp-relay.brevo.com, port=587
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ── Verify connection on startup ──────────────
transporter.verify((err) => {
    if (err) {
        console.error('[EMAIL] Transporter setup failed:', err.message);
    } else {
        console.log('[EMAIL] Transporter ready — Gmail SMTP connected');
    }
});

// ── Shared HTML wrapper ───────────────────────
const emailWrapper = (content) => `
<div style="font-family: Arial, sans-serif; max-width: 600px;
            margin: 0 auto; padding: 30px; background: #f9f9f9;">
  <div style="background: white; border-radius: 8px; padding: 30px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #2D6A4F; margin: 0; font-size: 24px;">🌱 FarmSense AI</h1>
      <p style="color: #888; margin: 4px 0 0; font-size: 13px;">Smart Farming Assistant</p>
    </div>
    ${content}
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0;">
      FarmSense AI — Smart Farming Assistant<br/>
      If you did not request this, please ignore this email.
    </p>
  </div>
</div>`;

// ── 1. Verification Email ─────────────────────
const sendVerificationEmail = async (email, name, token) => {
    const verifyUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
        from: `"FarmSense AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '✅ Verify your FarmSense AI account',
        html: emailWrapper(`
            <h2 style="color: #2D6A4F;">Welcome, ${name}!</h2>
            <p style="color: #444; line-height: 1.6;">
                Thank you for registering. Click the button below to verify
                your email address and activate your account.
            </p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="${verifyUrl}"
                   style="background: #2D6A4F; color: white; padding: 14px 36px;
                          text-decoration: none; border-radius: 6px;
                          font-size: 15px; font-weight: bold;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #888; font-size: 13px;">
                This link expires in <strong>24 hours</strong>.
            </p>
            <p style="color: #aaa; font-size: 12px; word-break: break-all;">
                Or copy this link: ${verifyUrl}
            </p>
        `)
    });
};

// ── 2. Password Reset Email ───────────────────
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"FarmSense AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔑 Reset your FarmSense AI password',
        html: emailWrapper(`
            <h2 style="color: #2D6A4F;">Password Reset Request</h2>
            <p style="color: #444; line-height: 1.6;">
                Hi <strong>${name}</strong>, we received a request to reset
                your password. Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}"
                   style="background: #c0392b; color: white; padding: 14px 36px;
                          text-decoration: none; border-radius: 6px;
                          font-size: 15px; font-weight: bold;">
                    Reset Password
                </a>
            </div>
            <p style="color: #888; font-size: 13px;">
                This link expires in <strong>1 hour</strong>.
                If you did not request a password reset, you can safely ignore this email.
            </p>
        `)
    });
};

// ── 3. Test Email ─────────────────────────────
const sendTestEmail = async (email, name) => {
    await transporter.sendMail({
        from: `"FarmSense AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🧪 FarmSense AI — Email Test Successful',
        html: emailWrapper(`
            <h2 style="color: #2D6A4F;">Email is working!</h2>
            <p style="color: #444; line-height: 1.6;">
                Hi <strong>${name}</strong>, your email notifications are
                configured correctly. You'll receive weather alerts and
                AI suggestions at this address.
            </p>
            <p style="color: #888; font-size: 13px;">
                Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
        `)
    });
};

// ── 4. Welcome Email (after verification) ─────
const sendWelcomeEmail = async (email, name) => {
    await transporter.sendMail({
        from: `"FarmSense AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🌾 Welcome to FarmSense AI!',
        html: emailWrapper(`
            <h2 style="color: #2D6A4F;">You're all set, ${name}!</h2>
            <p style="color: #444; line-height: 1.6;">
                Your email has been verified. Complete your farm profile
                to start getting AI-powered recommendations.
            </p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/onboarding"
                   style="background: #2D6A4F; color: white; padding: 14px 36px;
                          text-decoration: none; border-radius: 6px;
                          font-size: 15px; font-weight: bold;">
                    Setup My Farm
                </a>
            </div>
        `)
    });
};

// ── 5. Inspection Invoice Email ───────────────
const sendInspectionInvoiceEmail = async (email, name, pdfBuffer) => {
    await transporter.sendMail({
        from: `"FarmSense AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🧾 Your Soil Inspection Booking & Invoice',
        html: emailWrapper(`
            <h2 style="color: #2D6A4F;">Booking Confirmed, ${name}!</h2>
            <p style="color: #444; line-height: 1.6;">
                Thank you for booking a professional Soil Inspection with FarmSense AI.
                We have received your payment of <strong>₹500</strong>.
            </p>
            <p style="color: #444; line-height: 1.6;">
                Please find your official invoice attached to this email as a PDF.
                Our agronomy team will contact you shortly to finalize the exact time of the visit.
            </p>
        `),
        attachments: [
            {
                filename: 'FarmSense_Invoice.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendTestEmail,
    sendWelcomeEmail,
    sendInspectionInvoiceEmail,
};
