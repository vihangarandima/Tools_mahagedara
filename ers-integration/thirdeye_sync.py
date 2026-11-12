"""
=============================================================================
TOOLS MAHAGEDARA - THIRDEYE ERP SYNCHRONIZATION BRIDGE
Powered By ThirdEYE ERP Solutions / My Enterprise Automation (Pvt) Ltd.
=============================================================================
This script connects to the store's physical ERP server at:
  http://103.47.225.144/main_api/Api

It performs:
  1. POST /users/login -> Authenticates and retrieves temporary session Api-key token.
  2. POST /get_itemListRTT -> Retrieves full live inventory (items, rates, and stock on hand).
  3. Writes cleaned & formatted data to:
     - public/data/thirdeye_inventory.json (ready for Tools Mahagedara Web Store)

Usage:
  python thirdeye_sync.py
=============================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime
import urllib.request
import urllib.error

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# API Configuration (Defaults provided by ThirdEYE ERP document)
API_BASE_URL = os.environ.get("THIRDEYE_API_URL", "http://103.47.225.144/main_api/Api").rstrip('/')
USERNAME = os.environ.get("THIRDEYE_USERNAME", "")
PASSWORD = os.environ.get("THIRDEYE_PASSWORD", "")
TOKEN_X = os.environ.get("THIRDEYE_TOKENX", "")
if not (USERNAME and PASSWORD and TOKEN_X):
    sys.exit("Set THIRDEYE_USERNAME, THIRDEYE_PASSWORD and THIRDEYE_TOKENX environment variables first.")

def post_json(url: str, payload: dict, headers: dict = None) -> dict:
    data = json.dumps(payload).encode('utf-8')
    req_headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'ToolsMahagedara-SyncBridge/1.0'
    }
    if headers:
        req_headers.update(headers)
    
    req = urllib.request.Request(url, data=data, headers=req_headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode('utf-8')
            return json.loads(content)
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8', errors='ignore')
        logging.error(f"HTTP Error {e.code} on {url}: {error_msg}")
        raise
    except Exception as e:
        logging.error(f"Network error contacting {url}: {e}")
        raise

def run_thirdeye_sync():
    logging.info("==================================================")
    logging.info("Starting ThirdEYE ERP Live Inventory Sync...")
    logging.info(f"Target Server: {API_BASE_URL}")
    logging.info("==================================================")

    # 1. Authenticate
    login_url = f"{API_BASE_URL}/users/login"
    login_payload = {
        "username": USERNAME,
        "password": PASSWORD,
        "tokenX": TOKEN_X
    }
    logging.info(f"Authenticating as '{USERNAME}'...")
    login_res = post_json(login_url, login_payload)

    if login_res.get("result") != "success" or not login_res.get("token"):
        raise RuntimeError(f"Authentication failed with ThirdEYE ERP: {login_res}")

    session_token = login_res["token"]
    company_name = login_res.get("companyname", "RTT CONSTRUCTION")
    logging.info(f"✓ Authentication successful for '{company_name}'!")
    logging.info(f"✓ Session Token received: {session_token[:15]}...")

    # 2. Fetch Item List
    items_url = f"{API_BASE_URL}/get_itemListRTT"
    items_headers = {
        "Api-key": session_token
    }
    items_payload = {
        "tokenX": TOKEN_X
    }
    logging.info("Fetching complete item catalog and stock levels...")
    items_res = post_json(items_url, items_payload, headers=items_headers)

    if items_res.get("result") != "success" or "itemlist" not in items_res:
        raise RuntimeError(f"Failed to fetch item list: {items_res.get('result')}")

    raw_items = items_res["itemlist"]
    total_count = len(raw_items)
    logging.info(f"✓ Successfully retrieved {total_count} items from ThirdEYE ERP!")

    # 3. Clean & Structure Items
    cleaned_items = []
    in_stock_count = 0

    for idx, item in enumerate(raw_items):
        item_code = str(item.get("itemCode") or f"ITEM-{idx+1}").strip()
        item_name = str(item.get("itemName") or item_code).strip()
        
        try:
            raw_on_hand = float(item.get("onHand") or 0)
            on_hand = max(0.0, raw_on_hand)
        except (ValueError, TypeError):
            on_hand = 0.0

        try:
            item_rate = float(item.get("itemRate") or 0)
        except (ValueError, TypeError):
            item_rate = 0.0

        try:
            discount_pcn = float(item.get("item_discount_PCN") or 0)
        except (ValueError, TypeError):
            discount_pcn = 0.0

        try:
            max_sales = float(item.get("maxsales") or item_rate)
        except (ValueError, TypeError):
            max_sales = item_rate

        is_in_stock = on_hand > 0
        if is_in_stock:
            in_stock_count += 1

        cleaned_items.append({
            "sku": item_code,
            "name": item_name,
            "itemType": item.get("itemType", "Inventory Part"),
            "category": item.get("itemcat") or "General Hardware & Tools",
            "unitOfMeasure": item.get("unitOfMesher") or "Nos",
            "price": item_rate,
            "originalPrice": max_sales if max_sales > item_rate else item_rate,
            "discountPercentage": discount_pcn,
            "stockQuantity": int(on_hand),
            "inStock": is_in_stock,
            "syncSource": "THIRDEYE_ERP",
            "lastSynced": datetime.now().isoformat()
        })

    logging.info(f"Summary: {in_stock_count} items currently In Stock / {total_count - in_stock_count} Out of Stock.")

    # 4. Save output files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    public_data_dir = os.path.join(project_root, "public", "data")
    os.makedirs(public_data_dir, exist_ok=True)

    output_path = os.path.join(public_data_dir, "thirdeye_inventory.json")
    sync_metadata = {
        "provider": "ThirdEYE ERP Solutions / My Enterprise Automation (Pvt) Ltd.",
        "companyName": company_name,
        "lastSynced": datetime.now().isoformat(),
        "totalItems": total_count,
        "inStockItems": in_stock_count,
        "items": cleaned_items
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(sync_metadata, f, ensure_ascii=False, separators=(",", ":"))

    logging.info(f"✓ Saved live inventory catalog to: {output_path}")
    logging.info("==================================================")
    logging.info("ThirdEYE ERP Synchronization Completed Successfully!")
    logging.info("==================================================")
    return sync_metadata

if __name__ == "__main__":
    try:
        run_thirdeye_sync()
    except Exception as exc:
        logging.error(f"Sync process aborted due to error: {exc}")
        sys.exit(1)
