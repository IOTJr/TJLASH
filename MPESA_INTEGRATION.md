# M-Pesa Payment Integration Guide

This document provides comprehensive instructions for integrating the M-Pesa STK Push payment flow with your backend infrastructure.

## Architecture Overview

```
Frontend (index.html)
    ↓
    calls initiateMpesaPayment()
    ↓
Backend API (/api/mpesa/stkpush)
    ↓
    [Credentials & Access Token Management]
    ↓
Daraja API (M-Pesa)
    ↓
    STK Push sent to customer phone
    ↓
Customer enters M-Pesa PIN
    ↓
M-Pesa Processes Transaction
    ↓
Daraja Callback Webhook
    ↓
Backend processes callback
    ↓
Frontend receives success/failure
```

## Backend Implementation

### 1. Environment Variables Required

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
MPESA_ENVIRONMENT=sandbox  # or production
```

### 2. Node.js/Express Backend Example

```javascript
// routes/mpesa.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get M-Pesa Access Token
async function getAccessToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const url = process.env.MPESA_ENVIRONMENT === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${auth}`
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to get access token:', error);
        throw error;
    }
}

// Initiate STK Push
router.post('/stkpush', async (req, res) => {
    try {
        const { phone, amount, bookingId, service, date, time, customerId } = req.body;

        // Validate inputs
        if (!phone || !amount || !bookingId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Get access token
        const accessToken = await getAccessToken();

        // Prepare STK Push payload
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
        const passkey = process.env.MPESA_PASSKEY;
        
        const stringToEncrypt = `${businessShortCode}${passkey}${timestamp}`;
        const crypto = require('crypto');
        const password = crypto
            .createHash('sha256')
            .update(stringToEncrypt)
            .digest('base64');

        // Format phone number (ensure it starts with 254)
        const formattedPhone = phone.replace(/\D/g, '');
        const mobileNumber = formattedPhone.startsWith('254') 
            ? formattedPhone 
            : '254' + formattedPhone.slice(-9);

        const stkPushUrl = process.env.MPESA_ENVIRONMENT === 'production'
            ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const payload = {
            BusinessShortCode: businessShortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amount),
            PartyA: mobileNumber,
            PartyB: businessShortCode,
            PhoneNumber: mobileNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: `BK${bookingId}`,
            TransactionDesc: `Lash Appointment Deposit - ${service}`
        };

        // Send STK Push
        const stkResponse = await axios.post(stkPushUrl, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Save booking in database with 'Pending Payment' status
        await saveBookingToDatabase({
            bookingId,
            customerId,
            phone: mobileNumber,
            amount,
            service,
            date,
            time,
            status: 'PENDING_PAYMENT',
            mpesaCheckoutRequestId: stkResponse.data.CheckoutRequestID,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: 'STK Push initiated successfully',
            checkoutRequestId: stkResponse.data.CheckoutRequestID
        });

    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initiate payment'
        });
    }
});

// M-Pesa Callback Handler
router.post('/callback', async (req, res) => {
    try {
        const { Body } = req.body;
        const { stkCallback } = Body;
        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

        console.log('M-Pesa Callback:', { CheckoutRequestID, ResultCode, ResultDesc });

        // Update booking status in database
        if (ResultCode === 0) {
            // Payment successful
            const metadata = CallbackMetadata.Item;
            const transactionAmount = metadata.find(item => item.Name === 'Amount').Value;
            const transactionCode = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
            const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber').Value;

            await updateBookingToPaid({
                checkoutRequestId: CheckoutRequestID,
                transactionCode,
                transactionAmount,
                status: 'CONFIRMED',
                paidAt: new Date()
            });

            // Send confirmation SMS
            await sendConfirmationSMS(phoneNumber, 'Payment confirmed! Your lash appointment is booked.');

        } else {
            // Payment failed
            await updateBookingStatus(CheckoutRequestID, 'FAILED', ResultDesc);
        }

        // Always return 200 to M-Pesa (acknowledgment)
        res.json({ ResultCode: 0 });

    } catch (error) {
        console.error('Callback processing error:', error);
        res.json({ ResultCode: 1 });
    }
});

// Query Transaction Status (Optional)
router.post('/query', async (req, res) => {
    try {
        const { checkoutRequestId } = req.body;

        if (!checkoutRequestId) {
            return res.status(400).json({ error: 'Missing checkoutRequestId' });
        }

        const accessToken = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
        const passkey = process.env.MPESA_PASSKEY;

        const stringToEncrypt = `${businessShortCode}${passkey}${timestamp}`;
        const crypto = require('crypto');
        const password = crypto
            .createHash('sha256')
            .update(stringToEncrypt)
            .digest('base64');

        const queryUrl = process.env.MPESA_ENVIRONMENT === 'production'
            ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

        const response = await axios.post(queryUrl, {
            BusinessShortCode: businessShortCode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### 3. Database Schema (Booking Storage)

```sql
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    service VARCHAR(50) NOT NULL,
    service_price INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    deposit_amount INT NOT NULL,
    total_amount INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING_PAYMENT',
    mpesa_checkout_request_id VARCHAR(255),
    mpesa_receipt_number VARCHAR(255),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    mpesa_code VARCHAR(255),
    status VARCHAR(50),
    response_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
