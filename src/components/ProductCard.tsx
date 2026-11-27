import React from 'react';
import { Star, ShoppingCart, MessageSquare, Eye } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { STORE_CONTACT } from '../data/mockProducts';

interface ProductCardProps {
  product: Product;
  onOpenQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenQuickView }) => {
  const { addToCart } = useCart();

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Hello Tools Mahagedara,\n\nI want to order:\n*${product.name}*\n• SKU: ${product.sku}\n• Price: Rs. ${product.price.toLocaleString()}\n• Warranty: ${product.warranty}\n\nPlease confirm availability and delivery to Kalutara / Island-wide.`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${msg}`, '_blank');
  };

  // Two key specs for the card
  const specEntries = Object.entries(product.specs || {}).slice(0, 2);
  const price = Number(product.price) || 0;
  const rating = Number(product.rating) || 4.8;
  const hasDiscount = Boolean(product.discountPercentage) && Number(product.discountPercentage) > 0;
  const hasOriginal = product.originalPrice != null && Number(product.originalPrice) > price;

  return (
    <div
      onClick={() => onOpenQuickView(product)}
      className="group relative bg-white md:border border-zinc-200 hover:border-zinc-400 rounded-lg md:rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-colors text-zinc-900"
    >
      {/* Brand & SKU (larger screens) */}
      <div className="hidden md:flex p-4 pb-0 items-center justify-between text-xs">
        <span className="font-bold text-zinc-900">{product.brand}</span>
        <span className="text-zinc-500">{product.sku}</span>
      </div>

      {/* Product image */}
      <div className="relative aspect-square md:aspect-[4/3] w-full bg-white flex items-center justify-center p-2 md:p-6 overflow-hidden">
        <img decoding="async"
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />

        {/* Phone: discount badge on the photo */}
        {hasDiscount && (
          <span className="md:hidden absolute top-1.5 left-1.5 bg-red-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded">
            −{product.discountPercentage}%
          </span>
        )}

        {/* Quick actions (larger screens: hover, keyboard focus, or always on touch tablets) */}
        <div className="hidden md:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 pointer-coarse:bg-transparent pointer-coarse:items-end transition-opacity items-center justify-center gap-2 p-4 pointer-coarse:p-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className="px-3.5 min-h-11 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm transition-colors rounded-xl flex items-center gap-1.5 cursor-pointer font-display"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to cart</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="w-11 h-11 flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white transition-colors rounded-xl cursor-pointer"
            title="Order on WhatsApp"
            aria-label={`Order ${product.name} on WhatsApp`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuickView(product);
            }}
            className="w-11 h-11 flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-white transition-colors rounded-xl cursor-pointer"
            title="Quick view"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Phone: compact shop-app details */}
      <div className="md:hidden px-2 pt-1.5 pb-2 text-left space-y-1">
        <h3 className="text-[13px] leading-snug text-zinc-800 truncate font-sans font-medium tracking-normal">
          {product.name}
        </h3>

        <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-300 fill-zinc-300'}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-600">{rating.toFixed(1)}</span>
          {product.inStock && (
            <span className="text-[11px] font-semibold text-emerald-700 ml-auto">In stock</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0 leading-none">
            {(hasOriginal || hasDiscount) && (
              <div className="flex items-center gap-1 mb-0.5">
                {hasOriginal && (
                  <span className="text-[11px] text-zinc-400 line-through">
                    Rs. {Number(product.originalPrice).toLocaleString()}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-1 py-0.5 rounded">
                    −{product.discountPercentage}%
                  </span>
                )}
              </div>
            )}
            <span className="text-base font-black text-orange-600 font-display whitespace-nowrap">
              <span className="text-[11px] font-bold">Rs.</span> {price.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            aria-label={`Add ${product.name} to cart`}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border-2 border-zinc-900 text-zinc-900 active:bg-amber-400 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Name, specs, price (larger screens) */}
      <div className="hidden md:block p-4 pt-2 text-left space-y-2.5 border-t border-zinc-100">
        <h3 className="text-base font-bold text-zinc-950 line-clamp-2 font-display leading-snug">
          {product.name}
        </h3>

        {specEntries.length > 0 && (
          <p className="text-xs text-zinc-600 truncate">
            {specEntries.map(([, v]) => v).join(' · ')}
          </p>
        )}

        <div className="flex items-end justify-between pt-1 gap-2">
          <div className="space-y-0.5">
            {(hasOriginal || hasDiscount) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {hasOriginal && (
                  <span className="text-zinc-500 line-through text-xs">
                    Rs. {Number(product.originalPrice).toLocaleString()}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-[11px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded">
                    −{product.discountPercentage}%
                  </span>
                )}
              </div>
            )}
            <div className="text-xl font-black text-zinc-950 font-display leading-tight">
              Rs. {price.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm shrink-0" aria-label={`Rated ${product.rating || 5} out of 5`}>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-zinc-900">{product.rating || 4.8}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
