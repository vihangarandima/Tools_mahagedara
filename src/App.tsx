import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ERSProvider, useERS } from './context/ERSContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { ShowroomInfo } from './components/ShowroomInfo';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { QuickWhatsAppButton } from './components/QuickWhatsAppButton';
import { Product, OrderDetails } from './types';
import { ONLINE_PAYMENTS_ENABLED } from './data/payments';
import { scrollToSection } from './utils/scrollToSection';

// Heavy modals are split into their own chunks and only fetched when opened
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const PaymentPortalModal = lazy(() => import('./components/PaymentPortalModal').then(m => ({ default: m.PaymentPortalModal })));
const ERSSyncModal = lazy(() => import('./components/ERSSyncModal').then(m => ({ default: m.ERSSyncModal })));
const ERSGuideModal = lazy(() => import('./components/ERSGuideModal').then(m => ({ default: m.ERSGuideModal })));

const MainApp: React.FC = () => {
  const { products, isSyncModalOpen, setIsSyncModalOpen, isGuideModalOpen, setIsGuideModalOpen } = useERS();
  const { isCartOpen, setIsCartOpen } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentPortalOpen, setIsPaymentPortalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);

  // Escape closes the topmost open drawer or dialog
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (completedOrder) setCompletedOrder(null);
      else if (isPaymentPortalOpen) setIsPaymentPortalOpen(false);
      else if (isCheckoutOpen) setIsCheckoutOpen(false);
      else if (activeProductModal) setActiveProductModal(null);
      else if (isCartOpen) setIsCartOpen(false);
      else if (isFilterDrawerOpen) setIsFilterDrawerOpen(false);
      else if (isGuideModalOpen) setIsGuideModalOpen(false);
      else if (isSyncModalOpen) setIsSyncModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [completedOrder, isPaymentPortalOpen, isCheckoutOpen, activeProductModal, isCartOpen, isFilterDrawerOpen, isGuideModalOpen, isSyncModalOpen]);

  // Hidden while online payments are only simulated (see src/data/payments.ts)
  const openPaymentPortal = ONLINE_PAYMENTS_ENABLED ? () => setIsPaymentPortalOpen(true) : undefined;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCatalog = () => {
    setSelectedCategory('all');
    scrollToSection('catalog-section');
  };

  const scrollToAbout = () => {
    scrollToSection('about-section');
  };

  const scrollToServices = () => {
    scrollToSection('services-section');
  };

  const scrollToContact = () => {
    scrollToSection('footer-contact');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* 1. Sleek Dark Obsidian Header Navbar */}
      <Navbar
        onNavigateHome={scrollToTop}
        onNavigateStore={scrollToCatalog}
        onNavigateAbout={scrollToAbout}
        onNavigateServices={scrollToServices}
        onNavigateContact={scrollToContact}
        onOpenPaymentPortal={openPaymentPortal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCategories={() => setIsFilterDrawerOpen(true)}
      />

      {/* 2. Hero Section: Architectural editorial hero with typography, trust metrics, and featured hardware showcase */}
      <Hero
        onExploreCatalog={scrollToCatalog}
        onOpenFeatured={() => {
          const featured = products.find(p => p.id === 'prod-001') || products[0];
          if (featured) setActiveProductModal(featured);
        }}
      />

      {/* 3. Main Catalog: Exact 2-Column layout with search, dual price filter, categories, featured products, 3x3 grid, and pagination */}
      <ProductCatalog
        products={products}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenQuickView={(p) => setActiveProductModal(p)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isFilterDrawerOpen={isFilterDrawerOpen}
        onFilterDrawerOpenChange={setIsFilterDrawerOpen}
      />

      {/* 4. About Us & Our Services Sections: Central Showroom, Authorized Brands, Spare Parts & Repairs */}
      <ShowroomInfo />

      {/* 5. Footer: Exact 3-column dark layout with stats, address, and Sent Message form */}
      <Footer 
        onOpenPaymentPortal={openPaymentPortal}
      />

      {/* Interactive Modals */}
      <ProductModal
        product={activeProductModal}
        onClose={() => setActiveProductModal(null)}
      />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenPaymentPortal={openPaymentPortal}
      />

      <Suspense fallback={null}>
      {isCheckoutOpen && <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderComplete={(order) => setCompletedOrder(order)}
      />}

      {isPaymentPortalOpen && <PaymentPortalModal
        isOpen={isPaymentPortalOpen}
        onClose={() => setIsPaymentPortalOpen(false)}
        onPaymentSuccess={(order) => {
          setIsPaymentPortalOpen(false);
          setCompletedOrder(order);
        }}
      />}
      </Suspense>

      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />

      <Suspense fallback={null}>
        {isSyncModalOpen && <ERSSyncModal />}
        {isGuideModalOpen && <ERSGuideModal />}
      </Suspense>

      <QuickWhatsAppButton />
    </div>
  );
};

export default function App() {
  return (
    <ERSProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </ERSProvider>
  );
}
