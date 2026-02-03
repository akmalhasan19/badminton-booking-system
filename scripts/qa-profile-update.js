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

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testProfileUpdate() {
    console.log('\n📝 Starting Profile Update Test...');

    const randomId = Math.floor(Math.random() * 10000);
    const email = `qa_upd_${randomId}@example.com`;
    const password = 'Password123!';
    const initialName = `User ${randomId}`;
    const newName = `User ${randomId} Updated`;

    try {
        // 1. Create User
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: initialName }
        });
        if (createError) throw new Error(`User creation failed: ${createError.message}`);

        // Wait for trigger
        await new Promise(r => setTimeout(r, 2000));

        // 2. Sign In
        const authClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: sessionData, error: sessionError } = await authClient.auth.signInWithPassword({
            email,
            password
        });
        if (sessionError) throw new Error(`SignIn failed: ${sessionError.message}`);

        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
        });

        // 3. Get Initial State
        const { data: initialProfile } = await userClient
            .from('users')
            .select('updated_at, full_name')
            .eq('id', userData.user.id)
            .single();

        console.log(`   Initial State: Name="${initialProfile.full_name}", UpdatedAt=${initialProfile.updated_at}`);

        // Wait 1s to ensure timestamp differs
        await new Promise(r => setTimeout(r, 1000));

        // 4. Update Profile
        console.log(`   Updating name to "${newName}"...`);
        const { error: updateError } = await userClient
            .from('users')
            .update({ full_name: newName })
            .eq('id', userData.user.id);

        if (updateError) throw new Error(`Update failed: ${updateError.message}`);

        // 5. Verify Change
        const { data: finalProfile } = await userClient
            .from('users')
            .select('updated_at, full_name')
            .eq('id', userData.user.id)
            .single();

        console.log(`   Final State:   Name="${finalProfile.full_name}", UpdatedAt=${finalProfile.updated_at}`);

        if (finalProfile.full_name !== newName) {
            throw new Error('Full Name did not update.');
        }

        if (new Date(finalProfile.updated_at) <= new Date(initialProfile.updated_at)) {
            throw new Error('updated_at timestamp did not refresh.');
        }

        console.log('\n✨ Profile Update Test Passed: Name changed and timestamp updated.');

    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        process.exit(1);
    }
}

testProfileUpdate();
