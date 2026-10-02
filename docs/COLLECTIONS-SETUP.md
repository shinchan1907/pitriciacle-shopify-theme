# Collections setup — Pitriciacle

Shopify's product CSV cannot create collections, so we use **automated collections**:
every product in `pitriciacle-products.csv` already carries a **Product Type**,
and each collection below auto-gathers products by that type. Create once; all
12 products (and any future ones with the same type) appear automatically.

## Create these 4 collections

For each row: **Products → Collections → Create collection**, then:

| # | Collection name | Type it | Collection type | Condition |
|---|---|---|---|---|
| 1 | Mirrors | Mirrors | Automated | Product type **is equal to** `Mirrors` |
| 2 | Lighting | Lighting | Automated | Product type **is equal to** `Lighting` |
| 3 | Rugs & Runners | Rugs & Runners | Automated | Product type **is equal to** `Rugs & Runners` |
| 4 | Metal Objects | Metal Objects | Automated | Product type **is equal to** `Metal Objects` |

Steps per collection:
1. Enter the name exactly as above (Shopify auto-generates the matching handle:
   `mirrors`, `lighting`, `rugs-runners`, `metal-objects` — the handles the
   theme's homepage collection grid already links to).
2. Under **Products**, choose **Automated**.
3. Condition: `Product type` → `is equal to` → the type from the table.
4. Set the collection image later with real photography (optional).
5. Save. Products appear immediately after the CSV import.

## Import order

1. **Upload the theme** first (so placeholder fallbacks exist).
2. **Products → Import** → upload `pitriciacle-products.csv` → confirm.
   Images import automatically from the hosted URLs in the CSV.
3. Create the 4 automated collections above.

## Notes

- Tags mirror the collection handles (`mirrors`, `lighting`, `rugs-runners`,
  `metal-objects`) as a backup grouping method.
- Inventory is set to 10 units tracked by Shopify, oversell denied (`deny`).
- All prices are in INR; variants are single ("Default Title") so no variant
  dropdowns appear on the product page.
- When real photography is ready: Products → open product → replace the
  placeholder image. The CSV image URLs are only stand-ins.
