const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
const XENDIT_API_URL = 'https://api.xendit.co';

// ini diubah agar menggunakan sistem logging yang benar
if (!XENDIT_SECRET_KEY) {
    console.warn('XENDIT_SECRET_KEY is not set');
}


type CreateInvoiceParams = {
    externalId: string;
    amount: number;
    payerEmail?: string;
    description: string;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
};

type InvoiceResponse = {
    id: string;
    external_id: string;
    user_id: string;
    status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED';
    merchant_name: string;
    merchant_profile_picture_url: string;
    amount: number;
    payer_email: string;
    description: string;
    invoice_url: string;
    expiry_date: string;
    available_banks: any[];
    available_retail_outlets: any[];
    available_ewallets: any[];
    available_qr_codes: any[];
    available_paylaters: any[];
    should_exclude_credit_card: boolean;
    should_send_email: boolean;
    created: string;
    updated: string;
};

export async function createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
    };

    const body: any = {
        external_id: params.externalId,
        amount: params.amount,
        payer_email: params.payerEmail,
        description: params.description,
        success_redirect_url: params.successRedirectUrl,
        failure_redirect_url: params.failureRedirectUrl,
    };

    const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[XenditClient] Create Invoice Failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData: JSON.stringify(errorData)
        })
        throw new Error(`Xendit API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return response.json();
}

export async function getInvoice(id: string): Promise<InvoiceResponse> {
    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
    };

    const response = await fetch(`${XENDIT_API_URL}/v2/invoices/${id}`, {
        method: 'GET',
        headers: headers,
    });

    if (!response.ok) {
        throw new Error(`Xendit API Error: ${response.status}`);
    }

    return response.json();
}

export async function getInvoicesByExternalId(externalId: string): Promise<InvoiceResponse[]> {
    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
    };

    const response = await fetch(`${XENDIT_API_URL}/v2/invoices?external_id=${externalId}`, {
        method: 'GET',
        headers: headers,
    });

    if (!response.ok) {
        throw new Error(`Xendit API Error: ${response.status}`);
    }

    return response.json();
}
