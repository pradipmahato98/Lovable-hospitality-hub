

# Comprehensive Production-Ready Audit & Enhancement Plan

## Current State Assessment

After auditing every module, page, hook, and component, here is what exists and what needs fixing/enhancing across the entire LuxeStay ERP:

---

## Phase 1: Critical Fixes (Data Integrity & Broken Logic)

### 1.1 Replace Mock/Hardcoded Data with Real Database Queries
Several modules still use hardcoded mock data instead of querying the database:

- **HR Module** (`HR.tsx`): Uses `mockEmployees` array instead of querying `profiles` + `staff_schedules` tables
- **Engineering** (`Engineering.tsx`): Uses hardcoded `MaintenanceRequest` mock data — no database table or hooks
- **Billing** (`Billing.tsx`): Hardcoded invoices array — should query `invoices` table
- **Payments** (`Payments.tsx`): Hardcoded payments array — should query `payments` table
- **Reports** (`Reports.tsx`): All chart data is hardcoded mock — should aggregate real data from `reservations`, `rooms`, `pos_transactions`, `invoices`
- **DayClose** (`DayClose.tsx`): Hardcoded `departmentRevenue` — should compute from actual `journal_entries` and POS data
- **FrontDesk Billing tab**: Hardcoded invoices at line 51 — duplicates of Billing page mock
- **ChannelManager**: `totalBookings` and `totalRevenue` are hardcoded at lines 48-49
- **POS Terminal** (`POSTerminal.tsx`): `menuItems` hardcoded — should come from a `pos_menu_items` table

### 1.2 Missing Database Tables Needed
Create these tables to support real data:
- `maintenance_requests` — for Engineering module
- `pos_menu_items` / `pos_menu_categories` — for POS menu management
- `leave_requests` — already referenced in LeaveManagement but may not exist
- `staff_departments` — structured department data instead of hardcoded arrays

### 1.3 Hook Consistency
- `useReservations` uses raw `useState`/`useEffect` instead of `useQuery` (TanStack) — should be refactored for cache consistency with the rest of the app
- Several hooks use `(supabase as any)` type assertions — acceptable per architecture memory, but should be audited for correctness

---

## Phase 2: Module-by-Module Enhancements

### 2.1 Dashboard (`Index.tsx`)
- **Current**: Basic 4 metrics + charts with real data
- **Enhance**: Add today's arrivals/departures count, housekeeping status summary, POS revenue today, pending maintenance count — all from real queries

### 2.2 Reservations (`Reservations.tsx`)
- **Current**: List + Calendar views, check-in/out dialogs, walk-in, realtime
- **Enhance**: Add status filter dropdown (the Filter button is non-functional), pagination for large datasets, reservation edit/cancel functionality, payment status column

### 2.3 Front Desk (`FrontDesk.tsx`)
- **Current**: Rooms grid/table, folios, queue, messages, upgrades, wake-up, group, keycards — all DB-connected
- **Fix**: Replace hardcoded Billing tab invoices with real `invoices` query; make billing metrics dynamic

### 2.4 Guests (`Guests.tsx`)
- **Current**: Guest profiles, feedback, loyalty, documents, history, messaging, de-dup — all DB-connected
- **Enhance**: Add Guest creation dialog (the "Add Guest" button has no handler), add guest edit/delete, search in grid view

### 2.5 Housekeeping (`Housekeeping.tsx`)
- **Current**: 604 lines, tasks, lost & found, inspections — DB-connected
- **Status**: Well-implemented, minor refinements only

### 2.6 Engineering (`Engineering.tsx`)
- **Critical**: 100% mock data, no database integration
- **Fix**: Create `maintenance_requests` table, create `useMaintenanceRequests` hook, wire up CRUD operations

### 2.7 POS System (`POS.tsx`, `POSTerminal.tsx`, `POSHistory.tsx`, `POSReports.tsx`)
- **Current**: Terminal with hardcoded menu, history/reports with DB queries
- **Fix**: Create `pos_menu_items` table and hook; replace hardcoded menu; make Kitchen Display functional with realtime order updates

