# Xendit Payments API v3 Integration

Dokumen ini menjelaskan integrasi backend Xendit Payment Request v3 untuk booking payment tanpa UI hosted dari Xendit.

## Env Variables

Tambahkan ke environment runtime backend:

```env
XENDIT_SECRET_KEY=...
XENDIT_WEBHOOK_TOKEN=...
XENDIT_CALLBACK_TOKEN=... # legacy fallback (opsional)
XENDIT_BASE_URL=https://api.xendit.co
XENDIT_API_VERSION=2024-11-11
XENDIT_DEFAULT_CHANNEL_CODE=QRIS
XENDIT_COUNTRY=ID
XENDIT_CURRENCY=IDR
FEATURE_XENDIT_V3_PAYMENTS=true
XENDIT_WEBHOOK_IP_ALLOWLIST=1.2.3.4,5.6.7.8
```

## Internal Endpoints

### POST `/api/payments/initiate`

Body:

```json
{
  "orderId": "7f81976f-7d2a-4f63-afc2-b4368e372e0d",
  "amount": 103000,
  "channelCode": "QRIS"
}
```

Response:

```json
{
  "paymentRequestId": "pr-7f8f5a39-8b1d-4ca2-a8d9-8da5076ad0fd",
  "referenceId": "booking_7f81976f-7d2a-4f63-afc2-b4368e372e0d",
  "status": "PENDING_USER_ACTION",
  "actions": [
    {
      "type": "REDIRECT_CUSTOMER",
      "descriptor": "WEB_URL",
      "value": "https://checkout.xendit.co/web/..."
    },
    {
      "type": "PRESENT_TO_CUSTOMER",
      "descriptor": "VIRTUAL_ACCOUNT_NUMBER",
      "value": "8808123412341234"
    }
  ],
  "expiresAt": "2026-02-11T18:00:00.000Z"
}
```

### GET `/api/payments/:orderId?sync=true`

Response:

```json
{
  "orderId": "7f81976f-7d2a-4f63-afc2-b4368e372e0d",
  "orderStatus": "pending",
  "payment": {
    "status": "PENDING_USER_ACTION",
    "providerStatus": "REQUIRES_ACTION",
    "paymentRequestId": "pr-7f8f5a39-8b1d-4ca2-a8d9-8da5076ad0fd",
    "referenceId": "booking_7f81976f-7d2a-4f63-afc2-b4368e372e0d",
    "channelCode": "QRIS",
    "amount": 103000,
    "currency": "IDR",
    "actions": [
      {
        "type": "PRESENT_TO_CUSTOMER",
        "descriptor": "QR_STRING",
        "value": "000201010212..."
      }
    ],
    "expiresAt": "2026-02-11T18:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  }
}
```

## Xendit Create Payment Request (Provider Payload)

Backend mengirim payload berikut ke `POST /v3/payment_requests`:

```json
{
  "reference_id": "booking_7f81976f-7d2a-4f63-afc2-b4368e372e0d",
  "type": "PAY",
  "country": "ID",
  "currency": "IDR",
  "request_amount": 103000,
  "channel_code": "QRIS",
  "channel_properties": {
    "success_return_url": "https://your-app.com/bookings/history?payment=success&booking_id=7f81976f-7d2a-4f63-afc2-b4368e372e0d",
    "failure_return_url": "https://your-app.com/bookings/history?payment=failed&booking_id=7f81976f-7d2a-4f63-afc2-b4368e372e0d"
  },
  "metadata": {
    "order_id": "7f81976f-7d2a-4f63-afc2-b4368e372e0d"
  }
}
```

## Webhook Setup (Xendit Dashboard)

1. Buka Xendit Dashboard > Developers > Webhooks.
2. Set URL webhook ke endpoint publik HTTPS:
   - `https://<your-domain>/api/webhooks/xendit`
3. Set callback token yang sama dengan `XENDIT_WEBHOOK_TOKEN`.
4. Simpan, lalu kirim test webhook dari dashboard.

## Verifikasi Token Webhook

Handler webhook memverifikasi header callback token berikut:

- `x-callback-token`
- `X-CALLBACK-TOKEN` (fallback)

Jika token mismatch, backend mengembalikan `401 Unauthorized`.

Jika `XENDIT_WEBHOOK_IP_ALLOWLIST` diisi, request dari IP yang tidak ada di daftar akan ditolak dengan `403`.

## Status Mapping

Status provider -> status internal:

- `REQUIRES_ACTION` -> `PENDING_USER_ACTION`
- `SUCCEEDED` / `COMPLETED` / `PAID` / `SETTLED` -> `PAID`
- `FAILED` / `CANCELLED` -> `FAILED`
- `EXPIRED` -> `EXPIRED`

Booking status sinkronisasi:

- `PAID` -> `bookings.status = confirmed`
- `FAILED`/`EXPIRED` -> `bookings.status = cancelled`

## Idempotency Webhook

Webhook disimpan ke tabel `webhook_events` dengan `dedupe_key` unik:

- prioritas: `provider_event_id` -> `webhook_id` -> `payment_request_id:status`
- event duplikat akan di-ignore dan tetap return `200`

## Notes

- Secret key hanya dipakai di backend (`Basic <base64(secret_key + ':')>`).
- UI harus render `actions[]` dari response backend (`REDIRECT_CUSTOMER` / `PRESENT_TO_CUSTOMER`).
- Jangan memproses data kartu mentah di backend.
