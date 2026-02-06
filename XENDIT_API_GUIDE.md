1. Split RULE
**Codes**
curl --request POST \
  --url https://api.xendit.co/split_rules \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk' \
  --header 'content-type: application/json' \
  --data '{
  "name": "Platform and Delivery Fees",
  "description": "Platform fee and delivery fee for a Marketplace",
  "routes": [
    {
      "flat_amount": 3000,
      "currency": "IDR",
      "destination_account_id": "5f8d0c0603ffe06b7d4d9fcf",
      "reference_id": "reference-1"
    },
    {
      "percent_amount": 5.25,
      "currency": "IDR",
      "destination_account_id": "5f8d0c0603ffe06b7d4d9fcf",
      "reference_id": "reference-2"
    }
  ]
}'
**h**

2. Get Account
**Codes**
curl --request GET \
  --url https://api.xendit.co/v2/accounts/%7Bid%7D \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk'
**h**

3. Split Payment Status
**Codes**
curl --request POST \
  --url https://api.xendit.co/your_split_payment_webhook_url \
  --header 'accept: ' \
  --header 'content-type: application/json' \
  --data '{
  "event": "split.payment",
  "created": "2021-01-01T10:00:00Z",
  "business_id": "5fe2b0137b7d62542fe6d7de",
  "data": {
    "id": "57fb4e076fa3fa296b7f5a97",
    "split_rule_id": "splitru_d9e069f2-4da7-4562-93b7-ded87023d749",
    "reference_id": "my_unique_route_reference_12345",
    "payment_id": "py-1402feb0-bb79-47ae-9d1e-e69394d3949c",
    "payment_reference_id": "my_unique_payment_reference_12345",
    "source_account_id": "5fe2b0137b7d62542fe6d7de",
    "destination_account_id": "67514ce3b045c2ebade1d94e",
    "status": "COMPLETED",
    "amount": 150.45,
    "currency": "PHP"
  }
}'
**h**

4. Get Account Holder
**Codes**
curl --request GET \
  --url https://api.xendit.co/account_holders/%7Bid%7D \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk'
**h**

5. Set Webhook URL
**Codes**
curl --request POST \
  --url https://api.xendit.co/callback_urls/%7Btype%7D \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk' \
  --header 'content-type: application/json' \
  --data '{
  "url": "https://www.xendit.co/webhook_catcher"
}'
**h**

6. Get Transaction ID
**Codes**
curl --request GET \
  --url https://api.xendit.co/transactions/%7Btransaction_id%7D \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk'
**h**

7. List Transaction
**Codes**
curl --request GET \
  --url 'https://api.xendit.co/transactions?amount=9989.0&limit=10' \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk'
**h**

8. Payments
**Codes**
curl --request GET \
  --url https://api.xendit.co/v3/payments/%7Bpayment_id%7D \
  --header 'accept: application/json' \
  --header 'api-version: 2024-11-11' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk'
**h**

9. Capture a payment
**Codes**
curl --request POST \
  --url https://api.xendit.co/v3/payments/%7Bpayment_id%7D/capture \
  --header 'accept: application/json' \
  --header 'api-version: 2024-11-11' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk' \
  --header 'content-type: application/json' \
  --data '{
 "capture_amount": 10000
}'
**h**

10. Refund a payment
**Codes**
curl --request POST \
  --url https://api.xendit.co/v3/payment_requests \
  --header 'accept: application/json' \
  --header 'api-version: 2024-11-11' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk' \
  --header 'content-type: application/json' \
  --data '{
  "reference_id": "order_123456_3ds",
  "type": "PAY",
  "country": "ID",
  "currency": "IDR",
  "request_amount": 100000,
  "capture_method": "AUTOMATIC",
  "channel_code": "CARDS",
  "channel_properties": {
    "mid_label": "CTV_TEST",
    "card_details": {
      "cvn": "123",
      "card_number": "4000000000001091",
      "expiry_year": "2025",
      "expiry_month": "12",
      "cardholder_first_name": "John",
      "cardholder_last_name": "Doe",
      "cardholder_email": "john.doe@example.com",
      "cardholder_phone_number": "+628123456789"
    },
    "skip_three_ds": false,
    "failure_return_url": "https://xendit.co/failure",
    "success_return_url": "https://xendit.co/success"
  },
  "description": "Payment for Order #123456",
  "metadata": {
    "order_id": "123456",
    "customer_type": "premium"
  }
}'
**h**

