
import { loadEnvConfig } from '@next/env';
import fetch from 'node-fetch'; // Needed for node script if not using global fetch
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_API_URL = 'https://api.xendit.co';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!XENDIT_SECRET_KEY) {
    console.error('Error: XENDIT_SECRET_KEY is not set in .env');
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Supabase credentials not set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const subAccountId = process.argv[2];
const webhookUrl = process.argv[3];
const type = process.argv[4] || 'invoice'; // Default to 'invoice'

if (!subAccountId || !webhookUrl) {
    console.error('Usage: npx tsx scripts/set-subaccount-webhook.ts <sub_account_id> <webhook_url> [type]');
    console.error('Example: npx tsx scripts/set-subaccount-webhook.ts 6094fa76c... https://mysite.com/api/webhooks/xendit invoice');
    process.exit(1);
}

async function setWebhook() {
    console.log(`Setting ${type} webhook for Sub-Account ${subAccountId} to ${webhookUrl}...`);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    try {
        const response = await fetch(`${XENDIT_API_URL}/callback_urls/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`,
                'for-user-id': subAccountId,
            },
            body: JSON.stringify({
                url: webhookUrl,
            }),
        });

        const data: any = await response.json();

        if (!response.ok) {
            console.error('Failed to set webhook:', JSON.stringify(data, null, 2));
            process.exit(1);
        }

        console.log('Successfully set webhook URL at Xendit!');
        console.log(JSON.stringify(data, null, 2));

        // Save to Database
        if (data.callback_token) {
            console.log('Saving verification token to database...');
            const { error } = await supabase
                .from('webhook_configs')
                .upsert({
                    provider: 'xendit',
                    account_id: subAccountId,
                    verification_token: data.callback_token,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'provider,account_id' });

            if (error) {
                console.error('Failed to save token to database:', error);
            } else {
                console.log('Token saved to database successfully!');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

setWebhook();
