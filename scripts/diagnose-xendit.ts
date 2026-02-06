
import { createInvoice, getInvoice } from '../src/lib/xendit/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


async function main() {
    console.log('Running Xendit Connectivity Test...');

    // 1. Check Env Var
    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
        console.error('❌ ERROR: XENDIT_SECRET_KEY is missing in environment variables.');
        process.exit(1);
    }
    console.log(`✅ XENDIT_SECRET_KEY is set (Length: ${secretKey.length})`);

    // 2. Try to create a dummy invoice
    const testId = `test_diag_${Date.now()}`;
    console.log(`\nAttempting to create invoice with external_id: ${testId}`);

    try {
        const invoice = await createInvoice({
            externalId: testId,
            amount: 15000,
            description: 'Connectivity Test Invoice',
            payerEmail: 'test@example.com'
        });

        console.log('✅ Invoice Created Successfully!');
        console.log('Invoice ID:', invoice.id);
        console.log('Invoice URL:', invoice.invoice_url);

        // 3. Try to fetch it back
        console.log('\nFetching invoice back...');
        const fetched = await getInvoice(invoice.id);
        console.log('✅ Fetch Successful. Status:', fetched.status);

    } catch (error: any) {
        console.error('❌ Connection or API Error:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

main().catch(console.error);
