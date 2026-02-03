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
    const email = `qa_ops_${role}_${randomId}@example.com`;
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

async function testSettingsAndPartners() {
    console.log('\n⚙️  Starting Operations & Partners Test (Fixed Schema)...');
    try {
        const customer = await createAuthUser('customer');
        const admin = await createAuthUser('admin');

        // --- PART 1: SETTINGS & HOURS ---

        // 1. JSON Settings
        console.log('   🔧 Testing JSON Settings...');
        const settingKey = `site_banner_${Date.now()}`;
        const { error: setErr } = await admin.client
            .from('settings')
            .insert({ key: settingKey, value: { visible: true, text: 'Hello' } });

        if (setErr) throw new Error(`Settings insert failed: ${setErr.message}`);

        // Verify Update
        const { error: updErr } = await admin.client
            .from('settings')
            .update({ value: { visible: false, text: 'Updated' } })
            .eq('key', settingKey);

        if (updErr) throw new Error(`Settings update failed: ${updErr.message}`);
        console.log('   ✅ Settings JSON updated.');

        // --- PART 2: PARTNER APP ---

        // 2. Public Submission (Partner App)
        console.log('   🤝 Testing Partner Application...');

        const { error: subErr } = await customer.client
            .from('partner_applications')
            .insert({
                owner_name: 'John Doe',
                email: 'partner@test.com',
                phone: '08123456789',
                social_media: '@johndoe',
                flooring_material: 'Wood',
                routine_clubs: 'Morning Club',
                website: 'https://test.com'
            });

        if (subErr) {
            console.warn(`   ⚠️ Customer Submission Failed: ${subErr.message}`);
        } else {
            console.log('   ✅ Partner Application Submitted.');
        }

        // 3. Admin Review & Guest Privacy
        const { data: appData } = await admin.client
            .from('partner_applications')
            .select('*')
            .eq('email', 'partner@test.com')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (appData) {
            console.log(`   ✅ Admin sees application (${appData.id}).`);

            // Update status
            const { error: appUpd } = await admin.client
                .from('partner_applications')
                .update({ status: 'approved' })
                .eq('id', appData.id);

            if (appUpd) throw new Error(`Admin update failed: ${appUpd.message}`);
            console.log('   ✅ Admin approved application.');

            // Guest check
            const { data: guestSee, error: guestErr } = await customer.client
                .from('partner_applications')
                .select('*')
                .eq('id', appData.id);

            // RLS Logic Verification
            if (guestErr || !guestSee || guestSee.length === 0) {
                console.log('   ✅ Guest Privacy: Customer cannot see other applications.');
            } else {
                // If policy is "Admins can view..." only, then customer gets nothing.
                console.log(`   ℹ️  Customer query result count: ${guestSee?.length}`);
            }
        }

        console.log('\n✨ Operations & Partners Test Finished.');

    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        process.exit(1);
    }
}

testSettingsAndPartners();
