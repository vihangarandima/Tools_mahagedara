"""
=============================================================================
TOOLS MAHAGEDARA - STORE ERS / ERP SYNCHRONIZATION BRIDGE
=============================================================================
This script runs in the background on the physical store server or cashier PC.
It extracts items, stock quantities, and prices from the local POS / ERP database
and synchronizes them securely with the Tools Mahagedara website via HTTPS.

SUPPORTED MODES:
  1. Direct Database Extraction (MSSQL / MySQL / PostgreSQL / ODBC)
  2. Automated CSV Ingestion (For POS systems exporting to a folder)

SETUP INSTRUCTIONS:
  pip install pyodbc pymysql requests
=============================================================================
"""

import sys
import os
import json
import logging
from datetime import datetime
import requests

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
WEB_STORE_API_URL = "https://toolsmahagedara.lk/api/v1/ers/inventory-sync"
API_SECRET_KEY = os.environ.get("ERS_API_KEY", "")

# Mode: 'DATABASE' or 'CSV_WATCH'
SYNC_MODE = "DATABASE"

# Database Connection Details (Only needed if SYNC_MODE == 'DATABASE')
DB_DRIVER = "{ODBC Driver 17 for SQL Server}"
DB_SERVER = "localhost" # or IP address of the main store database server
DB_NAME = "ToolsMahagedara_POS"
DB_USER = "web_sync_user"
DB_PASSWORD = os.environ.get("ERS_DB_PASSWORD", "")

# CSV Watch Path (Only needed if SYNC_MODE == 'CSV_WATCH')
CSV_FILE_PATH = r"C:\POS_Exports\DailyInventoryExport.csv"

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("ers_bridge.log", encoding="utf-8")
    ]
)

# ---------------------------------------------------------------------------
# EXTRACTION FUNCTIONS
# ---------------------------------------------------------------------------

def extract_from_database():
    """Extract inventory snapshot via ODBC from local SQL database"""
    import pyodbc
    conn_str = f"DRIVER={DB_DRIVER};SERVER={DB_SERVER};DATABASE={DB_NAME};UID={DB_USER};PWD={DB_PASSWORD}"
    logging.info(f"Connecting to ERS database at {DB_SERVER}...")

    conn = pyodbc.connect(conn_str, timeout=10)
    cursor = conn.cursor()

    query = """
    SELECT sku, name, brand, category, price, stockQuantity, inStock, warranty 
    FROM vw_ToolsMahagedara_WebSync
    """
    cursor.execute(query)
    
    products = []
    for row in cursor.fetchall():
        products.append({
            "sku": str(row.sku).strip(),
            "name": str(row.name).strip(),
            "brand": str(row.brand).strip(),
            "category": str(row.category).strip(),
            "price": float(row.price),
            "stockQuantity": int(row.stockQuantity),
            "inStock": bool(row.inStock),
            "warranty": str(row.warranty).strip()
        })
    
    conn.close()
    return products

def extract_from_csv():
    """Extract inventory snapshot from CSV file exported by POS software"""
    import csv
    if not os.path.exists(CSV_FILE_PATH):
        raise FileNotFoundError(f"CSV file not found at {CSV_FILE_PATH}")

    products = []
    with open(CSV_FILE_PATH, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map standard ERP columns
            sku = row.get("SKU") or row.get("ItemCode") or row.get("Barcode")
            name = row.get("ItemName") or row.get("Description")
            price = float(row.get("Price") or row.get("SellingPrice") or row.get("RetailPrice") or 0)
            stock = int(float(row.get("Stock") or row.get("QtyOnHand") or row.get("Qty") or 0))

            if sku and price > 0:
                products.append({
                    "sku": sku.strip(),
                    "name": name.strip() if name else "Power Tool",
                    "brand": row.get("Brand", "Standard"),
                    "category": row.get("Category", "Power Tools"),
                    "price": price,
                    "stockQuantity": stock,
                    "inStock": stock > 0,
                    "warranty": row.get("Warranty", "Official Warranty")
                })
    return products

# ---------------------------------------------------------------------------
# MAIN SYNCHRONIZATION EXECUTION
# ---------------------------------------------------------------------------

def run_synchronization():
    logging.info("Starting scheduled ERS synchronization job...")
    try:
        if SYNC_MODE == "DATABASE":
            items = extract_from_database()
        else:
            items = extract_from_csv()

        logging.info(f"Extracted {len(items)} active tool inventory records.")

        # Prepare payload
        payload = {
            "sourceSystem": "Tools Mahagedara Colombo Warehouse ERS",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "itemsCount": len(items),
            "products": items
        }

        # Transmit to website
        headers = {
            "Content-Type": "application/json",
            "X-ERS-API-KEY": API_SECRET_KEY,
            "User-Agent": "ToolsMahagedara-ERS-Bridge/2.0"
        }

        logging.info(f"Transmitting inventory delta to {WEB_STORE_API_URL}...")
        response = requests.post(WEB_STORE_API_URL, json=payload, headers=headers, timeout=30)

        if response.status_code == 200:
            data = response.json()
            logging.info(f"SUCCESS: Synchronized {data.get('updatedCount', len(items))} items with live website.")
            return True
        else:
            logging.error(f"HTTP ERROR {response.status_code}: {response.text}")
            return False

    except Exception as e:
        logging.error(f"CRITICAL ERROR in synchronization pipeline: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_synchronization()
    sys.exit(0 if success else 1)