```

## Frontend M-Pesa Integration

### Enabling M-Pesa Payment in app.js

Uncomment the M-Pesa API call in the `callMpesaAPI()` function:

```javascript
// In app.js - callMpesaAPI() function
fetch('/api/mpesa/stkpush', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'  // Add if needed
    },
    body: JSON.stringify(paymentPayload)
})
.then(response => response.json())
.then(data => {
    console.log('STK Push sent:', data);
    if (!data.success) {
        throw new Error('STK Push failed');
    }
    // Payment will be confirmed via webhook callback
})
.catch(error => {
    console.error('M-Pesa API error:', error);
    alert('Payment initiation failed. Please try again.');
    this.pageManager.transitionTo('page-checkout');
});
```

### Webhook Integration from Backend

When M-Pesa sends a callback to your backend, trigger the success:

```javascript
// Backend would send this via Server-Sent Events or WebSocket
// Or the frontend polls for status:

setInterval(() => {
    fetch(`/api/mpesa/query?bookingId=${this.bookingData.bookingId}`)
        .then(r => r.json())
        .then(data => {
            if (data.status === 'CONFIRMED') {
                this.handlePaymentSuccess();
            }
        });
}, 2000);
```

## Testing & Sandbox

### Test Credentials (Sandbox)

```
Business Short Code: 174379
Pass Key: bfb279f9aa9bdbcf158e97dd1a503b6e
Test Phone Numbers:
  - 254708374149 (usually works)
  - 254722000000
  - 254729674567
```

### Test Flow

1. Start payment process
2. App sends STK Push request
3. You'll receive STK prompt on your phone
4. Enter test PIN: 1234
5. M-Pesa confirms payment
6. Backend receives callback
7. Frontend shows success screen

## Production Checklist

- [ ] Replace sandbox credentials with production credentials
- [ ] Update MPESA_ENVIRONMENT to 'production'
- [ ] Configure HTTPS/SSL for all endpoints
- [ ] Set up proper error logging and monitoring
- [ ] Implement SMS notifications for booking confirmation
- [ ] Add email confirmations with appointment details
- [ ] Implement booking reminder system (SMS/Email 24h before)
- [ ] Add admin dashboard for managing bookings
- [ ] Test full payment flow end-to-end
- [ ] Set up database backups
- [ ] Implement rate limiting to prevent abuse
- [ ] Add logging for audit trail
- [ ] Set up security headers (CORS, CSP, etc.)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid access token" | Ensure credentials are correct and token is fresh |
| "Phone not found in the system" | Use valid M-Pesa registered numbers |
| "Timeout waiting for payment" | Increase timeout or implement polling |
| "Duplicate transaction error" | Use unique AccountReference for each request |
| "Callback not received" | Check callback URL is accessible, verify firewall settings |

## Security Best Practices

1. Always validate inputs on backend
2. Use HTTPS for all API calls
3. Store sensitive credentials in environment variables
4. Implement CSRF tokens for POST requests
5. Rate limit payment endpoints
6. Log all transactions for audit trail
7. Implement proper authentication/authorization
8. Use webhook signature verification
9. Never expose API keys in frontend code
10. Implement payment reconciliation regularly

## Support Resources

- [Safaricom Daraja Docs](https://developer.safaricom.co.ke/)
- [M-Pesa API Guide](https://developer.safaricom.co.ke/apis)
- [STK Push Documentation](https://developer.safaricom.co.ke/docs)
- Email: support@safaricom.co.ke
