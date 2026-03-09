

# Comprehensive ERP Enhancement Plan — 11 Modules

## Modules & Gaps Summary

### 1. POS Terminal
- `$` on line 209 (Night Audit revenue display reuses `$` — line 209, 264)
- No menu item CRUD from terminal (must go elsewhere)
- No void/refund transaction capability
- No daily cash drawer reconciliation
- Order tab cart doesn't persist to DB until checkout
- No KOT (Kitchen Order Ticket) print action

### 2. Channel Manager
- Single flat page, no tabs — needs Rate Calendar, Sync Logs, Reports tabs
- Settings button on each channel is non-functional (line 177)
- No "Add Channel" dialog
- Commission rate edit is not wired
- No rate parity alerts or overbooking detection
- "Avg. Sync Time" is hardcoded "8 min" (line 98)

### 3. Banquet
- Already robust (842 lines, drag calendar, catering, venue, reports)
- Minor: needs ErrorBoundary wrapper
- No invoice generation from event
- No event staff assignment from Banquet page (panel exists but may not be wired to directory)

### 4. Night Audit
- `$` hardcoded on lines 209, 264 instead of `formatCurrency()`
- "Last Audit: Dec 19, 2024" is hardcoded (line 100) — should read from `night_audit_logs`
- Occupancy calculation uses hardcoded 50 rooms (line 70) — should use actual room count
- No ErrorBoundary wrapper
- "Manage" button on pending arrivals is non-functional (line 150)
- No audit history log viewer

### 5. Day Close
- Activity history is hardcoded mock data with `$` signs (lines 178-198)
- "+5.2% from yesterday" and "+2.1% from target" are hardcoded (lines 123, 138)
- No actual day-close persistence (just sets local `isClosed` state, line 27)
- Missing: payment method breakdown, expense deductions, net profit calculation

### 6. User Management
- Functional but minimal — only 2 tabs (Users, Audit)
- No bulk role assignment
- No user activity summary (last login, session count)
- No export users list

### 7. Staff Management
- Only 3 tabs (Directory, About Staff, Logs Report)
- No shift scheduling tab
- No attendance tracking view
- No document management for staff (contracts, certificates)

### 8. HR
- 3 tabs (Employees, Payroll, Leave) — solid base
- "Add Employee" button opens Guest dialog (wrong, line 94)
- "Schedule Shifts" and "Performance Reviews" buttons non-functional (lines 98, 107)
- No training/certification tracker
- No HR reports/analytics tab
- No employee document management

### 9. Settings
- Already comprehensive (10 settings categories)
- No import/export settings functionality
- No room type/rate configuration directly from settings

### 10. Admin Console
- 8 tabs, comprehensive
- Security policies are static badges, not editable (lines 434, 441, 448)
- Account provisioning uses `crypto.randomUUID()` as fake user_id (line 179) — won't map to real auth
- No system health dashboard with actual DB metrics

### 11. Dev Panel
- System status uses hardcoded latencies (lines 157-162)
- Recent logs are hardcoded (lines 164-170)
- Email config is local state only, not persisted (wait — memory says it IS persisted, but code shows useState)

---

## Implementation Plan

### Phase 1: Critical Bug Fixes (All Modules)

**Currency & Hardcoded Data:**
- Night Audit: Replace `$` with `formatCurrency()` on lines 209, 264
- Day Close: Replace hardcoded activity history (lines 178-198) with data from `night_audit_logs` table
- Day Close: Replace hardcoded percentage strings with calculated values
- Night Audit: Replace "Last Audit: Dec 19, 2024" with query to latest `night_audit_logs` entry
- Night Audit: Replace hardcoded 50 rooms with actual room count query
- Channel Manager: Replace hardcoded "8 min" with calculated avg sync time

**Non-functional Buttons:**
- HR: Fix "Add Employee" to open staff creation dialog instead of guest dialog
- HR: Wire "Schedule Shifts" to navigate to Staff Management
- Night Audit: Wire "Manage" button to navigate to reservations

### Phase 2: Channel Manager Enhancement

**Add 3 tabs:**
- **Channels** (existing grid, enhanced with Add Channel dialog + commission edit)
- **Rate Calendar** (uses existing `useRateAvailability` hook — room/date grid showing rates)
- **Sync Logs** (reads from `ota_sync_logs` table with filters)
- **Reports** (channel performance: bookings by source, commission costs, revenue by channel)

