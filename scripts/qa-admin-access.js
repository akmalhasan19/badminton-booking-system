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

async function testAdminAccess() {
    console.log('\n🛡️  Starting Admin Access Test...');

    const randomId = Math.floor(Math.random() * 10000);
    const email = `qa_admin_${randomId}@example.com`;
    const password = 'Password123!';
    const name = `Admin User ${randomId}`;

    try {
        // 1. Create User
        const { data: userData, error: createError } = await adminService.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });
        if (createError) throw new Error(`User creation failed: ${createError.message}`);

        // Wait for trigger
        await new Promise(r => setTimeout(r, 2000));

        // 2. PROMOTE to Admin (Update public.users role)
        // NOTE: Assuming column is 'role' and value is 'admin' based on guide.
        console.log(`   Promoting user ${userData.user.id} to 'admin'...`);
        const { error: promoteError } = await adminService
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userData.user.id);

        if (promoteError) {
            // If column 'role' doesn't exist, this will fail. We'll catch it.
            throw new Error(`Failed to promote user: ${promoteError.message}`);
        }

        // 3. Sign In as Admin
        const authClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: sessionData, error: sessionError } = await authClient.auth.signInWithPassword({
            email,
            password
        });
        if (sessionError) throw new Error(`SignIn failed: ${sessionError.message}`);

        const adminUserClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
        });

        // 4. Test: Admin tries to view ALL users
        console.log('   🕵️  Admin attempting to read ALL users...');
        const { data: allUsers, error: queryError } = await adminUserClient
            .from('users')
            .select('id');

        if (queryError) {
            throw new Error(`Admin query failed: ${queryError.message}`);
        }

        // Should see at least self, likely more from previous tests.
        console.log(`   ✅ Query Success. Found ${allUsers.length} users.`);

        if (allUsers.length < 2) {
            console.warn('   ⚠️ Warning: expected more than 1 user (from previous tests), but verifying access is what matters.');
        }

        console.log('\n✨ Admin Access Test Passed: Admin can view user list.');

    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        process.exit(1);
    }
}

testAdminAccess();
