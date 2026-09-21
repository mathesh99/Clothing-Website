import { prisma } from '../config/database';
import { BadRequestError } from '../utils/errors';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});
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
      await transporter.sendMail({
        from: `"He & She" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your He & She Registration Code',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2>Welcome to He & She!</h2>
            <p>Your one-time verification code is:</p>
            <h1 style="letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 15px; border-radius: 8px; display: inline-block;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });

      console.log(`Live OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new BadRequestError('Failed to send verification email. Please try again later.');
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
