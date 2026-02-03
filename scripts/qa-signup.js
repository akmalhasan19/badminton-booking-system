const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Check .env.local');
    process.exit(1);
}

// Client for Signup (Anon)
const authClient = createClient(supabaseUrl, supabaseAnonKey);

// Client for Verification (Service Role - Admin)
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testSignUp() {
    const randomId = Math.floor(Math.random() * 10000);
    const testEmail = `qa_test_${randomId}@example.com`;
    const testPassword = 'Password123!';
    const testName = `QA User ${randomId}`;

    console.log(`\n🚀 Starting Sign Up Test...`);
    console.log(`📧 Testing with email: ${testEmail}`);

    // 1. Sign Up
    const { data: authData, error: authError } = await authClient.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: {
                full_name: testName,
            },
        },
    });

    if (authError) {
        console.error(`❌ Sign Up Failed: ${authError.message}`);
        process.exit(1);
    }

    const userId = authData.user?.id;
    if (!userId) {
        console.error('❌ Sign Up succeeded but no User ID returned.');
        process.exit(1);
    }

    console.log(`✅ Auth Sign Up Successful (User ID: ${userId})`);

    // 2. Wait for Trigger
    console.log('⏳ Waiting 2 seconds for DB trigger...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Verify public.users
    const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error(`❌ DB Verification Failed: ${userError.message}`);
        console.error('   The database trigger might be missing or failed.');
        process.exit(1);
    }

    if (userData) {
        console.log(`✅ Public User Row Found!`);
        console.log(`   - ID: ${userData.id}`);
        console.log(`   - Name: ${userData.full_name}`);
        console.log(`   - Email: ${userData.email}`);

        // Verify Data Match
        if (userData.email === testEmail && userData.full_name === testName) {
            console.log('✅ Data Integrity Check Passed');
        } else {
            console.warn('⚠️ Data Mismatch: Email or Name does not match input.');
        }
    } else {
        console.error('❌ Row not found in public.users table.');
        process.exit(1);
    }
}

testSignUp();
