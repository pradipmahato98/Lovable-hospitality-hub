

# Comprehensive Project Optimization & Security Hardening Plan

This is a large multi-part plan covering: performance optimization, responsive fixes, cashier reports, attendance/clock-in fixes, dine-in/out tracking in POS, and security hardening.

---

## Part 1: Performance & Responsive Optimization

### A. Responsive Layout Fixes
- **TabsList overflow**: All pages with many tabs (FrontDesk has 10 tabs) need `flex-wrap h-auto` and `overflow-x-auto` on `TabsList` to prevent horizontal overflow on mobile (360px viewport).
- **Dialog/Sheet overflow**: Ensure all `DialogContent` and `SheetContent` use `max-h-[90vh] overflow-y-auto` so pop-ups don't extend beyond screen.
- **POSTableSystem.tsx** (1480 lines): The ordering panel and table grid need `overflow-hidden` containers with inner scroll areas for small screens.
- **Sidebar**: Already collapses on mobile -- verify no z-index conflicts with dialogs.

### B. Performance Fixes
- **POSDashboard mock data**: Replace static mock fallback with empty state UI instead of fake transactions that mislead reports.
- **Large component splitting**: POSTableSystem.tsx at 1480 lines should remain as-is (already works) but add `React.memo` on expensive child renders.
- **Query deduplication**: Some pages query the same tables redundantly (e.g., `rooms` queried in FrontDesk + FrontDeskReportsTab). Already handled by React Query cache -- no change needed.

### C. DialogTitle Accessibility Fix
- Console shows `DialogContent requires a DialogTitle` errors. Audit all `Dialog` usages and add missing `DialogTitle` (or wrap with `VisuallyHidden`).

**Files modified:**
- `src/pages/FrontDesk.tsx` -- TabsList responsive wrap
- `src/pages/Banquet.tsx` -- already has `flex-wrap h-auto`, verify
- `src/pages/NightAudit.tsx`, `src/pages/StaffManagement.tsx` -- responsive tab overflow
- `src/components/pos/POSTableSystem.tsx` -- dialog accessibility fix, responsive containers
- Multiple dialog components -- add missing `DialogTitle`

---

## Part 2: Cashier Reports in Report Tabs

Add a **Cashier Report** section (tabular, no charts) to the Reports tabs of Front Desk, POS, Banquet, and Reservations. Each shows:

### Front Desk Cashier Report
- Table of today's payments received (from `payments` table): payment_number, guest, amount, method, reference, received_by, timestamp
- Summary row: total cash, total card, total digital, grand total
- PDF/Excel export

### POS Cashier Report  
- Already in POSReports -- enhance with a dedicated **Cashier Summary** tab showing:
  - Shift-wise transaction totals (from `pos_transactions` grouped by time blocks)
  - Payment method breakdown table
  - Void/refund summary
  - Cash drawer reconciliation table

### Banquet Cashier Report
- Table of payments/deposits received for events: event_name, client, deposit_amount, total_amount, balance, payment status
- Summary: total deposits collected, total outstanding

### Reservation Cashier Report
- Table from `payments` joined with reservations: reservation_code, guest, payment amount, method, date
- Summary: total collected, pending balance

**New files:**
- `src/components/front-desk/FrontDeskCashierReport.tsx`
- `src/components/reservations/ReservationCashierReport.tsx`
- `src/components/banquet/BanquetCashierReport.tsx`

**Modified files:**
- `src/components/front-desk/FrontDeskReportsTab.tsx` -- add Cashier Report section
- `src/components/reservations/ReservationReportsTab.tsx` -- add Cashier Report section
- `src/components/banquet/EventReportsPanel.tsx` -- add Cashier Report section
- `src/pages/POSReports.tsx` -- add Cashier Summary tab

---

## Part 3: Additional Report Functions (Non-Chart, Tabular)

Add these **table-based reports** (no dashboard/charts) to each module's reports tab:

### Front Desk
- **Room Occupancy Log**: Table of room-wise occupancy history (room, guest, check-in, check-out, nights, revenue)
- **Queue Performance Report**: Avg wait time, entries by priority, resolution rate

### Reservations  
- **No-Show Report**: Table of no-show reservations with guest details, room, revenue lost
- **Source Performance Report**: Table breakdown by booking source with count, revenue, avg stay

### Banquet
- **Event Profitability Report**: Table with event, revenue, catering cost, venue cost, net profit
- **Venue Utilization Report**: Venue-wise booking count, total hours, revenue

### POS
- **Item Sales Report**: Table of items sold, quantity, revenue, sorted by revenue
- **Server Performance Report**: Server-wise transactions, revenue, avg ticket size

