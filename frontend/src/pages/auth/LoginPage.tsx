import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authService, cartService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authService.login(data),
    onSuccess: async (res) => {
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);

      // Merge guest cart
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        try { await cartService.mergeGuestCart(guestId); } catch {}
        localStorage.removeItem('guestId');
      }

      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(redirect, { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Login failed');
    },
  });

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-normal text-center text-velour-black mb-2">Sign In</h1>
      <p className="text-center text-sm text-velour-grey mb-8">Welcome back to He & She</p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} className="form-input" placeholder="you@example.com" />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label" htmlFor="password">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-velour-grey hover:text-velour-gold transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              {...register('password')} 
              className="form-input pr-10" 
              placeholder="••••••••" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-velour-grey hover:text-velour-black transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3.5 mt-2">
          {mutation.isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-velour-grey">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-velour-black font-medium hover:text-velour-gold transition-colors">
            Create one
          </Link>
        </p>
      </div>

      <div className="mt-6 p-4 bg-velour-ivory text-xs text-velour-grey">
        <p className="font-medium mb-1">Demo credentials:</p>
        <p>Customer: <span className="text-velour-black">demo@velour.in / Demo@123</span></p>
        <p>Admin: <span className="text-velour-black">admin@velour.in / Admin@123</span></p>
      </div>
    </div>
  );
}
