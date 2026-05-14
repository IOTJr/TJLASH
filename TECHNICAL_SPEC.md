# Technical Specification - Lashed by Amarah Booking App

## Document Information

- **Product Name:** Lashed by Amarah Booking Application
- **Version:** 1.0.0
- **Last Updated:** January 2024
- **Status:** Production Ready
- **Author:** Development Team

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Frontend Specifications](#frontend-specifications)
4. [Backend Specifications](#backend-specifications)
5. [API Specifications](#api-specifications)
6. [Database Schema](#database-schema)
7. [Animation Specifications](#animation-specifications)
8. [Security Specifications](#security-specifications)
9. [Performance Requirements](#performance-requirements)
10. [Error Handling](#error-handling)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTML5 (Structure) + CSS3 (Styling) + JS (Logic)   │  │
│  │  Tailwind CSS + GSAP 3.12.2 + Vanilla JS           │  │
│  │                                                      │  │
│  │  Pages:                                            │  │
│  │  - Service Selection                               │  │
│  │  - Date & Time Selection                           │  │
│  │  - Checkout Summary                                │  │
│  │  - Payment Processing                              │  │
│  │  - Success Confirmation                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node.js/Express REST API                           │  │
│  │  - /api/mpesa/stkpush      (POST)                   │  │
│  │  - /api/mpesa/callback     (POST)                   │  │
│  │  - /api/mpesa/query        (POST)                   │  │
│  │  - /api/bookings           (GET, POST)              │  │
│  │  - /health                 (GET)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        ↓ Internal                           ↓ M-Pesa API
    ┌────────────────┐          ┌──────────────────────────┐
    │  DATABASE      │          │   SAFARICOM DARAJA       │
    │  MySQL 5.7+    │          │   STK Push               │
    │                │          │   Callbacks              │
    │  Tables:       │          │   Query                  │
    │  - bookings    │          └──────────────────────────┘
    │  - transactions│
    └────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Markup | HTML5 | - | Semantic structure |
| Styling | CSS3 | - | Custom animations |
| Framework | Tailwind CSS | 3.x | Utility-first CSS |
| Animation | GSAP | 3.12.2 | Advanced animations |
| Logic | Vanilla JavaScript | ES6+ | Application logic |
| CDN Libs | CDN | - | GSAP, Tailwind |

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ | Server runtime |
| Framework | Express | 4.18+ | HTTP server |
| Database | MySQL | 5.7+ | Data persistence |
| Driver | mysql2/promise | 3.6+ | Async DB operations |
| Security | helmet | 7.1+ | HTTP headers |
| Rate Limit | express-rate-limit | 7.1+ | API throttling |
| HTTP Client | axios | 1.6+ | API requests |
| Utilities | crypto, fs, path | - | Built-in modules |

## Frontend Specifications

### File Structure

```
index.html          2,200 lines    HTML5 structure + inline content
styles.css          400 lines      Custom CSS + animations
app.js              600 lines      Application logic
animations.js       350 lines      Butterfly + transition effects
```

### Page States

#### 1. Service Selection Page
- **ID:** `page-services`
- **Content:**
  - Header with logo and tagline
  - Service grid (3 cards: Classic, Hybrid, Volume)
  - Hours section
  - Contact section
  - Booking policies section
  - Action button (disabled until selection)
- **Animations:**
  - Floating butterflies on load
  - Card hover scale + glow effect
  - Button enabled animation

#### 2. Date & Time Selection Page
- **ID:** `page-date`
- **Content:**
  - Header
  - Service display
  - Date picker input
  - Time slots grid (16 slots)
  - Back button
  - Continue button
- **Animations:**
  - Page transition fade/slide
  - Slot hover effects
  - Slot selection highlight

#### 3. Checkout Summary Page
- **ID:** `page-checkout`
- **Content:**
  - Header
  - Booking summary card
  - Payment method selection (2 options)
  - M-Pesa phone input
  - Amount display
  - Navigation buttons
- **Animations:**
  - Payment option hover scale
  - Amount update animation
  - Button glow effects

#### 4. Payment Processing Page
- **ID:** `page-payment`
- **Content:**
  - M-Pesa logo pulse animation
  - Processing message
  - Countdown timer (60 seconds)
  - Demo confirm button (for testing)
- **Animations:**
  - Logo pulse scale animation
  - Countdown updates

#### 5. Success Page
- **ID:** `page-success`
- **Content:**
  - Animated logo
  - Checkmark animation
  - Success message
  - Booking details
  - Before your appointment section
  - Home button
- **Animations:**
  - Logo fade-in scale
  - Checkmark pop animation
  - Cascading butterflies (20 total)
  - Page entry animation

### Responsive Design

| Breakpoint | Resolution | Layout |
|-----------|-----------|--------|
| Mobile | < 640px | Single column, touch-optimized |
| Tablet | 640-1024px | Two column grid |
| Desktop | > 1024px | Full three column grid |

### Accessibility

- Semantic HTML5
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states for all buttons
- Color contrast ratio ≥ 4.5:1
- Reduced motion media query support

## Backend Specifications

### Server Configuration

```javascript
- Port: 3000 (configurable via PORT env var)
- CORS: Enabled for frontend origin
- Security: Helmet.js middleware
- Rate Limiting: 100 req/15min per IP
- JSON Limits: 10mb
```

### API Routes

#### POST /api/mpesa/stkpush

**Purpose:** Initiate M-Pesa STK Push payment

**Request Body:**
```json
{
  "phone": "254712345678",
  "amount": 500,
  "bookingId": "BK1704067200123",
  "service": "hybrid",
  "date": "2024-06-15",
  "time": "14:00",
  "customerId": "CUST1704067200"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "STK Push initiated successfully",
  "checkoutRequestId": "ws_CO_DMZ_xxx",
  "responseCode": "0"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

#### POST /api/mpesa/callback

**Purpose:** Receive M-Pesa payment confirmation

**Webhook Payload (from M-Pesa):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "xxx",
      "CheckoutRequestID": "ws_CO_DMZ_xxx",
      "ResultCode": 0,
      "ResultDesc": "The service request has been processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 500},
          {"Name": "MpesaReceiptNumber", "Value": "LHR61H91J0J"},
          {"Name": "PhoneNumber", "Value": 254712345678},
          {"Name": "TransactionDate", "Value": 20240115120000}
        ]
      }
    }
  }
}
```

**Response:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Callback processed"
}
```

#### POST /api/mpesa/query

**Purpose:** Query payment status

**Request Body:**
```json
{
  "checkoutRequestId": "ws_CO_DMZ_xxx"
}
```

**Response:**
```json
{
  "ResponseCode": "0",
  "ResponseDescription": "The service request has been processed successfully.",
  "MerchantRequestID": "xxx",
  "CheckoutRequestID": "ws_CO_DMZ_xxx",
  "ResultCode": 0,
  "ResultDesc": "Success"
}
```

#### GET /api/bookings/:bookingId

**Purpose:** Retrieve booking details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "booking_id": "BK1704067200123",
    "customer_id": "CUST1704067200",
    "service": "hybrid",
    "appointment_date": "2024-06-15",
    "appointment_time": "14:00",
    "phone_number": "254712345678",
    "status": "CONFIRMED",
    "deposit_amount": 350,
    "total_amount": 700,
    "paid_at": "2024-01-15T12:00:00Z"
  }
}
```

#### GET /health

**Purpose:** Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## API Specifications

### Authentication

Currently: None (add JWT for production)

```javascript
// Future implementation
const token = req.headers.authorization.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Auth required |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal error |

### Rate Limiting

- **Limit:** 100 requests per 15 minutes
- **Per:** IP address
- **Applies to:** All endpoints

## Database Schema

### bookings Table

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_phone (phone_number),
    INDEX idx_date (appointment_date)
);
```

**Status Values:**
- `PENDING_PAYMENT` - Waiting for payment
- `CONFIRMED` - Payment confirmed, appointment scheduled
- `FAILED` - Payment failed
- `COMPLETED` - Appointment completed
- `CANCELLED` - Appointment cancelled

### payment_transactions Table

```sql
CREATE TABLE payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    mpesa_code VARCHAR(255),
    status VARCHAR(50),
    response_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    INDEX idx_booking (booking_id)
);
```

## Animation Specifications

### Butterfly Animation System

#### 1. Background Floating Butterflies
- **Count:** 6-8 butterflies
- **Emoji:** 🦋, ✨, 💫 (randomized)
- **Duration:** 6-14 seconds per butterfly
- **Path:** Random X displacement (0-100px), Y descent full screen
- **Opacity:** Fades in at start, fades out at end
- **Trigger:** On page load
- **Removal:** Auto-remove from DOM after animation

#### 2. Cursor-Following Butterflies
- **Emoji:** 🦋
- **Size:** 48px
- **Duration:** 1.5 seconds
- **Path:** Random X/Y offset, ascending
- **Trigger:** On button click
- **Effect:** Sparkle effect with rotation

#### 3. Cascading Butterflies (Success)
- **Count:** 20 butterflies
- **Duration:** 4 seconds total
- **Interval:** Evenly spaced throughout duration
- **Path:** Vertical cascade from top, slight X wobble
- **Effect:** Digital confetti effect

### Page Transitions

- **Type:** Cross-dissolve + subtle slide
- **Duration:** 600ms
- **Easing:** cubic-bezier(0.23, 1, 0.320, 1)
- **Transform:** translateY(20px) → translateY(0)
- **Opacity:** 0 → 1

### Service Card Interactions

- **Hover:** Scale 1.02, glow shadow, shimmer animation
- **Click:** Scale 0.98 (feedback)
- **Select:** Scale 1.05, border highlight
- **Animation Duration:** 300ms

### Button Interactions

- **Hover:** Brightness +10%, shadow increase
- **Click:** Scale 0.98
- **Disabled:** Opacity 50%, cursor not-allowed

## Security Specifications

### Frontend Security

- No sensitive data in localStorage (except session booking)
- HTTPS required for production
- Content Security Policy headers
- XSS protection via input sanitization
- No eval() or innerHTML with user input

### Backend Security

- HTTPS only
- Helmet.js for security headers
- Rate limiting (100 req/15min)
- Input validation on all endpoints
- Prepared statements for SQL (mysql2)
- Environment variables for secrets
- CORS restricted to known origins
- Callback signature verification (M-Pesa)

### M-Pesa Security

- Production credentials never in code
- Webhook URL must be HTTPS
- Implement callback signature verification
- Validate callback authenticity
- One-time transaction processing
- Payment idempotency

### Data Protection

- Personal data encrypted in transit (HTTPS)
- Database backups encrypted
- Payment data not stored (only transaction reference)
- GDPR compliance for customer data
- Regular security audits

## Performance Requirements

### Frontend Performance

| Metric | Target |
|--------|--------|
| Page Load | < 2 seconds |
| FCP (First Contentful Paint) | < 1 second |
| LCP (Largest Contentful Paint) | < 2.5 seconds |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Animation FPS | 60 FPS |

### Backend Performance

| Metric | Target |
|--------|--------|
| API Response Time | < 500ms |
| STK Push Initiation | < 2 seconds |
| Database Query | < 100ms |
| Concurrent Connections | 100+ |

### Optimization Techniques

- GZIP compression enabled
- CSS/JS minification
- Image optimization
- CDN for static assets
- Database query optimization
- Connection pooling (10 connections)
- Caching strategies
- Lazy loading

## Error Handling

### Frontend Error Handling

```javascript
try {
    // Validation
    if (!phone || !amount) {
        throw new Error('Missing required fields');
    }
    
    // API Call
    const response = await fetch('/api/mpesa/stkpush', { /* ... */ });
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'API Error');
    }
    
} catch (error) {
    console.error('Error:', error);
    alert(error.message);
    // User-friendly error handling
}
```

### Backend Error Handling

```javascript
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;
    
    res.status(status).json({ error: message });
});
```

### Error Messages

| Scenario | Message |
|----------|---------|
| Invalid phone | "Please enter a valid M-Pesa phone number" |
| Past date | "Please select a future date" |
| No service selected | "Please select a service above to continue" |
| Network error | "Connection error. Please try again." |
| Payment timeout | "Payment timeout. Please try again." |
| API error | "Request failed. Please try again later." |

## Testing Strategy

### Unit Tests

```bash
jest --coverage
```

### Integration Tests

```javascript
describe('STK Push', () => {
  test('Should initiate payment', async () => {
    const response = await request(app)
      .post('/api/mpesa/stkpush')
      .send({
        phone: '254712345678',
        amount: 500,
        // ...
      });
    
    expect(response.status).toBe(200);
    expect(response.body.checkoutRequestId).toBeDefined();
  });
});
```

### E2E Tests

```bash
# Test full booking flow from UI
cypress run
```

## Monitoring & Logging

### Log Levels

- **ERROR:** Critical issues requiring attention
- **WARN:** Warnings that should be reviewed
- **INFO:** General information
- **DEBUG:** Detailed debugging info

### Metrics to Monitor

- API response times
- Error rate
- Payment success rate
- Database connection health
- Memory usage
- CPU usage
- Request volume

---

**Document Version:** 1.0.0  
**Last Updated:** January 2024
