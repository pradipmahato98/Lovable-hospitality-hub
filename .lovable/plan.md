

# Plan: Complete the Finance & Accounting Module

## Current State Assessment

After reviewing all 30+ finance components, here is what works vs what is placeholder:

**Already functional (real database):**
- Chart of Accounts (full CRUD)
- Journal Entries (create, post, with lines)
- Trial Balance (aggregated from posted journals)
- General Ledger (running balances per account)
- Invoices & Payments (create, record payment, auto-update balances)
- Expenses (create, approve, mark paid lifecycle)
- Bank & Cash view (combines payments + expenses)
- AR/AP views (surface invoices/expenses)
- Period Close (business date rollover)

**Placeholder with mock/hardcoded data (no persistence):**
- Customer Master, Vendor Master, Asset Master, Budget Setup
- Financial Configuration (switches not saved)
- Tax Configuration
- Asset Operations, Approval Workflow, Integration Orchestrator
- All reporting services (AR, AP, Cash/Bank, Fixed Assets, Audit, Budget, Consolidation, Statement Mapping)
- All infrastructure services (Event Bus, Shared Data, API Gateway, Security Layer)

## Implementation Plan

### Phase 1: Database Tables (migration)
Create missing tables needed for real accounting logic:
- `customers` — corporate/individual clients with credit limits, payment terms
- `fixed_assets` — asset register with depreciation tracking (cost, salvage, useful_life, accumulated_depreciation, method)
- `budgets` + `budget_lines` — budget templates with per-account allocations by period
- `tax_rates` table already exists in hooks but needs verification
- `financial_periods` — fiscal periods with open/closed/locked status
- `approval_queue` — pending approvals with entity references

All tables get RLS policies using `is_staff()`.

### Phase 2: Connect Setup Components to Database

1. **Customer Master** — Replace mock array with `guests` table (already exists) filtered by corporate/agency type, or create dedicated `customers` table. Add CRUD dialogs.
2. **Vendor Master** — Connect to existing `suppliers` table (already in DB). Add search, create/edit dialogs.
3. **Asset Master** — Connect to new `fixed_assets` table. Add acquisition form with depreciation method selection (straight-line, declining balance).
4. **Budget Setup** — Connect to `budgets` + `budget_lines`. Create budget templates with account-level allocations.
5. **Financial Config** — Persist toggle states to a `settings` or `module_config` table (check if exists in useSettings).
6. **Tax Config** — Wire to `tax_rates` from useFinanceExtended (already has hooks).
7. **Statement Mapping** — Map account ranges to financial statement line items (Balance Sheet, P&L).

### Phase 3: Make Transaction Components Functional

1. **AR Transactions** — Add "New Invoice" dialog that creates via `useInvoices().createInvoice`, payment receipt recording, credit memo support.
2. **AP Transactions** — Add "New Vendor Bill" form, 3-way PO matching (link to `purchase_orders`), payment scheduling.
3. **Asset Operations** — Implement depreciation calculation engine (straight-line: `(cost - salvage) / useful_life`), auto-generate journal entries for depreciation runs.
4. **Tax Calculation** — Apply tax rates from `tax_rates` table to invoices/expenses, generate tax liability journal entries.
5. **Budget Execution** — Show actual vs budget comparison per account, variance analysis.
6. **Approval Workflow** — Queue items pending approval, approve/reject with audit trail.
7. **Integration Orchestrator** — Auto-post POS settlements, folio charges, and payroll to GL via journal entries.

### Phase 4: Build Real Reports

1. **Financial Statements** — Generate Balance Sheet and Income Statement from trial balance data, grouped by account type hierarchy.
2. **AR Aging Report** — Group outstanding invoices by 0-30, 31-60, 61-90, 90+ day buckets.
3. **AP Aging Report** — Same for vendor bills/expenses.
4. **Cash Flow Report** — Categorize cash movements into Operating, Investing, Financing.
5. **Fixed Assets Report** — Asset register with book value, accumulated depreciation, remaining life.
6. **Tax Report** — Summarize tax collected (output) vs tax paid (input), net liability.
7. **Budget vs Actual** — Side-by-side with variance percentages and trend charts.
8. **Audit Trail** — Pull from existing `audit_log` table with filters by entity, date, user.
9. **Consolidation/BI** — Revenue by department, expense ratios, KPI dashboard with charts.

### Phase 5: Remove Infrastructure Tab

The Infrastructure tab (Event Bus, API Gateway, Security Layer, Shared Data) is a monitoring concept that doesn't apply to a hotel accounting module. Replace it with a **Settings/Admin** sub-section within Setup, or remove it entirely to keep the module focused on accounting.

## Technical Approach

- Create ~6 new database tables via migration tool
- Rewrite ~15 placeholder components to use real hooks + Supabase queries
- Add ~5 new hooks for customers, fixed assets, budgets, financial periods, approvals
- Accounting logic (depreciation, aging, period close validation) implemented client-side with journal entry auto-generation
- All financial mutations create corresponding journal entries to maintain double-entry integrity
- Reports computed from `journal_lines` + `accounts` aggregations (same pattern as existing trial balance)

## Scope Note

This is a large effort spanning 20+ files. I recommend implementing in batches — starting with Phase 1 (DB) + Phase 2 (Setup) first, then Transactions, then Reports. Each phase will be fully functional before moving to the next.

Shall I proceed with all phases, or start with a specific one?

