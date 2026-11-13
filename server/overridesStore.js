/**
 * Storage for the admin panel's product edits ("overrides").
 *
 * The ERP snapshot (public/data/thirdeye_inventory.json) is rewritten on every
 * sync, so admin changes are kept in a separate small JSON document and laid
 * over the ERP data when the site loads:
 *
 *   { version: 1, updatedAt, products: { "<SKU>": { name?, price?, ..., deleted?, custom? } } }
 *
 * On Vercel the document lives in a private Vercel Blob store. On a dev PC
 * (no Blob token) it is a plain file in .data/, which is git-ignored.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const BLOB_PATH = 'admin/product_overrides.json';
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'product_overrides.json');

const CATEGORY_PATTERN = /^[a-z0-9-]{1,40}$/;
const MAX_SKU_LENGTH = 120;

export function emptyDoc() {
  return { version: 1, updatedAt: null, products: {} };
}

export function skuKey(sku) {
  return String(sku ?? '').trim().toUpperCase();
}

function useBlob() {
  return Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);
}

function normaliseDoc(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.products !== 'object' || raw.products === null) return emptyDoc();
  return { version: 1, updatedAt: raw.updatedAt || null, products: raw.products };
}

/** `fresh` skips the CDN cache; the admin panel needs it, shoppers do not. */
export async function readOverrides({ fresh = false } = {}) {
  if (useBlob()) {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATH, { access: 'private', useCache: !fresh });
    if (!result || !result.stream) return emptyDoc();
    return normaliseDoc(JSON.parse(await new Response(result.stream).text()));
  }

  try {
    return normaliseDoc(JSON.parse(await fs.readFile(LOCAL_FILE, 'utf-8')));
  } catch (err) {
    if (err.code === 'ENOENT') return emptyDoc();
    throw err;
  }
}

export async function writeOverrides(doc) {
  const body = JSON.stringify({ ...doc, version: 1, updatedAt: new Date().toISOString() });

  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    await put(BLOB_PATH, body, {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 60
    });
  } else {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, body, 'utf-8');
  }

  return JSON.parse(body);
}

// ---------------------------------------------------------------------------
// Validation: only known fields with sane values are ever stored.
// ---------------------------------------------------------------------------

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function cleanNumber(value, { integer = false } = {}) {
  const num = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(num) || num < 0 || num > 1e9) return undefined;
  return integer ? Math.round(num) : Math.round(num * 100) / 100;
}

function cleanImage(value) {
  const url = cleanText(value, 600);
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//')) ? url : undefined;
}

function cleanFields(fields) {
  const src = fields && typeof fields === 'object' ? fields : {};
  const out = {};

  const name = cleanText(src.name, 200);
  if (name) out.name = name;
  const brand = cleanText(src.brand, 60);
  if (brand) out.brand = brand;
  const description = cleanText(src.description, 2000);
  if (description) out.description = description;
  const image = cleanImage(src.image);
  if (image) out.image = image;
  if (typeof src.category === 'string' && CATEGORY_PATTERN.test(src.category)) out.category = src.category;

  if ('price' in src) {
    const price = cleanNumber(src.price);
    if (price !== undefined) out.price = price;
  }
  if ('stockQuantity' in src) {
    const stock = cleanNumber(src.stockQuantity, { integer: true });
    if (stock !== undefined) out.stockQuantity = stock;
  }

  return out;
}

export class ChangeError extends Error {}

/**
 * Applies one admin action to the document and returns the new document.
 *   set     - save edited fields for a product (or create an admin-added one)
 *   delete  - hide an ERP product from the site / remove an admin-added one
 *   restore - bring a deleted product back
 *   reset   - drop every edit so the product follows the ERP again
 */
export function applyChange(doc, change) {
  const op = change && change.op;
  const key = skuKey(change && change.sku);
  if (!key || key.length > MAX_SKU_LENGTH) throw new ChangeError('Missing or invalid product code (SKU).');

  const products = { ...doc.products };
  const existing = products[key];

  if (op === 'set') {
    const fields = cleanFields(change.fields);
    const custom = Boolean(existing && existing.custom) || change.custom === true;

    if (custom) {
      if (!fields.name) throw new ChangeError('A product name is required.');
      if (fields.price === undefined) throw new ChangeError('A valid price is required.');
      products[key] = { ...fields, sku: String(change.sku).trim(), custom: true };
    } else if (Object.keys(fields).length === 0) {
      delete products[key];
    } else {
      products[key] = fields;
    }
  } else if (op === 'delete') {
    if (existing && existing.custom) delete products[key];
    else products[key] = { ...(existing || {}), deleted: true };
  } else if (op === 'restore') {
    if (existing) {
      const { deleted, ...rest } = existing;
      if (Object.keys(rest).length === 0) delete products[key];
      else products[key] = rest;
    }
  } else if (op === 'reset') {
    if (existing && !existing.custom) delete products[key];
  } else {
    throw new ChangeError('Unknown action.');
  }

  return { ...doc, products };
}
