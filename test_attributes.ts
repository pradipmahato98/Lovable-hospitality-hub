import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rhajtijfptfnezeetcvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYWp0aWpmcHRmbmV6ZWV0Y3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTM1MzUsImV4cCI6MjA4MTg4OTUzNX0.TetJeoWu6YMhQse9VmMAzgY_oxJcx9u4_3LgNZJ0N2g'
)

async function test() {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{ name: 'Test Item', attributes: { color: 'red' } }])
    .select()

  if (error) {
    console.error('Error:', error.message)
    if (error.message.includes('attributes')) {
      console.log('CONFIRMED: attributes column missing in DB')
    }
  } else {
    console.log('Success:', data)
  }
}

test()
