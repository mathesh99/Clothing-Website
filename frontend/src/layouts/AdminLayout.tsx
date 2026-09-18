import { useState } from 'react';
import { ScrollRestoration, NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  LogOut, Menu, X, ChevronRight, Layers, Home, User, Tag, Image as ImageIcon, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Inventory', href: '/admin/inventory', icon: Layers },
  { label: 'Catalogue', href: '/admin/catalogue', icon: Tag },
  { label: 'Website CMS', href: '/admin/content', icon: ImageIcon },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Customers', href: '/admin/customers', icon: Users },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    clearAuth();
    toast.success('Logged out');
    navigate('/auth/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-velour-black text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
        <Link to="/" className="font-display text-2xl tracking-[0.2em] text-white">He & She</Link>
        <span className="text-2xs text-velour-gold tracking-widest uppercase">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {ADMIN_NAV.map(({ label, href, icon: Icon, exact }) => (
          <NavLink
            key={href}
            to={href}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-velour-gold text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <div className="px-3 mb-3">
          <p className="text-xs text-white/50">Signed in as</p>
          <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-velour-off-white flex">
      <ScrollRestoration />
      
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-60 shadow-xl">
            <Sidebar />
          </div>
          <button className="absolute top-4 left-62 text-white" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-velour-ivory px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <button className="lg:hidden text-velour-charcoal" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-velour-grey">
            <Link to="/" className="hover:text-velour-black">Store</Link>
            <ChevronRight size={12} />
            <span>Admin</span>
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Home button */}
            <Link
              to="/"
              title="Go to Store"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-velour-charcoal hover:text-velour-black hover:bg-velour-ivory rounded-sm transition-colors"
            >
              <Home size={15} />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {/* User avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-velour-ivory transition-colors"
                aria-label="User menu"
              >
                <div className="w-7 h-7 rounded-full bg-velour-black text-white flex items-center justify-center">
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
                    : <User size={14} />}
                </div>
                <span className="hidden sm:block text-sm font-medium text-velour-charcoal">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronRight size={12} className={`text-velour-grey transition-transform ${userMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-velour-ivory shadow-lg z-20 py-1">
                    <div className="px-3 py-2 border-b border-velour-ivory">
                      <p className="text-xs text-velour-grey">Signed in as</p>
                      <p className="text-sm font-medium text-velour-black truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-velour-charcoal hover:bg-velour-ivory transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
