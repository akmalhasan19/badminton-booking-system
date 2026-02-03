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
    const email = `qa_new_${role}_${randomId}@example.com`;
    const password = 'Password123!';

    // Create User
    const { data, error } = await adminService.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `${role} User` }
    });
    if (error) throw error;

    // Set Role if admin
    if (role === 'admin') {
        await adminService.from('users').update({ role: 'admin' }).eq('id', data.user.id);
    }

    // Sign In
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData } = await authClient.auth.signInWithPassword({ email, password });

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
    });

    return { user: data.user, client };
}

async function testCourts() {
    console.log('\n🏟️  Starting Courts Test (No Venues Table)...');

    try {
        const customer = await createAuthUser('customer');
        const admin = await createAuthUser('admin');

        // 1. Unauthorized Creation
        console.log('   🛑 Testing Unauthorized Creation (Customer)...');
        const { error: createError } = await customer.client
            .from('courts')
            .insert({
                name: 'Hacker Court',
                description: 'Should fail',
                is_active: true
            });

        // RLS Policy: Admins can insert courts.
        // So customer insert should fail.

        if (createError) {
            console.log(`   ✅ Blocked as expected: ${createError.message}`);
        } else {
            throw new Error('Customer was able to create a Court!');
        }

        // 2. Admin Creation
        console.log('   ✅ Testing Admin Creation...');
        const courtName = `QA Court ${Date.now()}`;
        const { data: court, error: adminCreateError } = await admin.client
            .from('courts')
            .insert({
                name: courtName,
                description: 'Test Court',
                is_active: true,
                // image_url is optional
            })
            .select()
            .single();

        if (adminCreateError) throw new Error(`Admin failed to create court: ${adminCreateError.message}`);
        console.log(`   ✅ Court Created: ${court.name} (${court.id})`);

        // 3. Visibility Test
        console.log('   👁️  Testing Court Visibility...');

        // Check Public Visibility (Active)
        const { data: visibleCourt } = await customer.client.from('courts').select('*').eq('id', court.id).single();
        if (!visibleCourt) throw new Error('Active court not visible to customer');
        console.log('   ✅ Active court visible to customer.');

        // Set Inactive
        console.log('   🔒 Setting Court to Inactive...');
        const { error: updateError } = await admin.client
            .from('courts')
            .update({ is_active: false })
            .eq('id', court.id);

        if (updateError) throw new Error(`Admin failed to update court: ${updateError.message}`);

        // Check Public Visibility (Inactive)
        const { data: hiddenCourt, error: hiddenError } = await customer.client.from('courts').select('*').eq('id', court.id).single();

        // RLS "Anyone can view active courts" (is_active = true OR is_admin())
        // So customer should NOT get data.
        if (hiddenError || !hiddenCourt) {
            console.log('   ✅ Inactive court HIDDEN from customer.');
        } else {
            throw new Error('Inactive court STILL visible to customer!');
        }

        // Check Admin Visibility (Inactive)
        const { data: adminSee } = await admin.client.from('courts').select('*').eq('id', court.id).single();
        if (adminSee) {
            console.log('   ✅ Inactive court VISIBLE to admin.');
        } else {
            throw new Error('Admin lost access to their own inactive court!');
        }

        console.log('\n✨ Courts Test Passed.');

    } catch (err) {
        console.error('❌ Courts Test Failed:', err.message);
        process.exit(1);
    }
}

testCourts();
