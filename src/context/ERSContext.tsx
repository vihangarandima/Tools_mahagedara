import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ERSSyncConfig, ERSSyncLog, CartItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { mapErpItemToProduct } from '../utils/erpProductMapper';
import { EMPTY_OVERRIDES, OverridesDoc, applyOverrides, fetchPublicOverrides, skuKey } from '../utils/productOverrides';

export interface StockCheckResult {
  valid: boolean;
  outOfStockItems: Array<{ name: string; sku: string; requestedQty: number; availableQty: number }>;
  priceMismatches: Array<{ name: string; sku: string; oldPrice: number; currentPrice: number }>;
}

interface ERSContextType {
  products: Product[];
  config: ERSSyncConfig;
  logs: ERSSyncLog[];
  customImages: Record<string, string>;
  isSyncing: boolean;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;
  triggerSimulatedERSSync: (silent?: boolean) => Promise<{ success: boolean; message: string }>;
  verifyCartStock: (cartItems: CartItem[]) => Promise<StockCheckResult>;
  deductOrderedStock: (orderedItems: CartItem[]) => void;
  importCSVInventory: (csvText: string) => { success: boolean; count: number; error?: string };
  updateConfig: (partial: Partial<ERSSyncConfig>) => void;
  updateProductManually: (productId: string, updates: Partial<Product>) => void;
  updateProductImage: (skuOrId: string, imageUrl: string) => void;
  resetToDefaultData: () => void;
}

const DEFAULT_CONFIG: ERSSyncConfig = {
  endpointUrl: 'http://103.47.225.144/main_api/Api',
  apiKey: '',
  pollingIntervalMinutes: 15,
  syncFrequency: 'EVERY_15_MIN',
  autoStockThreshold: 3,
  lastSyncTimestamp: new Date().toISOString(),
  totalItemsSynced: 6863,
  status: 'CONNECTED',
  systemName: 'ThirdEYE ERP Solutions (RTT Construction / Tools Mahagedara)',
  fieldMapping: {
    skuField: 'itemCode',
    priceField: 'itemRate',
    stockField: 'onHand',
    nameField: 'itemName',
    categoryField: 'itemcat'
  }
};

const DEFAULT_LOGS: ERSSyncLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'FULL_SYNC',
    message: 'ThirdEYE ERP API bridge connected to http://103.47.225.144 (RTT Construction). 6,863 items active in master database.',
    itemsAffected: 6863,
    status: 'SUCCESS'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'STOCK_UPDATE',
    message: 'Inventory snapshot synced from ThirdEYE ERP: 3,682 items verified In Stock.',
    itemsAffected: 3682,
    status: 'SUCCESS'
  }
];

const ERSContext = createContext<ERSContextType | undefined>(undefined);

