

# Add Core Report Templates to All Report Tabs

## Current State Summary
Each module has a reports tab, but most only show summary metrics and 1-2 charts. They lack the detailed, printable **report templates** that hotel managers actually use daily. Below are the specific tabular report templates to add per module.

## New Report Templates by Module

### Front Desk Reports Tab
Add 3 new collapsible report sections below existing content:
1. **Room Occupancy Log** — Table: Room#, Guest Name, Check-in, Check-out, Nights, Rate, Revenue (from `reservations` joined with `rooms` and `guests`)
2. **Queue Performance Report** — Table: Priority, Count, Avg Wait (minutes), Resolved count (from `front_desk_queue`)
3. **Daily Revenue Summary** — Table: Category (Room, F&B, Misc), Count, Total Amount (from `payments` grouped by date)

### Reservations Reports Tab
Add 3 new report sections:
1. **No-Show Report** — Table: Reservation Code, Guest, Room, Check-in Date, Revenue Lost (filter `status = 'no_show'` or `cancelled` with no actual check-in)
2. **Source Performance** — Table: Source, Booking Count, Total Revenue, Avg Stay Duration, Avg Rate
3. **Room Type Demand** — Table: Room Type, Booking Count, Occupancy %, Revenue (from `reservations` joined with `rooms`)

### Guest Reports Tab
Add 2 new report sections:
1. **Guest Retention Report** — Table: Guest, Total Visits, First Visit, Last Visit, Lifetime Value, VIP Status (sorted by visits desc)
2. **Communication Log Summary** — Table: Channel (email/sms/whatsapp), Sent Count, Direction breakdown (from `guest_communications` grouped by channel)

### Banquet Reports Tab
Add 2 new report sections:
1. **Event Profitability** — Table: Event Name, Client, Revenue, Catering Cost, Net Profit, Margin % (from `banquet_events` joined with `event_catering`)
2. **Venue Utilization** — Table: Venue Name, Events Count, Total Hours, Total Revenue (grouped by venue from `banquet_events`)

### POS Reports
Add 2 new report sections (in a new "Detailed" tab):
1. **Item Sales Report** — Table: Item Name, Category, Qty Sold, Revenue, Avg Price (from `pos_transactions.items` JSON aggregation)
2. **Server Performance** — Table: Server Name, Orders, Revenue, Avg Ticket Size (from `pos_orders` grouped by `server_name`)

### Housekeeping Reports Tab
Add 1 new report:
1. **Room Turnaround Report** — Table: Room#, Tasks Completed, Avg Score, Last Inspection Date (from `housekeeping_inspections`)

### Engineering Reports Tab
Add 1 new report:
1. **Asset Downtime Log** — Table: Room/Location, Issue, Priority, Created, Resolved, Downtime (hrs) (from `maintenance_requests` where completed)

### Inventory Reports Tab
Add 1 new report:
1. **Supplier Performance** — Table: Supplier, PO Count, Total Value, On-Time Deliveries, Pending POs (from `purchase_orders` joined with `suppliers`)

### HR Reports Tab
Add 2 new reports + PDF/Excel export buttons (currently missing):
1. **Payroll Summary** — Table: Staff, Department, Basic Salary, Allowances, Deductions, Net Pay, Status (from `payroll_records`)
2. **Leave Balance Report** — Table: Staff, Department, Leave Type, Days Taken, Balance (from `leave_requests`)
- Add PDF/Excel export buttons to the header

### Staff Analytics Tab
Add 1 new report:
1. **Overtime Report** — Table: Staff, Department, Regular Hours, Overtime Hours, Total Hours (from `staff_time_clock` calculations)

### Global Reports Page
Add 1 new tab:
1. **Financial Summary** tab — Table: Revenue (Rooms + POS + Banquet), Expenses, Net Profit, broken down by month (from `reservations`, `pos_transactions`, `expenses`)

## Implementation Pattern
Each new report section follows the same pattern:
- Wrapped in a `<Card>` with `<CardHeader>` title + individual PDF/Excel export buttons
- Data table using `<Table>` components
- `useMemo` for computation from already-fetched data (no new queries where possible)
- Empty state message when no data

## Files Modified (~12 files)
- `src/components/front-desk/FrontDeskReportsTab.tsx` — add 3 reports
- `src/components/reservations/ReservationReportsTab.tsx` — add 3 reports
- `src/components/guests/GuestReportsTab.tsx` — add 2 reports
- `src/components/banquet/EventReportsPanel.tsx` — add 2 reports
- `src/pages/POSReports.tsx` — add Detailed tab with 2 reports
- `src/components/housekeeping/ReportsTab.tsx` — add 1 report
- `src/components/engineering/ReportsTab.tsx` — add 1 report
- `src/components/inventory/ReportsTab.tsx` — add 1 report
- `src/components/hr/HRReportsTab.tsx` — add 2 reports + export buttons
- `src/components/staff/StaffAnalyticsTab.tsx` — add 1 report
- `src/pages/Reports.tsx` — add Financial Summary tab

