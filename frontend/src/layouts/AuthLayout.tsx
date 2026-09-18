import { Outlet, Link, ScrollRestoration } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-velour-ivory flex flex-col">
      <ScrollRestoration />
      <header className="py-8 text-center">
        <Link to="/">
          <span className="font-display text-3xl font-semibold tracking-[0.2em] text-velour-black">
            He & She
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-velour-grey">
        © {new Date().getFullYear()} He & She. All rights reserved.
      </footer>
    </div>
  );
}
