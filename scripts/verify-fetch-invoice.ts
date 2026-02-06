
// Hardcoded key to ensure we are testing the logic, not the environment
const KEY = 'xnd_development_W3tcRfWfmdlkCKN8h2VaEKpoZP3Es5uAMxJQqq1wRdU93kaqf7Eiogc0XPQ3uNU';
const AUTH = Buffer.from(KEY + ':').toString('base64');

// The ID created in the previous successful test
// "Success! Invoice ID: 6985708742f0967f1eea5b31"
// We need the EXTERNAL ID for that one.
// In the previous script: const testId = `test_hardcoded_${Date.now()}`;
// We don't know the exact external ID from the previous run's output (it printed the internal ID).
// But we can try to search for it if we knew it.

// Better: Create a NEW one, then immediately search for it.

async function main() {
    console.log('Testing Get Invoice by External ID...');

    // 1. Create Invoice
    const externalId = `test_fetch_${Date.now()}`;
    console.log(`\n1. Creating Invoice: ${externalId}`);

    try {
        const createRes = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                external_id: externalId,
                amount: 15000,
                payer_email: 'test@example.com',
                description: 'Fetch Test'
            })
        });

        if (!createRes.ok) {
            console.error('Create Failed:', await createRes.text());
            return;
        }
        console.log('✅ Created.');

        // 2. Fetch by External ID
        console.log(`\n2. Fetching by External ID: ${externalId}`);
        const fetchRes = await fetch(`https://api.xendit.co/v2/invoices?external_id=${externalId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            }
        });

        if (!fetchRes.ok) {
            console.error('Fetch Failed:', await fetchRes.text());
            return;
        }

        const invoices = await fetchRes.json();
        console.log(`Found ${invoices.length} invoices.`);

        if (invoices.length > 0) {
            console.log('✅ Success! Found invoice:', invoices[0].id);
            if (invoices[0].external_id === externalId) {
                console.log('✅ External ID matches.');
            } else {
                console.error('❌ External ID Mismatch:', invoices[0].external_id);
            }
        } else {
            console.error('❌ No invoices returned (Empty Array). search might be delayed?');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
