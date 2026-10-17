import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  Database, 
  Layers, 
  ArrowRight, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useERS } from '../context/ERSContext';

export const ERSGuideModal: React.FC = () => {
  const { isGuideModalOpen, setIsGuideModalOpen, config } = useERS();
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  if (!isGuideModalOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sqlSnippet = `-- STEP 2: Create a secure View on your Store ERS / ERP Database
CREATE VIEW vw_WebInventorySync AS
SELECT 
    p.ItemCode        AS sku,
    p.ItemName        AS name,
    p.BrandName       AS brand,
    c.CategoryName    AS category,
    p.RetailPriceLKR  AS price,
    COALESCE(s.QtyOnHand, 0) AS stockQuantity,
    CASE 
        WHEN COALESCE(s.QtyOnHand, 0) > 0 THEN 1 
        ELSE 0 
    END AS inStock,
    p.WarrantyPeriod  AS warranty,
    GETDATE()         AS ersLastUpdated
FROM tbl_Products p
LEFT JOIN tbl_StockLevel s ON p.ItemCode = s.ItemCode
LEFT JOIN tbl_Categories c ON p.CategoryID = c.CategoryID
WHERE p.IsActive = 1;`;

  const pythonBridgeSnippet = `# STEP 3: Automated ERS Bridge Script (Run on Store PC / Server)
# Save as: ers_sync_bridge.py
# Requirements: pip install requests pyodbc (or pymysql)

import pyodbc
import requests
import json
from datetime import datetime

# 1. Configuration
ERS_DB_CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=ToolsMahagedara_ERS;"
    "UID=readonly_webuser;"
    "PWD=YourSecurePassword123!"
)

WEB_API_ENDPOINT = "${config.endpointUrl}"
API_SECRET_KEY = "${config.apiKey}"

def fetch_and_sync():
    print(f"[{datetime.now()}] Connecting to local ERS database...")
    
    try:
        conn = pyodbc.connect(ERS_DB_CONNECTION_STRING)
        cursor = conn.cursor()
        
        # Pull live items, quantities, and prices
        query = "SELECT sku, name, brand, category, price, stockQuantity, inStock, warranty FROM vw_WebInventorySync"
        cursor.execute(query)
        
        items = []
        for row in cursor.fetchall():
            items.append({
                "sku": row.sku,
                "name": row.name,
                "brand": row.brand,
                "category": row.category,
                "price": float(row.price),
                "stockQuantity": int(row.stockQuantity),
                "inStock": bool(row.inStock),
                "warranty": row.warranty
            })
            
        conn.close()
        print(f"[{datetime.now()}] Extracted {len(items)} items from ERS.")
        
        # 2. Transmit to Tools Mahagedara Website
        headers = {
            "Content-Type": "application/json",
            "X-ERS-API-KEY": API_SECRET_KEY
        }
        
        payload = {
            "sourceSystem": "Store ERS Local Server",
            "timestamp": datetime.utcnow().isoformat(),
            "itemsCount": len(items),
            "products": items
        }
        
        res = requests.post(WEB_API_ENDPOINT, json=payload, headers=headers, timeout=30)
        
        if res.status_code == 200:
            print(f"[{datetime.now()}] SUCCESS: Web catalog synchronized successfully! {res.json()}")
        else:
            print(f"[{datetime.now()}] FAILED with status {res.status_code}: {res.text}")
            
    except Exception as e:
        print(f"[{datetime.now()}] ERROR in ERS sync: {str(e)}")

if __name__ == "__main__":
    fetch_and_sync()`;

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
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-white font-heading">
                Step-by-Step ERS System Integration Blueprint
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                From Ground Zero to Automated Real-Time Inventory & Price Synchronization
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGuideModalOpen(false)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 text-xs leading-relaxed text-zinc-300">
          
          {/* Architecture Visual Diagram */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="text-xs font-bold uppercase text-amber-400 font-mono flex items-center gap-2">
              <Layers className="w-4 h-4" />
              How the ERS Connection Works
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <Database className="w-5 h-5 text-amber-400 mx-auto" />
                <div className="font-bold text-white text-xs">1. Store ERS DB</div>
                <div className="text-[11px] text-zinc-500">SQL Server / MySQL / Tally</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <Cpu className="w-5 h-5 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-xs">2. Local Bridge</div>
                <div className="text-[11px] text-zinc-500">Python / Node.js background runner</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <Globe className="w-5 h-5 text-blue-400 mx-auto" />
                <div className="font-bold text-white text-xs">3. HTTPS REST API</div>
                <div className="text-[11px] text-zinc-500">Encrypted token header</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto" />
                <div className="font-bold text-white text-xs">4. Web Store</div>
                <div className="text-[11px] text-zinc-500">Instant price & stock refresh</div>
              </div>
            </div>
          </div>

          {/* STEP 0 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center font-mono text-xs">
                0
              </span>
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                Identify Your Customer's ERS / ERP Software
              </h4>
            </div>
            <p>
              Ask your customer what software manages their inventory and billing at the shop. In Sri Lanka, 95% of hardware shops use one of the following:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="font-bold text-white">A. SQL-Based POS / ERP</span>
                <p className="text-[11px] text-zinc-400">
                  Accura POS, Dhanush, Visual POS, Busy, or custom ERP built on Microsoft SQL Server or MySQL.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="font-bold text-white">B. Accounting Systems</span>
                <p className="text-[11px] text-zinc-400">
                  Tally Prime (ODBC port 9000 or XML export) or QuickBooks Desktop (QODBC driver).
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center font-mono text-xs">
                1
              </span>
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                Create a Read-Only Database View (SQL)
              </h4>
            </div>
            <p>
              Do NOT expose the entire database to the web. Create a dedicated read-only SQL view that only selects the essential public e-commerce fields:
            </p>

            <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden font-mono text-[11px]">
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center text-zinc-400">
                <span>SQL Query (Run once in SQL Server Management Studio or phpMyAdmin)</span>
                <button
                  onClick={() => copyToClipboard(sqlSnippet, 'sql')}
                  className="flex items-center gap-1 text-amber-400 hover:text-white"
                >
                  {copiedIndex === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'sql' ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-zinc-200">
                <code>{sqlSnippet}</code>
              </pre>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center font-mono text-xs">
                2
              </span>
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                Install the Lightweight Bridge Script on the Store PC
              </h4>
            </div>
            <p>
              This python script runs safely on the shop's local Windows computer. It reads the local database view, packages the items into JSON, and securely POSTs them to the website endpoint:
            </p>

            <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden font-mono text-[11px]">
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center text-zinc-400">
                <span>Python Bridge Script (ers_sync_bridge.py)</span>
                <button
                  onClick={() => copyToClipboard(pythonBridgeSnippet, 'py')}
                  className="flex items-center gap-1 text-amber-400 hover:text-white"
                >
                  {copiedIndex === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'py' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-zinc-200 max-h-72">
                <code>{pythonBridgeSnippet}</code>
              </pre>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center font-mono text-xs">
                3
              </span>
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                Automate with Windows Task Scheduler (Zero Human Effort)
              </h4>
            </div>
            <p>
              To make it sync completely automatically every 15 minutes or once daily:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-zinc-300">
              <li>Open Windows Start Menu on the store PC and search for <strong className="text-white">Task Scheduler</strong>.</li>
              <li>Click <strong className="text-white">"Create Basic Task..."</strong>, name it <span className="font-mono text-amber-400">"ToolsMahagedara_ERSSync"</span>.</li>
              <li>Set trigger to <strong className="text-white">"Daily"</strong> or <strong className="text-white">"Repeat every 15 minutes"</strong>.</li>
              <li>Action: Start a program ➔ Program: <span className="font-mono text-zinc-200">python.exe</span>, Arguments: <span className="font-mono text-zinc-200">C:\ToolsMahagedara\ers_sync_bridge.py</span>.</li>
              <li>Click Finish! Now whenever physical stock is sold at the cashier, the website will reflect the updated quantity automatically.</li>
            </ol>
          </div>

          {/* STEP 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-black flex items-center justify-center font-mono text-xs">
                4
              </span>
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                No Direct DB Access? Use CSV Daily Auto-Export
              </h4>
            </div>
            <p>
              If the store manager does not wish to run scripts against the live database:
            </p>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Instant CSV Drag-and-Drop Ingestion Built-in</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Most POS software features an "Export Stock to Excel/CSV" button. The store manager can simply open the <strong className="text-white">ERS Control Center</strong> in this website, click the <strong className="text-white">CSV Bulk Sync tab</strong>, paste the exported file, and all prices and quantities will update within 1 second.
              </p>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={() => setIsGuideModalOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase text-xs tracking-wider"
            >
              Close Guide
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
