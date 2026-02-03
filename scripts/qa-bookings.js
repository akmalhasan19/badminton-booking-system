const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const adminService = createClient(supabaseUrl, supabaseServiceKey);

async function createAuthUser(role = 'customer') {
    const randomId = Math.floor(Math.random() * 10000);
    const email = `qa_book_${role}_${randomId}@example.com`;
    const password = 'Password123!';

    const { data } = await adminService.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: `${role} User` }
    });
    if (role === 'admin') {
        await adminService.from('users').update({ role: 'admin' }).eq('id', data.user.id);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData } = await authClient.auth.signInWithPassword({ email, password });

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
    });

    return { user: data.user, client };
}

async function testBookings() {
    console.log('\n📅 Starting Booking Logic Test...');
    try {
        const customer = await createAuthUser('customer');
        const custB = await createAuthUser('customer'); // For overlap test
        const admin = await createAuthUser('admin');

        // 0. Setup Court
        const { data: court } = await admin.client
            .from('courts')
            .insert({ name: `Court Bookable ${Date.now()}`, is_active: true })
            .select()
            .single();
        console.log(`   ✅ Setup: Court Created (${court.id})`);

        const today = new Date().toISOString().split('T')[0];

        // 1. Standard Booking
        console.log('   🟢 Testing Standard Booking (10:00-11:00)...');
        const booking1Payload = {
            court_id: court.id,
            user_id: customer.user.id,
            booking_date: today,
            start_time: '10:00:00',
            end_time: '11:00:00',
            duration_hours: 1,
            total_price: 50000,
            status: 'pending'
        };

        const { data: b1, error: e1 } = await customer.client
            .from('bookings')
            .insert(booking1Payload)
            .select()
            .single();

        if (e1) throw new Error(`Standard booking failed: ${e1.message}`);
        console.log(`   ✅ Booking 1 Created (${b1.id})`);

        // 2. Overlap Test (10:30-11:30)
        console.log('   🔴 Testing Overlap Booking (10:30-11:30)...');
        const { error: e2 } = await custB.client
            .from('bookings')
            .insert({
                ...booking1Payload,
                user_id: custB.user.id,
                start_time: '10:30:00',
                end_time: '11:30:00'
            });

        if (e2 && (e2.message.includes('conflicts with existing key') || e2.code === '23P01')) {
            console.log(`   ✅ Overlap Blocked: ${e2.message}`);
        } else if (e2) {
            throw new Error(`Overlap Failed with unexpected error: ${e2.message}`);
        } else {
            console.error('   ❌ FAIL: Overlap Succeeded! Database constraint is missing.');
        }

        // 3. Double Booking Same Slot
        console.log('   🔴 Testing Exact Duplicate Booking...');
        const { error: e3 } = await custB.client
            .from('bookings')
            .insert({
                ...booking1Payload,
                user_id: custB.user.id
            });

        if (e3) {
            console.log(`   ✅ Duplicate Blocked: ${e3.message}`);
        } else {
            console.error('   ❌ FAIL: Duplicate Booking Succeeded! Unique constraint is missing.');
        }

        // 4. Cancellation (Pending)
        console.log('   🗑️  Testing Cancellation (Pending)...');
        const { error: cancelError } = await customer.client
            .from('bookings')
            .delete()
            .eq('id', b1.id);

        if (cancelError) throw new Error(`Cancellation failed: ${cancelError.message}`);

        // Verify deleted
        const { data: checkDeleted } = await customer.client.from('bookings').select('*').eq('id', b1.id).maybeSingle();
        if (!checkDeleted) {
            console.log('   ✅ Booking Deleted (Cancelled).');
        } else {
            throw new Error('Booking still exists after delete!');
        }

        // 5. Confirmed Booking Cancellation (Should Fail)
        console.log('   🔒 Testing Confirmed Booking Cancellation...');
        // Create new booking
        const { data: b2 } = await customer.client
            .from('bookings')
            .insert({ ...booking1Payload, start_time: '12:00:00', end_time: '13:00:00' })
            .select().single();

        // Admin confirms it
        await admin.client.from('bookings').update({ status: 'confirmed' }).eq('id', b2.id);

        // User tries to delete
        const { error: deleteConfirmedError } = await customer.client.from('bookings').delete().eq('id', b2.id);

        const { data: checkConfirmed } = await admin.client.from('bookings').select('*').eq('id', b2.id).maybeSingle();
        if (checkConfirmed) {
            console.log('   ✅ Confirmed Booking Persists (User cannot delete).');
        } else {
            throw new Error('User was able to DELETE a Confirmed booking!');
        }

        // 6. Admin Override
        console.log('   ⚡ Testing Admin Override (Delete Confirmed)...');
        const { error: adminDelError } = await admin.client.from('bookings').delete().eq('id', b2.id);

        if (adminDelError) throw new Error(`Admin delete failed: ${adminDelError.message}`);

        const { data: checkFinal } = await admin.client.from('bookings').select('*').eq('id', b2.id).maybeSingle();
        if (!checkFinal) {
            console.log('   ✅ Admin successfully deleted confirmed booking.');
        } else {
            throw new Error('Admin delete did not remove the row.');
        }

        console.log('\n✨ Booking Logic Test Finished.');

    } catch (err) {
        console.error('❌ Booking Test Crashed:', err.message);
        process.exit(1);
    }
}

testBookings();
