import React, { useState } from 'react';
import { Mail, Phone, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { STORE_CONTACT } from '../data/mockProducts';
import { useERS } from '../context/ERSContext';
import { getStoreStatus } from '../utils/storeHours';

const inputClass = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-amber-400';
const labelClass = 'block text-sm text-zinc-300 mb-1';

interface FooterProps {
  onOpenPaymentPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPaymentPortal }) => {
  const { setIsSyncModalOpen } = useERS();
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [message, setMessage] = useState('');
  const storeStatus = getStoreStatus();

  // The inquiry is delivered through WhatsApp with the message prefilled
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mail) return;

    const waText = encodeURIComponent(
      `Hello Tools මහගෙදර,\n\nInquiry from your website:\nName: ${name}\nEmail: ${mail}\nMessage: ${message}`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${waText}`, '_blank');
  };

  return (
    <footer id="footer-contact" className="bg-[#070708] text-zinc-400 text-sm pb-12">
      <div className="hazard-stripe mb-16" />
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-zinc-900">

          {/* About */}
          <div className="lg:col-span-4 space-y-5">
            <a href="#top" className="inline-block group">
              <img
                src="/images/logo_dark_bg.png"
                alt="Tools මහගෙදර"
                className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform"
              />
            </a>
            <p className="text-zinc-400 leading-relaxed max-w-sm">
              Power tools, machinery and hardware for contractors, workshops and craftsmen in Kalutara and across Sri Lanka.
            </p>
          </div>

          {/* Visit & contact */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-base font-bold text-white font-display">Visit or call</h2>

            <div className="space-y-4">
              <div>
                <p className="text-zinc-200">{STORE_CONTACT.address}</p>
                <a
                  href={STORE_CONTACT.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold mt-1"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Get directions</span>
                </a>
              </div>

              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Kalutara:</span>
                  <a href={`tel:${STORE_CONTACT.phone}`} className="text-white hover:text-amber-400 font-semibold">{STORE_CONTACT.phone}</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Landline:</span>
                  <a href={`tel:${STORE_CONTACT.landline.replace(/\s+/g, '')}`} className="text-zinc-200 hover:text-amber-400">{STORE_CONTACT.landline}</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Aluthgama branch:</span>
                  <a href={`tel:${STORE_CONTACT.aluthgamaPhone.replace(/\s+/g, '')}`} className="text-zinc-200 hover:text-amber-400">{STORE_CONTACT.aluthgamaPhone}</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <a href={`mailto:${STORE_CONTACT.email}`} className="text-zinc-200 hover:text-amber-400">{STORE_CONTACT.email}</a>
                </li>
              </ul>

              <div>
                <p className={storeStatus.isOpen ? 'text-emerald-400 font-semibold' : 'text-zinc-200 font-semibold'}>{storeStatus.label}</p>
                <p>{STORE_CONTACT.fullHours}</p>
              </div>
            </div>
          </div>

          {/* Inquiry form */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-base font-bold text-white font-display">Send us a message</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="inquiry-name" className={labelClass}>Name</label>
                <input id="inquiry-name" type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="inquiry-email" className={labelClass}>Email</label>
                <input id="inquiry-email" type="email" required autoComplete="email" placeholder="name@example.com" value={mail} onChange={e => setMail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="inquiry-message" className={labelClass}>Message</label>
                <textarea
                  id="inquiry-message"
                  rows={3}
                  required
                  placeholder="Tool model, bulk quote, or delivery question"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors rounded-lg font-display cursor-pointer"
              >
                Send via WhatsApp
              </button>
            </form>
          </div>

        </div>

        {/* Accepted Payment Methods & Online Portal Banner */}
        <div className="py-6 my-6 border-y border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 font-mono font-bold uppercase tracking-wider text-[11px] mr-1">
              Accepted Payments:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-300 font-bold border border-zinc-800 font-mono text-[11px]">
              VISA
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-300 font-bold border border-zinc-800 font-mono text-[11px]">
              MASTERCARD
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-amber-400 font-bold border border-zinc-800 font-mono text-[11px]">
              LANKAPAY
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-purple-400 font-bold border border-zinc-800 font-mono text-[11px]">
              KOKO 3x BNPL
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-emerald-400 font-bold border border-zinc-800 font-mono text-[11px]">
              LANKAQR / CEFT
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-300 font-bold border border-zinc-800 font-mono text-[11px]">
              CASH ON DELIVERY
            </span>
          </div>

          {onOpenPaymentPortal && (
            <button
              type="button"
              onClick={onOpenPaymentPortal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all font-display cursor-pointer shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5 text-zinc-950" />
              <span>Online Payment Portal / Pay Invoice</span>
            </button>
          )}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Tools මහගෙදර (Tools Mahagedara), Kalutara, Sri Lanka.</p>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 cursor-pointer"
          >
            Staff: inventory sync
          </button>
        </div>

      </div>
    </footer>
  );
};
