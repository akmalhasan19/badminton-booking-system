
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE ROLE KEY to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDb() {
    console.log('--- Debugging DB Access ---');

    // 1. Try to list operational_hours (often linked to venue)
    const { data: hours, error: hoursError } = await supabase.from('operational_hours').select('*').limit(1);
    if (hoursError) console.log('Error fetching operational_hours:', hoursError.message);
    else console.log('Found operational_hours:', hours);

    // 2. Try to list users (to see if we have access at all)
    const { data: users, error: userError } = await supabase.from('users').select('id, email').limit(2);
    if (userError) console.log('Error fetching users:', userError.message);
    else console.log('Found users:', users);

    // 3. Try to list bookings
    const { data: bookings, error: bookingError } = await supabase.from('bookings').select('*').limit(2);
    if (bookingError) console.log('Error fetching bookings:', bookingError.message);
    else console.log('Found bookings:', bookings);

    // 4. Try 'venues' again with error inspection
    const { data, error } = await supabase.from('venues').select('*');
    if (error) {
        console.log(`Failed 'venues': ${error.code} - ${error.message}`);
    } else {
        console.log('Success "venues":', data);
    }
}

debugDb();
