const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToAdmin(email) {
    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: node promote-admin.js <email>');
        process.exit(1);
    }

    console.log(`Searching for user with email: ${email}...`);

    // 1. Get User ID from Auth (Optional, but good for verification if we could, but we can't query auth.users easily without admin API. 
    // We will assume the user exists in public.users which is synchronized usually, or we just update public.users directly.)

    // Check public.users table
    const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (searchError || !users) {
        console.error(`User not found in public.users table: ${searchError?.message || 'No data'}`);
        console.log('Make sure the user has signed up/logged in at least once.');
        return;
    }

    console.log(`Found user: ${users.full_name} (${users.id})`);
    console.log(`Current Role: ${users.role}`);

    if (users.role === 'admin') {
        console.log('User is already an Admin.');
        return;
    }

    // 2. Update Role
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', users.id);

    if (updateError) {
        console.error('Failed to update role:', updateError.message);
        return;
    }

    console.log('✅ Success! User has been promoted to Admin.');
    console.log('You can now remove ADMIN_EMAIL from .env.local if you wish.');
}

// Get email from command line argument
const emailArg = process.argv[2];
promoteToAdmin(emailArg);
