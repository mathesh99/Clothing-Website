import { prisma } from '../config/database';
import { BadRequestError } from '../utils/errors';
import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey, 
  process.env.BREVO_API_KEY || ''
);

export const otpService = {
  async sendRegistrationOtp(email: string) {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing OTPs for this email that are unverified
    await prisma.otpVerification.deleteMany({
      where: { email, isVerified: false }
    });

    // Save the new OTP to the database
    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        expiresAt,
      }
    });

    // Send the live email
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = "Your He & She Registration Code";
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome to He & She!</h2>
          <p>Your one-time verification code is:</p>
          <h1 style="letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 15px; border-radius: 8px; display: inline-block;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;
      // Brevo requires the sender email to be verified in their dashboard.
      // process.env.SMTP_USER represents the email you verify in Brevo (e.g. premanadar999@gmail.com).
      sendSmtpEmail.sender = { name: "He & She", email: process.env.SMTP_USER || 'hello@heandshe.com' };
      sendSmtpEmail.to = [{ email }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log(`Live OTP email sent successfully to ${email}`);
      console.log(`\n=================================================`);
      console.log(`🔑 DEV MODE: The OTP for ${email} is: ${otp}`);
      console.log(`=================================================\n`);
    } catch (error: any) {
      console.error('Failed to send OTP email via Brevo:', error);
      throw new BadRequestError(`Brevo Error: ${error.message || 'Failed to send email'}`);
    }
    
    return { message: 'OTP sent successfully' };
  },

  async verifyOtp(email: string, otp: string) {
    const record = await prisma.otpVerification.findFirst({
      where: { email, otp, isVerified: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestError('OTP has expired');
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isVerified: true }
    });

    return { message: 'Email verified successfully' };
  }
};