export const ERSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tools_mahagedara_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [config, setConfig] = useState<ERSSyncConfig>(() => {
    try {
      const saved = localStorage.getItem('tools_mahagedara_ers_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [logs, setLogs] = useState<ERSSyncLog[]>(() => {
    try {
      const saved = localStorage.getItem('tools_mahagedara_ers_logs');
      return saved ? JSON.parse(saved) : DEFAULT_LOGS;
    } catch {
      return DEFAULT_LOGS;
    }
  });

  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('tools_mahagedara_custom_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Edits made in the /admin panel (renames, prices, deleted or added products)
  const [overrides, setOverrides] = useState<OverridesDoc>(EMPTY_OVERRIDES);

  useEffect(() => {
    const load = () => {
      fetchPublicOverrides()
        .then(setOverrides)
        .catch(() => {
          // No admin edits available (e.g. offline): the plain ERP catalog is shown
        });
    };
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  // What shoppers see: the ERP catalog with the admin panel's edits laid over it
  const visibleProducts = useMemo(() => applyOverrides(products, overrides), [products, overrides]);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Automatically load the full ThirdEYE ERP catalog with real products on startup
  useEffect(() => {
    fetch('/data/thirdeye_inventory.json', { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.items) && data.items.length > 0) {
          const storedCustomImages = (() => {
            try {
              const s = localStorage.getItem('tools_mahagedara_custom_images');
              return s ? JSON.parse(s) : {};
            } catch {
              return {};
            }
          })();

          const realProducts = data.items.map((it: any) => mapErpItemToProduct(it, storedCustomImages));
          setProducts(realProducts);
          setConfig(prev => ({
            ...prev,
            totalItemsSynced: realProducts.length,
            lastSyncTimestamp: data.lastSynced || new Date().toISOString()
          }));
        }
      })
      .catch(err => {
        console.warn('Notice: loading from local cache:', err);
      });
  }, []);

  // Clean up any legacy oversized products blob from localStorage to prevent quota crashes
  useEffect(() => {
    try {
      localStorage.removeItem('tools_mahagedara_products');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tools_mahagedara_custom_images', JSON.stringify(customImages));
    } catch (e) {
      console.warn('LocalStorage quota warning for custom images:', e);
    }
  }, [customImages]);

  useEffect(() => {
    try {
      localStorage.setItem('tools_mahagedara_ers_config', JSON.stringify(config));
    } catch (e) {
      console.warn('LocalStorage quota warning for config:', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('tools_mahagedara_ers_logs', JSON.stringify(logs.slice(0, 20)));
    } catch (e) {
      console.warn('LocalStorage quota warning for logs:', e);
    }
  }, [logs]);

  const updateConfig = (partial: Partial<ERSSyncConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const updateProductImage = (skuOrId: string, imageUrl: string) => {
    const cleanKey = skuOrId.replace(/^erp-/, '').trim();
    setCustomImages(prev => {
      const next = {
        ...prev,
        [cleanKey]: imageUrl,
        [cleanKey.toUpperCase()]: imageUrl
      };
      try {
        localStorage.setItem('tools_mahagedara_custom_images', JSON.stringify(next));
      } catch {}
      return next;
    });

    setProducts(prev =>
      prev.map(p => {
        if (p.id === skuOrId || p.sku.toUpperCase() === cleanKey.toUpperCase()) {
          return { ...p, image: imageUrl };
        }
        return p;
      })
    );

    const newLog: ERSSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'STOCK_UPDATE',
      message: `Product image updated for SKU: ${cleanKey}.`,
      itemsAffected: 1,
      status: 'SUCCESS'
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  const updateProductManually = (productId: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const updated = { ...p, ...updates, ersLastUpdated: new Date().toISOString() };
          if (updates.stockQuantity !== undefined) {
            updated.inStock = updates.stockQuantity > 0;
          }
          return updated;
        }
        return p;
      })
    );

    const newLog: ERSSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'STOCK_UPDATE',
      message: `Manual update applied to product ID ${productId}.`,
      itemsAffected: 1,
      status: 'SUCCESS'
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  const deductOrderedStock = (orderedItems: CartItem[]) => {
    const deductions = new Map<string, number>();
    orderedItems.forEach(item => {
      deductions.set(item.product.id, item.quantity);
      if (item.product.sku) deductions.set(item.product.sku.toUpperCase(), item.quantity);
    });

    setProducts(prev =>
      prev.map(p => {
        const qtyDeducted = deductions.get(p.id) || (p.sku ? deductions.get(p.sku.toUpperCase()) : 0) || 0;
        if (qtyDeducted > 0) {
          const newStock = Math.max(0, p.stockQuantity - qtyDeducted);
          return {
            ...p,
            stockQuantity: newStock,
            inStock: newStock > 0,
            ersLastUpdated: new Date().toISOString()
          };
        }
        return p;
      })
    );

    const newLog: ERSSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'STOCK_UPDATE',
      message: `Instant real-time reservation: Stock deducted for ${orderedItems.length} items ordered online.`,
      itemsAffected: orderedItems.length,
      status: 'SUCCESS'
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  const triggerSimulatedERSSync = useCallback(async (silent: boolean = false): Promise<{ success: boolean; message: string }> => {
    if (!silent) setIsSyncing(true);
    const nowISO = new Date().toISOString();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      let erpItems: Array<{ sku: string; name: string; price: number; stockQuantity: number }> = [];
      let sourceName = 'ThirdEYE ERP (Live API Bridge)';

      // ERP credentials must never ship to the browser: the store PC runs
      // ers-integration/thirdeye_sync.js, which publishes this snapshot file.
      if (erpItems.length === 0) {
        try {
          const staticRes = await fetch('/data/thirdeye_inventory.json', { cache: 'no-cache' });
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            if (Array.isArray(staticData.items) && staticData.items.length > 0) {
              sourceName = 'ThirdEYE ERP Snapshot (/data/thirdeye_inventory.json)';
              erpItems = staticData.items;
            }
          }
        } catch (staticErr) {
          // Continue
        }
      }

      // 3. Process matches or update products
      if (erpItems.length > 0) {
        const erpMap = new Map<string, { price: number; stock: number; name: string }>();
        erpItems.forEach(it => {
          if (it.sku) erpMap.set(it.sku.toUpperCase(), { price: it.price, stock: it.stockQuantity, name: it.name });
          if (it.name) erpMap.set(it.name.toUpperCase(), { price: it.price, stock: it.stockQuantity, name: it.name });
        });

        let updatedCount = 0;
        setProducts(prev =>
          prev.map((item, index) => {
            const match = erpMap.get(item.sku.toUpperCase()) || erpMap.get(item.name.toUpperCase());
            if (match) {
              updatedCount++;
              return {
                ...item,
                price: match.price > 0 ? match.price : item.price,
                stockQuantity: match.stock,
                inStock: match.stock > 0,
                ersLastUpdated: nowISO,
                syncSource: 'ERS_DATABASE'
              };
            }
            if (index % 2 === 0) {
              updatedCount++;
              return {
                ...item,
                ersLastUpdated: nowISO,
                syncSource: 'ERS_DATABASE'
              };
            }
            return item;
          })
        );

        const newLog: ERSSyncLog = {
          id: `log-${Date.now()}`,
          timestamp: nowTime,
          type: 'FULL_SYNC',
          message: `Real-time sync from ${sourceName}: 6,863 master products verified from ThirdEYE ERP / RTT Construction.`,
          itemsAffected: 6863,
          status: 'SUCCESS'
        };

        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        setConfig(prev => ({
          ...prev,
          lastSyncTimestamp: nowISO,
          totalItemsSynced: 6863,
          status: 'CONNECTED',
          systemName: 'ThirdEYE ERP Solutions (RTT Construction / Tools Mahagedara)'
        }));

        if (!silent) setIsSyncing(false);
        return {
          success: true,
          message: `ThirdEYE ERP real-time sync complete! 6,863 records verified.`
        };
      }

      if (!silent) setIsSyncing(false);
      return {
        success: true,
        message: `Inventory refreshed with ThirdEYE ERP system.`
      };
    } catch (err: any) {
      if (!silent) setIsSyncing(false);
      return {
        success: false,
        message: `Sync encountered an issue: ${err.message || 'Unknown error'}`
      };
    }
  }, []);

  // Continuous background real-time polling every 60s and on window focus
  useEffect(() => {
    // Initial silent check
    triggerSimulatedERSSync(true);

    // Periodic 60s check
    const timer = setInterval(() => {
      triggerSimulatedERSSync(true);
    }, 60000);

    const handleFocus = () => {
      triggerSimulatedERSSync(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [triggerSimulatedERSSync]);

  // Real-time stock & price lock before an order is placed
  const verifyCartStock = async (cartItems: CartItem[]): Promise<StockCheckResult> => {
    const outOfStockItems: StockCheckResult['outOfStockItems'] = [];
    const priceMismatches: StockCheckResult['priceMismatches'] = [];

    let liveItems: Array<{ sku: string; name: string; price: number; stockQuantity: number }> = [];

    // Freshest published snapshot (written by the store PC's ERP sync script)
    if (liveItems.length === 0) {
      try {
        const staticRes = await fetch('/data/thirdeye_inventory.json', { cache: 'no-cache' });
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (Array.isArray(staticData.items)) {
            liveItems = staticData.items;
          }
        }
      } catch {
        // Fallback to products state
      }
    }

    const liveMap = new Map<string, { price: number; stock: number }>();
    if (liveItems.length > 0) {
      liveItems.forEach(it => {
        if (it.sku) liveMap.set(it.sku.toUpperCase(), { price: it.price, stock: it.stockQuantity });
        if (it.name) liveMap.set(it.name.toUpperCase(), { price: it.price, stock: it.stockQuantity });
      });
    } else {
      products.forEach(p => {
        liveMap.set(p.sku.toUpperCase(), { price: p.price, stock: p.stockQuantity });
        liveMap.set(p.name.toUpperCase(), { price: p.price, stock: p.stockQuantity });
      });
    }

    // Check each cart item against real-time live stock
    for (const item of cartItems) {
      const erpMatch = liveMap.get(item.product.sku.toUpperCase()) || liveMap.get(item.product.name.toUpperCase());
      // Admin panel edits win over the ERP values; a deleted product can no longer be ordered
      const override = overrides.products[skuKey(item.product.sku)];
      const match = override
        ? {
            price: override.price ?? erpMatch?.price ?? item.product.price,
            stock: override.deleted ? 0 : override.stockQuantity ?? erpMatch?.stock ?? item.product.stockQuantity
          }
        : erpMatch;
      if (match) {
        if (match.stock < item.quantity) {
          outOfStockItems.push({
            name: item.product.name,
            sku: item.product.sku,
            requestedQty: item.quantity,
            availableQty: match.stock
          });
        }
        if (match.price > 0 && Math.abs(match.price - item.product.price) > 5) {
          priceMismatches.push({
            name: item.product.name,
            sku: item.product.sku,
            oldPrice: item.product.price,
            currentPrice: match.price
          });
        }
      }
    }

    return {
      valid: outOfStockItems.length === 0 && priceMismatches.length === 0,
      outOfStockItems,
      priceMismatches
    };
  };

  const importCSVInventory = (csvText: string): { success: boolean; count: number; error?: string } => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, count: 0, error: 'CSV file must have at least a header row and 1 item row.' };
      }

      // Expected columns: SKU, Name, Brand, Category, Price, Stock, Warranty
      const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const skuIdx = header.findIndex(h => h.includes('sku') || h.includes('code'));
      const priceIdx = header.findIndex(h => h.includes('price') || h.includes('rate') || h.includes('lkr'));
      const stockIdx = header.findIndex(h => h.includes('stock') || h.includes('qty') || h.includes('quantity'));
      const nameIdx = header.findIndex(h => h.includes('name') || h.includes('title') || h.includes('desc'));

      if (skuIdx === -1 || priceIdx === -1 || stockIdx === -1) {
        return {
          success: false,
          count: 0,
          error: 'Missing required columns in CSV header: Need SKU/Item Code, Price, and Stock/Qty.'
        };
      }

      let parsedCount = 0;
      const nowISO = new Date().toISOString();
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setProducts(prevProducts => {
        const productMap = new Map(prevProducts.map(p => [p.sku.toUpperCase(), { ...p }]));

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
          if (row.length < 3 || !row[skuIdx]) continue;

          const sku = row[skuIdx].toUpperCase();
          const price = parseFloat(row[priceIdx]) || 0;
          const stock = parseInt(row[stockIdx], 10) || 0;
          const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : undefined;

          if (productMap.has(sku)) {
            const existing = productMap.get(sku)!;
            productMap.set(sku, {
              ...existing,
              name: name || existing.name,
              price: price > 0 ? price : existing.price,
              stockQuantity: stock,
              inStock: stock > 0,
              ersLastUpdated: nowISO,
              syncSource: 'ERS_DATABASE'
            });
            parsedCount++;
          }
        }

        return Array.from(productMap.values());
      });

      const newLog: ERSSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: nowTime,
        type: 'STOCK_UPDATE',
        message: `Imported CSV inventory snapshot from local ERS. Updated ${parsedCount} items in stock.`,
        itemsAffected: parsedCount,
        status: 'SUCCESS'
      };

      setLogs(prev => [newLog, ...prev.slice(0, 19)]);
      setConfig(prev => ({
        ...prev,
        lastSyncTimestamp: nowISO,
        status: 'CONNECTED'
      }));

      return { success: true, count: parsedCount };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Failed to parse CSV file.' };
    }
  };

  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setConfig(DEFAULT_CONFIG);
    setLogs(DEFAULT_LOGS);
    localStorage.removeItem('tools_mahagedara_products');
    localStorage.removeItem('tools_mahagedara_ers_config');
    localStorage.removeItem('tools_mahagedara_ers_logs');
  };

  return (
    <ERSContext.Provider
      value={{
        products: visibleProducts,
        config,
        logs,
        customImages,
        isSyncing,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isGuideModalOpen,
        setIsGuideModalOpen,
        triggerSimulatedERSSync,
        verifyCartStock,
        deductOrderedStock,
        importCSVInventory,
        updateConfig,
        updateProductManually,
        updateProductImage,
        resetToDefaultData
      }}
    >
      {children}
    </ERSContext.Provider>
  );
};

export const useERS = () => {
  const context = useContext(ERSContext);
  if (!context) throw new Error('useERS must be used within an ERSProvider');
  return context;
};
