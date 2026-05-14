/**
 * Lashed by Amarah - Backend Server
 * Handles M-Pesa payment processing and booking management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lash_bookings',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ===========================================
// M-PESA UTILITY FUNCTIONS
// ===========================================

/**
 * Get M-Pesa Access Token
 */
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
        console.error('Failed to get access token:', error.response?.data || error.message);
        throw new Error('M-Pesa authentication failed');
    }
}

/**
 * Generate M-Pesa Password
 */
function generateMpesaPassword(businessShortCode, passkey, timestamp) {
    const stringToEncrypt = `${businessShortCode}${passkey}${timestamp}`;
    return crypto
        .createHash('sha256')
        .update(stringToEncrypt)
        .digest('base64');
}

/**
 * Format phone number to M-Pesa format
 */
function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.slice(1);
    } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
}

// ===========================================
// DATABASE FUNCTIONS
// ===========================================

/**
 * Save booking to database
 */
async function saveBookingToDatabase(bookingData) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const query = `
            INSERT INTO bookings (
                booking_id, customer_id, service, service_price,
                appointment_date, appointment_time, phone_number,
                payment_method, deposit_amount, total_amount,
                status, mpesa_checkout_request_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
            bookingData.bookingId,
            bookingData.customerId,
            bookingData.service,
            bookingData.servicePrice || 0,
            bookingData.date,
            bookingData.time,
            bookingData.phone,
            bookingData.paymentMethod,
            bookingData.amount,
            bookingData.totalAmount || bookingData.amount,
            bookingData.status,
            bookingData.mpesaCheckoutRequestId,
            new Date()
        ]);

        return true;
    } catch (error) {
        console.error('Database save error:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Update booking to paid status
 */
async function updateBookingToPaid(checkoutRequestId, paymentData) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const query = `
            UPDATE bookings 
            SET status = ?, 
                mpesa_receipt_number = ?, 
                paid_at = ?
            WHERE mpesa_checkout_request_id = ?
        `;

        await connection.execute(query, [
            'CONFIRMED',
            paymentData.transactionCode,
            new Date(),
            checkoutRequestId
        ]);

        // Also save transaction record
        await savePaymentTransaction(checkoutRequestId, paymentData);

        return true;
    } catch (error) {
        console.error('Database update error:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Save payment transaction record
 */
async function savePaymentTransaction(checkoutRequestId, paymentData) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const query = `
            INSERT INTO payment_transactions (
                booking_id, amount, mpesa_code, status, response_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
            checkoutRequestId,
            paymentData.transactionAmount,
            paymentData.transactionCode,
            'SUCCESS',
            JSON.stringify(paymentData),
            new Date()
        ]);

        return true;
    } catch (error) {
        console.error('Transaction save error:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Update booking status
 */
async function updateBookingStatus(checkoutRequestId, status, description = null) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const query = `
            UPDATE bookings 
            SET status = ?
            WHERE mpesa_checkout_request_id = ?
        `;

        await connection.execute(query, [status, checkoutRequestId]);
        return true;
    } catch (error) {
        console.error('Status update error:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Get booking by ID
 */
async function getBookingById(bookingId) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const query = 'SELECT * FROM bookings WHERE booking_id = ?';
        const [rows] = await connection.execute(query, [bookingId]);
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

// ===========================================
// ROUTES
// ===========================================

/**
 * Health Check
 */
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * STK Push - Initiate M-Pesa Payment
 */
app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        const { phone, amount, bookingId, service, date, time, customerId } = req.body;

        // Validation
        if (!phone || !amount || !bookingId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: phone, amount, bookingId' 
            });
        }

        if (amount < 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'Minimum amount is 10 KES' 
            });
        }

        // Get access token
        const accessToken = await getAccessToken();

        // Generate timestamp and password
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
        const passkey = process.env.MPESA_PASSKEY;
        const password = generateMpesaPassword(businessShortCode, passkey, timestamp);

        // Format phone number
        const mobileNumber = formatPhoneNumber(phone);

        // Prepare STK Push request
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

        console.log('Sending STK Push:', { 
            amount, 
            phone: mobileNumber, 
            bookingId,
            accountReference: payload.AccountReference 
        });

        // Send STK Push to M-Pesa
        const stkResponse = await axios.post(stkPushUrl, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('STK Push response:', stkResponse.data);

        // Save booking to database
        await saveBookingToDatabase({
            bookingId,
            customerId,
            service,
            date,
            time,
            phone: mobileNumber,
            amount,
            paymentMethod: 'deposit',
            status: 'PENDING_PAYMENT',
            mpesaCheckoutRequestId: stkResponse.data.CheckoutRequestID,
            servicePrice: amount * 2 // Assuming deposit is 50%
        });

        res.json({
            success: true,
            message: 'STK Push initiated successfully',
            checkoutRequestId: stkResponse.data.CheckoutRequestID,
            responseCode: stkResponse.data.ResponseCode
        });

    } catch (error) {
        console.error('STK Push error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initiate payment'
        });
    }
});

