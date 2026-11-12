/**
 * =========================================================================
 * TOOLS MAHAGEDARA - REAL-TIME CONTINUOUS ERP SYNCHRONIZATION DAEMON
 * =========================================================================
 * This background worker runs 24/7 on the store computer or cloud server.
 * Every 60 seconds (or configured interval), it securely checks ThirdEYE ERP
 * for inventory updates, stock deductions, and price changes.
 * 
 * Usage:
 *   node ers-integration/thirdeye_realtime_daemon.js
 * Or:
 *   npm run sync:daemon
 * =========================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = (process.env.THIRDEYE_API_URL || 'http://103.47.225.144/main_api/Api').replace(/\/+$/, '');
const USERNAME = process.env.THIRDEYE_USERNAME || 'Developer';
const PASSWORD = process.env.THIRDEYE_PASSWORD || 'rtt@#123';
const TOKEN_X = process.env.THIRDEYE_TOKENX || 'ydjJP7B6tq';
const SYNC_INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS || '60000', 10); // 60 seconds default

let cachedToken = null;
let tokenExpiresAt = 0;

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${errorText}`);
  }

  return await res.json();
}

async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const loginRes = await postJson(`${API_BASE_URL}/users/login`, {
    username: USERNAME,
    password: PASSWORD,
    tokenX: TOKEN_X
  });

  if (loginRes.result !== 'success' || !loginRes.token) {
    throw new Error(`Authentication with ThirdEYE ERP failed: ${JSON.stringify(loginRes)}`);
  }

  cachedToken = loginRes.token;
  tokenExpiresAt = now + 1000 * 60 * 30; // cache for 30 minutes
  return cachedToken;
}

async function performSyncCycle() {
  const startTime = Date.now();
  try {
    const token = await getAuthToken();

    const itemsRes = await postJson(
      `${API_BASE_URL}/get_itemListRTT`,
      { tokenX: TOKEN_X },
      { 'Api-key': token }
    );

    if (itemsRes.result !== 'success' || !Array.isArray(itemsRes.itemlist)) {
      throw new Error(`Failed to retrieve items: ${JSON.stringify(itemsRes)}`);
    }

    const rawItems = itemsRes.itemlist;
    let inStockCount = 0;

    const cleanedItems = rawItems.map((item, idx) => {
      const itemCode = String(item.itemCode || `ITEM-${idx + 1}`).trim();
      const itemName = String(item.itemName || itemCode).trim();
      const rawOnHand = parseFloat(item.onHand) || 0;
      const onHand = Math.max(0, rawOnHand);
      const itemRate = parseFloat(item.itemRate) || 0;
      const discountPcn = parseFloat(item.item_discount_PCN) || 0;
      const maxSales = parseFloat(item.maxsales) || itemRate;
      const inStock = onHand > 0;
      if (inStock) inStockCount++;

      return {
        sku: itemCode,
        name: itemName,
        itemType: item.itemType || 'Inventory Part',
        category: item.itemcat || 'General Hardware & Tools',
        unitOfMeasure: item.unitOfMesher || 'Nos',
        price: itemRate,
        originalPrice: maxSales > itemRate ? maxSales : itemRate,
        discountPercentage: discountPcn,
        stockQuantity: Math.round(onHand),
        inStock,
        syncSource: 'THIRDEYE_ERP',
        lastSynced: new Date().toISOString()
      };
    });

    const outputDir = path.resolve(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'thirdeye_inventory.json');
    const metadata = {
      provider: 'ThirdEYE ERP Solutions / My Enterprise Automation (Pvt) Ltd.',
      companyName: 'RTT CONSTRUCTION',
      lastSynced: new Date().toISOString(),
      totalItems: cleanedItems.length,
      inStockItems: inStockCount,
      items: cleanedItems
    };

    fs.writeFileSync(outputPath, JSON.stringify(metadata), 'utf-8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[${new Date().toLocaleTimeString()}] ✓ REAL-TIME SYNC OK: ${cleanedItems.length} items checked (${inStockCount} In Stock). Took ${duration}s.`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ⚠ SYNC CYCLE ERROR:`, err.message);
    // invalidate token on error so it retries clean login next cycle
    cachedToken = null;
  }
}

console.log('=============================================================================');
console.log('⚡ TOOLS MAHAGEDARA - REAL-TIME ERP SYNC DAEMON ACTIVE');
console.log(`⚡ Checking ${API_BASE_URL} every ${SYNC_INTERVAL_MS / 1000} seconds...`);
console.log('=============================================================================');

// Run first sync immediately
performSyncCycle();

// Repeat on continuous interval
setInterval(performSyncCycle, SYNC_INTERVAL_MS);