### Phase 3: Night Audit & Day Close

**Night Audit:**
- Add ErrorBoundary wrapper
- Add audit history tab showing past `night_audit_logs` entries
- Wire "Manage" button to link to reservation edit
- Use dynamic room count from rooms table

**Day Close:**
- Persist day-close to `night_audit_logs` with full revenue breakdown
- Replace mock activity history with real DB query
- Add payment method breakdown section (cash/card/digital from `pos_transactions` + `payments`)
- Add expense deduction section
- Calculate actual net profit (revenue - expenses)
- Add export daily summary as PDF

### Phase 4: HR & Staff Management

**HR Module — Add 2 tabs:**
- **Reports** tab: headcount by department chart, payroll summary, leave statistics, turnover rate
- **Training** tab: track certifications and training programs per employee (uses notes field or new lightweight approach)
- Fix "Add Employee" to navigate to `/staff?tab=directory` with add action
- Fix "Schedule Shifts" to navigate to staff scheduling

**Staff Management — Add 2 tabs:**
- **Schedules** tab: weekly shift calendar view reading from `staff_schedules` table with create/edit shift dialog
- **Attendance** tab: daily clock-in/out records from `staff_time_clock` with summary metrics

### Phase 5: User Management Enhancement

- Add **Activity** tab: show last login time, session count (from profiles.updated_at)
- Add export users list to Excel
- Add bulk role assignment checkbox UI

### Phase 6: Admin Console & Dev Panel

**Admin Console:**
- Make security policies editable (toggle switches persisted to settings table)
- Fix account provisioning warning (clarify it creates a pre-provisioned profile)
- Add system metrics card (total rooms, reservations, revenue from reportStats)

**Dev Panel:**
- Replace hardcoded system status with actual Supabase health check (ping tables)
- Replace hardcoded logs with real `audit_log` table entries
- Persist email config to settings table (key: `email_config`)

### Phase 7: POS Terminal Enhancement

- Add **Void/Refund** action on completed transactions (POSHistory page + new mutation)
- Add daily cash drawer reconciliation section on POS Dashboard
- No new DB tables needed — uses existing `pos_transactions`

### Phase 8: Banquet & Settings

**Banquet:**
- Add ErrorBoundary wrapper
- Add "Generate Invoice" button on confirmed events (creates entry in `invoices` table)

**Settings:**
- Add "Export Settings" / "Import Settings" buttons (JSON export/import of all settings keys)

---

## File Changes Summary

### Modified Files (~20):
- `src/pages/NightAudit.tsx` — fix currency, dynamic room count, ErrorBoundary, audit history, manage button
- `src/pages/DayClose.tsx` — persist close, real history, payment breakdown, expenses, PDF export
- `src/pages/ChannelManager.tsx` — refactor to tabbed layout (Channels, Rate Calendar, Sync Logs, Reports)
- `src/pages/HR.tsx` — fix buttons, add Reports + Training tabs
- `src/pages/StaffManagement.tsx` — add Schedules + Attendance tabs
- `src/pages/UserManagement.tsx` — add Activity tab, export, bulk role
- `src/pages/AdminConsole.tsx` — editable security policies, fix provisioning, system metrics
- `src/pages/DevPanel.tsx` — real status checks, real logs, persist email config
- `src/pages/Banquet.tsx` — ErrorBoundary, invoice generation
- `src/pages/POSTerminal.tsx` — void/refund capability
- `src/pages/POSHistory.tsx` — void/refund action on transactions
- `src/pages/POS.tsx` — cash drawer reconciliation
- `src/pages/Settings.tsx` — export/import settings
- `src/hooks/useNightAudit.ts` — add audit history query, dynamic room count
- `src/hooks/useChannelManager.ts` — add sync logs query
- `src/hooks/useStaffMembers.ts` — add schedule CRUD mutations
- `src/hooks/useHR.ts` — add HR reports queries

### New Files (~5):
- `src/components/staff/SchedulesTab.tsx` — weekly shift calendar
- `src/components/staff/AttendanceTab.tsx` — clock records view
- `src/components/hr/HRReportsTab.tsx` — HR analytics
- `src/components/pos/CashDrawerPanel.tsx` — reconciliation UI
- `src/components/channel-manager/SyncLogsPanel.tsx` — OTA sync log viewer

### No new database tables needed
All existing tables cover the required functionality.

