
// Scripts must be run with environment variables loaded.
// Use: npx tsx scripts/verify-xendit-logging.ts

import { simulateWebhookTrigger, getWebhookLogs } from '../src/app/debug/actions';

async function main() {
    console.log('Starting Xendit Logging Verification...');

    const testId = `verify_${Date.now()}`;

    // 1. Simulate Webhook
    console.log(`\n1. Simulating Webhook for ID: ${testId}`);
    const simResult = await simulateWebhookTrigger(testId);
    console.log('Simulation Result:', simResult);

    if (simResult.error) {
        console.error('Simulation Failed! Check server logs.');
        // It might fail if the server is not running or env vars are missing in this context
        // But let's see.
    }

    // 2. Fetch Logs
    console.log('\n2. Fetching Webhook Logs...');
    // Give it a moment for the async DB insert
    await new Promise(r => setTimeout(r, 2000));

    const { data: logs, error } = await getWebhookLogs(5);

    if (error) {
        console.error('Failed to fetch logs:', error);
        process.exit(1);
    }

    console.log(`Found ${logs?.length} logs.`);

    if (logs && logs.length > 0) {
        const latest = logs[0];
        console.log('Latest Log:', {
            id: latest.id,
            created_at: latest.created_at,
            source: latest.source,
            status: latest.status,
            external_id_in_payload: latest.payload?.external_id
        });

        if (latest.payload?.external_id === testId) {
            console.log('\n✅ SUCCESS: Verification Webhook was logged!');
        } else {
            console.log('\n⚠️ WARNING: Latest log does not match test ID. It might be from a previous run or local dev traffic.');
        }
    } else {
        console.log('\n❌ FAILURE: No logs found.');
    }

    process.exit(0);
}

main().catch(console.error);
