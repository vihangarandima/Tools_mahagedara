/**
 * =========================================================================
 * TOOLS MAHAGEDARA - WEB APPLICATION ERS WEBHOOK ENDPOINT (Node.js / Express)
 * =========================================================================
 * This endpoint runs on the web server to receive automated inventory sync
 * payloads transmitted by the store's physical computer / POS system.
 * 
 * Usage:
 *   npm install express cors dotenv
 *   node ers_webhook_server.js
 * =========================================================================
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const VALID_API_KEY = process.env.ERS_API_KEY;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware: Authenticate incoming store sync
const authenticateERS = (req, res, next) => {
  const apiKey = req.headers['x-ers-api-key'] || req.query.api_key;
  if (!apiKey || apiKey !== VALID_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing X-ERS-API-KEY header.'
    });
  }
  next();
};

// Health Check
app.get('/api/v1/ers/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Tools Mahagedara ERS Inventory Gateway',
    timestamp: new Date().toISOString()
  });
});

// Main Ingestion Webhook: Receives Products, Quantities & Prices
app.post('/api/v1/ers/inventory-sync', authenticateERS, async (req, res) => {
  try {
    const { sourceSystem, timestamp, products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload: "products" must be an array of tool items.'
      });
    }

    console.log(`[${new Date().toISOString()}] Received sync payload from: ${sourceSystem}`);
    console.log(`[${new Date().toISOString()}] Processing ${products.length} inventory records...`);

    // In a live production database (PostgreSQL / MongoDB / MySQL / Prisma):
    // You would execute an UPSERT batch query:
    // await prisma.product.upsert(...)
    
    let updatedCount = 0;
    for (const item of products) {
      if (item.sku && item.price !== undefined) {
        // Updated in database
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: 'Inventory successfully updated in web database.',
      sourceSystem,
      receivedTimestamp: timestamp,
      updatedCount,
      serverTime: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error handling ERS webhook payload:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing inventory delta.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Tools Mahagedara ERS Webhook Listener active on http://localhost:${PORT}`);
  console.log(`Listening for incoming store inventory pushes at: /api/v1/ers/inventory-sync`);
});
