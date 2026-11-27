import { Product } from '../types';
import { PRODUCT_IMAGES } from '../data/productImages';
import { getNearMatchImage } from '../data/nearMatchImages';

export const SAMPLE_TOOL_IMAGES = {
  powerTools: '/images/tool_6.webp',
  paintSprayer: '/images/products/ASG4042.webp',
  handTools: '/images/tool_20.webp',
  machinery: '/images/products/VPM3708.webp',
  measuring: '/images/products/HDCD01150.webp',
  toolBox: '/images/products/HTB02.webp',
  hardware: '/images/products/AKDB1125.webp'
};

export function getSampleImageForProduct(name: string, category: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('PAINT') || upper.includes('SPRAY')) return SAMPLE_TOOL_IMAGES.paintSprayer;
  if (upper.includes('CALIPER') || upper.includes('VERNIER') || upper.includes('MEASURE')) return SAMPLE_TOOL_IMAGES.measuring;
  if (upper.includes('BOX') || upper.includes('CASE') || upper.includes('CHEST')) return SAMPLE_TOOL_IMAGES.toolBox;
  if (upper.includes('WRENCH') || upper.includes('SOCKET') || upper.includes('BIT') || upper.includes('PLIER') || upper.includes('SCREWDRIVER')) return SAMPLE_TOOL_IMAGES.handTools;
  if (upper.includes('WASHER') || upper.includes('PUMP') || upper.includes('GENERATOR') || upper.includes('WELDING')) return SAMPLE_TOOL_IMAGES.machinery;
  if (upper.includes('DRILL') || upper.includes('GRINDER') || upper.includes('HAMMER') || upper.includes('SAW')) return SAMPLE_TOOL_IMAGES.powerTools;
  if (category === 'power-tools') return SAMPLE_TOOL_IMAGES.powerTools;
  if (category === 'hand-tools') return SAMPLE_TOOL_IMAGES.handTools;
  if (category === 'machinery') return SAMPLE_TOOL_IMAGES.machinery;
  return SAMPLE_TOOL_IMAGES.hardware;
}

export function detectCategory(name: string): string {
  const upper = name.toUpperCase();
  if (
    upper.includes('DRILL') || 
    upper.includes('GRINDER') || 
    upper.includes('HAMMER') || 
    upper.includes('SAW') || 
    upper.includes('SPRAYER') || 
    upper.includes('BLOWER') || 
    upper.includes('SANDER') || 
    upper.includes('ROUTER') || 
    upper.includes('CUTTER')
  ) {
    return 'power-tools';
  }
  if (
    upper.includes('WRENCH') || 
    upper.includes('SOCKET') || 
    upper.includes('BIT') || 
    upper.includes('PLIER') || 
    upper.includes('SCREWDRIVER') || 
    upper.includes('CALIPER') || 
    upper.includes('MEASURE') || 
    upper.includes('GUN') || 
    upper.includes('HANDLE') ||
    upper.includes('TOOL BOX')
  ) {
    return 'hand-tools';
  }
  if (
    upper.includes('WASHER') || 
    upper.includes('PUMP') || 
    upper.includes('GENERATOR') || 
    upper.includes('COMPRESSOR') || 
    upper.includes('WELDING')
  ) {
    return 'machinery';
  }
  return 'accessories';
}

export function detectBrand(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('BOSCH')) return 'BOSCH';
  if (upper.includes('MAKITA')) return 'MAKITA';
  if (upper.includes('DEWALT')) return 'DeWALT';
  if (upper.includes('DONGCHENG') || upper.includes('DONG CHENG')) return 'DongCheng';
  if (upper.includes('COOFIX')) return 'COOFIX';
  if (upper.includes('INGCO')) return 'INGCO';
  if (upper.includes('TOTAL')) return 'TOTAL';
  if (upper.includes('HUGO')) return 'HUGO';
  if (upper.includes('LION')) return 'LION';
  return 'Tools Mahagedara';
}

/** Default product text shown when the admin has not written a description. */
export function defaultDescription(name: string, sku: string, price: number): string {
  return `Original ${name} (Item Code: ${sku}) available at Tools Mahagedara Showroom, Katukurunda, Kalutara. Active showroom price: Rs. ${price.toLocaleString()}.`;
}

export function stockOnHandLabel(stockQuantity: number, unit: string): string {
  return `${stockQuantity} ${unit} in showroom`;
}

export function stockWarrantyLabel(inStock: boolean): string {
  return inStock ? 'Physical Showroom Stock' : 'Order Upon Request';
}

export function mapErpItemToProduct(
  item: any,
  customImages: Record<string, string> = {},
  applyStoreDiscount = true
): Product {
  const sku = String(item.sku || item.itemCode || '').trim();
  const name = String(item.name || item.itemName || sku).trim();
  const category = detectCategory(name);
  const brand = detectBrand(name);
  const rawPrice = Number(item.price ?? item.itemRate) || 0;
  const rawOriginal = Number(item.originalPrice ?? item.maxsales) || rawPrice;
  const baseOriginal = rawOriginal > rawPrice ? rawOriginal : rawPrice;
  const hasBaseDiscount = baseOriginal > rawPrice && rawPrice > 0;
  const price =
    applyStoreDiscount && rawPrice > 0 && !hasBaseDiscount
      ? Math.round(rawPrice * 0.9)
      : rawPrice;
  const originalPrice = baseOriginal > price ? baseOriginal : price;
  const discountPercentage =
    applyStoreDiscount && rawPrice > 0 && !hasBaseDiscount
      ? 10
      : Number(item.discountPercentage ?? item.item_discount_PCN) || 0;
  const stockQuantity = Math.max(0, Number(item.stockQuantity ?? item.onHand) || 0);
  const inStock = stockQuantity > 0;
  const unit = item.unitOfMeasure || item.unitOfMesher || 'Nos';

  // Check if admin has set a custom image for this SKU/ID
  const image = customImages[sku] || customImages[sku.toUpperCase()] || PRODUCT_IMAGES[sku] || getNearMatchImage(name) || getSampleImageForProduct(name, category);

  return {
    id: `erp-${sku}`,
    sku,
    name,
    brand,
    category,
    price,
    originalPrice,
    discountPercentage,
    stockQuantity,
    inStock,
    rating: 4.8,
    reviewsCount: 5,
    warranty: stockWarrantyLabel(inStock),
    image,
    description: defaultDescription(name, sku, price),
    specs: {
      'Item Code': sku,
      'Stock on Hand': stockOnHandLabel(stockQuantity, unit),
      'Unit of Measure': unit,
      'System Source': 'ThirdEYE ERP Solutions'
    },
    syncSource: 'ERS_DATABASE',
    ersLastUpdated: item.lastSynced || new Date().toISOString()
  };
}

