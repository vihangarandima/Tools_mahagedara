import React from 'react';
import { ShieldCheck, Truck, Star, ArrowDown, ArrowUpRight, Tag } from 'lucide-react';
import { STORE_CONTACT } from '../data/mockProducts';
import { useERS } from '../context/ERSContext';
import { CURRENT_OFFER } from '../data/offer';
import { scrollToSection } from '../utils/scrollToSection';

interface HeroProps {
  onExploreCatalog?: () => void;
  onOpenFeatured?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCatalog }) => {
  const { products } = useERS();
  const offerHref = CURRENT_OFFER.ctaHref ||
    `https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${encodeURIComponent(`Hello Tools Mahagedara, I'd like to know more about your offer${CURRENT_OFFER.title ? `: ${CURRENT_OFFER.title}` : ''}.`)}`;

  const scrollToCatalog = () => {
    if (onExploreCatalog) {
      onExploreCatalog();
    } else {
      scrollToSection('catalog-section');
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#09090b] pt-12 pb-16 lg:pt-16 lg:pb-20 text-white">

      {/* Deep Atmospheric Industrial Machinery & Workshop Background - High Visibility */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-85 transition-opacity duration-700"
        style={{ 
          backgroundImage: `url('/images/hero_bg.webp')`,
          filter: 'contrast(1.15) brightness(0.92)'
        }}
      />
      {/* Precision architectural dark grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      {/* Directional scrim: subtle fade on the left to keep text ultra crisp, while the workshop shines through */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/92 via-[#09090b]/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_75%_45%,rgba(245,158,11,0.18),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          {/* Left: headline, pitch, proof points and actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight text-white font-display leading-[1.05] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              Engineered <span className="text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">power.</span><br />
              Built for professionals.
            </h1>
            <p className="text-base sm:text-lg text-zinc-200 max-w-xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Kalutara’s wholesale and retail dealer for genuine DeWALT, BOSCH Professional, MAKITA and DongCheng tools. Factory warranties, in-house repairs, and cash on delivery anywhere in Sri Lanka.
            </p>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{STORE_CONTACT.rating} on Google</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Official warranty card</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Island-wide delivery</span>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm transition-colors rounded-xl flex items-center gap-2 cursor-pointer font-display"
              >
                <span>Browse {products.length} tools</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${encodeURIComponent('Hello Tools Mahagedara, I need pricing and availability for tools/machinery.')}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors rounded-xl flex items-center gap-2 cursor-pointer font-display"
              >
                <span>Get a quote on WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right: current offer banner (set in src/data/offer.ts) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 text-white">
              {CURRENT_OFFER.image ? (
                <a
                  href={offerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={CURRENT_OFFER.title || 'View current offer'}
                  className="block relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-950 group"
                >
                  <img
                    fetchPriority="high"
                    decoding="async"
                    src={CURRENT_OFFER.image}
                    alt={CURRENT_OFFER.title || 'Current offer'}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </a>
              ) : (
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-950 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <Tag className="w-10 h-10 text-amber-400" aria-hidden="true" />
                  <span className="text-xl font-black font-display">New offers coming soon</span>
                  <span className="text-sm text-zinc-400">Ask us on WhatsApp for this week&apos;s deals.</span>
                </div>
              )}

              <div className="pt-5 space-y-4 text-left">
                <div>
                  <span className="text-xs font-bold text-amber-400">Special offer</span>
                  <h2 className="text-lg font-black text-white font-display leading-snug mt-0.5">
                    {CURRENT_OFFER.title || 'Exclusive showroom deals'}
                  </h2>
                  {CURRENT_OFFER.subtitle && (
                    <p className="text-sm text-zinc-400 mt-1">{CURRENT_OFFER.subtitle}</p>
                  )}
                </div>

                <a
                  href={offerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-center font-bold text-sm transition-colors rounded-xl font-display border border-zinc-700"
                >
                  {CURRENT_OFFER.ctaLabel || 'Ask about this offer'}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hazard stripe divider into the catalog */}
      <div className="hazard-stripe absolute bottom-0 inset-x-0" />
    </section>
  );
};
