import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authService.forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // always show success (prevent email enumeration)
  });

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-velour-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="font-display text-2xl font-normal mb-3">Check your email</h1>
        <p className="text-sm text-velour-grey mb-6">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </p>
        <Link to="/auth/login" className="btn-primary px-8">Back to Sign In</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-normal text-center mb-2">Forgot Password</h1>
      <p className="text-center text-sm text-velour-grey mb-8">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
            required
          />
        </div>
        <button type="submit" disabled={mutation.isPending || !email} className="btn-primary w-full py-3.5">
          {mutation.isPending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/auth/login" className="text-sm text-velour-grey hover:text-velour-black transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}
