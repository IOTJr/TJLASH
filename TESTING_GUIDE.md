# Testing Guide - Lashed by Amarah Booking App

Complete guide for testing all features of the booking application.

## Table of Contents

1. [Frontend Testing](#frontend-testing)
2. [Backend Testing](#backend-testing)
3. [M-Pesa Integration Testing](#m-pesa-integration-testing)
4. [Performance Testing](#performance-testing)
5. [Security Testing](#security-testing)
6. [User Acceptance Testing](#user-acceptance-testing)

## Frontend Testing

### Manual Testing Checklist

#### 1. Page Load & Initial State

```
□ Open index.html in browser
□ Verify page loads without errors
□ Check console for JavaScript errors (F12)
□ Verify butterflies animate in background
□ Check responsive layout on mobile/tablet/desktop
□ Confirm all images and fonts load correctly
```

**Expected Result:** 
- App loads smoothly in < 2 seconds
- Butterflies float across screen
- No console errors

#### 2. Service Selection Page

```
□ Click each service card
  □ Classic Lash (500 KES)
  □ Hybrid Lash (700 KES)
  □ Volume Lash (950 KES)
□ Verify card highlights on selection
□ Verify "Continue" button enables after selection
□ Check hover effects on cards
□ Verify card unselects when clicking another
□ Check mobile responsiveness
```

**Expected Result:**
- Cards highlight with glow effect
- Button becomes enabled
- Selected card shows clear indication
- Hover effects smooth and responsive

#### 3. Date & Time Selection Page

```
□ Click "Continue" from services
□ Verify page transition is smooth
□ Check date picker opens
□ Select past date
  □ Should show error: "Please select a future date"
□ Select valid future date
□ Verify time slots appear (16 slots)
□ Click each time slot
  □ Verify selection highlight
□ Verify "Continue to Checkout" enables after time selection
□ Click "Back" button
  □ Should return to service page
□ Verify service and date persist through navigation
```

**Expected Result:**
- Date validation works
- Time slots display correctly
- Navigation buttons work
- Data persists during navigation

#### 4. Checkout Summary Page

```
□ Review displayed information
  □ Service name
  □ Date (formatted)
  □ Time
  □ Total price
□ Test payment method toggle
  □ Click "Full Price" option
    □ Amount updates to full price
    □ Note updates
  □ Click "Deposit" option
    □ Amount updates to 50%
    □ Note updates to show remaining balance
□ Test M-Pesa phone input
  □ Enter "712345678"
  □ Should format to "+254712345678"
  □ Try invalid formats
    □ Should restrict to 9 digits
    □ Should only accept numbers
□ Try submitting without phone
  □ Should show error
□ Click "Back" button
  □ Should return to date selection
```

**Expected Result:**
- All information displays correctly
- Payment method toggle updates amount
- Phone validation works
- Navigation works

#### 5. Payment Processing Page

```
□ Enter phone and click "Pay"
□ Verify transition to payment page
□ Check M-Pesa logo pulse animation
□ Verify countdown timer starts at 60 seconds
□ Check countdown decrements properly
□ Demo test: Click "Demo: Confirm Payment"
□ Verify transition to success page within 2 seconds
```

**Expected Result:**
- Payment page shows correctly
- Timer counts down
- Demo button triggers success flow
- Transitions are smooth

#### 6. Success Page

```
□ Check page displays:
  □ "Lashed by Amarah" logo (animated)
  □ Large green checkmark (animated)
  □ Cascading butterflies (20 total, 4 seconds)
  □ Success message
  □ Booking confirmation details
  □ Before your appointment section
□ Verify butterflies cascade properly
  □ Should fall from top to bottom
  □ Should fade in/out
  □ Should cover full width
□ Check "Return Home" button
  □ Should reset app
  □ Should navigate back to services page
```

**Expected Result:**
- Success page shows all elements
- Butterflies cascade beautifully
- Return button resets app
- All animations play smoothly

#### 7. Responsive Design

```
Mobile (< 640px):
□ Navigate to index.html on mobile device
□ Check single-column layout
□ Verify touch targets are large enough (>44px)
□ Check buttons are easily clickable
□ Verify text is readable (no zooming)
□ Check keyboard doesn't hide inputs
□ Test all navigation flows

Tablet (640-1024px):
□ Check two-column layout
□ Verify spacing is appropriate
□ Test landscape orientation
□ Verify animations still work smoothly

Desktop (>1024px):
□ Check three-column service grid
□ Verify centered layout
□ Check hover states work well
□ Verify animation performance
```

**Expected Result:**
- App works on all screen sizes
- Touch interactions work on mobile
- Layout adapts to viewport
- No horizontal scrolling on mobile

### Automated Frontend Testing

```bash
# Using Selenium or Playwright for automation
# Example: Test service selection flow

const { chromium } = require('playwright');

async function testServiceSelection() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Navigate to app
    await page.goto('http://localhost:8000');
    
    // Click service card
    await page.click('[data-service="hybrid"]');
    
    // Verify button is enabled
    const button = page.locator('#btn-select-service');
    expect(await button.isDisabled()).toBe(false);
    
    // Continue
    await button.click();
    
    // Verify page transition
    expect(await page.locator('#page-date').isVisible()).toBe(true);
    
    await browser.close();
}

testServiceSelection();
```

## Backend Testing

### API Endpoint Testing

#### 1. Health Check

```bash
curl http://localhost:3000/health

Expected Response:
{
  "status": "OK",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

#### 2. STK Push Endpoint

```bash
curl -X POST http://localhost:3000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": 500,
    "bookingId": "BK12345",
    "service": "hybrid",
    "date": "2024-06-15",
    "time": "14:00",
    "customerId": "CUST123"
  }'

Expected Response (Success):
{
  "success": true,
  "message": "STK Push initiated successfully",
  "checkoutRequestId": "ws_CO_DMZ_xxx",
  "responseCode": "0"
}

Expected Response (Error):
{
  "success": false,
  "error": "Missing required fields: phone, amount, bookingId"
}
```

#### 3. Booking Query

```bash
curl http://localhost:3000/api/bookings/BK12345

Expected Response:
{
  "success": true,
  "data": {
    "id": 1,
    "booking_id": "BK12345",
    "status": "PENDING_PAYMENT",
    "service": "hybrid",
    "amount": 500,
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

### Database Testing

```sql
-- Test booking creation
SELECT * FROM bookings WHERE booking_id = 'BK12345';

-- Test payment transaction recording
SELECT * FROM payment_transactions WHERE booking_id = 'BK12345';

-- Test status updates
SELECT booking_id, status, created_at, updated_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;

-- Test data integrity
SELECT COUNT(*) as total_bookings,
       COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
       COUNT(CASE WHEN status = 'PENDING_PAYMENT' THEN 1 END) as pending
FROM bookings;
```

### Performance Testing

```bash
# Test API response time using Apache Bench
ab -n 100 -c 10 http://localhost:3000/health

# Load testing with wrk
wrk -t4 -c100 -d30s http://localhost:3000/health

# API stress test
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/mpesa/stkpush \
    -H "Content-Type: application/json" \
    -d '{"phone":"254712345678","amount":500,"bookingId":"BK'$i'","service":"hybrid","date":"2024-06-15","time":"14:00","customerId":"CUST'$i'"}'
done
```

**Expected Results:**
- Respond in < 500ms
- Handle 100+ concurrent requests
- No memory leaks over 1 hour

## M-Pesa Integration Testing

### Sandbox Testing

#### Step 1: Get Sandbox Credentials

```
Go to: https://sandbox.safaricom.co.ke/
Login with sandbox account
Get:
- Consumer Key
- Consumer Secret
- Business Short Code: 174379
- Pass Key: bfb279f9aa9bdbcf158e97dd1a503b6e
```

#### Step 2: Configure Environment

```bash
# Update .env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_key
MPESA_CONSUMER_SECRET=your_sandbox_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

#### Step 3: Test STK Push

```bash
# Start backend
npm run dev

# In another terminal, test endpoint
curl -X POST http://localhost:3000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254708374149",
    "amount": 500,
    "bookingId": "TEST123",
    "service": "hybrid",
    "date": "2024-06-15",
    "time": "14:00",
    "customerId": "TEST_CUST"
  }'

# Expected: CheckoutRequestID returned
# Check your phone for STK prompt
# Enter PIN: 1234
# Verify payment callback in logs
```

#### Step 4: Test Callback Flow

```javascript
// Simulate M-Pesa callback in Node REPL
const callback = {
  Body: {
    stkCallback: {
      CheckoutRequestID: "ws_CO_DMZ_xxx",
      ResultCode: 0,
      ResultDesc: "The service request has been processed successfully.",
      CallbackMetadata: {
        Item: [
          { Name: "Amount", Value: 500 },
          { Name: "MpesaReceiptNumber", Value: "LHR61H91J0J" },
          { Name: "PhoneNumber", Value: 254708374149 }
        ]
      }
    }
  }
};

// Send to callback endpoint
fetch('http://localhost:3000/api/mpesa/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(callback)
})
.then(r => r.json())
.then(console.log);

// Verify booking status changed to CONFIRMED
```

### Production Testing

**Before going live:**

```
□ Test with production credentials
□ Verify callback URL is HTTPS
□ Verify callback URL is publicly accessible
□ Test with real M-Pesa phone number
□ Test payment confirmation SMS
□ Test with various amounts (10 KES, 1000 KES, etc.)
□ Test error scenarios:
  □ Invalid phone number
  □ Insufficient funds
  □ Payment timeout
  □ Duplicate transactions
□ Verify transaction logs
□ Test refund/reversal if needed
```

## Performance Testing

### Frontend Performance

```javascript
// Browser console
performance.getEntriesByType('navigation').forEach(entry => {
  console.log(`DNS: ${entry.domainLookupEnd - entry.domainLookupStart}ms`);
  console.log(`TCP: ${entry.connectEnd - entry.connectStart}ms`);
  console.log(`TTFB: ${entry.responseStart - entry.requestStart}ms`);
  console.log(`Download: ${entry.responseEnd - entry.responseStart}ms`);
  console.log(`DOM Parse: ${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`);
  console.log(`Total: ${entry.loadEventEnd - entry.fetchStart}ms`);
});
```

**Targets:**
- Page Load: < 2 seconds
- FCP: < 1 second
- LCP: < 2.5 seconds
- Animation: 60 FPS

### Backend Performance

```bash
# Monitor with PM2
pm2 monitor

# Check memory usage
ps aux | grep node

# Monitor CPU
top

# Monitor database
mysql> SHOW PROCESSLIST;
```

**Targets:**
- API Response: < 500ms
- Database Query: < 100ms
- Memory: < 500MB
- CPU: < 50%

## Security Testing

### OWASP Top 10 Testing

#### 1. Injection Testing

```javascript
// SQL Injection test
phone: "'; DROP TABLE bookings; --"

// Expected: Should be rejected or safely escaped
// Verify: Query still works, no data loss
```

#### 2. XSS Testing

```javascript
// Try injecting script
service: "<script>alert('XSS')</script>"

// Expected: Should not execute
// Verify: No alert shown, data safely stored
```

#### 3. CSRF Testing

```bash
# Ensure all state-changing requests use POST
# Verify no CSRF tokens needed (stateless API)
# Test with invalid origin headers
```

#### 4. Authentication Testing

```bash
# Try accessing endpoints without auth
curl http://localhost:3000/api/bookings

# Expected: Should work (no auth required currently)
# Note: Add JWT auth in production
```

#### 5. Rate Limiting Testing

```bash
# Test rate limiting
for i in {1..150}; do
  curl http://localhost:3000/health &
done
wait

# Expected: After 100 requests in 15min, get 429 Too Many Requests
```

### HTTPS/SSL Testing

```bash
# Check SSL configuration
openssl s_client -connect yourdomain.com:443

# Test SSL Labs
# Visit: https://www.ssllabs.com/ssltest/
# Enter: yourdomain.com
# Expected: Grade A or A+
```

### API Security Testing

```bash
# Test CORS
curl -H "Origin: https://evil.com" http://localhost:3000/api/mpesa/stkpush

# Expected: Blocked if not in CORS whitelist

# Test security headers
curl -i http://localhost:3000/health

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

## User Acceptance Testing

### Test Scenarios

#### Scenario 1: Happy Path

```
1. User opens app
2. Selects Hybrid Lash service
3. Chooses future date and time
4. Selects 50% deposit payment
5. Enters M-Pesa phone number
6. Completes payment
7. Sees success screen with butterflies
8. Returns home

Expected: Everything works smoothly, no errors
```

#### Scenario 2: Invalid Inputs

```
1. Try selecting past date
   Expected: Error message
2. Try entering invalid phone
   Expected: Error message
3. Try paying without selecting service
   Expected: Button disabled
4. Try empty phone number
   Expected: Error message

Expected: All validation works correctly
```

#### Scenario 3: Payment Scenarios

```
Scenario A: Successful Payment
- Amount debited from account
- Booking confirmed in system
- SMS confirmation sent
- Success page shown

Scenario B: Failed Payment
- User sees error message
- Booking NOT confirmed
- Able to retry payment
- No duplicate charges

Scenario C: Timeout Payment
- 60-second timer expires
- User option to retry
- Booking in 'pending' state
```

#### Scenario 4: Mobile Experience

```
1. Open app on mobile device
2. Navigate through all pages
3. Type in form fields
4. Click all buttons
5. Check animations play smoothly
6. Verify no horizontal scrolling
7. Check text is readable

Expected: Smooth, lag-free experience on mobile
```

### UAT Checklist

```
□ All pages load correctly
□ All buttons work
□ All forms validate inputs
□ Navigation works both directions
□ Data persists during navigation
□ Animations play smoothly
□ Responsive on mobile/tablet/desktop
□ No console errors
□ All text is readable
□ All images display
□ Buttons have hover states
□ Payment flow works end-to-end
□ Success page shows all elements
□ Can start new booking after success
□ No memory leaks (browser developer tools)
□ Performance is acceptable
□ Error messages are helpful
```

## Testing Tools

### Browser Testing
- Chrome DevTools
- Firefox Developer Tools
- Safari Web Inspector
- Mobile Device Testing

### Automated Testing
- Playwright
- Selenium
- Jest
- Supertest

### Performance Testing
- Google Lighthouse
- WebPageTest
- Apache Bench (ab)
- wrk

### Security Testing
- OWASP ZAP
- Burp Suite
- SSL Labs
- npm audit

### Monitoring
- PM2 Monitoring
- Sentry
- DataDog
- New Relic

---

**Testing Version:** 1.0.0  
**Last Updated:** January 2024
