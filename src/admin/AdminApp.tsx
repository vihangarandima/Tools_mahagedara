import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, LogOut, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { mapErpItemToProduct } from '../utils/erpProductMapper';
import {
  EMPTY_OVERRIDES,
  OverridesDoc,
  ProductOverride,
  applyOverrideToProduct,
  isEdited,
  productFromCustomOverride,
  skuKey
} from '../utils/productOverrides';
import { ApiError, ProductChange, adminApi } from './adminApi';
import { EditorTarget, ProductEditor } from './ProductEditor';

type Status = 'erp' | 'edited' | 'added' | 'deleted';
type Filter = 'all' | 'in-stock' | 'out-of-stock' | 'edited' | 'added' | 'deleted';

interface Row extends EditorTarget {
  key: string;
  status: Status;
  searchText: string;
}

const PAGE_SIZE = 25;

const STATUS_BADGE: Record<Exclude<Status, 'erp'>, { label: string; className: string }> = {
  edited: { label: 'Edited', className: 'bg-amber-400/15 text-amber-300 border-amber-400/30' },
  added: { label: 'Added by you', className: 'bg-sky-400/15 text-sky-300 border-sky-400/30' },
  deleted: { label: 'Deleted', className: 'bg-red-400/15 text-red-300 border-red-400/30' }
};

function buildRows(baseProducts: Product[], doc: OverridesDoc): Row[] {
  const overrides = doc.products;
  const baseKeys = new Set<string>();

  const makeRow = (key: string, product: Product, status: Status, base?: Product, override?: ProductOverride): Row => ({
    key,
    product,
    base,
    override,
    status,
    searchText: `${product.name} ${product.sku} ${product.brand}`.toLowerCase()
  });

  const erpRows = baseProducts.map(base => {
    const key = skuKey(base.sku);
    baseKeys.add(key);
    const override = overrides[key];
    if (!override) return makeRow(key, base, 'erp', base);
    const status: Status = override.deleted ? 'deleted' : isEdited(override) ? 'edited' : 'erp';
    return makeRow(key, applyOverrideToProduct(base, override), status, base, override);
  });

  const addedRows = Object.keys(overrides)
    .filter(key => overrides[key].custom && !baseKeys.has(key))
    .map(key => makeRow(key, productFromCustomOverride(key, overrides[key]), 'added', undefined, overrides[key]));

  return [...addedRows, ...erpRows];
}

const price = (value: number) => `Rs. ${Number(value).toLocaleString()}`;

// ---------------------------------------------------------------------------

