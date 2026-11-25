import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ShoppingCart,
  Phone,
  CreditCard,
  Search,
  House,
  LayoutGrid,
  MessageCircle,
  Check,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONTACT, CATEGORIES } from '../data/mockProducts';
import { getStoreStatus } from '../utils/storeHours';
import { scrollToSection } from '../utils/scrollToSection';

const NAV_SECTIONS = ['catalog-section', 'about-section', 'services-section', 'footer-contact'];

interface NavbarProps {
  onNavigateHome?: () => void;
  onNavigateStore?: () => void;
  onNavigateAbout?: () => void;
  onNavigateServices?: () => void;
  onNavigateContact?: () => void;
  onOpenPaymentPortal?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onOpenCategories: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateStore,
  onNavigateAbout,
  onNavigateServices,
  onNavigateContact,
  onOpenPaymentPortal,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenCategories
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    // Start scrolling after the mobile menu has closed: removing it mid-scroll cancels the scroll
    window.setTimeout(() => {
      if (fallbackFn) {
        fallbackFn();
      } else if (document.getElementById(id)) {
        scrollToSection(id);
      } else if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const pickCategory = (catId: string) => {
    setIsMobileMenuOpen(false);
    onSelectCategory(catId);
    scrollToSection('catalog-section');
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchInputRef.current?.blur();
    setIsMobileMenuOpen(false);
    scrollToSection('catalog-section');
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      'Hello Tools Mahagedara,\n\nI need advice on choosing the right power tool and would like to check availability and prices.'
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${text}`, '_blank');
  };

  const tabClass = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-semibold transition-colors cursor-pointer ${
      active ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#09090b] border-b-2 border-amber-400">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between gap-3 h-14 sm:h-16 md:h-20">

            {/* Logo */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                handleScrollTo('top', onNavigateHome);
              }}
              className="flex items-center gap-3 cursor-pointer group py-1 shrink-0"
            >
              <img fetchPriority="high" decoding="async"
                src="/images/logo_dark_bg.webp"
                alt="Tools මහගෙදර"
                className="h-9 sm:h-11 md:h-13 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform duration-300"
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

            {/* Phone: app-style search bar */}
            <form role="search" onSubmit={submitSearch} className="md:hidden flex-1 min-w-0">
              <label htmlFor="header-search" className="sr-only">Search tools</label>
              <div className="flex items-center h-10 rounded-full bg-white border-2 border-amber-400 pl-4 pr-1">
                <input
                  ref={searchInputRef}
                  id="header-search"
                  type="search"
                  enterKeyHint="search"
                  placeholder="Search drills, grinders…"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search"
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-zinc-950 text-amber-400 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

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

            {/* Desktop: phone + pay online + cart */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
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
                className="flex items-center gap-2 px-3 h-11 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 text-sm font-semibold transition-colors border border-zinc-800"
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
            </div>
          </div>
        </div>

        {/* Phone: category tabs */}
        <nav aria-label="Categories" className="md:hidden flex items-center gap-5 overflow-x-auto no-scrollbar px-3 text-sm font-semibold font-display">
          {[{ id: 'all', name: 'All' }, ...CATEGORIES].map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => pickCategory(cat.id)}
                aria-pressed={isActive}
                className={`relative shrink-0 whitespace-nowrap py-2.5 cursor-pointer transition-colors ${
                  isActive
                    ? 'text-white font-black after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-amber-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </nav>

        {/* Phone: delivery + warranty promise strip */}
        <button
          type="button"
          onClick={() => handleScrollTo('about-section', onNavigateAbout)}
          className="md:hidden w-full flex items-center gap-2 px-3 py-2 bg-amber-50 text-[12px] text-zinc-800 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" strokeWidth={3} />
          <span className="font-semibold text-emerald-800 whitespace-nowrap">Island-wide delivery</span>
          <span className="w-px h-3.5 bg-zinc-300 shrink-0" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="font-semibold text-emerald-800 truncate">Official warranty on every tool</span>
          <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto shrink-0" />
        </button>

        {/* Phone: "More" menu */}
        {isMobileMenuOpen && (
          <div id="mobile-nav" className="bg-[#0c0d12] border-t border-zinc-800 px-6 py-4 space-y-4 text-base font-semibold text-zinc-200 md:hidden font-display">
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

      {/* Phone: bottom tab bar */}
      <nav
        aria-label="Shop"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => handleScrollTo('top', onNavigateHome)}
            aria-current={!isMobileMenuOpen && (activeSection === 'top' || activeSection === 'catalog-section') ? 'page' : undefined}
            className={tabClass(!isMobileMenuOpen && (activeSection === 'top' || activeSection === 'catalog-section'))}
          >
            <House className="w-6 h-6" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              scrollToSection('catalog-section');
              onOpenCategories();
            }}
            className={tabClass(false)}
          >
            <LayoutGrid className="w-6 h-6" />
            <span>Categories</span>
          </button>

          <button type="button" onClick={openWhatsApp} className={tabClass(false)}>
            <MessageCircle className="w-6 h-6 text-emerald-500" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsCartOpen(true);
            }}
            aria-label={totalItems > 0 ? `Cart, ${totalItems} items` : 'Cart'}
            className={tabClass(false)}
          >
            <span className="relative">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </span>
            <span>Cart</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(open => !open);
            }}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className={tabClass(isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