### 2.8 Inventory (`Inventory.tsx`)
- **Current**: 556 lines, items/categories/suppliers/POs/stock movements — all DB-connected
- **Status**: Well-implemented

### 2.9 Channel Manager (`ChannelManager.tsx`)
- **Current**: OTA channels with toggle/sync — DB-connected
- **Fix**: Replace hardcoded booking/revenue stats with real aggregated data

### 2.10 Finance (`Finance.tsx`)
- **Current**: Most comprehensive module — Dashboard, Setup (10 sub-tabs), Transactions (15 sub-tabs), Reports (11 sub-tabs)
- **Status**: Well-implemented, recently enhanced with Ledger/DayBook/Reconcile
- **Minor**: Ensure all sub-tab components handle empty states gracefully

### 2.11 HR (`HR.tsx`)
- **Critical**: Uses `mockEmployees`, not database
- **Fix**: Query `profiles` joined with `user_roles` and `staff_schedules`; wire up real employee data; leave management and payroll already have DB hooks

### 2.12 Banquet (`Banquet.tsx`)
- **Current**: 841 lines, events/catering/venue/reports — DB-connected
- **Status**: Well-implemented

### 2.13 Night Audit & Day Close
- **Night Audit**: DB-connected with step-based workflow
- **Day Close**: Hardcoded revenue data — needs real aggregation from journal entries + POS

### 2.14 Reports (`Reports.tsx`)
- **Critical**: 100% hardcoded chart data
- **Fix**: Create `useReportStats` hook that aggregates from `reservations`, `rooms`, `pos_transactions`, `invoices`, `expenses`

### 2.15 Billing & Payments
- **Critical**: Both pages use hardcoded data
- **Fix**: Wire to `invoices`/`payments` tables via existing hooks

### 2.16 Settings (`Settings.tsx`)
- **Current**: 10 setting categories, all DB-connected via `useSettings`
- **Status**: Well-implemented

### 2.17 Staff Management (`StaffManagement.tsx`)
- **Current**: Directory, personal details, preferences, alerts, security, logs — DB-connected
- **Status**: Well-implemented

---

## Phase 3: Cross-Cutting Improvements

### 3.1 Error Handling
- Add `ErrorBoundary` wrapper to modules that lack it (Engineering, HR, Reports, Billing, Payments, DayClose)

### 3.2 Loading States
- Ensure every data-fetching page shows skeleton/spinner (some mock-data pages skip this)

### 3.3 Empty States
- Add meaningful empty-state messages with action buttons across all list views

### 3.4 Currency Formatting
- Standardize currency display (some use `$`, some use template literals) — should use a shared `formatCurrency()` utility respecting property settings

---

## Implementation Priority Order

Due to message size limits, this should be executed across multiple iterations:

**Batch 1** (Highest Impact — Replace Mock Data):
1. Create `maintenance_requests` table + hook + wire Engineering module
2. Create `pos_menu_items` table + hook + wire POS Terminal
3. Wire HR to real `profiles`/`user_roles` data (remove mockEmployees)
4. Wire Reports page to real aggregated data
5. Wire Billing & Payments pages to `invoices`/`payments` tables

**Batch 2** (Fix Broken UI Logic):
6. Make Reservations Filter button functional
7. Add Guest creation dialog handler
8. Fix FrontDesk billing tab hardcoded data
9. Fix DayClose hardcoded department revenue
10. Fix ChannelManager hardcoded stats

**Batch 3** (Polish & Production Hardening):
11. Add ErrorBoundary to remaining pages
12. Add `formatCurrency()` utility and standardize
13. Refactor `useReservations` to use `useQuery`
14. Add pagination to all list views exceeding 50 items
15. Ensure all date displays use standardized AD/BS format

---

This plan addresses every module in the ERP. Shall I proceed with Batch 1 first?

