
import { createInvoice } from '../src/lib/xendit/client';

// Hardcoding the key to verify it directly without .env issues
// User's new key:
const KEY = 'xnd_development_W3tcRfWfmdlkCKN8h2VaEKpoZP3Es5uAMxJQqq1wRdU93kaqf7Eiogc0XPQ3uNU';
const AUTH = Buffer.from(KEY + ':').toString('base64');

async function main() {
    console.log('Testing specific key directly (Create Invoice)...');
    console.log('Key:', KEY.substring(0, 20) + '...');

    // Test creating an invoice
    try {
        const testId = `test_hardcoded_${Date.now()}`;
        console.log(`Attempting to create invoice: ${testId}`);

        const response = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                external_id: testId,
                amount: 10000,
                payer_email: 'test@example.com',
                description: 'Hardcoded Key Test'
            })
        });

        console.log('Status:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.log('Error Response:', text);
        } else {
            const json = await response.json();
            console.log('Success! Invoice ID:', json.id);
            console.log('Invoice URL:', json.invoice_url);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

main();
