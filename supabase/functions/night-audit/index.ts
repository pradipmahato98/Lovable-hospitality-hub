import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get current business date
    const { data: settings, error: settingsError } = await supabaseClient
      .from('settings')
      .select('value')
      .eq('key', 'business_date')
      .single()

    if (settingsError) throw settingsError
    const businessDate = settings.value

    console.log(`Starting Automated Night Audit for ${businessDate}`)

    // 2. Post room charges via RPC
    const { data: postedStats, error: postError } = await supabaseClient.rpc('post_daily_room_charges', {
      v_business_date: businessDate
    })

    if (postError) throw postError
    const { posted_count, total_revenue } = postedStats[0]

    // 3. Calculate occupancy
    const { count: totalRooms } = await supabaseClient
      .from('rooms')
      .select('*', { count: 'exact', head: true })

    const { count: occupiedRooms } = await supabaseClient
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'checked-in')
      .lte('check_in_date', businessDate)
      .gt('check_out_date', businessDate)

    const occupancyRate = totalRooms ? (occupiedRooms / totalRooms) * 100 : 0

    // 4. Close the day and advance business date
    const nextDate = new Date(businessDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextDateStr = nextDate.toISOString().split('T')[0]

    await supabaseClient
      .from('settings')
      .update({ value: nextDateStr })
      .eq('key', 'business_date')

    // 5. Create Audit Log
    await supabaseClient
      .from('night_audit_logs')
      .insert([{
        business_date: businessDate,
        total_charges_posted: posted_count,
        total_room_revenue: total_revenue,
        occupancy_rate: occupancyRate,
        status: 'completed'
      }])

    // 6. Generate "Trial Balance" data (Aggregated report)
    // In a real implementation, this would generate a PDF/CSV and store in Storage
    console.log(`Night Audit Completed. Next date: ${nextDateStr}`)

    return new Response(
      JSON.stringify({ success: true, businessDate, nextDateStr, posted_count, total_revenue }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Night Audit Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
