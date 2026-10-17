import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  QrCode,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  Printer,
  MessageSquare,
  Sparkles,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONTACT, SRI_LANKA_DISTRICTS } from '../data/mockProducts';
import { OrderDetails } from '../types';

interface PaymentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: OrderDetails) => void;
  initialInvoiceNo?: string;
  initialAmount?: number;
}

type PaymentTab = 'CART' | 'CUSTOM_INVOICE';
type PaymentMethod = 'CARD' | 'LANKA_QR' | 'KOKO';

export const PaymentPortalModal: React.FC<PaymentPortalModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  initialInvoiceNo = '',
  initialAmount
}) => {
  const { cart, subtotal, shippingFee, total, selectedDistrict, clearCart } = useCart();

  // Tab State: Cart items or custom invoice/repair bill
  const [activeTab, setActiveTab] = useState<PaymentTab>(
    cart.length > 0 && !initialInvoiceNo ? 'CART' : 'CUSTOM_INVOICE'
  );

  // Selected Payment Gateway
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');

  // Custom Invoice Inputs
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoiceNo || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [customAmount, setCustomAmount] = useState<string>(
    initialAmount ? String(initialAmount) : (total > 0 ? String(total) : '25000')
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('Tools & Machinery Purchase');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Koko Form State
  const [kokoPhone, setKokoPhone] = useState('');

  // Bank Transfer / Slip State
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [bankRefNo, setBankRefNo] = useState('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Processing & 3DS OTP Simulation States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('739201');
  const [errorMessage, setErrorMessage] = useState('');
  const [paidReceipt, setPaidReceipt] = useState<OrderDetails | null>(null);

  if (!isOpen) return null;

  // Amount computation
  const payableAmount = activeTab === 'CART'
    ? (total > 0 ? total : 0)
    : (parseFloat(customAmount) || 0);

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setCardExpiry(raw);
  };

  // Card Brand Detection
  const getCardBrand = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (num.startsWith('5') || num.startsWith('2')) return 'MASTERCARD';
    if (num.startsWith('3')) return 'AMEX';
    return 'LANKAPAY';
  };

  // Copy bank account helper
  const handleCopy = (text: string, bankId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bankId);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  // File slip upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSlipFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initiate Payment
  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (payableAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than Rs. 0');
      return;
    }

    if (activeTab === 'CUSTOM_INVOICE') {
      if (!customerName.trim()) {
        setErrorMessage('Please enter your full name or company name.');
        return;
      }
      if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) {
        setErrorMessage('Please enter a valid Sri Lankan phone number.');
        return;
      }
    }

    if (paymentMethod === 'CARD') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        setErrorMessage('Please enter a valid 16-digit debit/credit card number.');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Please enter the name on your card.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMessage('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMessage('Please enter the 3 or 4-digit CVV security code.');
        return;
      }

      // Trigger Bank 3DS OTP verification
      setShowOtpModal(true);
      return;
    }

    if (paymentMethod === 'KOKO') {
      if (!kokoPhone || kokoPhone.replace(/\D/g, '').length < 9) {
        setErrorMessage('Please enter your Koko registered mobile number.');
        return;
      }
      finalizePayment('KOKO_PAY', 'Koko Pay Sri Lanka (3x Installments)');
      return;
    }

    if (paymentMethod === 'LANKA_QR') {
      finalizePayment('BANK_TRANSFER', 'LankaQR / Direct CEFT Transfer');
      return;
    }
  };

  // Complete Payment after 3DS OTP
  const handleConfirmOtp = () => {
    setShowOtpModal(false);
    finalizePayment('ONLINE_CARD', `${getCardBrand()} - LankaPay Gateway`);
  };

  const finalizePayment = (
    method: OrderDetails['orderMethod'],
    gatewayName: string
  ) => {
    setIsProcessing(true);
    setProcessingStep('Connecting to LankaPay National Payment Network...');

    setTimeout(() => {
      setProcessingStep('Authorizing funds with issuer bank...');
    }, 900);

    setTimeout(() => {
      setProcessingStep('Securing transaction & generating official receipt...');
    }, 1800);

    setTimeout(() => {
      setIsProcessing(false);

      const txnId = `TXN-LP-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const orderId = activeTab === 'CART'
        ? `TM-${Date.now().toString().slice(-6)}`
        : invoiceNumber;

      const completedOrder: OrderDetails = {
        orderId,
        customerName: activeTab === 'CART' ? (customerName || 'Registered Contractor') : customerName,
        phone: activeTab === 'CART' ? (customerPhone || STORE_CONTACT.phone) : customerPhone,
        email: customerEmail || undefined,
        district: selectedDistrict || 'Kalutara',
        city: 'Kalutara South',
        address: STORE_CONTACT.address,
        notes: activeTab === 'CUSTOM_INVOICE' ? `Payment for invoice ${invoiceNumber} - ${paymentPurpose}` : 'Online Card Settlement',
        orderMethod: method,
        items: activeTab === 'CART' ? [...cart] : [
          {
            product: {
              id: 'custom-invoice-item',
              sku: invoiceNumber,
              name: `Invoice Settlement - ${paymentPurpose}`,
              brand: 'Tools Mahagedara',
              category: 'invoices',
              price: payableAmount,
              stockQuantity: 1,
              inStock: true,
              rating: 5,
              reviewsCount: 1,
              warranty: 'Official Company Invoice',
              image: '/images/tool_1.jpg',
              description: `Direct payment for invoice #${invoiceNumber}`
            } as any,
            quantity: 1
          }
        ],
        subtotal: activeTab === 'CART' ? subtotal : payableAmount,
        shippingFee: activeTab === 'CART' ? shippingFee : 0,
        total: payableAmount,
        status: 'PAID',
        paymentStatus: 'PAID',
        transactionId: txnId,
        paymentGateway: gatewayName,
        cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : '8492',
        bankSlipUploaded: !!slipFile,
        createdAt: new Date().toISOString()
      };

      if (activeTab === 'CART') {
        clearCart();
      }

      setPaidReceipt(completedOrder);
      onPaymentSuccess(completedOrder);
    }, 2600);
  };

  const handleShareWhatsAppReceipt = () => {
    if (!paidReceipt) return;
    const msg = encodeURIComponent(
      `*PAYMENT CONFIRMATION - TOOLS MAHAGEDARA*\n` +
      `----------------------------------------\n` +
      `Receipt Ref: *#${paidReceipt.orderId}*\n` +
      `Transaction ID: *${paidReceipt.transactionId}*\n` +
      `Paid Amount: *Rs. ${paidReceipt.total.toLocaleString()}*\n` +
      `Status: *PAID & SETTLED (LankaPay)*\n` +
      `Customer: ${paidReceipt.customerName} (${paidReceipt.phone})\n` +
      `Gateway: ${paidReceipt.paymentGateway}\n` +
      `Date: ${new Date(paidReceipt.createdAt).toLocaleString()}\n` +
      `----------------------------------------\n` +
      `Thank you for your payment to Tools Mahagedara Kalutara!`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-3xl bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col text-zinc-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black">
              <Lock className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-display tracking-tight text-white">
                  Tools Mahagedara Secure Payment Portal
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  256-BIT SSL ENCRYPTED
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Official LankaPay & Bank Gateway for Tools Mahagedara Kalutara
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close portal"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Receipt View */}
        {paidReceipt ? (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Payment Authorized & Settled
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 font-display mt-2">
                Rs. {paidReceipt.total.toLocaleString()}
              </h3>
              <p className="text-sm text-zinc-600">
                Transaction ID: <strong className="font-mono text-zinc-900">{paidReceipt.transactionId}</strong>
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left text-xs space-y-3 font-mono">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Invoice / Reference:</span>
                <span className="font-bold text-zinc-950">#{paidReceipt.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Customer Name:</span>
                <span className="font-bold text-zinc-950">{paidReceipt.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Payment Gateway:</span>
                <span className="font-bold text-emerald-700">{paidReceipt.paymentGateway}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Card / Method:</span>
                <span className="font-bold text-zinc-950">
                  {paidReceipt.cardLast4 ? `Ending in •••• ${paidReceipt.cardLast4}` : 'Direct Bank Deposit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date & Time:</span>
                <span className="text-zinc-800">{new Date(paidReceipt.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Print Official Receipt</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsAppReceipt}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase transition-colors cursor-pointer font-display"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStartPayment} className="overflow-y-auto p-5 sm:p-6 space-y-6">

            {errorMessage && (
              <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Select What to Pay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
                  1. Payment Purpose & Amount
                </label>
                <span className="text-xs font-mono font-bold text-amber-600">
                  Total: Rs. {payableAmount.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('CART')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'CART'
                      ? 'bg-zinc-950 text-amber-400 font-bold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Cart Items ({cart.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('CUSTOM_INVOICE')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'CUSTOM_INVOICE'
                      ? 'bg-zinc-950 text-amber-400 font-bold shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pay Invoice / Repair Bill</span>
                </button>
              </div>

              {activeTab === 'CART' ? (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                  <div className="flex justify-between text-zinc-600">
                    <span>Selected Tools ({cart.reduce((a, b) => a + b.quantity, 0)} units):</span>
                    <span className="font-bold text-zinc-900 font-mono">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Courier Delivery ({selectedDistrict || 'Island-wide'}):</span>
                    <span className="font-bold text-zinc-900 font-mono">Rs. {shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200 font-display">
                    <span>Payable Total:</span>
                    <span className="text-base text-red-600 font-sans font-black">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                      Invoice / Quotation Reference
                    </label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-894 or TM-49102"
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                      Payment Amount (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-zinc-500">Rs.</span>
                      <input
                        type="number"
                        required
                        min="100"
                        step="100"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        placeholder="25000"
                        className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                      Contractor / Payer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Your full name or workshop"
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="077 214 0011"
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Gateway Selection */}
            <div className="space-y-3 pt-2 border-t border-zinc-200">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display block">
                2. Select Payment Method
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Method A: Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'CARD'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/30'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'CARD' ? 'text-amber-600' : 'text-zinc-500'}`} />
                    <span className="text-[10px] font-mono font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                      INSTANT
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-950 font-display">Credit / Debit Card</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Visa, Mastercard, LankaPay</div>
                  </div>
                </button>

                {/* Method B: LankaQR & Bank */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('LANKA_QR')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'LANKA_QR'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/30'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <QrCode className={`w-5 h-5 ${paymentMethod === 'LANKA_QR' ? 'text-amber-600' : 'text-zinc-500'}`} />
                    <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                      LANKA QR
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-950 font-display">LankaQR & Bank Transfer</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Scan with any bank app</div>
                  </div>
                </button>

                {/* Method C: Koko Pay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('KOKO')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'KOKO'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/30'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Sparkles className={`w-5 h-5 ${paymentMethod === 'KOKO' ? 'text-amber-600' : 'text-zinc-500'}`} />
                    <span className="text-[10px] font-mono font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">
                      3x 0% INT
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-950 font-display">Koko Buy Now Pay Later</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Pay in 3 monthly parts</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Payment Details Form */}
            <div className="space-y-4 pt-2 border-t border-zinc-200">
              {paymentMethod === 'CARD' && (
                <div className="space-y-4">
                  {/* Virtual Card Preview */}
                  <div className="w-full max-w-sm mx-auto h-44 rounded-2xl p-5 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-amber-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                        TOOLS MAHAGEDARA PAY
                      </span>
                      <span className="text-xs font-black font-display text-white">
                        {getCardBrand()}
                      </span>
                    </div>

                    <div className="font-mono text-base tracking-widest text-zinc-200">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex items-end justify-between text-xs font-mono">
                      <div>
                        <div className="text-[9px] text-zinc-400 uppercase">Cardholder</div>
                        <div className="font-bold tracking-wider truncate max-w-[170px] uppercase">
                          {cardHolder || 'YOUR NAME'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-zinc-400 uppercase">Expires</div>
                        <div className="font-bold">{cardExpiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Inputs */}
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
                          className="w-full bg-white border border-zinc-300 rounded-lg pl-3.5 pr-12 py-2.5 text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                          {getCardBrand()}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                        Cardholder Name (as printed on card)
                      </label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="K. A. PERERA"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-mono uppercase text-zinc-900 focus:outline-none focus:border-amber-500"
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
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-zinc-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1 flex items-center justify-between">
                        <span>CVV / CVC</span>
                        <span className="text-[10px] text-zinc-500 font-normal">3 or 4 digits</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-zinc-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'LANKA_QR' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                    <div className="text-center sm:text-left space-y-2">
                      <span className="text-[10px] font-mono font-bold bg-amber-400 text-zinc-950 px-2 py-0.5 rounded uppercase">
                        Scan & Pay via LankaQR
                      </span>
                      <h4 className="text-sm font-bold text-zinc-950 font-display">
                        Pay with any Sri Lankan Bank App
                      </h4>
                      <p className="text-xs text-zinc-600">
                        Open Commercial Bank ePassbook, Sampath Vishwa, BOC Smart, Flash, or FriMi and scan:
                      </p>
                      <div className="text-xs font-mono font-bold text-zinc-900">
                        Merchant: Tools Mahagedara (Kalutara)
                      </div>
                    </div>

                    {/* QR Representation */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-36 h-36 bg-white border-2 border-zinc-900 rounded-xl p-2 shadow-inner flex items-center justify-center relative">
                        <div className="w-full h-full bg-zinc-900 rounded-lg flex flex-col items-center justify-center text-amber-400 p-2 text-center">
                          <QrCode className="w-16 h-16 text-amber-400" />
                          <span className="text-[8px] font-mono font-bold text-white uppercase mt-1">
                            LANKAQR VERIFIED
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1">
                        Scan to pay Rs. {payableAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Bank Accounts with 1-click Copy */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-700 block">
                      Or Direct CEFT / Deposit Bank Accounts:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {STORE_CONTACT.bankAccounts.map(b => (
                        <div key={b.bank} className="p-3 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-zinc-950">{b.bank}</div>
                            <div className="font-mono font-bold text-amber-700">{b.accountNumber}</div>
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
                  </div>

                  {/* Slip Upload & Bank Ref */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                        Bank Reference / Transaction #
                      </label>
                      <input
                        type="text"
                        value={bankRefNo}
                        onChange={e => setBankRefNo(e.target.value)}
                        placeholder="e.g. CEFT-849102"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                        Attach Transfer Slip Proof (Optional)
                      </label>
                      <label className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-zinc-300 hover:border-amber-500 rounded-lg bg-zinc-50 hover:bg-zinc-100 cursor-pointer text-xs text-zinc-600">
                        <Upload className="w-4 h-4 text-amber-500" />
                        <span>{slipFile ? 'Slip Attached ✓' : 'Upload Receipt Slip'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'KOKO' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 font-display text-sm">
                        Koko 3-Month Installment Plan
                      </span>
                      <span className="text-[10px] font-bold font-mono bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                        0% INTEREST
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                        <div className="text-[10px] text-zinc-500 font-mono">Today</div>
                        <div className="font-black text-purple-900 font-display mt-0.5">
                          Rs. {(payableAmount / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                        <div className="text-[10px] text-zinc-500 font-mono">30 Days</div>
                        <div className="font-black text-purple-900 font-display mt-0.5">
                          Rs. {(payableAmount / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
                        <div className="text-[10px] text-zinc-500 font-mono">60 Days</div>
                        <div className="font-black text-purple-900 font-display mt-0.5">
                          Rs. {(payableAmount / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-purple-950 block mb-1">
                        Koko Registered Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={kokoPhone}
                        onChange={e => setKokoPhone(e.target.value)}
                        placeholder="07X XXX XXXX"
                        className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Central Bank of Sri Lanka Certified Gateway</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer font-display shadow-sm flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay Rs. {payableAmount.toLocaleString()} Securely</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </form>
        )}

        {/* 3D-Secure Bank OTP Modal Simulation */}
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
                  A 6-digit One-Time Password (OTP) has been sent to your registered mobile phone for authentication of <strong>Rs. {payableAmount.toLocaleString()}</strong> at <strong>Tools Mahagedara</strong>.
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

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-70 flex flex-col items-center justify-center p-4 bg-black/85 text-white space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
            <h4 className="text-lg font-black font-display tracking-tight text-white">
              Processing Payment...
            </h4>
            <p className="text-xs font-mono text-amber-400 animate-pulse">
              {processingStep}
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
