import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ERSSyncConfig, ERSSyncLog } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';

interface ERSContextType {
  products: Product[];
  config: ERSSyncConfig;
  logs: ERSSyncLog[];
  isSyncing: boolean;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;
  triggerSimulatedERSSync: () => Promise<{ success: boolean; message: string }>;
  importCSVInventory: (csvText: string) => { success: boolean; count: number; error?: string };
  updateConfig: (partial: Partial<ERSSyncConfig>) => void;
  updateProductManually: (productId: string, updates: Partial<Product>) => void;
  resetToDefaultData: () => void;
}

const DEFAULT_CONFIG: ERSSyncConfig = {
  endpointUrl: 'https://ers.toolsmahagedara.lk/api/v1/inventory/export',
  apiKey: import.meta.env.VITE_ERS_API_KEY ?? '',
  pollingIntervalMinutes: 15,
  syncFrequency: 'EVERY_15_MIN',
  autoStockThreshold: 3,
  lastSyncTimestamp: new Date().toISOString(),
  totalItemsSynced: INITIAL_PRODUCTS.length,
  status: 'CONNECTED',
  systemName: 'Central ERS / POS System (Sri Lanka Store)',
  fieldMapping: {
    skuField: 'ITEM_CODE / BARCODE',
    priceField: 'RETAIL_PRICE_LKR',
    stockField: 'QTY_ON_HAND',
    nameField: 'ITEM_DESCRIPTION',
    categoryField: 'CAT_CODE'
  }
};

const DEFAULT_LOGS: ERSSyncLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'FULL_SYNC',
    message: 'Full catalog synchronized with local ERS database (12 items confirmed active).',
    itemsAffected: 12,
    status: 'SUCCESS'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'STOCK_UPDATE',
    message: 'Stock level refreshed for DongCheng Rotary Hammer (24 units available in showroom warehouse).',
    itemsAffected: 1,
    status: 'SUCCESS'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'PRICE_CHANGE',
    message: 'BOSCH GSB 183-LI promotional price updated to Rs. 36,500 by store manager.',
    itemsAffected: 1,
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

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('tools_mahagedara_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('tools_mahagedara_ers_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('tools_mahagedara_ers_logs', JSON.stringify(logs));
  }, [logs]);

  const updateConfig = (partial: Partial<ERSSyncConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
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

  const triggerSimulatedERSSync = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);

    // Simulate network latency to the store's ERS/ERP server
    await new Promise(resolve => setTimeout(resolve, 1400));

    // Simulate stock fluctuation and price sync from ERP
    let updatedCount = 0;
    const nowISO = new Date().toISOString();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setProducts(prev =>
      prev.map((item, index) => {
        // Vary a few items to show realistic live sync
        if (index % 2 === 0) {
          updatedCount++;
          // Simulated minor inventory fluctuation
          const deltaQty = (index % 3 === 0) ? -1 : 3;
          const newQty = Math.max(2, item.stockQuantity + deltaQty);
          return {
            ...item,
            stockQuantity: newQty,
            inStock: newQty > 0,
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
      message: `Successfully pulled inventory delta from ${config.systemName}: Updated ${updatedCount} tool items (quantities & active prices).`,
      itemsAffected: updatedCount,
      status: 'SUCCESS'
    };

    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setConfig(prev => ({
      ...prev,
      lastSyncTimestamp: nowISO,
      totalItemsSynced: products.length,
      status: 'CONNECTED'
    }));

    setIsSyncing(false);
    return {
      success: true,
      message: `ERS Synchronization complete! ${updatedCount} items refreshed.`
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
        products,
        config,
        logs,
        isSyncing,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isGuideModalOpen,
        setIsGuideModalOpen,
        triggerSimulatedERSSync,
        importCSVInventory,
        updateConfig,
        updateProductManually,
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