11. Payment webhook notification
**Codes**
curl --request POST \
  --url https://api.xendit.co/your_payment_webhook_url \
  --header 'accept: ' \
  --header 'content-type: application/json' \
  --data '{
  "paymentCapture": {
    "value": {
      "event": "payment.capture",
      "business_id": "6094fa76c2fd53701b8e079c",
      "created": "2021-12-02T14:52:21.566Z",
      "data": {
        "payment_id": "py-1fdaf346-dd2e-4b6c-b938-124c7167a822",
        "business_id": "6094fa76c2fd53701b8e079c",
        "status": "SUCCEEDED",
        "payment_request_id": "pr-1fdaf346-dd2e-4b6c-b938-124c7167a822",
        "request_amount": 10000,
        "customer_id": "cust-5ed61c4e-499f-49bd-9d90-f3f45028a7a3",
        "channel_code": "BRI_VIRTUAL_ACCOUNT",
        "country": "ID",
        "currency": "IDR",
        "reference_id": "example_reference_id",
        "description": "Payment description",
        "channel_properties": {
          "failure_return_url": "https://xendit.co/failure",
          "success_return_url": "https://xendit.co/success"
        },
        "type": "SINGLE_PAYMENT",
        "created": "2021-12-02T14:52:21.566Z",
        "updated": "2021-12-02T14:52:21.566Z"
      }
    }
  },
  "paymentAuthorization": {
    "value": {
      "event": "payment.authorization",
      "business_id": "6094fa76c2fd53701b8e079c",
      "created": "2021-12-02T14:52:21.566Z",
      "data": {
        "payment_id": "py-1fdaf346-dd2e-4b6c-b938-124c7167a822",
        "business_id": "6094fa76c2fd53701b8e079c",
        "status": "AUTHORIZED",
        "payment_request_id": "pr-1fdaf346-dd2e-4b6c-b938-124c7167a822",
        "request_amount": 10000,
        "customer_id": "cust-5ed61c4e-499f-49bd-9d90-f3f45028a7a3",
        "channel_code": "CARDS",
        "country": "PH",
        "currency": "PHP",
        "reference_id": "example_reference_id",
        "description": "Payment description",
        "channel_properties": {
          "failure_return_url": "https://xendit.co/failure",
          "success_return_url": "https://xendit.co/success"
        },
        "type": "SINGLE_PAYMENT",
        "created": "2021-12-02T14:52:21.566Z",
        "updated": "2021-12-02T14:52:21.566Z"
      }
    }
  },
  "paymentFailure": {
    "value": {
      "event": "payment.failure",
      "business_id": "6094fa76c2fd53701b8e079c",
      "created": "2021-12-02T14:52:21.566Z",
      "data": {
        "payment_id": "py-1fdaf346-dd2e-4b6c-b938-124c7167a822",
        "business_id": "6094fa76c2fd53701b8e079c",
        "status": "FAILED",
        "payment_request_id": "pr-1fdaf346-dd2e-4b6c-b938-124c7167a822",
        "request_amount": 10000,
        "customer_id": "cust-5ed61c4e-499f-49bd-9d90-f3f45028a7a3",
        "channel_code": "CARDS",
        "country": "TH",
        "currency": "THB",
        "reference_id": "example_reference_id",
        "description": "Payment description",
        "failure_code": "INSUFFICIENT_BALANCE",
        "channel_properties": {
          "failure_return_url": "https://xendit.co/failure",
          "success_return_url": "https://xendit.co/success"
        },
        "type": "SINGLE_PAYMENT",
        "created": "2021-12-02T14:52:21.566Z",
        "updated": "2021-12-02T14:52:21.566Z"
      }
    }
  }
}'
**h**

12. Get Status of Payment
**Codes**
curl --request GET \
  --url https://api.xendit.co/v3/payment_requests/%7Bpayment_request_id%7D \
  --header 'accept: application/json' \
  --header 'api-version: 2024-11-11' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk'
**h**

13. Set Sub-Account Webhook URL
**Codes**
curl --request POST \
  --url https://api.xendit.co/callback_urls/%7Btype%7D \
  --header 'accept: application/json' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk' \
  --header 'content-type: application/json' \
  --header 'for-user-id: <sub_account_id>' \
  --data '{
  "url": "https://www.yourdomain.com/api/webhooks/xendit"
}'
**h**