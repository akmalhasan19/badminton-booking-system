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

// Client for Admin actions (User creation)
const adminLegacyClient = createClient(supabaseUrl, supabaseServiceKey);

// Helper to create a user and return their client
async function createTestUser(nameSuffix) {
    const email = `qa_rls_${Date.now()}_${nameSuffix}@example.com`;
    const password = 'Password123!';

    // 1. Create Confirmed User via Admin API
    const { data, error } = await adminLegacyClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `RLS User ${nameSuffix}` }
    });

    if (error || !data.user) {
        throw new Error(`Failed to create user ${nameSuffix}: ${error?.message}`);
    }

    // 2. Sign In to get Session (as the User)
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password
    });

    if (signInError || !signInData.session) {
        throw new Error(`SignIn failed for ${nameSuffix}: ${signInError?.message}`);
    }

    // 3. Return client authenticated as this user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } }
    });

    return { user: data.user, client: userClient };
}

async function testRLS() {
    console.log('\n🔐 Starting RLS (Profile Access) Test...');

    try {
        // 1. Create two users
        console.log('   Creating User A...');
        const userA = await createTestUser('A');
        console.log(`   ✅ User A created (${userA.user.id})`);

        console.log('   Creating User B...');
        const userB = await createTestUser('B');
        console.log(`   ✅ User B created (${userB.user.id})`);

        // Wait for triggers to populate public.users
        await new Promise(r => setTimeout(r, 2000));

        // 2. Test: User A tries to view User B
        console.log('   🕵️  User A attempting to read User B profile...');
        const { data: dataB, error: errorB } = await userA.client
            .from('users')
            .select('*')
            .eq('id', userB.user.id);

        // NOTE: Supabase RLS usually returns empty array [] for SELECT violations, NOT an error, 
        // unless using .single() which errors on 0 rows. 
        // We expect [] or error.

        if (errorB) {
            console.log(`   ✅ Query returned error (Access Denied): ${errorB.message}`);
        } else if (dataB && dataB.length === 0) {
            console.log(`   ✅ Query returned 0 rows (RLS Filtered Successfully).`);
        } else {
            console.error(`   ❌ FAIL: User A could see User B data:`, dataB);
            process.exit(1);
        }

        // 3. Test: User A tries to view Own Profile
        console.log('   👤 User A attempting to read OWN profile...');
        const { data: dataA, error: errorA } = await userA.client
            .from('users')
            .select('*')
            .eq('id', userA.user.id);

        if (errorA) {
            console.error(`   ❌ FAIL: User A could NOT see own data: ${errorA.message}`);
            process.exit(1);
        } else if (dataA && dataA.length === 1) {
            console.log(`   ✅ Query returned 1 row (Access Granted to Self).`);
        } else {
            console.error(`   ❌ FAIL: User A own data query returned unexpected count: ${dataA?.length}`);
            process.exit(1);
        }

        console.log('\n✨ RLS Test Passed: Users can only see their own profiles.');

    } catch (err) {
        console.error('❌ RLS Test Failed with Exception:', err);
        process.exit(1);
    }
}

testRLS();
