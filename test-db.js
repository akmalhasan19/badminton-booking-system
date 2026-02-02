
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVenues() {
    console.log('Testing connection to venues table...');
    const { data, error } = await supabase.from('venues').select('*').limit(5);

    if (error) {
        console.error('Error fetching venues:', error.message);
        console.log('Trying "halls" table...');
        const { data: halls, error: hallError } = await supabase.from('halls').select('*').limit(5);
        if (hallError) {
            console.error('Error fetching halls:', hallError.message);
        } else {
            console.log('Found "halls" table:', halls);
        }
    } else {
        console.log('Found "venues" table:', data);
    }
}

testVenues();
