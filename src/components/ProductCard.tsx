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

  return (
    <div
      onClick={() => onOpenQuickView(product)}
      className="group relative bg-white border border-zinc-200 hover:border-zinc-400 rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-colors text-zinc-900"
    >
      {/* Brand & SKU */}
      <div className="p-4 pb-0 flex items-center justify-between text-xs">
        <span className="font-bold text-zinc-900">{product.brand}</span>
        <span className="text-zinc-500">{product.sku}</span>
      </div>

      {/* Product image with quick actions (hover, keyboard focus, or always on touch screens) */}
      <div className="relative aspect-[4/3] w-full bg-white flex items-center justify-center p-6 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 pointer-coarse:bg-transparent pointer-coarse:items-end transition-opacity flex items-center justify-center gap-2 p-4 pointer-coarse:p-2 z-20">
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

      {/* Name, specs, price */}
      <div className="p-4 pt-2 text-left space-y-2.5 border-t border-zinc-100">
        <h3 className="text-base font-bold text-zinc-950 line-clamp-2 font-display leading-snug">
          {product.name}
        </h3>

        {specEntries.length > 0 && (
          <p className="text-xs text-zinc-600 truncate">
            {specEntries.map(([, v]) => v).join(' · ')}
          </p>
        )}

        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-black text-zinc-950 font-display">
              Rs. {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-zinc-500 line-through text-sm">
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
            {product.discountPercentage && (
              <span className="text-sm font-bold text-red-700">−{product.discountPercentage}%</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm shrink-0" aria-label={`Rated ${product.rating} out of 5`}>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-zinc-900">{product.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
