/**
 * TOOLS MAHAGEDARA - THIRDEYE ERP SYNCHRONIZATION BRIDGE (Node.js)
 * Powered By ThirdEYE ERP Solutions / My Enterprise Automation (Pvt) Ltd.
 * 
 * Usage:
 *   node ers-integration/thirdeye_sync.js
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

async function runSync() {
  console.log('==================================================');
  console.log('Starting ThirdEYE ERP Live Inventory Sync...');
  console.log(`Target Server: ${API_BASE_URL}`);
  console.log('==================================================');

  // 1. Login
  console.log(`Authenticating with username: "${USERNAME}"...`);
  const loginRes = await postJson(`${API_BASE_URL}/users/login`, {
    username: USERNAME,
    password: PASSWORD,
    tokenX: TOKEN_X
  });

  if (loginRes.result !== 'success' || !loginRes.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes)}`);
  }

  const sessionToken = loginRes.token;
  const companyName = loginRes.companyname || 'RTT CONSTRUCTION';
  console.log(`✓ Authentication successful for "${companyName}"!`);

  // 2. Fetch inventory
  console.log('Fetching live product catalog and stock levels...');
  const itemsRes = await postJson(
    `${API_BASE_URL}/get_itemListRTT`,
    { tokenX: TOKEN_X },
    { 'Api-key': sessionToken }
  );

  if (itemsRes.result !== 'success' || !Array.isArray(itemsRes.itemlist)) {
    throw new Error(`Failed to retrieve items: ${JSON.stringify(itemsRes)}`);
  }

  const rawItems = itemsRes.itemlist;
  console.log(`✓ Retrieved ${rawItems.length} items from ThirdEYE ERP!`);

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
    companyName,
    lastSynced: new Date().toISOString(),
    totalItems: cleanedItems.length,
    inStockItems: inStockCount,
    items: cleanedItems
  };

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`✓ Saved inventory snapshot to: ${outputPath}`);
  console.log(`✓ Summary: ${inStockCount} items In Stock / ${cleanedItems.length - inStockCount} Out of Stock.`);
  console.log('==================================================');
  console.log('ThirdEYE ERP Sync Finished Successfully!');
  console.log('==================================================');
}

runSync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
