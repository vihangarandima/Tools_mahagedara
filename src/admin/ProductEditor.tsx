import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RotateCcw, X } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockProducts';
import { EDITABLE_FIELDS, EditableField, ProductOverride } from '../utils/productOverrides';

export interface EditorTarget {
  /** Product as currently shown on the site (ERP values with saved edits applied). */
  product: Product;
  /** Pure ERP values; absent for products that were added in the admin panel. */
  base?: Product;
  override?: ProductOverride;
}

interface Props {
  /** `null` opens the form for a brand-new product. */
  target: EditorTarget | null;
  saving: boolean;
  error: string | null;
  isSkuTaken: (sku: string) => boolean;
  onSave: (sku: string, fields: ProductOverride, isNew: boolean) => void;
  onReset: (sku: string) => void;
  onClose: () => void;
}

type FormValues = Record<EditableField, string>;

const CATEGORY_OPTIONS = [
  ...CATEGORIES.map(c => ({ id: c.id, name: c.name })),
  { id: 'accessories', name: 'Accessories & Hardware' }
];

const EMPTY_FORM: FormValues = {
  name: '',
  price: '',
  stockQuantity: '0',
  category: 'accessories',
  brand: 'Tools Mahagedara',
  image: '',
  description: ''
};

function toForm(product: Product): FormValues {
  return {
    name: product.name,
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
    category: product.category,
    brand: product.brand,
    image: product.image,
    description: product.description
  };
}

function isValidImage(url: string): boolean {
  return /^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//'));
}

function parseField(field: EditableField, raw: string): string | number {
  if (field === 'price') return Math.round(Number(raw) * 100) / 100;
  if (field === 'stockQuantity') return Math.round(Number(raw));
  return raw.trim();
}

const inputClass =
  'w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none';
const labelClass = 'block text-xs font-semibold text-zinc-300 mb-1.5';

export const ProductEditor: React.FC<Props> = ({ target, saving, error, isSkuTaken, onSave, onReset, onClose }) => {
  const isNew = target === null;
  const isCustom = isNew || Boolean(target.override?.custom);
  const initial = useMemo(() => (target ? toForm(target.product) : EMPTY_FORM), [target]);

  const [values, setValues] = useState<FormValues>(initial);
  const [sku, setSku] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [saving, onClose]);

  const set = (field: EditableField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }));
    setProblem(null);
  };

  const categoryOptions = CATEGORY_OPTIONS.some(c => c.id === values.category)
    ? CATEGORY_OPTIONS
    : [...CATEGORY_OPTIONS, { id: values.category, name: values.category }];

  const hasSavedEdits = !isCustom && EDITABLE_FIELDS.some(f => target?.override?.[f] !== undefined);
  const imagePreview = values.image.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = values.name.trim();
    const price = Number(values.price);
    const stock = Number(values.stockQuantity);
    const image = values.image.trim();

    if (!name) return setProblem('Please enter a product name.');
    if (values.price.trim() === '' || !Number.isFinite(price) || price < 0) return setProblem('Please enter a valid price.');
    if (values.stockQuantity.trim() === '' || !Number.isFinite(stock) || stock < 0) return setProblem('Please enter a valid stock quantity.');
    if (image && !isValidImage(image)) return setProblem('The image link must start with https:// (or / for a file on this site).');

    if (isNew) {
      const newSku = sku.trim() || `TM-${Date.now().toString(36).toUpperCase()}`;
      if (newSku.length > 120) return setProblem('The product code is too long.');
      if (isSkuTaken(newSku)) return setProblem('Another product already uses this product code.');

      const fields: ProductOverride = {};
      for (const field of EDITABLE_FIELDS) {
        const value = parseField(field, values[field]);
        if (value !== '') (fields as any)[field] = value;
      }
      return onSave(newSku, fields, true);
    }

    // Existing product: only store what differs from the ERP, so untouched fields keep following it
    const fields: ProductOverride = {};
    for (const field of EDITABLE_FIELDS) {
      const saved = target.override?.[field];
      if (values[field] === initial[field]) {
        if (saved !== undefined) (fields as any)[field] = saved;
        continue;
      }
      const value = parseField(field, values[field]);
      if (value === '') continue; // cleared: fall back to the default
      if (!isCustom && target.base && value === target.base[field]) continue; // back to the ERP value
      (fields as any)[field] = value;
    }
    onSave(target.product.sku, fields, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-xl max-h-[94dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-800">
          <div className="min-w-0">
            <h2 id="editor-title" className="text-lg text-white">{isNew ? 'Add a product' : 'Edit product'}</h2>
            {!isNew && <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">Code: {target.product.sku}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-2 -m-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isNew && (
            <div>
              <label htmlFor="f-sku" className={labelClass}>Product code (SKU) <span className="font-normal text-zinc-500">- optional</span></label>
              <input id="f-sku" value={sku} onChange={e => { setSku(e.target.value); setProblem(null); }} className={inputClass} placeholder="Leave empty to create one automatically" maxLength={120} />
            </div>
          )}

          <div>
            <label htmlFor="f-name" className={labelClass}>Name</label>
            <input id="f-name" value={values.name} onChange={set('name')} className={inputClass} maxLength={200} autoFocus={isNew} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="f-price" className={labelClass}>Price (Rs.)</label>
              <input id="f-price" type="number" inputMode="decimal" min="0" step="any" value={values.price} onChange={set('price')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="f-stock" className={labelClass}>Stock quantity</label>
              <input id="f-stock" type="number" inputMode="numeric" min="0" step="1" value={values.stockQuantity} onChange={set('stockQuantity')} className={inputClass} />
            </div>
          </div>

          {!isCustom && (
            <p className="text-xs text-zinc-400 leading-relaxed -mt-1">
              Price and stock normally update by themselves from the ERP system. If you change one here, your value stays until you reset it.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="f-category" className={labelClass}>Category</label>
              <select id="f-category" value={values.category} onChange={set('category')} className={inputClass}>
                {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-brand" className={labelClass}>Brand</label>
              <input id="f-brand" value={values.brand} onChange={set('brand')} className={inputClass} maxLength={60} />
            </div>
          </div>

          <div>
            <label htmlFor="f-image" className={labelClass}>Image link</label>
            <div className="flex gap-3 items-start">
              <div className="w-16 h-16 shrink-0 rounded-xl bg-white border border-zinc-700 overflow-hidden flex items-center justify-center">
                {imagePreview && isValidImage(imagePreview) && (
                  <img key={imagePreview} src={imagePreview} alt="" className="w-full h-full object-contain" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                )}
              </div>
              <input id="f-image" value={values.image} onChange={set('image')} className={inputClass} placeholder="https://..." maxLength={600} />
            </div>
          </div>

          <div>
            <label htmlFor="f-description" className={labelClass}>Description</label>
            <textarea id="f-description" value={values.description} onChange={set('description')} rows={4} className={`${inputClass} resize-y`} maxLength={2000} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 space-y-3">
          {(problem || error) && (
            <p role="alert" className="text-sm text-red-300 bg-red-950/60 border border-red-900 rounded-xl px-3.5 py-2.5">{problem || error}</p>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            {hasSavedEdits && (
              <button
                type="button"
                onClick={() => onReset(target.product.sku)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to ERP values
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-sm font-bold cursor-pointer disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isNew ? 'Add product' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
