import React, { useEffect, useState } from 'react';
import { ERSProvider, useERS } from './context/ERSContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { ShowroomInfo } from './components/ShowroomInfo';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ERSSyncModal } from './components/ERSSyncModal';
import { ERSGuideModal } from './components/ERSGuideModal';
import { PaymentPortalModal } from './components/PaymentPortalModal';
import { QuickWhatsAppButton } from './components/QuickWhatsAppButton';
import { Product, OrderDetails } from './types';

const MainApp: React.FC = () => {
  const { products, isSyncModalOpen, setIsSyncModalOpen, isGuideModalOpen, setIsGuideModalOpen } = useERS();
  const { isCartOpen, setIsCartOpen } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      else if (isGuideModalOpen) setIsGuideModalOpen(false);
      else if (isSyncModalOpen) setIsSyncModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [completedOrder, isPaymentPortalOpen, isCheckoutOpen, activeProductModal, isCartOpen, isGuideModalOpen, isSyncModalOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCatalog = () => {
    setSelectedCategory('all');
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    const el = document.getElementById('about-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    const el = document.getElementById('services-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const el = document.getElementById('footer-contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {/* 1. Sleek Dark Obsidian Header Navbar */}
      <Navbar
        onNavigateHome={scrollToTop}
        onNavigateStore={scrollToCatalog}
        onNavigateAbout={scrollToAbout}
        onNavigateServices={scrollToServices}
        onNavigateContact={scrollToContact}
        onOpenPaymentPortal={() => setIsPaymentPortalOpen(true)}
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
      />

      {/* 4. About Us & Our Services Sections: Central Showroom, Authorized Brands, Spare Parts & Repairs */}
      <ShowroomInfo />

      {/* 5. Footer: Exact 3-column dark layout with stats, address, and Sent Message form */}
      <Footer 
        onOpenPaymentPortal={() => setIsPaymentPortalOpen(true)}
      />

      {/* Interactive Modals */}
      <ProductModal
        product={activeProductModal}
        onClose={() => setActiveProductModal(null)}
      />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenPaymentPortal={() => setIsPaymentPortalOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderComplete={(order) => setCompletedOrder(order)}
      />

      <PaymentPortalModal
        isOpen={isPaymentPortalOpen}
        onClose={() => setIsPaymentPortalOpen(false)}
        onPaymentSuccess={(order) => {
          setIsPaymentPortalOpen(false);
          setCompletedOrder(order);
        }}
      />

      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />

      <ERSSyncModal />

      <ERSGuideModal />

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
