

# Inventory Module — Full ERP Enhancement Plan

## Current State
The module has 4 tabs (Items, Suppliers, Purchase Orders, Stock Movements) with basic CRUD. Key gaps:
- No supplier CRUD dialog, no edit/delete for items
- Purchase Order "New Order" button is non-functional
- No receiving workflow for POs (mark items received, auto-update stock)
- No inventory reports/analytics tab
- No category management UI
- No wastage/damage tracking
- No stock transfer between locations
- No inventory valuation reports
- Currency still showing `$` in some places
- No export functionality (PDF/Excel)

## New Database Tables Needed

### `inventory_transfers`
Track stock transfers between departments/locations:
- id, transfer_number, item_id, quantity, from_location, to_location, transferred_by, status, notes, created_at

### `inventory_wastage`
Track damaged/expired/wasted items:
- id, item_id, quantity, wastage_type (damaged/expired/spoiled/other), reason, reported_by, approved_by, cost_impact, created_at

No other new tables needed — categories, suppliers, items, POs, movements all exist.

## Implementation Plan

### 1. Add New Tabs
Expand from 4 tabs to 7:
- **Items** (enhanced with edit/delete, inline details)
- **Categories** (new — full CRUD for inventory_categories)
- **Suppliers** (enhanced with add/edit dialogs)
- **Purchase Orders** (enhanced with create dialog + receiving workflow)
- **Stock Movements** (enhanced with filters + export)
- **Transfers** (new — inter-department stock transfers)
- **Reports** (new — valuation, turnover, wastage, low-stock alerts)

### 2. Hook Enhancements (`useInventory.ts`)
- Add `createCategory`, `updateCategory`, `deleteCategory` mutations
- Add `deleteItem`, `deactivateItem` mutations
- Add `receivePurchaseOrder` mutation (updates PO status + auto-adjusts stock for each line item)
- Add `useInventoryTransfers` hook (CRUD + realtime)
- Add `useInventoryWastage` hook (CRUD)
- Add `useInventoryReports` hook (valuation by category, turnover rate, consumption trends)

### 3. Feature Details

**Items Tab Enhancements:**
- Edit item dialog (reuses create form)
- Delete/deactivate item action
- Item detail expansion showing supplier info, last restock date, movement history
- Selling price field in create/edit
- Location and max stock fields

**Categories Tab (New):**
- Tree view of categories with parent/child
- Add/edit/delete category dialogs
- Item count per category

**Suppliers Tab Enhancements:**
- Add Supplier dialog with all fields (name, contact, email, phone, address, payment terms)
- Edit supplier dialog
- Toggle active/inactive
- Show item count per supplier

**Purchase Orders Enhancements:**
- Full Create PO dialog: select supplier, add line items (item + qty + price), auto-calculate totals
- Status workflow: Draft → Sent → Partially Received → Received → Cancelled
- Receive PO dialog: mark quantities received per line item, auto-update inventory stock
- PO detail view with line items

**Transfers Tab (New):**
- Create transfer: select item, from/to location, quantity
- Transfer list with status (pending/completed/cancelled)
- Auto-creates stock movements on completion

**Reports Tab (New):**
- Stock Valuation by Category (table + totals)
- Low Stock Alert list with reorder suggestions
- Stock Movement Summary (in/out/adjustment totals by date range)
- Top consumed items ranking
- Export to Excel/PDF

### 4. Cross-Cutting
- Replace all `$` with `formatCurrency()`
- Add ErrorBoundary wrapper
- All dialogs use proper loading states and validation
- Realtime subscriptions on new tables

### 5. File Structure
- `src/pages/Inventory.tsx` — main page (refactored, tabs shell)
- `src/components/inventory/ItemsTab.tsx`
- `src/components/inventory/CategoriesTab.tsx`
- `src/components/inventory/SuppliersTab.tsx`
- `src/components/inventory/PurchaseOrdersTab.tsx`
- `src/components/inventory/TransfersTab.tsx`
- `src/components/inventory/StockMovementsTab.tsx`
- `src/components/inventory/ReportsTab.tsx`
- `src/hooks/useInventory.ts` — enhanced with all new mutations/queries

### 6. Migration SQL
Two new tables with RLS + realtime:
- `inventory_transfers` — staff can manage
- `inventory_wastage` — staff can manage
- Enable realtime for both

This will transform the inventory module from a basic stock tracker into a full enterprise inventory management system.

