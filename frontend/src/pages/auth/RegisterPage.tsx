import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const emailSchema = z.object({
  email: z.string().email('Invalid email'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'Must be at least 6 digits'),
});

const detailsSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Step 1: Email Form
  const { register: regEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrs } } = useForm({
    resolver: zodResolver(emailSchema),
  });

  // Step 2: OTP Form
  const { register: regOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrs } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  // Step 3: Details Form
  const { register: regDetails, handleSubmit: handleDetailsSubmit, formState: { errors: detailsErrs } } = useForm({
    resolver: zodResolver(detailsSchema),
  });

  const sendOtpMutation = useMutation({
    mutationFn: (data: { email: string }) => authService.sendRegistrationOtp(data.email),
    onSuccess: (_, variables) => {
      setEmail(variables.email);
      setStep(2);
      toast.success('Verification code sent to your email');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send OTP'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { otp: string }) => authService.verifyRegistrationOtp(email, data.otp),
    onSuccess: () => {
      setStep(3);
      toast.success('Email verified successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Invalid or expired OTP'),
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => authService.register({
      email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    }),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome to He & She, ${user.firstName}!`);
      navigate('/');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Registration failed'),
  });

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-normal text-center text-velour-black mb-2">Create Account</h1>
      <p className="text-center text-sm text-velour-grey mb-8">Join He & She — Wear the Difference</p>

      {/* Step 1: Email */}
      {step === 1 && (
        <form onSubmit={handleEmailSubmit((d: any) => sendOtpMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input type="email" {...regEmail('email')} className="form-input" placeholder="you@example.com" />
            {emailErrs.email && <p className="form-error">{emailErrs.email.message as string}</p>}
          </div>
          <button type="submit" disabled={sendOtpMutation.isPending} className="btn-primary w-full py-3.5">
            {sendOtpMutation.isPending ? 'Sending code...' : 'Continue'}
          </button>
        </form>
      )}

      {/* Step 2: Verify OTP */}
      {step === 2 && (
        <form onSubmit={handleOtpSubmit((d: any) => verifyOtpMutation.mutate(d))} className="space-y-4">
          <div className="text-sm text-velour-grey text-center mb-4">
            We sent a verification code to <strong>{email}</strong>
          </div>
          <div>
            <label className="form-label">Verification Code</label>
            <input type="text" {...regOtp('otp')} className="form-input text-center tracking-[0.5em] text-lg font-medium" placeholder="000000" maxLength={6} />
            {otpErrs.otp && <p className="form-error">{otpErrs.otp.message as string}</p>}
          </div>
          <button type="submit" disabled={verifyOtpMutation.isPending} className="btn-primary w-full py-3.5">
            {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify Email'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full mt-2 text-sm">
            Change email address
          </button>
        </form>
      )}

      {/* Step 3: Account Details */}
      {step === 3 && (
        <form onSubmit={handleDetailsSubmit((d: any) => registerMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">First Name</label>
              <input {...regDetails('firstName')} className="form-input" placeholder="First" />
              {detailsErrs.firstName && <p className="form-error">{detailsErrs.firstName.message as string}</p>}
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input {...regDetails('lastName')} className="form-input" placeholder="Last" />
              {detailsErrs.lastName && <p className="form-error">{detailsErrs.lastName.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="form-label">Phone (optional)</label>
            <input type="tel" {...regDetails('phone')} className="form-input" placeholder="+91 00000 00000" />
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                {...regDetails('password')} 
                className="form-input pr-10" 
                placeholder="At least 8 characters" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-velour-grey hover:text-velour-black transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {detailsErrs.password && <p className="form-error">{detailsErrs.password.message as string}</p>}
          </div>

          <div>
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                {...regDetails('confirmPassword')} 
                className="form-input pr-10" 
                placeholder="Repeat password" 
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-velour-grey hover:text-velour-black transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {detailsErrs.confirmPassword && <p className="form-error">{detailsErrs.confirmPassword.message as string}</p>}
          </div>

          <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full py-3.5">
            {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-velour-grey">
        By creating an account, you agree to our{' '}
        <a href="#" className="underline">Terms of Service</a> and{' '}
        <a href="#" className="underline">Privacy Policy</a>.
      </p>

      <div className="mt-6 text-center">
        <p className="text-sm text-velour-grey">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-velour-black font-medium hover:text-velour-gold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
