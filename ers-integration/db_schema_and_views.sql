-- =========================================================================
-- TOOLS MAHAGEDARA - ERS / ERP INVENTORY INTEGRATION SQL VIEWS
-- Compatible with: Microsoft SQL Server (2012+), MySQL (8.0+), MariaDB, PostgreSQL
-- =========================================================================

-- PURPOSE:
-- Creates a safe, sanitized, read-only view that isolates the e-commerce catalog
-- from sensitive accounting, supplier cost margins, or customer debt ledgers.

-- 1. SQL SERVER / MSSQL VERSION
-- -------------------------------------------------------------------------
IF OBJECT_ID('vw_ToolsMahagedara_WebSync', 'V') IS NOT NULL
    DROP VIEW vw_ToolsMahagedara_WebSync;
GO

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
    COALESCE(p.WarrantyMonths, 12)    AS warranty_months,
    CONCAT(COALESCE(p.WarrantyMonths, 12), ' Months Company Warranty') AS warranty,
    COALESCE(p.LastUpdated, GETDATE()) AS ersLastUpdated
FROM tbl_Items p
LEFT JOIN tbl_InventoryStock s ON p.ItemCode = s.ItemCode
LEFT JOIN tbl_ItemCategories c ON p.CategoryID = c.CategoryID
WHERE p.IsActive = 1
  AND p.IsDiscontinued = 0;
GO

-- 2. CREATE A DEDICATED READ-ONLY USER FOR SECURITY
-- Never use 'sa' or 'root' for web sync scripts!
CREATE LOGIN web_sync_user WITH PASSWORD = '<CHANGE_ME_STRONG_PASSWORD>';
CREATE USER web_sync_user FOR LOGIN web_sync_user;
GRANT SELECT ON vw_ToolsMahagedara_WebSync TO web_sync_user;
GO