/**
 * M-Pesa Callback Handler
 */
app.post('/api/mpesa/callback', async (req, res) => {
    try {
        console.log('Received M-Pesa callback:', JSON.stringify(req.body, null, 2));

        const { Body } = req.body;
        if (!Body || !Body.stkCallback) {
            return res.json({ ResultCode: 1, ResultDesc: 'Invalid callback format' });
        }

        const { stkCallback } = Body;
        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

        // Handle different result codes
        if (ResultCode === 0) {
            // Payment successful
            console.log('Payment successful for CheckoutRequestID:', CheckoutRequestID);

            // Extract callback metadata
            const metadata = CallbackMetadata.Item;
            const amount = metadata.find(item => item.Name === 'Amount')?.Value;
            const mpesaCode = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
            const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

            // Update booking to paid
            await updateBookingToPaid(CheckoutRequestID, {
                transactionCode: mpesaCode,
                transactionAmount: amount,
                phoneNumber: phoneNumber
            });

            // Send confirmation SMS (optional)
            // await sendConfirmationSMS(phoneNumber, bookingId);

        } else {
            // Payment failed
            console.log('Payment failed:', ResultDesc);
            await updateBookingStatus(CheckoutRequestID, 'FAILED', ResultDesc);
        }

        // Always return 200 to M-Pesa
        res.json({ ResultCode: 0, ResultDesc: 'Callback processed' });

    } catch (error) {
        console.error('Callback processing error:', error);
        res.json({ ResultCode: 1, ResultDesc: 'Internal error' });
    }
});

/**
 * Query Payment Status
 */
app.post('/api/mpesa/query', async (req, res) => {
    try {
        const { checkoutRequestId } = req.body;

        if (!checkoutRequestId) {
            return res.status(400).json({ error: 'Missing checkoutRequestId' });
        }

        const accessToken = await getAccessToken();

        // Generate password
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
        const passkey = process.env.MPESA_PASSKEY;
        const password = generateMpesaPassword(businessShortCode, passkey, timestamp);

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
        res.status(500).json({ 
            error: error.message || 'Failed to query payment status',
            checkoutRequestId: req.body.checkoutRequestId
        });
    }
});

/**
 * Get Booking Details
 */
app.get('/api/bookings/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to retrieve booking' 
        });
    }
});

/**
 * Create Booking (Direct)
 */
app.post('/api/bookings', async (req, res) => {
    try {
        const { service, date, time, phone, paymentMethod, amount } = req.body;

        if (!service || !date || !time || !phone || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

        await saveBookingToDatabase({
            bookingId,
            customerId: `CUST${Date.now()}`,
            service,
            date,
            time,
            phone: formatPhoneNumber(phone),
            amount,
            paymentMethod,
            status: 'CREATED'
        });

        res.status(201).json({
            success: true,
            bookingId,
            message: 'Booking created successfully'
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to create booking' 
        });
    }
});

// ===========================================
// ERROR HANDLING
// ===========================================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ===========================================
// SERVER STARTUP
// ===========================================

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║  Lashed by Amarah Backend Running    ║
    ║  Port: ${PORT}                             ║
    ║  Environment: ${process.env.NODE_ENV || 'development'}          ║
    ║  M-Pesa: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}           ║
    ╚══════════════════════════════════════╝
    `);
});

module.exports = app;
