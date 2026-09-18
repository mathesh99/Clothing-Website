import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

type F = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (d: F) => authService.resetPassword(token, d.password),
    onSuccess: () => { toast.success('Password reset successfully'); navigate('/auth/login'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reset failed'),
  });

  if (!token) return (
    <div className="text-center"><p className="text-velour-grey">Invalid reset link.</p><Link to="/auth/forgot-password" className="btn-primary mt-4">Request new link</Link></div>
  );

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-normal text-center mb-2">Reset Password</h1>
      <p className="text-center text-sm text-velour-grey mb-8">Choose a new password for your account.</p>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="form-label">New Password</label>
          <input type="password" {...register('password')} className="form-input" placeholder="At least 8 characters" />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>
        <div>
          <label className="form-label">Confirm Password</label>
          <input type="password" {...register('confirm')} className="form-input" />
          {errors.confirm && <p className="form-error">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3.5">
          {mutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
