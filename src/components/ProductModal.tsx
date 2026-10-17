import React, { useState } from 'react';
import { X, ShoppingCart, ShieldCheck, Truck, Check, MessageSquare, Wrench } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { STORE_CONTACT } from '../data/mockProducts';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  if (!product) return null;
  // Keyed so quantity and selected image reset for each product
  return <ProductDialog key={product.id} product={product} onClose={onClose} />;
};

const ProductDialog: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.image);
  const maxQuantity = product.stockQuantity || 99;

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent(
      `Hello Tools Mahagedara,\n\nI want to order / check stock for:\n*${product.name}*\n• SKU: ${product.sku}\n• Qty: ${quantity}\n• Unit Price: Rs. ${product.price.toLocaleString()}\n• Subtotal: Rs. ${(product.price * quantity).toLocaleString()}\n• Warranty: ${product.warranty}\n\nPlease let me know availability and delivery options!`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${message}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col text-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm text-zinc-600">
            <strong className="text-zinc-900">{product.brand}</strong> · SKU {product.sku}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Gallery */}
            <div className="md:col-span-5 space-y-4">
              <div className="aspect-square rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden p-6 flex items-center justify-center">
                <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      aria-label={`Photo ${idx + 1}`}
                      aria-pressed={selectedImage === img}
                      className={`w-16 h-16 rounded-xl border p-1 bg-white overflow-hidden transition-colors cursor-pointer ${
                        selectedImage === img ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              <ul className="space-y-2.5 text-sm text-zinc-700">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{product.warranty}, official card included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Same-day in Kalutara · Cash on delivery island-wide</span>
                </li>
                <li className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Serviced in our own workshop</span>
                </li>
              </ul>
            </div>

            {/* Details */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <h2 id="product-dialog-title" className="text-2xl font-black text-zinc-950 leading-tight font-display">
                  {product.name}
                </h2>
                <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{product.description}</p>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-zinc-200">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-black text-zinc-950 font-display">
                    Rs. {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-zinc-500 line-through">Rs. {product.originalPrice.toLocaleString()}</span>
                  )}
                  {product.discountPercentage && (
                    <span className="text-base font-bold text-red-700">−{product.discountPercentage}%</span>
                  )}
                </div>
                <span className={`text-sm font-semibold ${product.inStock ? 'text-emerald-700' : 'text-red-700'}`}>
                  {product.inStock ? `In stock (${product.stockQuantity})` : 'Out of stock'}
                </span>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-base font-bold text-zinc-950 font-display">Specifications</h3>
                <dl className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-sm">
                  {Object.entries(product.specs).map(([specKey, specVal]) => (
                    <div key={specKey} className="grid grid-cols-2 gap-3 px-3 py-2.5">
                      <dt className="text-zinc-600">{specKey}</dt>
                      <dd className="text-zinc-950 font-semibold">{specVal}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {product.includedItems && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-zinc-950 font-display">In the box</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-zinc-700">
                    {product.includedItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 hover:bg-zinc-100 text-zinc-700 font-bold transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-base text-zinc-950" aria-live="polite" aria-label={`Quantity ${quantity}`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    aria-label="Increase quantity"
                    className="w-11 h-11 hover:bg-zinc-100 text-zinc-700 font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    addToCart(product, quantity);
                    onClose();
                  }}
                  disabled={!product.inStock}
                  className={`flex-1 min-w-[140px] h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors font-display ${
                    product.inStock
                      ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 cursor-pointer'
                      : 'bg-zinc-200 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{product.inStock ? 'Add to cart' : 'Out of stock'}</span>
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="h-11 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer font-display"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
