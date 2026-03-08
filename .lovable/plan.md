

## Plan: Add Ledger, Day Book, and Cash & Bank Reconcile Tabs to Transactions

### Overview
Add three new sub-tabs under the **Transaction** section (below Journal Entries): **Ledger**, **Day Book**, and **Cash & Bank Reconcile**. Each features a filter sidebar that auto-opens on tab click.

### 1. Add Ledger Tab (`src/components/finance/transactions/LedgerTransactionService.tsx`)

**Filter Sidebar** (auto-opens on load, left panel):
- **Fiscal Year** dropdown (default: current year 2081/82)
- **From Date** / **To Date** (NepaliDateInput, BS mode)
- **Ledger Account** dropdown (populated from `accounts` table)
- **Show** toggle: "Details" or "Summary"
- **Linked Ledger** dropdown (filters to accounts that have transactions matching the selected ledger)
- **Search** and **Cancel** buttons at bottom

**Main Content** (right panel):
- Table showing ledger entries: Date (AD), मिति (BS), Voucher #, Description, Debit, Credit, Running Balance
- Summary mode shows account totals only
- Uses existing `useLedger` hook from `useFinance.ts`

### 2. Add Day Book Tab (`src/components/finance/transactions/DayBookService.tsx`)

**Filter Sidebar** (auto-opens):
- **Fiscal Year** dropdown
- **Date** picker (single day, defaults to today)
- **Voucher Type** filter (All, Journal, Receipt, Payment, Contra)
- **Search** and **Cancel** buttons

**Main Content**:
- Lists all journal entries for the selected date
- Table: Voucher #, Type, Description, Debit Total, Credit Total, Posted By
- Summary cards at top: Total Entries, Total Debits, Total Credits
- Queries `journal_entries` + `journal_lines` filtered by date

### 3. Add Cash & Bank Reconcile Tab (`src/components/finance/transactions/CashBankReconcileService.tsx`)

**Filter Sidebar** (auto-opens):
- **Fiscal Year** dropdown
- **Account** dropdown (filtered to asset-type accounts with "cash" or "bank" in name)
- **Statement Date** picker
- **From Date** / **To Date** range
- **Search** and **Cancel** buttons

**Main Content**:
- Two-panel view: Book Balance vs Statement Balance
- Table of unreconciled items: Date, Description, Debit, Credit, Status (checkboxes to mark reconciled)
- Summary: Opening Balance, Additions, Deductions, Closing Balance, Difference
- Uses `journal_lines` data filtered by the selected cash/bank account

### 4. Update Finance.tsx

Add three entries to `transactionSubTabs` array after "journals":
```typescript
{ id: "ledger", label: "Ledger", component: LedgerTransactionService },
{ id: "day-book", label: "Day Book", component: DayBookService },
{ id: "cash-bank-reconcile", label: "Cash & Bank Reconcile", component: CashBankReconcileService },
```

### Files to Create/Modify
- **Create**: `src/components/finance/transactions/LedgerTransactionService.tsx`
- **Create**: `src/components/finance/transactions/DayBookService.tsx`
- **Create**: `src/components/finance/transactions/CashBankReconcileService.tsx`
- **Modify**: `src/pages/Finance.tsx` (add imports + sub-tab entries)

### Technical Notes
- All three components use a shared layout pattern: `Sheet` or side panel (left) for filters + main content (right)
- Filter sidebar uses `useState` with `showFilter: true` by default (auto-open)
- No database changes needed — all data comes from existing `accounts`, `journal_entries`, and `journal_lines` tables via existing hooks
- Reuses `useAccounts`, `useLedger`, `useJournalEntries` from `useFinance.ts`

