import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Phone, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONTACT } from '../data/mockProducts';
import { getStoreStatus } from '../utils/storeHours';

const NAV_SECTIONS = ['catalog-section', 'about-section', 'services-section', 'footer-contact'];

interface NavbarProps {
  onNavigateHome?: () => void;
  onNavigateStore?: () => void;
  onNavigateAbout?: () => void;
  onNavigateServices?: () => void;
  onNavigateContact?: () => void;
  onOpenPaymentPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateStore,
  onNavigateAbout,
  onNavigateServices,
  onNavigateContact,
  onOpenPaymentPortal
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const storeStatus = getStoreStatus();

  // Highlight the nav link for the section currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
        if (window.scrollY < 200) setActiveSection('top');
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    NAV_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const links = [
    { id: 'top', label: 'Home', onNavigate: onNavigateHome },
    { id: 'catalog-section', label: 'Catalog', onNavigate: onNavigateStore },
    { id: 'about-section', label: 'About', onNavigate: onNavigateAbout },
    { id: 'services-section', label: 'Repairs & Services', onNavigate: onNavigateServices },
    { id: 'footer-contact', label: 'Contact', onNavigate: onNavigateContact }
  ];

  const handleScrollTo = (id: string, fallbackFn?: () => void) => {
    setIsMobileMenuOpen(false);
    if (fallbackFn) {
      fallbackFn();
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b] border-b-2 border-amber-400">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleScrollTo('top', onNavigateHome);
            }}
            className="flex items-center gap-3 cursor-pointer group py-1"
          >
            <img
              src="/images/logo_dark_bg.png"
              alt="Tools මහගෙදර"
              className="h-11 sm:h-13 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform duration-300"
            />
            <div className="hidden xl:flex flex-col text-left leading-none">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                DIRECT IMPORTER
              </span>
              <span className="text-xs font-black tracking-wider text-white font-display mt-0.5">
                KALUTARA, SRI LANKA
              </span>
            </div>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-zinc-300 font-display">
            {links.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleScrollTo(link.id, link.onNavigate);
                }}
                aria-current={activeSection === link.id ? 'location' : undefined}
                className={
                  activeSection === link.id
                    ? 'text-amber-400 cursor-pointer py-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-400'
                    : 'hover:text-amber-400 transition-colors cursor-pointer py-1'
                }
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Phone + pay online + cart + mobile menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenPaymentPortal && (
              <button
                type="button"
                onClick={onOpenPaymentPortal}
                className="hidden lg:flex items-center gap-1.5 px-3.5 h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all font-display cursor-pointer shadow-xs border border-amber-500"
              >
                <CreditCard className="w-4 h-4 text-zinc-950" />
                <span>Pay Online</span>
              </button>
            )}

            <a
              href={`tel:${STORE_CONTACT.phone}`}
              className="hidden sm:flex items-center gap-2 px-3 h-11 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 text-sm font-semibold transition-colors border border-zinc-800"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>{STORE_CONTACT.phone}</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={totalItems > 0 ? `Cart, ${totalItems} items` : 'Cart'}
              className="relative w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#09090b]">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-amber-400 transition-colors cursor-pointer md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div id="mobile-nav" className="bg-[#0c0d12] border-b border-zinc-800 px-6 py-4 space-y-4 text-base font-semibold text-zinc-200 md:hidden font-display">
          <nav className="flex flex-col">
            {links.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleScrollTo(link.id, link.onNavigate);
                }}
                aria-current={activeSection === link.id ? 'location' : undefined}
                className={`py-2.5 ${activeSection === link.id ? 'text-amber-400' : 'hover:text-amber-400 transition-colors'}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {onOpenPaymentPortal && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPaymentPortal();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-amber-400 text-zinc-950 text-sm font-black font-display uppercase tracking-wider cursor-pointer shadow-xs"
            >
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Online Payment Portal</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-zinc-950 text-white px-2 py-0.5 rounded">
                LANKAPAY
              </span>
            </button>
          )}

          <a
            href={`tel:${STORE_CONTACT.phone}`}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-sans"
          >
            <span className="text-zinc-300">
              Call the store
              <span className={`block text-xs ${storeStatus.isOpen ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {storeStatus.label}
              </span>
            </span>
            <span className="text-amber-400 font-bold">{STORE_CONTACT.phone}</span>
          </a>
        </div>
      )}
    </header>
  );
};
