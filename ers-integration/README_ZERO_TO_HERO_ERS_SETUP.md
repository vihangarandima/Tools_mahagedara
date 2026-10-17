# 🛠️ Tools Mahagedara - ERS / ERP Integration Guide (From 0 to 100)

Welcome to the definitive setup manual for connecting **Tools Mahagedara (ටූල්ස් මහගෙදර)** to your customer's physical store **ERS / ERP / POS System**.

This document explains everything in clear, step-by-step detail so you or the store owner can set up automatic stock quantity and price synchronization without needing complex cloud servers or exposing the store database to security risks.

---

## 📋 Table of Contents
1. [What is an ERS System & How Does This Connection Work?](#1-what-is-an-ers-system--how-does-this-connection-work)
2. [Step 0: The 3 Questions to Ask Your Customer](#step-0-the-3-questions-to-ask-your-customer)
3. [Step 1: Choose the Right Sync Strategy](#step-1-choose-the-right-sync-strategy)
4. [Step 2: Prepare the Store Database (Read-Only SQL View)](#step-2-prepare-the-store-database-read-only-sql-view)
5. [Step 3: Set Up the Store Bridge Script (`ers_sync_bridge.py`)](#step-3-set-up-the-store-bridge-script-ers_sync_bridgepy)
6. [Step 4: Automate with Windows Task Scheduler (Runs Every 15 Min)](#step-4-automate-with-windows-task-scheduler-runs-every-15-min)
7. [Step 5: Alternative Zero-Code Option: CSV / Excel Drag & Drop](#step-5-alternative-zero-code-option-csv--excel-drag--drop)
8. [Step 6: Security & Best Practices](#step-6-security--best-practices)
9. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. What is an ERS System & How Does This Connection Work?

An **ERS (Enterprise Resource System)** or **ERP / POS** is the software running on the cashier computer or server at the physical Tools Mahagedara shop in Sri Lanka (e.g., Colombo, Panchikawatte, or Nawala). It tracks:
- **Item Master**: Barcodes, SKUs, Brand, Tool Name.
- **Selling Price**: Current retail price in Sri Lankan Rupees (LKR රු.).
- **Qty on Hand (Stock)**: Physical count of power tools in the store showroom and warehouse.

### 🏗️ The 4-Tier Synchronization Architecture

```
[Store ERS Database] (On-Premise PC / Server)
         │
         ▼
[Read-Only SQL View] (Sanitizes & exposes only public fields)
         │
         ▼
[ers_sync_bridge.py] (Runs locally on store PC every 15 mins)
         │  (Encrypted HTTPS POST with X-ERS-API-KEY header)
         ▼
[Website REST API] (https://toolsmahagedara.lk/api/v1/ers/inventory-sync)
         │
         ▼
[Tools Mahagedara Web Catalog] (Instantly updates live prices & stock badges)
```

> [!NOTE]
> **Why outbound HTTPS push instead of inbound?**
> Physical hardware stores in Sri Lanka have dynamic IP addresses (SLT, Dialog) and sit behind NAT firewalls. By having the store computer **push** out to the website, **you never need to open inbound router ports, set up port forwarding, or buy static IP addresses!**

---

## Step 0: The 3 Questions to Ask Your Customer

Before writing any configuration, ask your customer these 3 simple questions:

1. *"What is the name of the software you use at the cashier counter to print bills?"*
   - Examples: **Accura POS, Dhanush, Visual POS, Busy, Tally Prime, QuickBooks, or a custom VB.NET/C# system**.
2. *"Where is the database hosted?"*
   - Usually on the cashier machine itself (`localhost`) or a designated "Server PC" in the shop office.
3. *"What database engine does it run on?"*
   - Most use **Microsoft SQL Server (Express)**, **MySQL / MariaDB**, or **Microsoft Access / SQLite**.

---

## Step 1: Choose the Right Sync Strategy

| Method | When to Use | Setup Time | Level |
|---|---|---|---|
| **Method A: Direct SQL Bridge** (Recommended) | If the customer has access to their SQL Server / MySQL database | 15 mins | ⭐ Professional |
| **Method B: CSV / Excel Daily Export** | If the software vendor won't give database access, but POS has an "Export to Excel" button | 2 mins | 🟢 Beginner Friendly |
| **Method C: Tally Prime ODBC** | If the store uses Tally for inventory | 20 mins | 🟡 Intermediate |

---

## Step 2: Prepare the Store Database (Read-Only SQL View)

Never connect directly to the main tables where financial records or supplier costs live. Create a **dedicated read-only view**:

1. Open **SQL Server Management Studio (SSMS)** or **phpMyAdmin / HeidiSQL** on the store server.
2. Open the file `ers-integration/db_schema_and_views.sql`.
3. Run the following script:

```sql
CREATE VIEW vw_ToolsMahagedara_WebSync AS
SELECT 
    TRIM(p.ItemCode)                  AS sku,
    TRIM(p.ItemName)                  AS name,
    COALESCE(TRIM(p.BrandName), 'BOSCH') AS brand,
    COALESCE(TRIM(c.CategoryName), 'Power Tools') AS category,
    CAST(p.SellingPrice AS DECIMAL(10,2)) AS price,
    CAST(COALESCE(s.QtyOnHand, 0) AS INT) AS stockQuantity,
    CASE 
        WHEN COALESCE(s.QtyOnHand, 0) > 0 THEN 1 
        ELSE 0 
    END                               AS inStock,
    CONCAT(COALESCE(p.WarrantyMonths, 12), ' Months Company Warranty') AS warranty,
    COALESCE(p.LastUpdated, GETDATE()) AS ersLastUpdated
FROM tbl_Items p
LEFT JOIN tbl_InventoryStock s ON p.ItemCode = s.ItemCode
LEFT JOIN tbl_ItemCategories c ON p.CategoryID = c.CategoryID
WHERE p.IsActive = 1;
```

4. Create a dedicated read-only database user:
```sql
CREATE LOGIN web_sync_user WITH PASSWORD = '<CHANGE_ME_STRONG_PASSWORD>';
CREATE USER web_sync_user FOR LOGIN web_sync_user;
GRANT SELECT ON vw_ToolsMahagedara_WebSync TO web_sync_user;
```

---

## Step 3: Set Up the Store Bridge Script (`ers_sync_bridge.py`)

1. Ensure **Python** is installed on the store PC (Python 3.10+).
2. Open Windows Command Prompt (`cmd.exe`) and install the required drivers:
   ```cmd
   pip install requests pyodbc pymysql
   ```
3. Copy `ers_sync_bridge.py` to a safe folder on the store PC, for example: `C:\ToolsMahagedara\ers_sync_bridge.py`.
4. Open the file with Notepad and verify your credentials:
   ```python
   WEB_STORE_API_URL = "https://toolsmahagedara.lk/api/v1/ers/inventory-sync"
   API_SECRET_KEY = os.environ.get("ERS_API_KEY", "")  # set ERS_API_KEY env var

   DB_SERVER = "localhost"
   DB_NAME = "ToolsMahagedara_POS"
   DB_USER = "web_sync_user"
   DB_PASSWORD = os.environ.get("ERS_DB_PASSWORD", "")  # set ERS_DB_PASSWORD env var
   ```
5. Test run the script manually:
   ```cmd
   python C:\ToolsMahagedara\ers_sync_bridge.py
   ```
   You should see:
   ```
   [INFO] Connecting to ERS database at localhost...
   [INFO] Extracted 48 active tool inventory records.
   [INFO] Transmitting inventory delta to https://toolsmahagedara.lk/api/v1/ers/inventory-sync...
   [INFO] SUCCESS: Synchronized 48 items with live website.
   ```

---

## Step 4: Automate with Windows Task Scheduler (Runs Every 15 Min)

Now automate it so nobody has to touch it:

1. Press `Win + S`, type **Task Scheduler**, and press **Enter**.
2. Click **Create Basic Task...** in the right sidebar.
3. **Name**: `ToolsMahagedara_ERSSync`.
4. **Trigger**: Select **Daily** ➔ Start at **08:00 AM**.
5. **Action**: Select **Start a program**.
   - **Program/script**: `python.exe` (or `C:\Python313\python.exe`)
   - **Add arguments**: `ers_sync_bridge.py`
   - **Start in**: `C:\ToolsMahagedara\`
6. Click **Finish**.
7. Right-click the newly created task ➔ **Properties** ➔ **Triggers tab** ➔ **Edit**:
   - Check **Repeat task every**: `15 minutes` for a duration of: `Indefinitely`.
   - Check **Run whether user is logged on or not**.

Done! Whenever tools are sold in the shop, the quantity on the website updates automatically every 15 minutes!

---

## Step 5: Alternative Zero-Code Option: CSV / Excel Drag & Drop

If the client prefers manual control or their POS vendor does not provide direct SQL access:

1. In the store's POS software, click **Reports ➔ Current Stock ➔ Export to Excel / CSV**.
2. Open the **Tools Mahagedara** website in your browser.
3. Click the green **"ERS System: LIVE CONNECTED"** badge in the top navigation bar.
4. Go to the **"CSV / Excel Bulk Sync"** tab.
5. Paste the CSV contents or select the file.
6. Click **Import & Update Web Catalog**.
7. The catalog will update all item quantities and prices in **less than 1 second**!

A ready-to-test CSV file is provided in `ers-integration/sample_inventory_feed.csv`.

---

## Step 6: Security & Best Practices

1. **API Secret Rotation**: The website requires `X-ERS-API-KEY` on every request. You can regenerate this key anytime from the website ERS Control Center.
2. **Rate Limiting**: Protect the website webhook with a rate limit of 1 sync per minute to prevent accidental spamming.
3. **Out-of-Stock Protection**: When stock reaches `0`, the website automatically hides the "Add to Cart" button and flags the item as **"Sold Out / Pre-Order via WhatsApp"**.
4. **Price Change History**: Every synchronization records an audit event in the **Sync Event Log** showing exactly which prices or stock counts changed.

---

## 🛠️ Need Custom POS Adapters?
If your customer's software requires custom XML, SOAP, or legacy FoxPro/DBF extraction, you can drop custom adapters directly into `ers-integration/ers_sync_bridge.py`!
