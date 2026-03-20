-- Atomic Room Allocation RPC
CREATE OR REPLACE FUNCTION public.allocate_room_atomically(
  p_guest_id UUID,
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_adults INTEGER,
  p_children INTEGER,
  p_total_amount DECIMAL,
  p_special_requests TEXT,
  p_source TEXT,
  p_reservation_code TEXT
) RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_room_status TEXT;
BEGIN
  -- 1. Lock the room row to prevent concurrent updates
  SELECT status INTO v_room_status
  FROM public.rooms
  WHERE id = p_room_id
  FOR UPDATE;

  -- 2. Check if the room is still available for the requested dates
  -- This is a simplified check; in a full PMS it would check rate_availability table
  -- For now we check if any overlapping reservation exists
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE room_id = p_room_id
    AND status NOT IN ('cancelled', 'checked_out')
    AND (
      (check_in_date <= p_check_in AND check_out_date > p_check_in) OR
      (check_in_date < p_check_out AND check_out_date >= p_check_out) OR
      (p_check_in <= check_in_date AND p_check_out > check_in_date)
    )
  ) THEN
    RAISE EXCEPTION 'Room is already booked for these dates';
  END IF;

  -- 3. Insert the reservation
  INSERT INTO public.reservations (
    guest_id,
    room_id,
    check_in_date,
    check_out_date,
    status,
    adults,
    children,
    total_amount,
    special_requests,
    source,
    reservation_code
  ) VALUES (
    p_guest_id,
    p_room_id,
    p_check_in,
    p_check_out,
    'confirmed',
    p_adults,
    p_children,
    p_total_amount,
    p_special_requests,
    p_source,
    p_reservation_code
  ) RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
