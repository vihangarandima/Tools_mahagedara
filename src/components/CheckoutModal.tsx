import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Upload,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SRI_LANKA_DISTRICTS, STORE_CONTACT } from '../data/mockProducts';
import { OrderDetails } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (order: OrderDetails) => void;
}

type OrderMethod = OrderDetails['orderMethod'];

const METHODS: { id: OrderMethod; title: string; badge?: string; description: string }[] = [
  {
    id: 'ONLINE_CARD',
    title: 'Credit / Debit Card (LankaPay)',
    badge: 'INSTANT PAY',
    description: 'Instant secure payment via Visa, Mastercard, AMEX, or LankaPay national network.'
  },
  {
    id: 'KOKO_PAY',
    title: 'Koko (Buy Now Pay Later)',
    badge: '3x 0% INT',
    description: 'Pay in 3 equal monthly installments with 0% interest on any Sri Lankan debit card.'
  },
  {
    id: 'BANK_TRANSFER',
    title: 'Direct Bank Transfer & LankaQR',
    badge: 'CEFT / QR',
    description: 'Pay into Commercial Bank or Sampath Bank and attach payment slip.'
  },
  {
    id: 'COD',
    title: 'Cash on Delivery (COD)',
    badge: 'DOORSTEP',
    description: 'Pay the courier in cash when your tools arrive at your workshop/job site.'
  },
  {
    id: 'WHATSAPP',
    title: 'Confirm on WhatsApp',
    badge: 'DIRECT CHAT',
    description: 'Our Katukurunda store sales team verifies stock and agrees dispatch with you.'
  },
  {
    id: 'PROFORMA_QUOTE',
    title: 'Pro-forma Quotation',
    badge: 'CORPORATE',
    description: 'A stamped commercial quotation for company Purchase Orders & tenders.'
  }
];

