
# Housekeeping & Engineering Module — Full ERP Enhancement Plan

## Current State Analysis

**Housekeeping (3 tabs: Rooms, Tasks, Lost & Found):**
- Room status is simulated (hardcoded in lines 74-79), not persisted to database
- Tasks tab works but lacks staff assignment UI, date filtering, and edit/delete
- Lost & Found works but uses prompt() for claiming (poor UX)
- No Inspections tab (hook exists, UI missing)
- No Reports/Analytics tab
- No PDF/Excel export
- No ErrorBoundary wrapper

**Engineering (single table view):**
- Basic maintenance requests CRUD works
- No edit/delete request functionality
- No staff assignment dialog
- No preventive maintenance scheduling
- No asset/equipment tracking
- No work order categories (electrical, plumbing, HVAC)
- No reports tab
- Already has ErrorBoundary

## Database Changes Required

### New Table: `room_housekeeping_status`
Track real-time housekeeping status per room:
- id, room_id, status (clean/dirty/inspected/in_progress/out_of_order), assigned_to, priority, updated_by, updated_at

### New Table: `preventive_maintenance`
Schedule recurring maintenance:
- id, asset_name, location, maintenance_type, frequency (daily/weekly/monthly/quarterly/yearly), last_completed, next_due, assigned_to, status, notes, created_at

### New Table: `maintenance_parts`
Track parts/materials used per request:
- id, request_id, part_name, quantity, unit_cost, total_cost, supplier, created_at

## Implementation Plan

### Housekeeping Enhancements

**1. Add Room Status Persistence:**
- Create `room_housekeeping_status` table
- Update hook to read/write real status
- Remove hardcoded simulation

**2. Expand to 6 Tabs:**
- Rooms (enhanced — persisted status, bulk actions)
- Tasks (enhanced — date picker, staff assignment, edit dialog)
- Inspections (new — full CRUD from existing hook)
- Lost & Found (enhanced — proper claim dialog)
- Supplies (new — track cleaning supplies usage from inventory)
- Reports (new — efficiency metrics, cleaning times, export)

**3. Hook Updates (`useHousekeeping.ts`):**
- Add `useRoomHousekeepingStatus` for real-time room status
- Add `deleteTask`, `assignTask` mutations
- Add inspection CRUD mutations
- Add supplies tracking queries

### Engineering Enhancements

**1. Expand to 4 Tabs:**
- Requests (enhanced — edit dialog, assignment, categories)
- Preventive Maintenance (new — scheduling, recurring tasks)
- Assets (new — equipment registry with last maintenance date)
- Reports (new — completion rates, response times, costs)

**2. Hook Updates (`useMaintenanceRequests.ts`):**
- Add `updateRequest`, `deleteRequest`, `assignRequest` mutations
- Add work order category field
- Add estimated vs actual time tracking
- Add realtime subscription

**3. New Hooks:**
- `usePreventiveMaintenance` — schedule and track recurring tasks
- `useMaintenanceParts` — parts/materials per work order

### File Structure

**Housekeeping Components:**
- `src/components/housekeeping/RoomsTab.tsx`
- `src/components/housekeeping/TasksTab.tsx`
- `src/components/housekeeping/InspectionsTab.tsx`
- `src/components/housekeeping/LostFoundTab.tsx`
- `src/components/housekeeping/SuppliesTab.tsx`
- `src/components/housekeeping/ReportsTab.tsx`
- `src/components/housekeeping/index.ts`

**Engineering Components:**
- `src/components/engineering/RequestsTab.tsx`
- `src/components/engineering/PreventiveMaintenanceTab.tsx`
- `src/components/engineering/AssetsTab.tsx`
- `src/components/engineering/ReportsTab.tsx`
- `src/components/engineering/index.ts`

### Cross-Cutting
- ErrorBoundary on Housekeeping page
- formatCurrency() for any cost displays
- PDF/Excel export on reports tabs
- Realtime subscriptions on all new tables
- Staff assignment dialogs using staff_members table
