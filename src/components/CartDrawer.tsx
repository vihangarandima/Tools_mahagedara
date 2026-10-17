import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SRI_LANKA_DISTRICTS } from '../data/mockProducts';

interface CartDrawerProps {
  onOpenCheckout: () => void;
  onOpenPaymentPortal?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout, onOpenPaymentPortal }) => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    subtotal, 
    shippingFee, 
    total, 
    totalItems,
    selectedDistrict,
    setSelectedDistrict,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  if (!isCartOpen) return null;

  const currentDistrict = SRI_LANKA_DISTRICTS.find(d => d.name === selectedDistrict);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setIsCartOpen(false)}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="w-full max-w-md bg-white border-l border-zinc-200 h-full flex flex-col shadow-2xl text-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Cart Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 id="cart-title" className="text-lg font-black text-zinc-950 font-display">
              Cart
            </h2>
            <p className="text-sm text-zinc-600">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-zinc-600 hover:text-red-700 font-medium transition-colors px-2 h-11 cursor-pointer"
              >
                Remove all
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              aria-label="Close cart"
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
                            <h4 className="text-base font-bold text-zinc-900 font-display">Your cart is empty</h4>
              <p className="text-sm text-zinc-600 max-w-xs mx-auto leading-relaxed">
                Add tools from the catalog to order or request a quote.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-amber-400 text-zinc-950 font-bold text-sm cursor-pointer hover:bg-amber-300 transition-colors font-display"
              >
                Browse the catalog
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex gap-3 items-center group hover:border-zinc-300 transition-colors"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-contain bg-white border border-zinc-200 shrink-0 p-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-600">
                    {item.product.brand}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 line-clamp-2 leading-tight font-display">
                    {item.product.name}
                  </h3>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    Rs. {item.product.price.toLocaleString()} each
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-sm font-bold text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-black text-zinc-950 ml-auto">
                      Rs. {(item.product.price * item.quantity).toLocaleString()}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Remove ${item.product.name}`}
                      className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer & Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-white space-y-4">
            
            {/* Delivery District Selector */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="cart-district" className="font-semibold text-zinc-800">
                  Deliver to
                </label>
                <span className="text-xs text-zinc-600">
                  {currentDistrict?.standardDeliveryDays || '2-3 Days'}
                </span>
              </div>
              <select
                id="cart-district"
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-2 text-sm text-zinc-900 focus:outline-none focus:border-amber-500"
              >
                {SRI_LANKA_DISTRICTS.map(d => (
                  <option key={d.name} value={d.name}>
                    {d.name}, Rs. {d.shippingLKR} delivery
                  </option>
                ))}
              </select>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="text-zinc-900 font-bold">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery to {selectedDistrict}</span>
                <span className="text-zinc-900 font-bold">Rs. {shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-950 pt-2 border-t border-zinc-200 font-display">
                <span>Total</span>
                <span className="font-black text-lg">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition-colors font-display cursor-pointer shadow-xs"
              >
                <span>Continue to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenPaymentPortal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    onOpenPaymentPortal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors font-display cursor-pointer border border-zinc-800"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fast Pay via Card / LankaPay Portal</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-zinc-500 font-mono">
              Visa • MasterCard • LankaPay • Koko • Bank Transfer • COD
            </p>

          </div>
        )}
      </div>
    </div>
  );
};
