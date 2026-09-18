import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-velour-off-white px-4 text-center">
      <p className="font-display text-8xl font-normal text-velour-light-grey mb-4">404</p>
      <h1 className="font-display text-3xl font-normal text-velour-black mb-3">Page Not Found</h1>
      <p className="text-velour-grey mb-8 max-w-sm">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <Home size={16} /> Return Home
      </Link>
    </div>
  );
}
