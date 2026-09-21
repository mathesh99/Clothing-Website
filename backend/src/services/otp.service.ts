import { prisma } from '../config/database';
import { BadRequestError } from '../utils/errors';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
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

      if (error) {
        console.error('Resend API Error:', error);
        throw new Error(error.message);
      }
      console.log(`Live OTP email sent successfully to ${email}`);
      console.log(`\n=================================================`);
      console.log(`🔑 DEV MODE: The OTP for ${email} is: ${otp}`);
      console.log(`=================================================\n`);
    } catch (error: any) {
      console.error('Failed to send OTP email:', error);
      throw new BadRequestError(`Resend Error: ${error.message}`);
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
