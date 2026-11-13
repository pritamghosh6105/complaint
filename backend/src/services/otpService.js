/**
 * CivicPulse AI — Enterprise Mobile OTP Service
 * 
 * Strict Security Rules Enforced:
 * 1. NEVER leaks OTP in HTTP API responses (even in staging/dev).
 * 2. 5-Minute Expiration: codes expire in 300 seconds.
 * 3. Invalidation on Resend: requesting a new code completely invalidates any prior code.
 * 4. Anti-Brute-Force Lockout: locked out after 4 incorrect guesses to prevent 6-digit brute forcing.
 * 5. Single-Use Consumption: code is destroyed immediately upon successful verification.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

class OTPService {
  constructor() {
    // In-memory store: phone -> OTP Record
    this.otpStore = new Map();
    // Expiration duration: 5 minutes (300,000 ms)
    this.expirationMs = 5 * 60 * 1000;
    // Maximum allowed incorrect guesses before lockout
    this.maxAttempts = 4;
    // Resend cooldown to prevent SMS spam: 30 seconds
    this.resendCooldownMs = 30 * 1000;

    // Periodic cleanup of expired records every 10 minutes
    setInterval(() => this.cleanupExpired(), 10 * 60 * 1000);
  }

  /**
   * Normalize 10-digit Indian mobile number
   */
  normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return '';
    // Strip all non-digit characters
    let cleaned = rawPhone.replace(/\D/g, '');
    // Strip leading country code (+91 or 91) if 12 digits
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    }
    // Strip leading zero if 11 digits
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  }

  /**
   * Format masked phone number for safe display (e.g. "+91 ******4321")
   */
  maskPhone(phone) {
    const clean = this.normalizePhone(phone);
    if (clean.length < 4) return '+91 ******';
    const last4 = clean.slice(-4);
    return `+91 ******${last4}`;
  }

  /**
   * Generate and send 6-digit Mobile OTP
   * NEVER returns the OTP in the returned object!
   */
  async sendOtp(rawPhone) {
    const phone = this.normalizePhone(rawPhone);
    if (!phone || phone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const now = Date.now();
    const existing = this.otpStore.get(phone);

    // Rate Limit: 30-second cooldown between resends
    if (existing && !existing.isLocked && (now - existing.lastSentAt < this.resendCooldownMs)) {
      const waitSec = Math.ceil((this.resendCooldownMs - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new OTP.`);
    }

    // Rule 2: Invalidate old codes whenever a new one is requested
    this.otpStore.delete(phone);

    // Generate cryptographically secure 6-digit random code (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = now + this.expirationMs;

    // Save fresh record
    this.otpStore.set(phone, {
      code,
      phone,
      createdAt: now,
      lastSentAt: now,
      expiresAt,
      attempts: 0,
      isLocked: false
    });

    // Simulated Secure SMS Dispatch (Never sent via HTTP API response)
    console.log('\n=======================================================');
    console.log(`📱 [CIVICPULSE SECURE MOBILE SMS GATEWAY]`);
    console.log(`Recipient : +91 ******${phone.slice(-4)}`);
    console.log(`Your OTP  : [ ${code} ]`);
    console.log(`Validity  : 5 Minutes (Expires at ${new Date(expiresAt).toLocaleTimeString()})`);
    console.log(`Security  : Locked after ${this.maxAttempts} incorrect attempts`);
    console.log('=======================================================\n');

    // Rule 1: NEVER send the OTP in the API response
    return {
      success: true,
      message: `A 6-digit verification code was sent to ${this.maskPhone(phone)}.`,
      maskedPhone: this.maskPhone(phone),
      expiresInSeconds: Math.round(this.expirationMs / 1000),
      resendCooldownSeconds: Math.round(this.resendCooldownMs / 1000)
    };
  }

  /**
   * Verify entered 6-digit OTP
   * Rule 3: Lock out after 4 wrong guesses
   */
  async verifyOtp(rawPhone, enteredCode) {
    const phone = this.normalizePhone(rawPhone);
    const cleanCode = (enteredCode || '').toString().trim();

    if (!phone || phone.length !== 10) {
      return { valid: false, error: 'Invalid mobile phone number.' };
    }

    if (!cleanCode || cleanCode.length !== 6) {
      return { valid: false, error: 'Please enter the full 6-digit verification code.' };
    }

    const record = this.otpStore.get(phone);

    // Check if code exists
    if (!record) {
      return { 
        valid: false, 
        error: 'No active OTP found for this number. Please request a new code.' 
      };
    }

    // Rule 3: Check if locked out
    if (record.isLocked) {
      return {
        valid: false,
        locked: true,
        error: 'Too many incorrect attempts. This OTP has been permanently invalidated. Please request a new code.'
      };
    }

    // Rule 2: Check expiration (3–5 minutes)
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      return {
        valid: false,
        expired: true,
        error: 'This OTP has expired (valid for 5 minutes). Please request a new code.'
      };
    }

    // Support fixed test code for automated staging/dev if explicitly configured
    const isTestCode = process.env.DEMO_OTP_CODE && cleanCode === process.env.DEMO_OTP_CODE;
    const isMatch = (record.code && cleanCode === record.code) || isTestCode;

    // Handle Incorrect Guess
    if (!isMatch) {
      record.attempts += 1;
      const remaining = this.maxAttempts - record.attempts;

      // Rule 3: Lockout after 4 wrong guesses
      if (remaining <= 0) {
        record.isLocked = true;
        record.code = null; // Instantly destroy code from memory
        return {
          valid: false,
          locked: true,
          attemptsRemaining: 0,
          error: `Too many incorrect attempts. For your security, this code has been locked and invalidated. Please request a new code.`
        };
      }

      return {
        valid: false,
        locked: false,
        attemptsRemaining: remaining,
        error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`
      };
    }

    // SUCCESS: Match confirmed!
    // Rule: Single-use consumption — invalidate OTP immediately so it cannot be reused
    this.otpStore.delete(phone);

    // Issue cryptographic Phone Verification Token valid for 15 minutes to complete registration
    const verificationToken = jwt.sign(
      { phone, verified: true, purpose: 'phone_verification' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      valid: true,
      message: 'Mobile number verified successfully.',
      verificationToken,
      phone
    };
  }

  /**
   * Verify if a verification token matches the phone number
   */
  verifyPhoneToken(token, rawPhone) {
    if (!token) return false;
    const expectedPhone = this.normalizePhone(rawPhone);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.verified === true && 
             decoded.purpose === 'phone_verification' && 
             decoded.phone === expectedPhone;
    } catch (_) {
      return false;
    }
  }

  /**
   * Periodic cleanup of expired records
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [phone, record] of this.otpStore.entries()) {
      if (now > record.expiresAt + 60000) {
        this.otpStore.delete(phone);
      }
    }
  }
}

module.exports = new OTPService();
