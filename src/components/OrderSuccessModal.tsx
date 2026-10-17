import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  MessageSquare, 
  X, 
  ShieldCheck
} from 'lucide-react';
import { OrderDetails } from '../types';
import { STORE_CONTACT } from '../data/mockProducts';

interface OrderSuccessModalProps {
  order: OrderDetails | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `Hello Tools Mahagedara,\n\nI have placed an order with Reference ID: *#${order.orderId}*.\nName: ${order.customerName}\nTotal: Rs. ${order.total.toLocaleString()}\n\nPlease check and dispatch my order.`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:m-0 print:max-h-none print:w-full text-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-base font-bold text-zinc-950 font-display">
              {order.status === 'PAID'
                ? 'Payment Confirmed & Verified. Order is queued for dispatch!'
                : 'Order sent. We will confirm on WhatsApp.'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Printable Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-zinc-900 print:text-black print:bg-white bg-white">
          
          {/* Company Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-200 print:border-black/20">
            <div>
              <div className="text-2xl font-black tracking-tight text-zinc-950 print:text-black font-display">
                TOOLS <span className="text-amber-500 print:text-black">MAHAGEDARA</span>
              </div>
              <div className="text-xs text-zinc-500 print:text-gray-600 font-semibold uppercase mt-0.5">
                ටූල්ස් මහගෙදර • Power tools & machinery, Kalutara
              </div>
              <div className="text-[11px] text-zinc-600 print:text-gray-600 mt-1">
                {STORE_CONTACT.address}
              </div>
              <div className="text-[11px] text-zinc-600 print:text-gray-600 font-mono">
                Hotline: {STORE_CONTACT.hotline} | WhatsApp: {STORE_CONTACT.whatsappDisplay}
              </div>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className={`px-3 py-1 rounded font-bold text-xs inline-block mb-1 ${
                order.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}>
                {order.status === 'PAID'
                  ? 'PAID IN FULL (LANKAPAY)'
                  : order.orderMethod === 'PROFORMA_QUOTE'
                  ? 'Quotation request'
                  : 'Order request'}
              </span>
              <div className="text-lg font-black text-zinc-950 print:text-black">
                #{order.orderId}
              </div>
              {order.transactionId && (
                <div className="text-[11px] text-emerald-700 font-bold">
                  Txn: {order.transactionId}
                </div>
              )}
              <div className="text-xs text-zinc-500 print:text-gray-600">
                {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 print:bg-gray-50 border border-zinc-200 print:border-gray-200 text-xs">
            <div>
              <span className="text-xs font-bold text-zinc-600 print:text-gray-600 block mb-1">
                Customer
              </span>
              <div className="font-bold text-zinc-950 print:text-black text-sm">{order.customerName}</div>
              <div className="text-zinc-600 print:text-gray-700 font-mono mt-0.5">{order.phone}</div>
              {order.email && <div className="text-zinc-500 print:text-gray-600">{order.email}</div>}
            </div>

            <div>
              <span className="text-xs font-bold text-zinc-600 print:text-gray-600 block mb-1">
                Delivery
              </span>
              <div className="font-semibold text-zinc-900 print:text-black">{order.address}</div>
              <div className="text-zinc-600 print:text-gray-700">{order.city}, {order.district} District</div>
              <div className="text-amber-700 print:text-black font-bold mt-1 font-mono">
                Method: {order.orderMethod.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 print:border-gray-300 text-zinc-500 print:text-gray-600 font-mono">
                  <th className="py-2">Item Description / SKU</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 print:divide-gray-200 font-mono">
                {order.items.map(item => (
                  <tr key={item.product.id}>
                    <td className="py-3">
                      <div className="font-bold text-zinc-950 print:text-black font-sans">{item.product.name}</div>
                      <div className="text-[11px] text-zinc-500 print:text-gray-500">
                        {item.product.brand} • SKU: {item.product.sku} • {item.product.warranty}
                      </div>
                    </td>
                    <td className="py-3 text-center font-bold text-zinc-800 print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-zinc-600 print:text-gray-800">
                      Rs. {item.product.price.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-950 print:text-black">
                      Rs. {(item.quantity * item.product.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="pt-4 border-t border-zinc-200 print:border-gray-300 flex justify-end">
            <div className="w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500 print:text-gray-600">
                <span>Subtotal:</span>
                <span className="text-zinc-900 font-bold">Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-500 print:text-gray-600">
                <span>Courier Delivery ({order.district}):</span>
                <span className="text-zinc-900 font-bold">Rs. {order.shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-950 print:text-black pt-2 border-t border-zinc-200 print:border-gray-300 font-display">
                <span>Total:</span>
                <span className="text-red-600 print:text-black font-black text-base font-sans">
                  Rs. {order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Company Warranty Notice */}
          <div className="p-4 rounded-xl bg-zinc-50 print:bg-gray-100 border border-zinc-200 print:border-gray-300 text-[11px] text-zinc-600 print:text-gray-600 space-y-1">
            <div className="font-bold text-zinc-900 print:text-black flex items-center gap-1.5 font-display">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Warranty & Dispatch Terms:</span>
            </div>
            <p>
              All tools supplied carry authentic manufacturer warranty backed by authorized service stations across Sri Lanka. For COD deliveries, please ensure cash is ready at the address.
            </p>
          </div>

          {/* Action Buttons (Hidden on print) */}
          <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Print</span>
              </button>

              <button
                onClick={handleWhatsAppContact}
                className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-sm transition-colors cursor-pointer font-display"
            >
              Continue shopping
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
