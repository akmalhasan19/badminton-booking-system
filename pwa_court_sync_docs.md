# PWA-Partner Booking Integration Documentation

## Overview
This document describes how external partners (e.g., PWA Smash) integrate with this Booking System via external APIs.

## API Endpoints Available

### 1. Create Booking
```
POST /api/external/v1/bookings
Authorization: x-api-key: <YOUR_API_KEY>
```

**Request Body:**
```json
{
  "courtId": "uuid-of-court",
  "bookingDate": "2026-02-05",
  "startTime": "10:00",
  "duration": 2,
  "customerName": "John Doe",
  "phone": "+62812345678"
}
```

### 2. Update Payment Status
```
PATCH /api/external/v1/bookings/{id}/payment
Authorization: x-api-key: <YOUR_API_KEY>
```

**Request Body:**
```json
{
  "status": "LUNAS"
}
```

**Supported Status Values:**
| External Status | Internal Status |
|-----------------|-----------------|
| `LUNAS` | `confirmed` |
| `confirmed` | `confirmed` |
| `completed` | `confirmed` |
| `DP` | `confirmed` |
| `pending` | `pending` |
| `cancelled` | `cancelled` |

### 3. Get Courts
```
GET /api/external/v1/courts
Authorization: x-api-key: <YOUR_API_KEY>
```

## Important Notes

### Courts Must Be Pre-seeded
> ⚠️ Courts must exist in the database before bookings can be created.

The system will return an error if you attempt to create a booking for a non-existent court. Use the `/api/external/v1/courts` endpoint to get available courts.

### Customer Data Handling
Customer information (`customerName` + `phone`) is stored in the `notes` field of the booking record:
```
"External Booking: John Doe (+62812345678)"
```

### Xendit Webhook Integration
After payment is completed on Xendit, a webhook is sent to:
```
POST /api/webhooks/xendit
```
This automatically updates the booking status to `confirmed`.

## Integration Flow

```
1. Partner gets available courts: GET /api/external/v1/courts
2. User selects court/time on Partner App
3. Partner creates booking: POST /api/external/v1/bookings
4. System returns booking ID with status='pending'
5. Partner redirects user to Xendit payment
6. User completes payment
7. Xendit sends webhook → booking status='confirmed'
```

## Contact
For API key requests or integration support, contact the system administrator.
