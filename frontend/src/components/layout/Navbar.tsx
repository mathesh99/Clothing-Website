import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { label: 'New In', href: '/shop?isNewArrival=true' },
  { label: "Men's", href: '/shop?category=men' },
  { label: "Women's", href: '/shop?category=women' },
  { label: 'Kids', href: '/shop?category=kids' },
  { label: 'Ethnic', href: '/shop?category=ethnic' },
  { label: 'Activewear', href: '/shop?category=activewear' },
  { label: 'Sale', href: '/shop?sortBy=price_asc' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-velour-black text-white text-center py-2 text-xs tracking-widest uppercase">
        Free shipping on orders above ₹999 · Use code <span className="text-velour-gold font-medium">HEANDSHE10</span> for 10% off
      </div>

      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? 'shadow-sm' : ''}`}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-velour-charcoal hover:text-velour-black"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="font-display font-semibold text-2xl lg:text-3xl tracking-[0.15em] text-velour-black">
                He & She
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium tracking-wide text-velour-charcoal hover:text-velour-black transition-colors duration-150 relative group"
                >
                  {link.label === 'Sale' ? (
                    <span className="text-velour-gold">{link.label}</span>
                  ) : (
                    <>
                      {link.label}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-velour-black transition-all duration-200 group-hover:w-full" />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                className="p-2 text-velour-charcoal hover:text-velour-black transition-colors"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* User */}
              <div className="relative">
                <button
                  className="p-2 text-velour-charcoal hover:text-velour-black transition-colors flex items-center gap-1"
                  onClick={() => {
                    if (isAuthenticated) setUserMenuOpen((v) => !v);
                    else navigate('/auth/login');
                  }}
                  aria-label="Account"
                >
                  <User size={20} />
                  {isAuthenticated && (
                    <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {userMenuOpen && isAuthenticated && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-velour-ivory shadow-lg z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-velour-ivory">
                      <p className="text-xs text-velour-grey">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2.5 text-sm text-velour-gold font-medium hover:bg-velour-off-white"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="block px-4 py-2.5 text-sm hover:bg-velour-off-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2.5 text-sm hover:bg-velour-off-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-velour-error hover:bg-velour-off-white border-t border-velour-ivory"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="p-2 text-velour-charcoal hover:text-velour-black transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart size={20} />
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="p-2 text-velour-charcoal hover:text-velour-black transition-colors relative"
                aria-label={`Cart, ${itemCount} items`}
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-velour-black text-white text-2xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Click outside to close user menu */}
        {userMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 py-5 border-b border-velour-ivory">
              <span className="font-display text-xl tracking-widest">He & She</span>
              <button onClick={() => setMobileOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="block px-5 py-3.5 text-sm font-medium tracking-wide border-b border-velour-ivory hover:bg-velour-off-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label === 'Sale' ? (
                    <span className="text-velour-gold">{link.label}</span>
                  ) : link.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-velour-ivory px-5 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <p className="text-xs text-velour-grey">{user?.email}</p>
                  <Link to="/profile" className="block text-sm" onClick={() => setMobileOpen(false)}>My Profile</Link>
                  <Link to="/orders" className="block text-sm" onClick={() => setMobileOpen(false)}>My Orders</Link>
                  <button onClick={handleLogout} className="text-sm text-velour-error">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="btn-primary w-full text-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link to="/auth/register" className="btn-secondary w-full text-center" onClick={() => setMobileOpen(false)}>Create Account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-start pt-24 px-4 animate-fade-in">
          <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-velour-grey" />
              <input
                id="search-input"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands..."
                className="w-full pl-12 pr-12 py-4 border-b-2 border-velour-black bg-transparent text-lg text-velour-black placeholder:text-velour-light-grey focus:outline-none"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-velour-grey hover:text-velour-black"
                onClick={() => setSearchOpen(false)}
              >
                <X size={20} />
              </button>
            </form>
            <p className="text-xs text-velour-grey mt-4 tracking-wider">Press Enter to search</p>
          </div>
          <div className="fixed inset-0 -z-10" onClick={() => setSearchOpen(false)} />
        </div>
      )}
    </>
  );
}