**Implementation**: Add these as sub-sections within existing report tab components using collapsible `Card` sections with PDF/Excel export buttons.

---

## Part 4: Fix Attendance, Clock In/Out, Shift, Dine In/Out

### A. StaffClockPanel Issues
- The `staff_time_clock` table has `staff_id` column but `StaffClockPanel.tsx` uses `user_id` -- this mismatch means clock-in records silently fail or return empty. **Fix**: Change all `user_id` references to `staff_id` in StaffClockPanel.
- Add shift tracking: display shift start/end from `staff_schedules` for the current user alongside their clock entries.

### B. AttendanceTab Enhancement
- Currently queries via `useTimeClock` hook -- verify it uses correct column name (`staff_id` not `user_id`).
- Add export functionality (PDF/Excel) for attendance records.
- Add summary cards: on-time rate, late arrivals, early departures.

### C. POS Dine-In/Out Tracking
- Currently POS tables track `status` (vacant/occupied) but no dine-in vs takeaway/delivery distinction.
- Add `order_type` field support: When opening a table or creating an order, allow selecting "Dine In", "Takeaway", or "Delivery".
- Database migration: Add `order_type` column to `pos_orders` table (default: 'dine_in').
- Update POSTableSystem order flow to include order type selection.
- Show order type badge on active table cards.

**Files modified:**
- `src/components/pos/StaffClockPanel.tsx` -- fix `user_id` → `staff_id`
- `src/components/staff/AttendanceTab.tsx` -- add export, fix column
- `src/hooks/useHR.ts` -- verify `useTimeClock` column reference
- `src/components/pos/POSTableSystem.tsx` -- add order type selection
- `src/components/pos/OpenTableDialog.tsx` -- add order type field

**Database migration:**
```sql
ALTER TABLE public.pos_orders ADD COLUMN order_type text NOT NULL DEFAULT 'dine_in';
```

---

## Part 5: Security Hardening

### A. Route Protection
- `ProtectedRoute` currently bypasses ALL auth in DEV mode (`import.meta.env.DEV`). **Remove this bypass** -- it's a security hole if accidentally deployed.
- Add rate limiting awareness: show lockout message after failed login attempts.

### B. Admin/Dev Panel Access Control
- DevPanel already checks `useIsAdmin` and redirects non-admins. Verify AdminConsole does the same.
- Add IP-based access logging for admin actions via `audit_log`.

### C. Security Headers & CSP
- Create an edge function `security-headers` that returns security metadata.
- Add `Content-Security-Policy` meta tag in `index.html`.
- Add `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` meta tags.

### D. Input Sanitization
- Audit all user inputs (search fields, form inputs) for XSS potential -- React handles most via JSX escaping.
- Ensure no `dangerouslySetInnerHTML` usage.

### E. Session Security
- Auth context already uses `persistSession: true` and `autoRefreshToken: true` -- good.
- Add session timeout: auto-logout after configurable inactivity period (read from `settings` table).
- Add `SecurityCertificatePanel` component in AdminConsole showing: SSL status, last security scan date, auth configuration status, RLS policy coverage.

### F. Unauthorized Access Prevention
- Add a `SecurityScanReport` component that displays:
  - Tables with RLS enabled/disabled
  - Edge functions with JWT verification status
  - Open/closed ports summary
  - Last scan timestamp
- Integrate with existing `SecurityBreachPanel` in DevPanel.

**Files modified:**
- `src/components/layout/ProtectedRoute.tsx` -- remove DEV bypass
- `index.html` -- add security meta tags
- `src/contexts/AuthContext.tsx` -- add session timeout logic
- `src/pages/AdminConsole.tsx` -- add Security Certificate panel
- `src/pages/DevPanel.tsx` -- enhance SecurityBreachPanel

---

## Summary of All Changes

**Database Migration (1):**
- Add `order_type` column to `pos_orders`

**New Files (3):**
- `src/components/front-desk/FrontDeskCashierReport.tsx`
- `src/components/reservations/ReservationCashierReport.tsx`
- `src/components/banquet/BanquetCashierReport.tsx`

**Modified Files (~18):**
- Pages: FrontDesk, Reservations, Banquet, POSReports, NightAudit, StaffManagement, AdminConsole, DevPanel
- Components: FrontDeskReportsTab, ReservationReportsTab, EventReportsPanel, POSTableSystem, StaffClockPanel, AttendanceTab, OpenTableDialog, ProtectedRoute
- Core: AuthContext, index.html, reportExport.ts

