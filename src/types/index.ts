export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory?: string;
  price: number; // in LKR
  originalPrice?: number;
  discountPercentage?: number;
  stockQuantity: number;
  inStock: boolean;
  isHeavyDuty?: boolean;
  isCordless?: boolean;
  voltage?: string; // e.g. "20V", "18V", "230V"
  powerWattage?: string; // e.g. "750W", "2000W"
  rating: number;
  reviewsCount: number;
  warranty: string; // e.g. "6 Months Company Warranty"
  image: string;
  images?: string[];
  description: string;
  specs: Record<string, string>;
  includedItems?: string[];
  ersLastUpdated?: string;
  syncSource?: 'ERS_DATABASE' | 'LOCAL_CACHE';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  sinhalaName?: string;
  icon: string;
  description: string;
  count: number;
}

export interface Brand {
  id: string;
  name: string;
  origin: string;
  logo: string;
  description: string;
}

export interface OrderDetails {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  district: string;
  city: string;
  address: string;
  notes?: string;
  orderMethod: 'WHATSAPP' | 'COD' | 'BANK_TRANSFER' | 'PROFORMA_QUOTE' | 'ONLINE_CARD' | 'KOKO_PAY' | 'DIRECT_PORTAL';
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'PENDING_CONFIRMATION' | 'PROCESSING' | 'DISPATCHED' | 'PAID';
  paymentStatus?: 'PAID' | 'PENDING' | 'AUTHORIZED' | 'COD_ON_DELIVERY';
  transactionId?: string;
  paymentGateway?: string;
  cardLast4?: string;
  bankSlipUploaded?: boolean;
  createdAt: string;
}

export interface ERSSyncConfig {
  endpointUrl: string;
  apiKey: string;
  pollingIntervalMinutes: number;
  syncFrequency: 'REALTIME_WEBHOOK' | 'EVERY_15_MIN' | 'HOURLY' | 'DAILY_BATCH';
  autoStockThreshold: number;
  lastSyncTimestamp: string;
  totalItemsSynced: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  systemName: string; // e.g. "Accura POS / Tally ERP / Custom SQL Server"
  fieldMapping: {
    skuField: string;
    priceField: string;
    stockField: string;
    nameField: string;
    categoryField: string;
  };
}

export interface ERSSyncLog {
  id: string;
  timestamp: string;
  type: 'STOCK_UPDATE' | 'PRICE_CHANGE' | 'NEW_ITEM' | 'FULL_SYNC';
  message: string;
  itemsAffected: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}
