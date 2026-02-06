
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Imports MUST be after dotenv config for them to pick up process.env values immediately 
// (though for modules it depends on when they read env, but let's be safe)
// Actually, standard ES imports are hoisted. We should use dynamic imports or require for this script to work perfectly with dotenv in a single file, OR run node -r dotenv/config.
// But since we are using tsx, let's just use dynamic imports.

async function main() {
    console.log('--- Starting Trace ---');
    console.log('SMASH_API_URL:', process.env.NEXT_PUBLIC_SMASH_API_BASE_URL);

    const { createClient } = await import('@supabase/supabase-js');
    const { getInvoicesByExternalId } = await import('../src/lib/xendit/client');
    const { smashApi } = await import('../src/lib/smash-api');

    // Setup minimal supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase Env Vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const bookingId = "ef2fbd27-b352-4508-a5f2-c60868f570f2";
    console.log(`Checking Booking ID: ${bookingId}...`);

    // 1. Get Venue ID from Booking
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('venue_id, status')
        .eq('id', bookingId)
        .single();

    if (error || !booking) {
        console.error('❌ Booking not found in Database:', error);
        return;
    }
    console.log(`✅ Booking found. Venue ID: ${booking.venue_id}`);

    // 2. Search Xendit (Platform Account Only)
    console.log(`\nSearching Xendit Platform Account...`);
    try {
        const invoices = await getInvoicesByExternalId(bookingId);
        if (invoices && invoices.length > 0) {
            console.log('✅ FOUND in Platform Account!');
            console.log('Invoice Status:', invoices[0].status);
            console.log('Invoice ID:', invoices[0].id);
            console.log('Amount:', invoices[0].amount);
        } else {
            console.log('❌ Not found in Platform Account.');
        }

    } catch (e: any) {
        console.error('❌ Error querying Xendit:', e.message);
    }
}

main();
