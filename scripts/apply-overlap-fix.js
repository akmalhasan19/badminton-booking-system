const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function applyOverlapConstraint() {
    console.log('🛠️  Applying Overlap Constraint Migration...');

    try {
        // 1. Enable btree_gist extension
        console.log('   Enabling btree_gist extension...');
        const { error: extError } = await adminClient.rpc('execute_sql', {
            sql: 'CREATE EXTENSION IF NOT EXISTS btree_gist;'
        });

        // If RPC doesn't exist, we'll try direct approach via fetch
        if (extError && extError.message.includes('function')) {
            console.log('   RPC not available, trying REST API...');

            // Use direct PostgreSQL REST API (requires service role)
            const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({})
            });

            // This won't work either - we need the Supabase Dashboard or CLI
            throw new Error('Direct SQL execution via JS client is not supported. Use Supabase Dashboard SQL Editor.');
        }

        if (extError) throw new Error(`Extension error: ${extError.message}`);
        console.log('   ✅ Extension enabled.');

        // 2. Add exclusion constraint
        console.log('   Adding exclusion constraint...');
        const { error: constraintError } = await adminClient.rpc('execute_sql', {
            sql: `
        ALTER TABLE public.bookings
        ADD CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
          court_id WITH =,
          tsrange(booking_date + start_time, booking_date + end_time) WITH &&
        );
      `
        });

        if (constraintError) throw new Error(`Constraint error: ${constraintError.message}`);
        console.log('   ✅ Constraint added.');

        console.log('\n✨ Migration Applied Successfully!');

    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        console.log('\n📋 MANUAL FIX REQUIRED:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run this SQL:\n');
        console.log('-- Enable extension');
        console.log('CREATE EXTENSION IF NOT EXISTS btree_gist;');
        console.log('');
        console.log('-- Add constraint');
        console.log('ALTER TABLE public.bookings');
        console.log('ADD CONSTRAINT no_overlapping_bookings');
        console.log('EXCLUDE USING gist (');
        console.log('  court_id WITH =,');
        console.log('  tsrange(booking_date + start_time, booking_date + end_time) WITH &&');
        console.log(');');
        process.exit(1);
    }
}

applyOverlapConstraint();