const inputClass = 'w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors';
const labelClass = 'text-xs font-bold text-zinc-700 mb-1 block';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderComplete
}) => {
  const { cart, subtotal, shippingFee, total, selectedDistrict, setSelectedDistrict, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderMethod>('ONLINE_CARD');
  const [errorMessage, setErrorMessage] = useState('');

  // Card specific state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Koko specific state
  const [kokoPhone, setKokoPhone] = useState('');

  // Bank transfer state
  const [bankRefNo, setBankRefNo] = useState('');
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // 3DS OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('739201');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  if (!isOpen) return null;

  const methodTitle = METHODS.find(m => m.id === paymentMethod)?.title ?? '';

  const getCardBrand = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (num.startsWith('5') || num.startsWith('2')) return 'MASTERCARD';
    if (num.startsWith('3')) return 'AMEX';
    return 'LANKAPAY';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setCardExpiry(raw);
  };

  const handleCopy = (text: string, bankId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bankId);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSlipFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name or company name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setErrorMessage('Please enter a valid phone number (at least 9 digits, e.g. 077 123 4567).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter the street delivery address.');
      return;
    }

    // Validation for Online Card
    if (paymentMethod === 'ONLINE_CARD') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Please enter a valid 16-digit debit/credit card number.');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Please enter the name printed on your card.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMessage('Please enter the card expiry date (MM/YY).');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMessage('Please enter the 3-digit CVV/CVC code.');
        return;
      }

      // Trigger 3D-Secure Bank Verification
      setShowOtpModal(true);
      return;
    }

    // Validation for Koko
    if (paymentMethod === 'KOKO_PAY') {
      if (!kokoPhone || kokoPhone.replace(/\D/g, '').length < 9) {
        setErrorMessage('Please enter your registered Koko mobile number.');
        return;
      }
    }

    processOrderCompletion('PENDING_CONFIRMATION');
  };

  const handleConfirmOtp = () => {
    setShowOtpModal(false);
    processOrderCompletion('PAID');
  };

  const processOrderCompletion = (orderStatus: OrderDetails['status']) => {
    const isPaid = orderStatus === 'PAID';

    if (isPaid) {
      setIsProcessing(true);
      setProcessingStatus('Connecting to LankaPay secure card network...');
      setTimeout(() => setProcessingStatus('Authorizing funds with bank...'), 900);
      setTimeout(() => setProcessingStatus('Payment authorized & receipt generated!'), 1800);
    }

    setTimeout(() => {
      setIsProcessing(false);
      const orderId = `TM-${Date.now().toString().slice(-6)}`;
      const txnId = isPaid ? `TXN-LP-${Math.floor(10000000 + Math.random() * 90000000)}` : undefined;

      const newOrder: OrderDetails = {
        orderId,
        customerName,
        phone,
        email: email || undefined,
        district: selectedDistrict,
        city: city || selectedDistrict,
        address,
        notes: notes || undefined,
        orderMethod: paymentMethod,
        items: [...cart],
        subtotal,
        shippingFee,
        total,
        status: orderStatus,
        paymentStatus: isPaid ? 'PAID' : (paymentMethod === 'COD' ? 'COD_ON_DELIVERY' : 'PENDING'),
        transactionId: txnId,
        paymentGateway: isPaid ? `${getCardBrand()} - LankaPay Gateway` : undefined,
        cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : undefined,
        bankSlipUploaded: !!slipFile,
        createdAt: new Date().toISOString()
      };

      const itemsList = cart
        .map(
          (item, i) =>
            `${i + 1}. *${item.product.name}* (SKU: ${item.product.sku})\n   Qty: ${item.quantity} x Rs. ${item.product.price.toLocaleString()} = Rs. ${(item.quantity * item.product.price).toLocaleString()}`
        )
        .join('\n\n');

      const waText = encodeURIComponent(
        `*NEW ORDER - TOOLS MAHAGEDARA*\n` +
        `Order Ref: *#${orderId}*\n` +
        `Payment Method: *${methodTitle}* ${isPaid ? '✅ (PAID ONLINE)' : ''}\n` +
        (txnId ? `Transaction ID: *${txnId}*\n\n` : `\n`) +
        `*Customer Details:*\n` +
        `• Name: ${customerName}\n` +
        `• Phone: ${phone}\n` +
        (email ? `• Email: ${email}\n` : '') +
        `• Delivery: ${address}, ${city || selectedDistrict}\n` +
        `• District: ${selectedDistrict}\n` +
        (notes ? `• Notes: ${notes}\n\n` : `\n`) +
        `*Ordered Tools:*\n${itemsList}\n\n` +
        `-------------------------\n` +
        `*Subtotal:* Rs. ${subtotal.toLocaleString()}\n` +
        `*Delivery:* Rs. ${shippingFee.toLocaleString()}\n` +
        `*TOTAL:* Rs. ${total.toLocaleString()}\n` +
        `-------------------------\n` +
        (isPaid
          ? `Status: Payment confirmed online via LankaPay. Please dispatch!`
          : `Please confirm availability and dispatch schedule.`)
      );

      // Open WhatsApp notification in separate tab
      window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${waText}`, '_blank');

      clearCart();
      onOrderComplete(newOrder);
      onClose();
    }, isPaid ? 2200 : 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="w-full max-w-3xl bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col text-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-zinc-950 font-black">
              <CreditCard className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h2 id="checkout-title" className="text-lg font-black text-white font-display">
                Checkout & Secure Payment
              </h2>
              <p className="text-xs text-zinc-400">
                Official LankaPay Online Gateway, Bank Transfer or Cash on Delivery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="overflow-y-auto p-6 space-y-6" noValidate>

          {errorMessage && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <fieldset className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <legend className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
                1. Select Payment Method
              </legend>
              <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                256-Bit Encrypted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METHODS.map(method => {
                const isSelected = paymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/30 shadow-xs'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="order-method"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-zinc-950 truncate font-display">
                          {method.title}
                        </span>
                        {method.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                            isSelected ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-zinc-500 mt-1 leading-snug">
                        {method.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Conditional Payment Method Input Sections */}
          {paymentMethod === 'ONLINE_CARD' && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-950 font-display uppercase tracking-wider">
                    Enter Debit / Credit Card Details
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                    VISA
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                    MC
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                    LANKAPAY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4532 8920 4910 8294"
                      maxLength={19}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                      {getCardBrand()}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="K. A. PERERA"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    CVV / CVC Code
                  </label>
                  <input
                    type="password"
                    required
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••"
                    maxLength={4}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by Verified by Visa & Mastercard Identity Check</span>
              </div>
            </div>
          )}

          {paymentMethod === 'KOKO_PAY' && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 font-display text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Koko 3-Month Plan (0% Interest)
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                  3 INSTALLMENTS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                  <div className="text-[10px] text-zinc-500 font-mono">1. Today</div>
                  <div className="font-black text-purple-900 font-display mt-0.5">
                    Rs. {(total / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                  <div className="text-[10px] text-zinc-500 font-mono">2. In 30 Days</div>
                  <div className="font-black text-purple-900 font-display mt-0.5">
                    Rs. {(total / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                  <div className="text-[10px] text-zinc-500 font-mono">3. In 60 Days</div>
                  <div className="font-black text-purple-900 font-display mt-0.5">
                    Rs. {(total / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-950 block mb-1">
                  Koko Registered Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={kokoPhone}
                  onChange={e => setKokoPhone(e.target.value)}
                  placeholder="07X XXX XXXX"
                  className="w-full bg-white border border-purple-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 font-display flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-500" />
                  Direct Bank Accounts & LankaQR
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">Official Company Accounts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {STORE_CONTACT.bankAccounts.map(b => (
                  <div key={b.bank} className="p-3.5 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-950 font-display">{b.bank}</div>
                      <div className="font-mono font-bold text-amber-700 text-sm">{b.accountNumber}</div>
                      <div className="text-[11px] text-zinc-600">{b.accountName}</div>
                      <div className="text-[10px] text-zinc-500">{b.branch}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(b.accountNumber, b.bank)}
                      className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedBank === b.bank ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Bank Reference / Slip Ref #
                  </label>
                  <input
                    type="text"
                    value={bankRefNo}
                    onChange={e => setBankRefNo(e.target.value)}
                    placeholder="e.g. CEFT-98402"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Attach Payment Slip (Optional)
                  </label>
                  <label className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-300 hover:border-amber-500 rounded-xl bg-white hover:bg-zinc-100 cursor-pointer text-xs text-zinc-600">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>{slipFile ? 'Slip Attached ✓' : 'Upload Screenshot / PDF'}</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Contact and Delivery */}
          <fieldset className="space-y-4 pt-2 border-t border-zinc-200">
            <legend className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display mb-3">
              2. Contact & Island-wide Delivery
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-name" className={labelClass}>Customer Name or Company *</label>
                <input id="co-name" type="text" required autoComplete="name" placeholder="Kasun Perera" value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="co-phone" className={labelClass}>Phone or WhatsApp Number *</label>
                <input id="co-phone" type="tel" required autoComplete="tel" placeholder="077 123 4567" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-email" className={labelClass}>Email for Official Receipt (optional)</label>
                <input id="co-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="co-district" className={labelClass}>Delivery District</label>
                <select id="co-district" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className={inputClass}>
                  {SRI_LANKA_DISTRICTS.map(d => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.standardDeliveryDays})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-city" className={labelClass}>City / Town (optional)</label>
                <input id="co-city" type="text" autoComplete="address-level2" placeholder="Kalutara, Panadura, Colombo..." value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="co-address" className={labelClass}>Street Address for Delivery *</label>
                <input id="co-address" type="text" required autoComplete="street-address" placeholder="No. 45/A, Galle Road" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="co-notes" className={labelClass}>Special Instructions / Site Notes (optional)</label>
              <textarea
                id="co-notes"
                rows={2}
                placeholder="Specific landmark, contractor gate code, or call before arriving"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </fieldset>

          {/* Order Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
            <h3 className="font-bold text-zinc-950 font-display text-sm">Order & Pricing Breakdown</h3>
            <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {cart.map(item => (
                <li key={item.product.id} className="flex justify-between gap-3 text-zinc-700">
                  <span className="truncate">{item.quantity} × {item.product.name}</span>
                  <span className="text-zinc-950 font-semibold font-mono shrink-0">
                    Rs. {(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-zinc-600 pt-2 border-t border-zinc-200">
              <span>Courier Delivery ({selectedDistrict}):</span>
              <span className="font-mono font-bold text-zinc-900">Rs. {shippingFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline font-display">
              <span className="font-bold text-zinc-950 text-sm">Total Payable</span>
              <span className="text-xl font-black text-red-600 font-sans">
                Rs. {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all font-display cursor-pointer shadow-md ${
              paymentMethod === 'ONLINE_CARD'
                ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black'
                : paymentMethod === 'KOKO_PAY'
                ? 'bg-purple-700 hover:bg-purple-800 text-white'
                : paymentMethod === 'WHATSAPP'
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white'
            }`}
          >
            {paymentMethod === 'ONLINE_CARD' && (
              <>
                <Lock className="w-5 h-5 text-zinc-950" />
                <span>Pay Rs. {total.toLocaleString()} via LankaPay Card Gateway</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
            {paymentMethod === 'KOKO_PAY' && (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Pay with Koko (3x Rs. {(total / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
              </>
            )}
            {paymentMethod === 'BANK_TRANSFER' && (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Bank Deposit Order (Rs. {total.toLocaleString()})</span>
              </>
            )}
            {paymentMethod === 'COD' && (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Place Cash on Delivery Order (Rs. {total.toLocaleString()})</span>
              </>
            )}
            {paymentMethod === 'WHATSAPP' && (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Send Order Confirmation on WhatsApp</span>
              </>
            )}
            {paymentMethod === 'PROFORMA_QUOTE' && (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Generate Official Quotation Request</span>
              </>
            )}
          </button>

        </form>

        {/* 3DS OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white border border-zinc-300 rounded-2xl shadow-2xl p-6 space-y-4 text-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-zinc-950 text-xs">
                    LP
                  </div>
                  <h4 className="font-bold text-sm text-zinc-950 font-display">
                    Bank 3D-Secure Verification
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-500">
                  LankaPay 2.0
                </span>
              </div>

              <div className="text-xs text-zinc-600 space-y-2">
                <p>
                  A 6-digit One-Time Password (OTP) has been sent to your registered mobile phone for authentication of <strong>Rs. {total.toLocaleString()}</strong> at <strong>Tools Mahagedara</strong>.
                </p>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-zinc-800 font-mono text-center">
                  <span className="text-[10px] text-amber-700 block uppercase">Test Demo OTP:</span>
                  <strong className="text-lg tracking-widest text-zinc-950">739201</strong>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Enter 6-Digit OTP:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl py-2.5 text-center text-lg font-mono font-black tracking-widest text-zinc-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOtp}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase cursor-pointer font-display"
                >
                  Authorize Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-70 flex flex-col items-center justify-center p-4 bg-black/85 text-white space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
            <h4 className="text-lg font-black font-display tracking-tight text-white">
              Processing Secure Payment...
            </h4>
            <p className="text-xs font-mono text-amber-400 animate-pulse">
              {processingStatus}
            </p>
            <span className="text-[11px] text-zinc-400">
              Please do not refresh or close this browser window.
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
