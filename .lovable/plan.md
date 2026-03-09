

# Guest, Reservation & Front Desk — Deep Enhancement Plan

## Current Gaps Identified

**Reservations:**
- `$` hardcoded on line 171 instead of `formatCurrency()`
- Calendar dates disabled for future (`date > new Date()`) — blocks future bookings
- No edit/cancel reservation actions
- No reservation detail/summary view
- No "no-show" status handling
- No payment status column in list
- No export (PDF/Excel)

**Guests:**
- No guest preferences UI tab (hook exists but no tab)
- No communication log tab (hook exists but no tab)
- No bulk delete/export
- Feedback tab has no "respond" dialog (only resolve button)
- Loyalty tab has no "add points" or "redeem" actions (hooks exist)

**Front Desk:**
- Folio hook still returns hardcoded fallback data on error (lines 63-68, 86-91)
- Billing tab search/filter/export buttons are non-functional
- No room status filter on Rooms tab
- No "create folio" button/dialog
- Wake-up call date picker restricted to past dates (line 114)

## Implementation Plan

### 1. Fix Critical Bugs
- Remove future-date restrictions on NewReservationDialog, CheckInOutDialog, and WakeUpCallScheduler calendars
- Replace `$` with `formatCurrency()` in Reservations list
- Remove hardcoded fallback mock data from `useGuestFolios`

### 2. Reservation Enhancements
- **Edit Reservation Dialog**: Modify dates, room, guest count, special requests, source
- **Cancel/No-Show Actions**: Add dropdown items for cancel + no-show with confirmation
- **Payment Status Column**: Show payment_status badge in list view
- **Reservation Detail Panel**: Side panel showing full reservation info when clicked (guest details, room, dates, payment breakdown, folio link)
- **Export**: Add Excel/PDF export button using existing `reportExport` utility

### 3. Guest Module Enhancements
- **Preferences Tab** (new): Uses existing `useGuestPreferences` hook — UI for room temp, pillow type, dietary, floor preference with inline editing
- **Communications Tab** (new): Uses existing `useGuestCommunications` — log of emails/calls/SMS with "Log Communication" dialog
- **Feedback Response Dialog**: Add dialog to write response text (uses existing `respondToFeedback` mutation)
- **Loyalty Actions**: Add "Add Points" and "Redeem Points" dialogs on loyalty table rows (hooks already exist)
- **Export Guest List**: Excel export button on guests tab

### 4. Front Desk Enhancements
- **Room Status Filter**: Add status filter dropdown on Rooms tab (available/occupied/cleaning/maintenance)
- **Create Folio Dialog**: Button + dialog to create new folio linked to guest/reservation
- **Billing Functional Search**: Wire up search input to filter invoices by number/guest name
- **Billing Export**: Wire up export button to download invoices as Excel
- **Billing Status Filter**: Wire up filter button as a status select

### 5. Hook Updates
- `useReservations.ts`: Add `updateReservation`, `cancelReservation`, `markNoShow` mutations; expand select to include `payment_status`, `adults`, `children`, `source`, `special_requests`
- `useGuestFolios.ts`: Remove hardcoded fallback data, return empty arrays on error
- No new database tables needed — all existing tables and hooks cover this

### File Changes
- **Modified**: `src/hooks/useReservations.ts` (add mutations + expand fields)
- **Modified**: `src/hooks/useGuestFolios.ts` (remove mock fallbacks)
- **Modified**: `src/pages/Reservations.tsx` (edit/cancel actions, payment column, detail panel, export, no-show)
- **Modified**: `src/pages/Guests.tsx` (add Preferences + Communications tabs, feedback response, loyalty actions, export)
- **Modified**: `src/pages/FrontDesk.tsx` (room filter, folio creation, billing search/filter/export)
- **Modified**: `src/components/reservations/NewReservationDialog.tsx` (fix date restriction)
- **Modified**: `src/components/reservations/CheckInOutDialog.tsx` (fix date restriction)
- **Modified**: `src/components/front-desk/WakeUpCallScheduler.tsx` (fix date restriction)
- **New**: `src/components/reservations/EditReservationDialog.tsx`
- **New**: `src/components/reservations/ReservationDetailPanel.tsx`
- **New**: `src/components/guests/GuestPreferencesTab.tsx`
- **New**: `src/components/guests/GuestCommunicationsTab.tsx`
- **New**: `src/components/guests/FeedbackResponseDialog.tsx`
- **New**: `src/components/guests/LoyaltyActionsDialog.tsx`

