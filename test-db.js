
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing all tables in public schema...');

    // Supabase JS doesn't support querying information_schema easily via .from() due to permissions usually.
    // But we can try RPC if exists, or just guess common names.
    // OR, better: The Service Role should be able to query checking if we can just try to hit `bookings` or `courts`.

    // Let's try to infer from "courts".
    const { data: courts, error: courtError } = await supabase.from('courts').select('*').limit(1);
    if (courtError) console.log('Courts error:', courtError.message);
    else console.log('Found "courts" table');

    // Let's try querying a known system table or just blindly listing standard ones?
    // Actually, let's try to query specific likely names:
    const candidates = ['venues', 'venue', 'halls', 'hall', 'centers', 'gyms', 'field_centers', 'fields'];

    for (const name of candidates) {
        const { error } = await supabase.from(name).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`✅ FOUND TABLE: "${name}"`);
        } else {
            // console.log(`   ${name}: ${error.message}`);
        }
    }
}

listTables();
