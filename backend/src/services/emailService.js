const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: user.trim(), pass: pass.trim() }
        });
        console.log('\x1b[32m%s\x1b[0m', `✓ [EmailService] Gmail SMTP Transport initialized for: ${user}`);
      } catch (err) {
        console.error('Failed to initialize Gmail transporter:', err.message);
        this.transporter = null;
      }
    } else {
      this.transporter = null;
    }
  }

  isConfigured() {
    const user = process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;
    return Boolean(user && pass);
  }

  /**
   * Send Password Reset OTP Email
   */
  async sendPasswordResetOtp(toEmail, userName, otpCode) {
    const fromAddress = process.env.GMAIL_USER || process.env.EMAIL_USER || 'no-reply@civicpulse.wb.gov.in';
    const cleanEmail = toEmail.toLowerCase().trim();
    const displayName = userName || 'Citizen / Officer';
    const currentYear = new Date().getFullYear();

    const subject = `[CivicPulse.AI] ${otpCode} is your Password Reset Verification Code`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="560px" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f2747 0%, #1e3a8a 100%); padding: 26px 30px; text-align: center;">
              <div style="color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">
                GOVERNMENT OF WEST BENGAL • CIVICPULSE.AI
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                Password Reset Verification
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">
                Hello <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset the password for your <strong>CivicPulse.AI</strong> portal account associated with <span style="color: #1e40af; font-weight: 600;">${cleanEmail}</span>.
              </p>

              <!-- OTP Callout Box -->
              <div style="background: #f8fafc; border: 1.5px dashed #3b82f6; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">
                  Your 6-Digit One-Time Password (OTP)
                </div>
                <div style="font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #1e3a8a; font-family: Monaco, Consolas, 'Courier New', monospace; padding: 4px 0;">
                  ${otpCode}
                </div>
                <div style="font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 8px;">
                  ⏱️ Valid for 10 minutes only
                </div>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Enter this code in the password reset window to choose a new password. If you did not request this verification code, please ignore this email or change your password immediately if you suspect unauthorized access.
              </p>

              <!-- Security Checklist -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
                <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">
                  🔒 Security Guidelines:
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.5;">
                  <li>Never disclose this OTP to anyone, including municipal personnel or support staff.</li>
                  <li>Our officers will never contact you requesting your OTP or password.</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              This is an automated system notification from the CivicPulse Citizen Grievance Portal.<br>
              Department of Urban & Rural Municipal Governance, Government of West Bengal © ${currentYear}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Attempt real Gmail SMTP dispatch if configured
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"CivicPulse.AI Support" <${fromAddress}>`,
          to: cleanEmail,
          subject,
          text: `Your CivicPulse.AI password reset OTP is: ${otpCode}. It is valid for 10 minutes.`,
          html: htmlContent
        });

        console.log('\x1b[32m%s\x1b[0m', `✓ [EmailService] Gmail OTP successfully dispatched to ${cleanEmail}. Message ID: ${info.messageId}`);
        return { success: true, mode: 'gmail_smtp', messageId: info.messageId };
      } catch (sendErr) {
        console.error('Gmail SMTP Dispatch Error:', sendErr.message);
        // Fallback to local console log
      }
    }

    // Fallback / Development Simulation Log (guarantees local & staging testing works instantly)
    console.log('\n' + '='.repeat(70));
    console.log('\x1b[33m%s\x1b[0m', '📧 [GMAIL OTP DISPATCH - SIMULATION / LOCAL CONSOLE]');
    console.log(`To: \x1b[36m${cleanEmail}\x1b[0m (${displayName})`);
    console.log(`Subject: ${subject}`);
    console.log(`OTP Code: \x1b[32m\x1b[1m${otpCode}\x1b[0m (Valid for 10 minutes)`);
    console.log('\x1b[90m%s\x1b[0m', 'Note: To deliver real emails, set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env');
    console.log('='.repeat(70) + '\n');

    return { 
      success: true, 
      mode: 'console_simulated',
      debug_otp: otpCode 
    };
  }
}

module.exports = new EmailService();

