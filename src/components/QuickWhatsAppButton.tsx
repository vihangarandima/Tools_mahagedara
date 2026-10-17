import React from 'react';
import { MessageSquare } from 'lucide-react';
import { STORE_CONTACT } from '../data/mockProducts';

export const QuickWhatsAppButton: React.FC = () => {
  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Tools Mahagedara,\n\nI need advice on choosing the right power tool and would like to check availability and prices.`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleOpenWhatsApp}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
    >
      <MessageSquare className="w-5 h-5 fill-white stroke-none" />
      <span>WhatsApp us</span>
    </button>
  );
};
