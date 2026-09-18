import { Link } from 'react-router-dom';
// Brand icons like Facebook/Twitter were removed from lucide-react in recent versions. Using generic text/links instead.

const FOOTER_LINKS = {
  Shop: [
    { label: 'New Arrivals', href: '/shop?isNewArrival=true' },
    { label: "Men's", href: '/shop?category=men' },
    { label: "Women's", href: '/shop?category=women' },
    { label: 'Kids', href: '/shop?category=kids' },
    { label: 'Accessories', href: '/shop?category=accessories' },
    { label: 'Sale', href: '/shop?sortBy=price_asc' },
  ],
  'Customer Care': [
    { label: 'Track Your Order', href: '/orders' },
    { label: 'Returns & Exchanges', href: '#' },
    { label: 'Shipping Policy', href: '#' },
    { label: 'Size Guide', href: '#' },
    { label: 'FAQs', href: '#' },
    { label: 'Contact Us', href: '#' },
  ],
  'About He & She': [
    { label: 'Our Story', href: '#' },
    { label: 'Sustainability', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Affiliates', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-velour-black text-white mt-auto">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-2xl font-normal mb-2">Stay in the loop</h3>
              <p className="text-velour-light-grey text-sm">Be the first to know about new collections and exclusive offers.</p>
            </div>
            <form
              className="flex gap-0 w-full lg:w-auto lg:min-w-96"
              onSubmit={(e) => { e.preventDefault(); }}
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-velour-gold transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-velour-gold hover:bg-velour-gold-dark text-white text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <span className="font-display text-2xl font-semibold tracking-[0.2em] text-white">
              He & She
            </span>
            <p className="text-velour-light-grey text-sm mt-4 leading-relaxed">
              Premium fashion for the modern wardrobe. Crafted with care, designed for life.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-velour-light-grey text-sm hover:text-velour-gold transition-colors">Instagram</a>
              <a href="#" className="text-velour-light-grey text-sm hover:text-velour-gold transition-colors">Twitter</a>
              <a href="#" className="text-velour-light-grey text-sm hover:text-velour-gold transition-colors">Facebook</a>
              <a href="#" className="text-velour-light-grey text-sm hover:text-velour-gold transition-colors">YouTube</a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-medium tracking-widest uppercase text-velour-gold mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-velour-light-grey hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-velour-grey">
          <p>© {new Date().getFullYear()} He & She. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
          <div className="flex items-center gap-2">
            <span>We accept:</span>
            <div className="flex gap-2">
              {['Visa', 'MC', 'UPI', 'Razorpay'].map(p => (
                <span key={p} className="bg-white/10 px-2 py-0.5 rounded text-2xs">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
