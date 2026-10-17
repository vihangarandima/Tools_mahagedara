import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Key, 
  Globe, 
  History, 
  Sliders, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowRight,
  Terminal,
  RotateCcw
} from 'lucide-react';
import { useERS } from '../context/ERSContext';

export const ERSSyncModal: React.FC = () => {
  const { 
    config, 
    logs, 
    isSyncing, 
    isSyncModalOpen, 
    setIsSyncModalOpen, 
    setIsGuideModalOpen,
    triggerSimulatedERSSync, 
    importCSVInventory, 
    updateConfig, 
    resetToDefaultData,
    products 
  } = useERS();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CSV_IMPORT' | 'API_CONFIG' | 'LOGS'>('OVERVIEW');
  const [csvInput, setCsvInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Form states for config
  const [endpointUrl, setEndpointUrl] = useState(config.endpointUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [systemName, setSystemName] = useState(config.systemName);
  const [pollInterval, setPollInterval] = useState(config.pollingIntervalMinutes);

  if (!isSyncModalOpen) return null;

  const handleRunSync = async () => {
    const res = await triggerSimulatedERSSync();
    setImportStatus({ success: res.success, message: res.message });
  };

  const handleCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) {
      setImportStatus({ success: false, message: 'Please paste CSV content.' });
      return;
    }
    const result = importCSVInventory(csvInput);
    if (result.success) {
      setImportStatus({ success: true, message: `Successfully updated ${result.count} products from CSV!` });
      setCsvInput('');
    } else {
      setImportStatus({ success: false, message: result.error || 'Failed to parse CSV.' });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      endpointUrl,
      apiKey,
      systemName,
      pollingIntervalMinutes: Number(pollInterval)
    });
    setImportStatus({ success: true, message: 'ERS Bridge Configuration updated successfully.' });
  };

  const sampleCSVTemplate = `SKU,ITEM_NAME,PRICE_LKR,QTY_ON_HAND
TM-BOSCH-GSB183,BOSCH GSB 183-LI Cordless Drill,36500,22
TM-CF-AG115-750,COOFIX Angle Grinder 115mm,13800,45
TM-DC-Z1C-FF05-26,DongCheng Rotary Hammer 26mm,26800,30
TM-LION-PW100,LION High Pressure Washer 100Bar,38500,15`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-white font-heading">
                  ERS / ERP Integration Control Center
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Store ERS Sync Engine • Auto-synchronizes Items, Stock Quantities & Prices
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-4 border-b-2 font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Live Monitor & Trigger
          </button>
          <button
            onClick={() => setActiveTab('CSV_IMPORT')}
            className={`py-3 px-4 border-b-2 font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'CSV_IMPORT'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            CSV / Excel Bulk Sync
          </button>
          <button
            onClick={() => setActiveTab('API_CONFIG')}
            className={`py-3 px-4 border-b-2 font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'API_CONFIG'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            API Endpoints & Mapping
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`py-3 px-4 border-b-2 font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'LOGS'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Sync Event Log ({logs.length})
          </button>
        </div>

        {/* Status Notification */}
        {importStatus && (
          <div className={`px-6 py-2.5 text-xs flex items-center justify-between ${
            importStatus.success ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-900' : 'bg-red-950/80 text-red-300 border-b border-red-900'
          }`}>
            <span>{importStatus.message}</span>
            <button onClick={() => setImportStatus(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tab Content */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold">Live ERS Status</span>
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    CONNECTED
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">{config.systemName}</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold">Active Tool Items</span>
                  <div className="text-xl font-black text-white">{products.length} Items</div>
                  <div className="text-[11px] text-zinc-400">Synced to Web Catalog</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Stock on Hand</span>
                  <div className="text-xl font-black text-amber-400">
                    {products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)} Units
                  </div>
                  <div className="text-[11px] text-zinc-400">Real-time inventory count</div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400 uppercase font-semibold">Last Synchronization</span>
                  <div className="text-xs font-bold text-zinc-200">
                    {new Date(config.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[11px] text-zinc-400">Polls every {config.pollingIntervalMinutes} min</div>
                </div>
              </div>

              {/* Sync Actions Box */}
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase font-mono">
                      Trigger Manual ERS Synchronization
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Polls the store ERP/ERS inventory server to immediately update price changes and restocked quantities.
                    </p>
                  </div>

                  <button
                    onClick={handleRunSync}
                    disabled={isSyncing}
                    className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isSyncing
                        ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing with ERS...' : 'Run Live Sync Now'}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <button
                    onClick={() => {
                      setIsSyncModalOpen(false);
                      setIsGuideModalOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Need to hook up your own ERP database? Open Setup Guide (0-to-100)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Revert catalog back to default factory stock?')) {
                        resetToDefaultData();
                        setImportStatus({ success: true, message: 'Catalog reset to factory default data.' });
                      }
                    }}
                    className="text-zinc-500 hover:text-red-400 flex items-center gap-1 font-mono text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Catalog to Factory
                  </button>
                </div>
              </div>

              {/* Live Inventory Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                    Live Synced Items Snapshot
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Updated in Real-Time
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80 bg-zinc-900/40 text-xs font-mono">
                  {products.slice(0, 6).map(prod => (
                    <div key={prod.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={prod.image} alt={prod.name} className="w-9 h-9 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate font-sans text-xs">{prod.name}</div>
                          <div className="text-[11px] text-zinc-400">SKU: {prod.sku} • {prod.brand}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase">Unit Price</div>
                          <div className="font-bold text-amber-400">Rs. {prod.price.toLocaleString()}</div>
                        </div>
                        <div className="w-24">
                          <div className="text-[11px] text-zinc-500 uppercase">Stock Count</div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            prod.stockQuantity > 5 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {prod.stockQuantity} units
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CSV / EXCEL BULK SYNC */}
          {activeTab === 'CSV_IMPORT' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-mono">
                  <FileSpreadsheet className="w-4 h-4" />
                  Direct CSV Export / Inventory Ingestion
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  If your store ERS/POS software (like Tally, Accura POS, Busy, or QuickBooks) can export a daily inventory spreadsheet, simply copy and paste the rows below to instantly synchronize item quantities and prices on the website.
                </p>
              </div>

              <form onSubmit={handleCSVSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-zinc-400 uppercase font-mono">
                      Paste CSV Data (SKU, Item Name, Price, Stock)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCsvInput(sampleCSVTemplate)}
                      className="text-amber-400 hover:text-amber-300 font-mono text-[11px] underline"
                    >
                      Fill Sample Template
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={csvInput}
                    onChange={e => setCsvInput(e.target.value)}
                    placeholder="SKU,ITEM_NAME,PRICE_LKR,QTY_ON_HAND&#10;TM-BOSCH-GSB183,BOSCH Cordless Impact Drill,36500,22"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Matches existing items by SKU code. Unmatched items remain unchanged.
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import & Update Web Catalog</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: API CONFIGURATION */}
          {activeTab === 'API_CONFIG' && (
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-mono">
                  <Globe className="w-4 h-4" />
                  REST API & Webhook Connectivity
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Configure the connection credentials between Tools Mahagedara website and your local store server.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-zinc-400 uppercase font-mono mb-1 block">
                    ERS System / Software Name
                  </label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={e => setSystemName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-400 uppercase font-mono mb-1 block">
                    Auto-Polling Interval (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={pollInterval}
                    onChange={e => setPollInterval(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-zinc-400 uppercase font-mono block">
                  Store ERS Endpoint URL / Webhook Listener
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={endpointUrl}
                    onChange={e => setEndpointUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-zinc-400 uppercase font-mono block">
                  Authorization Secret Key (X-ERS-API-KEY)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {/* Field mapping preview */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs font-mono">
                <span className="font-bold text-zinc-300 uppercase block">Database Field Mapping:</span>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-400">
                  <div>SKU ➔ <span className="text-amber-400">{config.fieldMapping.skuField}</span></div>
                  <div>PRICE ➔ <span className="text-amber-400">{config.fieldMapping.priceField}</span></div>
                  <div>STOCK ➔ <span className="text-amber-400">{config.fieldMapping.stockField}</span></div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider"
                >
                  Save Bridge Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 uppercase font-mono flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  Chronological Inventory Audit Trail
                </span>
                <span className="text-zinc-500 font-mono text-[11px]">
                  Showing last {logs.length} events
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800 bg-zinc-900/30 text-xs font-mono">
                {logs.map(log => (
                  <div key={log.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">{log.type}</span>
                      <span className="text-zinc-500 text-[11px]">{log.timestamp}</span>
                    </div>
                    <div className="text-zinc-200 font-sans text-xs">{log.message}</div>
                    <div className="text-[11px] text-zinc-500">
                      Impact: {log.itemsAffected} items updated • Status: {log.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