const LoginScreen: React.FC<{ configured: boolean; onLoggedIn: () => void }> = ({ configured, onLoggedIn }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(password);
      onLoggedIn();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Tools Mahagedara</p>
          <h1 className="text-2xl text-white mt-1">Admin panel</h1>
        </div>

        {!configured && (
          <p role="alert" className="text-sm text-amber-200 bg-amber-950/50 border border-amber-900 rounded-xl px-3.5 py-3 leading-relaxed">
            The admin password has not been set up yet. Add <span className="font-mono">ADMIN_PASSWORD</span> in your Vercel project settings, then redeploy.
          </p>
        )}

        <div>
          <label htmlFor="admin-password" className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-3 text-base text-zinc-100 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        <button type="submit" disabled={busy || !password} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold cursor-pointer disabled:opacity-60 disabled:cursor-default">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Log in
        </button>

        <a href="/" className="block text-center text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-2">Back to the website</a>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------

const ConfirmDelete: React.FC<{ row: Row; busy: boolean; onConfirm: () => void; onCancel: () => void }> = ({ row, busy, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
      <h2 id="confirm-title" className="text-lg text-white">Delete this product?</h2>
      <p className="text-sm text-zinc-300 leading-relaxed">
        <span className="font-semibold text-white">{row.product.name}</span>{' '}
        {row.status === 'added'
          ? 'will be removed permanently.'
          : 'will be hidden from the website. You can bring it back any time from the "Deleted" list.'}
      </p>
      <div className="flex justify-end gap-2.5">
        <button type="button" onClick={onCancel} disabled={busy} autoFocus className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold cursor-pointer disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------

const Dashboard: React.FC<{ onSessionExpired: () => void; onLogout: () => void }> = ({ onSessionExpired, onLogout }) => {
  const [baseProducts, setBaseProducts] = useState<Product[] | null>(null);
  const [doc, setDoc] = useState<OverridesDoc>(EMPTY_OVERRIDES);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);

  const [editorKey, setEditorKey] = useState<string | 'new' | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [inventory, overrides] = await Promise.all([
        fetch('/data/thirdeye_inventory.json', { cache: 'no-cache' }).then(res => {
          if (!res.ok) throw new Error('Could not load the product list.');
          return res.json();
        }),
        adminApi.loadOverrides()
      ]);
      setBaseProducts((inventory.items || []).map((item: any) => mapErpItemToProduct(item)));
      setDoc(overrides);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) return onSessionExpired();
      setLoadError(err.message || 'Could not load the product list.');
    }
  }, [onSessionExpired]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const rows = useMemo(() => (baseProducts ? buildRows(baseProducts, doc) : []), [baseProducts, doc]);
  const rowsByKey = useMemo(() => new Map(rows.map(r => [r.key, r])), [rows]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, 'in-stock': 0, 'out-of-stock': 0, edited: 0, added: 0, deleted: 0 };
    for (const row of rows) {
      if (row.status === 'deleted') {
        c.deleted++;
        continue;
      }
      c.all++;
      if (row.product.inStock) c['in-stock']++;
      else c['out-of-stock']++;
      if (row.status === 'edited') c.edited++;
      if (row.status === 'added') c.added++;
    }
    return c;
  }, [rows]);

  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const words = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter(row => {
      if (filter === 'deleted' ? row.status !== 'deleted' : row.status === 'deleted') return false;
      if (filter === 'in-stock' && !row.product.inStock) return false;
      if (filter === 'out-of-stock' && row.product.inStock) return false;
      if (filter === 'edited' && row.status !== 'edited') return false;
      if (filter === 'added' && row.status !== 'added') return false;
      return words.every(word => row.searchText.includes(word));
    });
  }, [rows, filter, deferredQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const runChange = async (change: ProductChange, successMessage: string): Promise<boolean> => {
    setSaving(true);
    setActionError(null);
    try {
      setDoc(await adminApi.saveChange(change));
      setToast(successMessage);
      return true;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) onSessionExpired();
      else setActionError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const closeEditor = useCallback(() => {
    setEditorKey(null);
    setActionError(null);
  }, []);

  const handleSave = async (sku: string, fields: ProductOverride, isNew: boolean) => {
    const ok = await runChange({ op: 'set', sku, fields, custom: isNew || undefined }, isNew ? 'Product added.' : 'Changes saved.');
    if (ok) {
      closeEditor();
      if (isNew) {
        setFilter('all');
        setQuery('');
        setPage(1);
      }
    }
  };

  const handleReset = async (sku: string) => {
    if (await runChange({ op: 'reset', sku }, 'Back to the ERP values.')) closeEditor();
  };

  const handleDelete = async () => {
    const row = deleteKey ? rowsByKey.get(deleteKey) : null;
    if (!row) return setDeleteKey(null);
    if (await runChange({ op: 'delete', sku: row.product.sku }, 'Product deleted.')) setDeleteKey(null);
  };

  const handleRestore = async (row: Row) => {
    if (!(await runChange({ op: 'restore', sku: row.product.sku }, 'Product is back on the website.'))) {
      setToast('Could not restore the product. Please try again.');
    }
  };

  const editorTarget = editorKey && editorKey !== 'new' ? rowsByKey.get(editorKey) ?? null : null;
  const deleteRow = deleteKey ? rowsByKey.get(deleteKey) : null;

  const filterOptions: Array<{ id: Filter; label: string }> = [
    { id: 'all', label: 'All products' },
    { id: 'in-stock', label: 'In stock' },
    { id: 'out-of-stock', label: 'Out of stock' },
    { id: 'edited', label: 'Edited' },
    { id: 'added', label: 'Added by you' },
    { id: 'deleted', label: 'Deleted' }
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400 leading-none">Tools Mahagedara</p>
            <h1 className="text-lg text-white leading-tight mt-1">Products</h1>
          </div>
          <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800">
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">View website</span>
          </a>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by name or product code"
              aria-label="Search products"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2.5">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value as Filter); setPage(1); }}
              aria-label="Filter products"
              className="flex-1 sm:flex-none rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              {filterOptions.map(option => (
                <option key={option.id} value={option.id}>{option.label} ({counts[option.id].toLocaleString()})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setActionError(null); setEditorKey('new'); }}
              disabled={!baseProducts}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-sm font-bold cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add product
            </button>
          </div>
        </div>

        {loadError ? (
          <div role="alert" className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center space-y-4">
            <p className="text-sm text-red-300">{loadError}</p>
            <button type="button" onClick={load} className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white cursor-pointer">Try again</button>
          </div>
        ) : !baseProducts ? (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-10 flex items-center justify-center gap-3 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading products...
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-400" aria-live="polite">
              {filtered.length.toLocaleString()} {filtered.length === 1 ? 'product' : 'products'}
              {deferredQuery.trim() ? ` matching "${deferredQuery.trim()}"` : ''}. Changes show on the website within a couple of minutes.
            </p>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_11.5rem] gap-4 px-4 py-2.5 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <span>Product</span>
                <span className="text-right">Price</span>
                <span className="text-right">Stock</span>
                <span />
              </div>

              {visible.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-zinc-400">
                  {filter === 'deleted' && !deferredQuery.trim() ? 'No deleted products.' : 'No products found. Try a different search or filter.'}
                </p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {visible.map(row => {
                    const p = row.product;
                    const badge = row.status === 'erp' ? null : STATUS_BADGE[row.status];
                    return (
                      <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_11.5rem] gap-x-4 gap-y-2.5 px-4 py-3 items-center">
                        <div className="flex items-center gap-3 min-w-0 col-span-2 md:col-span-1">
                          <div className="w-12 h-12 shrink-0 rounded-lg bg-white overflow-hidden">
                            <img src={p.image} alt="" loading="lazy" className="w-full h-full object-contain" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${row.status === 'deleted' ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{p.name}</p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              <span className="font-mono">{p.sku}</span>
                              {badge && <span className={`ml-2 inline-block px-1.5 py-px rounded-md border text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>{badge.label}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-3 md:contents">
                          <p className="text-sm font-semibold text-zinc-100 md:text-right tabular-nums">{price(p.price)}</p>
                          <p className={`text-sm md:text-right tabular-nums ${p.inStock ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {p.inStock ? p.stockQuantity.toLocaleString() : 'Out'}
                            <span className="md:hidden text-zinc-500">{p.inStock ? ' in stock' : ' of stock'}</span>
                          </p>
                        </div>

                        <div className="flex justify-end gap-1.5">
                          {row.status === 'deleted' ? (
                            <button type="button" onClick={() => handleRestore(row)} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer disabled:opacity-50">
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore
                            </button>
                          ) : (
                            <>
                              <button type="button" onClick={() => { setActionError(null); setEditorKey(row.key); }} aria-label={`Edit ${p.name}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer">
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button type="button" onClick={() => { setActionError(null); setDeleteKey(row.key); }} aria-label={`Delete ${p.name}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-950/70 text-xs font-bold text-red-300 hover:text-red-200 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {pageCount > 1 && (
              <nav className="flex items-center justify-between gap-3" aria-label="Pages">
                <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 cursor-pointer disabled:opacity-40 disabled:cursor-default">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <p className="text-sm text-zinc-400 tabular-nums">Page {currentPage} of {pageCount.toLocaleString()}</p>
                <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount} className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 cursor-pointer disabled:opacity-40 disabled:cursor-default">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      {editorKey && (editorKey === 'new' || editorTarget) && (
        <ProductEditor
          key={editorKey}
          target={editorKey === 'new' ? null : editorTarget}
          saving={saving}
          error={actionError}
          isSkuTaken={sku => rowsByKey.has(skuKey(sku))}
          onSave={handleSave}
          onReset={handleReset}
          onClose={closeEditor}
        />
      )}

      {deleteRow && (
        <>
          <ConfirmDelete row={deleteRow} busy={saving} onConfirm={handleDelete} onCancel={() => { setDeleteKey(null); setActionError(null); }} />
          {actionError && <p role="alert" className="fixed z-[60] bottom-5 inset-x-4 mx-auto max-w-sm text-sm text-red-200 bg-red-950 border border-red-900 rounded-xl px-4 py-3 text-center">{actionError}</p>}
        </>
      )}

      {toast && (
        <p role="status" className="fixed z-[60] bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-sm font-semibold shadow-2xl whitespace-nowrap">
          {toast}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

export default function AdminApp() {
  const [session, setSession] = useState<'checking' | 'login' | 'ready' | 'unavailable'>('checking');
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    document.title = 'Admin - Tools Mahagedara';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);

    adminApi
      .session()
      .then(state => {
        setConfigured(state.configured);
        setSession(state.authenticated ? 'ready' : 'login');
      })
      .catch(() => setSession('unavailable'));

    return () => robots.remove();
  }, []);

  const toLogin = useCallback(() => setSession('login'), []);

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Even if the request fails, leave the dashboard
    }
    setSession('login');
  };

  return (
    <div className="min-h-dvh bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      {session === 'checking' && (
        <div className="min-h-dvh flex items-center justify-center text-zinc-400" role="status" aria-label="Loading">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      {session === 'unavailable' && (
        <div className="min-h-dvh flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-4">
            <h1 className="text-xl text-white">Admin panel is not available</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">The admin service could not be reached. Check your internet connection and try again.</p>
            <button type="button" onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white cursor-pointer">Try again</button>
          </div>
        </div>
      )}
      {session === 'login' && <LoginScreen configured={configured} onLoggedIn={() => setSession('ready')} />}
      {session === 'ready' && <Dashboard onSessionExpired={toLogin} onLogout={logout} />}
    </div>
  );
}
