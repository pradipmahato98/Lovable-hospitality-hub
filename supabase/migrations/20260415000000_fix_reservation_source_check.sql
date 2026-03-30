-- Migration: 20260415000000_fix_reservation_source_check.sql
-- Description: Updates the reservations table source check constraint to include additional sources from the frontend

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_source_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_source_check
CHECK (source IN ('direct', 'online', 'agent', 'corporate', 'walk-in', 'booking.com', 'expedia', 'airbnb', 'phone', 'email', 'booking', 'walkin'));
