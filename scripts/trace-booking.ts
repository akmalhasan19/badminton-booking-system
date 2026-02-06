
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

    // 2. Get Sub-Account from Venue
    let forUserId = undefined;
    if (booking.venue_id) {
        try {
            const venue = await smashApi.getVenueDetails(booking.venue_id);
            if (venue?.xendit_account_id) {
                forUserId = venue.xendit_account_id;
                console.log(`✅ Venue found. Sub-Account ID: ${forUserId}`);
            } else {
                console.log('⚠️ Venue found but NO Xendit Sub-Account ID.');
                console.log('Venue Data:', venue);
            }
        } catch (e) {
            console.error('❌ Failed to fetch venue:', e);
        }
    }

    // 3. Search Xendit
    console.log(`\nSearching Xendit...`);
    try {
        // Try Sub-Account
        if (forUserId) {
            console.log(`Checking Sub-Account: ${forUserId}`);
            const invoicesSub = await getInvoicesByExternalId(bookingId, forUserId);
            if (invoicesSub && invoicesSub.length > 0) {
                console.log('✅ FOUND in Sub-Account!');
                console.log('Invoice Status:', invoicesSub[0].status);
                console.log('Invoice ID:', invoicesSub[0].id);
                return;
            } else {
                console.log('❌ Not found in Sub-Account.');
            }
        }

        // Try Platform
        console.log(`Checking Platform Account...`);
        const invoicesPlat = await getInvoicesByExternalId(bookingId);
        if (invoicesPlat && invoicesPlat.length > 0) {
            console.log('✅ FOUND in Platform Account!');
            console.log('Invoice Status:', invoicesPlat[0].status);
            console.log('Invoice ID:', invoicesPlat[0].id);
        } else {
            console.log('❌ Not found in Platform Account either.');
        }

    } catch (e: any) {
        console.error('❌ Error querying Xendit:', e.message);
    }
}

main();
