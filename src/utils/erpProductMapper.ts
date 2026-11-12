import { Product } from '../types';
import { PRODUCT_IMAGES } from '../data/productImages';

export const SAMPLE_TOOL_IMAGES = {
  powerTools: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  paintSprayer: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  handTools: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
  machinery: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80',
  measuring: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  toolBox: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80',
  hardware: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=600&q=80'
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

export function mapErpItemToProduct(item: any, customImages: Record<string, string> = {}): Product {
  const sku = String(item.sku || item.itemCode || '').trim();
  const name = String(item.name || item.itemName || sku).trim();
  const category = detectCategory(name);
  const brand = detectBrand(name);
  const price = Number(item.price ?? item.itemRate) || 0;
  const originalPrice = Number(item.originalPrice ?? item.maxsales) || price;
  const stockQuantity = Math.max(0, Number(item.stockQuantity ?? item.onHand) || 0);
  const inStock = stockQuantity > 0;
  const unit = item.unitOfMeasure || item.unitOfMesher || 'Nos';

  // Check if admin has set a custom image for this SKU/ID
  const image = customImages[sku] || customImages[sku.toUpperCase()] || PRODUCT_IMAGES[sku] || getSampleImageForProduct(name, category);

  return {
    id: `erp-${sku}`,
    sku,
    name,
    brand,
    category,
    price,
    originalPrice: originalPrice > price ? originalPrice : price,
    discountPercentage: Number(item.discountPercentage ?? item.item_discount_PCN) || 0,
    stockQuantity,
    inStock,
    rating: 4.8,
    reviewsCount: 5,
    warranty: inStock ? 'Physical Showroom Stock' : 'Order Upon Request',
    image,
    description: `Original ${name} (Item Code: ${sku}) available at Tools Mahagedara Showroom, Katukurunda, Kalutara. Active showroom price: Rs. ${price.toLocaleString()}.`,
    specs: {
      'Item Code': sku,
      'Stock on Hand': `${stockQuantity} ${unit} in showroom`,
      'Unit of Measure': unit,
      'System Source': 'ThirdEYE ERP Solutions'
    },
    syncSource: 'ERS_DATABASE',
    ersLastUpdated: item.lastSynced || new Date().toISOString()
  };
}

