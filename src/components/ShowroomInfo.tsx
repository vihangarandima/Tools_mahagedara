import React, { useState } from 'react';
import { MapPin, Clock, PhoneCall, MessageSquare, Check, ShieldCheck, Truck, Wrench, Eye, X, ZoomIn, Building, Sparkles } from 'lucide-react';
import { STORE_CONTACT } from '../data/mockProducts';

const openWhatsApp = (text: string) => {
  window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
};

const CheckList: React.FC<{ items: string[]; checkColor?: string }> = ({ items, checkColor = 'text-amber-400' }) => (
  <ul className="space-y-2 text-sm text-zinc-300">
    {items.map(item => (
      <li key={item} className="flex items-start gap-2">
        <Check className={`w-4 h-4 ${checkColor} shrink-0 mt-0.5`} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

interface StoreImage {
  src: string;
  tag: string;
  title: string;
  desc: string;
}

const STORE_GALLERY: StoreImage[] = [
  {
    src: '/images/store_front_kalutara.jpg',
    tag: 'FLAGSHIP STOREFRONT',
    title: 'Galle Road Kalutara Depot',
    desc: 'Located directly on Galle Road, Katukurunda with convenient customer vehicle parking and loading bays.'
  },
  {
    src: '/images/kalutara_showroom.jpg',
    tag: 'AUTHORIZED SHOWROOM',
    title: 'Brand Power Tool Bays',
    desc: 'Dedicated display racks for DeWALT, BOSCH Professional, MAKITA & DongCheng machinery.'
  },
  {
    src: '/images/store_testing_bench.jpg',
    tag: 'TRY BEFORE YOU BUY',
    title: 'Live Tool Testing Station',
    desc: 'Hands-on workbench with heavy timber blocks and concrete slabs to test power and ergonomics before purchase.'
  },
  {
    src: '/images/tool_repair_workshop.jpg',
    tag: 'IN-HOUSE WORKSHOP',
    title: 'Electrical Repair & Rewinding Hub',
    desc: 'Certified technicians performing armature rewinding, bearing replacement, and quick turnaround diagnosis.'
  },
  {
    src: '/images/express_delivery_depot.jpg',
    tag: 'LOGISTICS & DISPATCH',
    title: 'Island-Wide COD Courier Bay',
    desc: 'Daily courier packaging with custom wooden crating for heavy machinery dispatch to all 25 districts.'
  }
];

export const ShowroomInfo: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<StoreImage | null>(null);

  return (
    <div className="bg-[#09090b] text-white relative">
      <div className="hazard-stripe" />

      {/* 1. Client Store Image Showcase Section */}
      <section id="gallery-section" className="py-20 bg-gradient-to-b from-[#09090b] via-[#111114] to-[#09090b] border-b border-zinc-800/80 relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/10 blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold">
                <Building className="w-3.5 h-3.5" />
                <span>EXPERIENCE TOOLS MAHAGEDARA IN PERSON</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white font-display tracking-tight leading-[1.1]">
                Our Showroom, Testing Center & <span className="text-amber-400">Workshop.</span>
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Step inside Kalutara’s largest dedicated power tools depot. Inspect authentic machinery, test tools before you buy, and meet our certified repair technicians.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={STORE_CONTACT.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors font-display shadow-lg shadow-amber-400/20"
              >
                <MapPin className="w-4 h-4" />
                <span>Visit Showroom</span>
              </a>
              <a
                href={`tel:${STORE_CONTACT.phone}`}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors font-display border border-zinc-700"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>{STORE_CONTACT.phone}</span>
              </a>
            </div>
          </div>

          {/* Store Photos Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Primary Hero Showcase: Galle Road Storefront (Spans 2 cols on lg) */}
            <div 
              onClick={() => setSelectedImage(STORE_GALLERY[0])}
              className="lg:col-span-2 group relative rounded-3xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/80 cursor-pointer aspect-[16/9] sm:aspect-[21/10]"
            >
              <img
                src={STORE_GALLERY[0].src}
                alt={STORE_GALLERY[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
              
              {/* Badges on top */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider font-display shadow">
                  {STORE_GALLERY[0].tag}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Open Daily 9AM – 6:30PM</span>
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-10 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  {STORE_GALLERY[0].title}
                </h3>
                <p className="text-sm text-zinc-300 mt-1 max-w-xl leading-relaxed">
                  {STORE_GALLERY[0].desc}
                </p>
                <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Click to expand high-res photo</span>
                </div>
              </div>
            </div>

            {/* Photo 2: Live Tool Testing Station */}
            <div 
              onClick={() => setSelectedImage(STORE_GALLERY[2])}
              className="group relative rounded-3xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/80 cursor-pointer aspect-[16/10] md:aspect-auto"
            >
              <img
                src={STORE_GALLERY[2].src}
                alt={STORE_GALLERY[2].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider font-display shadow">
                  {STORE_GALLERY[2].tag}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-10 text-left">
                <h3 className="text-lg font-black text-white font-display">
                  {STORE_GALLERY[2].title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {STORE_GALLERY[2].desc}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                  <ZoomIn className="w-3 h-3" />
                  <span>View full size</span>
                </div>
              </div>
            </div>

            {/* Photo 3: Power Tools Showroom Interior */}
            <div 
              onClick={() => setSelectedImage(STORE_GALLERY[1])}
              className="group relative rounded-3xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/80 cursor-pointer aspect-[16/10] sm:aspect-[4/3]"
            >
              <img
                src={STORE_GALLERY[1].src}
                alt={STORE_GALLERY[1].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-1 rounded-md bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider font-display shadow">
                  {STORE_GALLERY[1].tag}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-10 text-left">
                <h3 className="text-lg font-black text-white font-display">
                  {STORE_GALLERY[1].title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {STORE_GALLERY[1].desc}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                  <ZoomIn className="w-3 h-3" />
                  <span>View full size</span>
                </div>
              </div>
            </div>

            {/* Photo 4: Technical Workshop & Rewinding Hub */}
            <div 
              onClick={() => setSelectedImage(STORE_GALLERY[3])}
              className="group relative rounded-3xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/80 cursor-pointer aspect-[16/10] sm:aspect-[4/3]"
            >
              <img
                src={STORE_GALLERY[3].src}
                alt={STORE_GALLERY[3].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider font-display shadow">
                  {STORE_GALLERY[3].tag}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-10 text-left">
                <h3 className="text-lg font-black text-white font-display">
                  {STORE_GALLERY[3].title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {STORE_GALLERY[3].desc}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                  <ZoomIn className="w-3 h-3" />
                  <span>View full size</span>
                </div>
              </div>
            </div>

            {/* Photo 5: Logistics & Dispatch */}
            <div 
              onClick={() => setSelectedImage(STORE_GALLERY[4])}
              className="group relative rounded-3xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/80 cursor-pointer aspect-[16/10] sm:aspect-[4/3]"
            >
              <img
                src={STORE_GALLERY[4].src}
                alt={STORE_GALLERY[4].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider font-display shadow">
                  {STORE_GALLERY[4].tag}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-10 text-left">
                <h3 className="text-lg font-black text-white font-display">
                  {STORE_GALLERY[4].title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {STORE_GALLERY[4].desc}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                  <ZoomIn className="w-3 h-3" />
                  <span>View full size</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. Built For Contractors / Backed by Real Warranties (Redesigned with Rich Visuals) */}
      <section id="about-section" className="scroll-mt-24 py-20 bg-[#0c0c0e] relative overflow-hidden">
        
        {/* Ambient lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_20%,rgba(245,158,11,0.08),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6">

          <div className="max-w-3xl mb-12 text-left">
            <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              PROVEN VALUE · AUTHENTIC GUARANTEE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white font-display tracking-tight leading-[1.1] mt-2">
              Built for contractors.<br />
              Backed by <span className="text-amber-400">real warranties.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Visit Kalutara Store */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-700/80 p-6 sm:p-7 shadow-xl shadow-black/60 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-amber-400/50 transition-colors text-left">
              <div className="space-y-4">
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden border-b border-zinc-800">
                  <img
                    src="/images/store_front_kalutara.jpg"
                    alt="Kalutara Showroom"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Open Today: 9:00 AM – 6:30 PM</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white font-display">Visit the Kalutara store</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{STORE_CONTACT.address}</p>
                
                <CheckList items={[
                  'Hands-on tool trial before you buy',
                  'Dedicated parking on Galle Road',
                  'Expert advice from tool specialists'
                ]} />
              </div>

              <a
                href={STORE_CONTACT.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl font-display shadow-lg shadow-amber-400/20"
              >
                <MapPin className="w-4 h-4" />
                <span>Get directions on Google Maps</span>
              </a>
            </div>

            {/* Card 2: 100% Authorized Dealer */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-700/80 p-6 sm:p-7 shadow-xl shadow-black/60 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-amber-400/50 transition-colors text-left">
              <div className="space-y-4">
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 flex flex-col justify-center items-center p-4">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-black uppercase">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>100% GENUINE GUARANTEE</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs font-black tracking-wider text-white pt-2 font-display">
                      <span className="text-amber-400">DeWALT</span>
                      <span className="text-blue-400">BOSCH</span>
                      <span className="text-teal-400">MAKITA</span>
                      <span className="text-orange-400">DongCheng</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white font-display">Authorized dealer</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  We sell genuine DeWALT, BOSCH Professional, MAKITA and DongCheng tools. Every tool comes with the official company warranty card, valid across Sri Lanka.
                </p>

                <CheckList 
                  items={[
                    'No counterfeit or grey-market imports',
                    'Warranty claims handled directly in-store',
                    'Verified serial numbers with factory cards'
                  ]}
                  checkColor="text-emerald-400"
                />
              </div>

              <a
                href={`tel:${STORE_CONTACT.phone}`}
                className="w-full py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl font-display"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Call {STORE_CONTACT.phone}</span>
              </a>
            </div>

            {/* Card 3: Island-Wide Delivery */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-700/80 p-6 sm:p-7 shadow-xl shadow-black/60 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-amber-400/50 transition-colors text-left">
              <div className="space-y-4">
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden border-b border-zinc-800">
                  <img
                    src="/images/express_delivery_depot.jpg"
                    alt="Island-Wide Delivery"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-[11px] font-mono text-amber-400">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>All 25 Districts Island-Wide</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white font-display">Island-wide delivery</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Same-day or next-day delivery in Kalutara, Colombo, Gampaha and Galle. Courier delivery to all 25 districts, paid by cash on delivery or bank transfer.
                </p>

                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 font-mono text-xs">
                  <span className="text-zinc-400">Kalutara District Flat Rate: </span>
                  <span className="font-bold text-amber-400 text-sm">Rs. 450</span>
                </div>

                <CheckList items={[
                  'Wooden crate packing for heavy machinery',
                  'Cash on delivery (COD) available',
                  'Safe transit insurance support'
                ]} />
              </div>

              <button
                type="button"
                onClick={() => openWhatsApp('Hello Tools Mahagedara Logistics,\n\nI need delivery details for my location in Sri Lanka.\n\nMy Delivery City / District:\nTools Needed:\n\nPlease confirm delivery schedule and courier fee.')}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl font-display shadow-lg shadow-emerald-700/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Check Delivery on WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 3. In-House Repairs & Workshop Services */}
      <section id="services-section" className="scroll-mt-24 py-20 bg-[#121215] border-t border-zinc-800 relative overflow-hidden">
        
        {/* Subtle grid and amber lighting */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-amber-500/10 blur-[130px] pointer-events-none" />

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6">

          <div className="max-w-2xl mb-12 space-y-3 text-left">
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              IN-HOUSE TECHNICAL WORKSHOP
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display tracking-tight">
              Repairs & technical services
            </h2>
            <p className="text-base text-zinc-300 leading-relaxed">
              Our in-house workshop repairs the brands we sell using genuine spare parts, armatures and factory diagnostic tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Service 1: Repairs & Spares */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-700/80 p-6 sm:p-7 shadow-xl shadow-black/60 flex flex-col justify-between gap-6 group hover:border-emerald-500/50 transition-colors text-left overflow-hidden">
              <div className="space-y-4">
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden border-b border-zinc-800">
                  <img
                    src="/images/tool_repair_workshop.jpg"
                    alt="Armature Rewinding Workshop"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-[11px] font-mono text-emerald-400">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5,000+ Genuine Spare Parts</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white font-display">Repairs & spare parts</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Armatures, carbon brushes, bearings, gearboxes, switches and chucks for Bosch, Makita, DeWALT and DongCheng.
                </p>
                <CheckList 
                  items={[
                    'Motor armature rewinding and bench testing',
                    'Hammer mechanism overhauls',
                    'Rapid fault diagnosis in Kalutara'
                  ]}
                  checkColor="text-emerald-400"
                />
              </div>

              <button
                type="button"
                onClick={() => openWhatsApp('Hello Tools Mahagedara Service Hub,\n\nI have a power tool / machinery that needs servicing or spare parts.\n\nMachine Brand & Model:\nFault Description:\n\nPlease let me know repair process and drop-off time at Kalutara showroom.')}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl font-display shadow-lg shadow-emerald-700/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Book a repair on WhatsApp</span>
              </button>
            </div>

            {/* Service 2: Warranty Claims */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-700/80 p-6 sm:p-7 shadow-xl shadow-black/60 flex flex-col justify-between gap-6 group hover:border-amber-400/50 transition-colors text-left overflow-hidden">
              <div className="space-y-4">
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col justify-center items-center p-4">
                  <div className="p-3.5 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 mb-2">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-300 uppercase">OFFICIAL SERVICE DESK</span>
                </div>

                <h3 className="text-xl font-black text-white font-display">Warranty claims</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Bring the tool to the Kalutara store with your invoice and warranty card, and our technicians will inspect it and submit the claim to the manufacturer.
                </p>
                <CheckList items={[
                  'Free inspection during the warranty period',
                  'Status updates by SMS and WhatsApp',
                  'Direct liaison with official Sri Lankan agents'
                ]} />
              </div>

              <a
                href={`tel:${STORE_CONTACT.landline.replace(/\s+/g, '')}`}
                className="w-full py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl font-display border border-zinc-700"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Call Service Desk: {STORE_CONTACT.landline}</span>
              </a>
            </div>

            {/* Service 3: Business & Bulk Orders */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-700/80 p-6 sm:p-7 shadow-xl shadow-black/60 flex flex-col justify-between gap-6 group hover:border-amber-400/50 transition-colors text-left overflow-hidden">
              <div className="space-y-4">
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 flex flex-col justify-center items-center p-4">
                  <div className="p-3.5 rounded-2xl bg-amber-400 text-zinc-950 mb-2 shadow-lg">
                    <Building className="w-8 h-8" />
                  </div>
                  <span className="font-mono text-xs font-black text-amber-400 uppercase">B2B CONTRACTOR FLEETS</span>
                </div>

                <h3 className="text-xl font-black text-white font-display">Business & bulk orders</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Special quantity pricing for construction firms, workshops, fabrication yards and vocational training schools across Sri Lanka.
                </p>
                <CheckList items={[
                  'Pro-forma VAT invoices for companies',
                  'Tiered wholesale volume discounts',
                  'Direct corporate bank transfer terms'
                ]} />
              </div>

              <button
                type="button"
                onClick={() => openWhatsApp('Hello Tools Mahagedara,\n\nI would like to request a wholesale / corporate quotation for tools and machinery for our business/project.\n\nPlease share your corporate price list or catalog.')}
                className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl font-display shadow-lg shadow-amber-400/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request a business quote</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Full-Screen High-Res Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-zinc-950/80 text-white hover:bg-amber-400 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[16/9] w-full bg-black relative">
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 text-left space-y-2 bg-zinc-900">
              <div className="inline-block px-2.5 py-0.5 rounded bg-amber-400 text-zinc-950 font-mono text-[10px] font-black uppercase">
                {selectedImage.tag}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                {selectedImage.title}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {selectedImage.desc}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
