import { Product } from '../types';
import { defaultDescription, mapErpItemToProduct, stockOnHandLabel, stockWarrantyLabel } from './erpProductMapper';

/**
 * Admin panel edits, laid over the ERP catalog. The ERP snapshot is rewritten on
 * every sync, so edits are stored separately (see server/overridesStore.js) and
 * keyed by upper-cased SKU. A field that is absent simply follows the ERP.
 */
export interface ProductOverride {
  sku?: string; // original SKU, kept for admin-added products
  name?: string;
  price?: number;
  stockQuantity?: number;
  category?: string;
  brand?: string;
  image?: string;
  description?: string;
  deleted?: boolean; // hidden from the website
  custom?: boolean; // added in the admin panel, not present in the ERP
}

export interface OverridesDoc {
  version: number;
  updatedAt: string | null;
  products: Record<string, ProductOverride>;
}

export const EMPTY_OVERRIDES: OverridesDoc = { version: 1, updatedAt: null, products: {} };

/** Fields the admin can edit. */
export const EDITABLE_FIELDS = ['name', 'price', 'stockQuantity', 'category', 'brand', 'image', 'description'] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

export function skuKey(sku: string): string {
  return String(sku ?? '').trim().toUpperCase();
}

export function isEdited(override: ProductOverride | undefined): boolean {
  return Boolean(override) && !override.custom && EDITABLE_FIELDS.some(field => override[field] !== undefined);
}

export function applyOverrideToProduct(base: Product, override: ProductOverride): Product {
  const name = override.name ?? base.name;
  const price = override.price ?? base.price;
  const stockQuantity = override.stockQuantity ?? base.stockQuantity;
  const inStock = stockQuantity > 0;
  const isErpProduct = base.id.startsWith('erp-');

  const merged: Product = {
    ...base,
    name,
    price,
    stockQuantity,
    inStock,
    category: override.category ?? base.category,
    brand: override.brand ?? base.brand,
    image: override.image ?? base.image
  };

  if (override.price !== undefined) {
    merged.originalPrice = price;
    merged.discountPercentage = 0;
  }

  if (override.stockQuantity !== undefined && isErpProduct) {
    merged.warranty = stockWarrantyLabel(inStock);
    merged.specs = {
      ...base.specs,
      'Stock on Hand': stockOnHandLabel(stockQuantity, base.specs['Unit of Measure'] || 'Nos')
    };
  }

  if (override.description !== undefined) {
    merged.description = override.description;
  } else if (isErpProduct && (override.name !== undefined || override.price !== undefined)) {
    merged.description = defaultDescription(name, base.sku, price);
  }

  return merged;
}

/** Builds a full product for an item that exists only in the admin panel. */
export function productFromCustomOverride(key: string, override: ProductOverride): Product {
  const base = mapErpItemToProduct({
    sku: override.sku || key,
    name: override.name,
    price: override.price,
    stockQuantity: override.stockQuantity ?? 0
  });
  const { name, price, stockQuantity, ...rest } = override;
  const product = applyOverrideToProduct(base, rest);
  return { ...product, specs: { ...product.specs, 'System Source': 'Tools Mahagedara' } };
}

/** The catalog shoppers see: ERP products with edits applied, deleted ones removed, admin-added ones first. */
export function applyOverrides(baseProducts: Product[], doc: OverridesDoc): Product[] {
  const overrides = doc.products;
  const keys = Object.keys(overrides);
  if (keys.length === 0) return baseProducts;

  const baseKeys = new Set<string>();
  const merged: Product[] = [];
  for (const product of baseProducts) {
    const key = skuKey(product.sku);
    baseKeys.add(key);
    const override = overrides[key];
    if (!override) merged.push(product);
    else if (!override.deleted) merged.push(applyOverrideToProduct(product, override));
  }

  const added = keys
    .filter(key => overrides[key].custom && !overrides[key].deleted && !baseKeys.has(key))
    .map(key => productFromCustomOverride(key, overrides[key]));

  return added.length > 0 ? [...added, ...merged] : merged;
}

export async function fetchPublicOverrides(): Promise<OverridesDoc> {
  const res = await fetch('/api/overrides');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = await res.json();
  if (!doc || typeof doc.products !== 'object' || doc.products === null) throw new Error('Unexpected response');
  return doc;
}
