# 🚀 Quick Start Guide - Lashed by Amarah Booking App

Get up and running with the Lashed by Amarah booking application in minutes!

## 📋 Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (for backend)
- MySQL 5.7+ (for backend)
- M-Pesa merchant account (for production)

## 🎯 5-Minute Quick Start

### Step 1: Open the Frontend

```bash
# Navigate to the app directory
cd lash-booking-app

# Option A: Using Python (built-in)
python -m http.server 8000
# or Python 3
python3 -m http.server 8000

# Option B: Using Node.js http-server
npx http-server

# Open in browser
# http://localhost:8000
```

### Step 2: Test the Demo Flow

1. **Select a Service** 
   - Click any service card (Classic, Hybrid, or Volume)
   - Button becomes enabled

2. **Choose Date & Time**
   - Pick a future date from the calendar
   - Select any available time slot
   - Click "Continue to Checkout"

3. **Review Checkout**
   - See service, date, time, and price
   - Choose payment method:
     - **Full Price**: Pay entire amount (500, 700, or 950 KES)
     - **Deposit**: Pay 50% now, balance at appointment

4. **Enter M-Pesa Number**
   - Enter phone like: 712345678 (without +254)
   - App auto-formats to full number

5. **Initiate Payment**
   - Click "Lipa Na M-Pesa 🚀"
   - App shows payment processing screen
   - Countdown timer for 60 seconds

6. **Demo Confirm Payment**
   - Click **"Demo: Confirm Payment"** button
   - View success page with:
     - Celebratory checkmark
     - Cascading butterfly confetti
     - Booking confirmation details
     - Before your appointment guidelines

7. **Return Home**
   - Click "Return Home"
   - Start new booking

## 🎨 Customizing the App

### Change Services & Prices

Edit `app.js`:

```javascript
this.services = {
    classic: { name: 'Classic Lash', price: 500 },
    hybrid: { name: 'Hybrid Lash', price: 700 },
    volume: { name: 'Volume Lash', price: 950 }
};
```

### Change Business Hours

Edit `index.html`:

```html
<p class="text-gray-700 text-sm mb-2">MON-FRI: <span class="font-semibold">9:00 AM - 6:00 PM</span></p>
<p class="text-gray-700 text-sm mb-2">SAT-SUN: <span class="font-semibold">10:00 AM - 3:00 PM</span></p>
```

### Change Colors

Edit `styles.css`:

```css
:root {
    --pink-soft: #F8C8DC;      /* Main pink */
    --pink-accent: #E96BA8;    /* Hover pink */
    --rose-accent: #D63384;    /* Accent rose */
    --cream: #FFF8F0;          /* Cream background */
}
```

### Adjust Animation Speed

Edit `animations.js`:

```javascript
// Butterfly animation speed
duration: duration || 4 + Math.random() * 2,  // Change these numbers

// Cascade butterflies count
cascadeButterflies(duration = 3, count = 15)  // Increase count for more butterflies
```

## 🔧 Backend Setup (Optional)

For production with real M-Pesa payments:

### Step 1: Install Node.js

```bash
# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
# Download from https://nodejs.org/
```

### Step 2: Install Dependencies

```bash
cd lash-booking-app
npm install
```

### Step 3: Setup Database

```bash
# Install MySQL
# macOS: brew install mysql
# Ubuntu: sudo apt-get install mysql-server
# Windows: Download from https://www.mysql.com/

# Start MySQL
mysql -u root -p

# Create database (copy from MPESA_INTEGRATION.md)
CREATE DATABASE lash_bookings;
USE lash_bookings;
# ... run the SQL from MPESA_INTEGRATION.md
```

### Step 4: Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your values
nano .env  # or edit in VS Code
```

**Minimum required for testing:**

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lash_bookings
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### Step 5: Start Backend

```bash
# Development
npm run dev

# Production
npm start

# Should see:
# ╔══════════════════════════════════════╗
# ║  Lashed by Amarah Backend Running    ║
# ║  Port: 3000                          ║
# ║  Environment: development            ║
# ║  M-Pesa: sandbox                     ║
# ╚══════════════════════════════════════╝
```

### Step 6: Connect Frontend to Backend

Edit `app.js` in `callMpesaAPI()` function:

Uncomment the fetch call:

```javascript
fetch('/api/mpesa/stkpush', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentPayload)
})
.then(response => response.json())
.then(data => {
    console.log('STK Push sent:', data);
    if (!data.success) {
        throw new Error('STK Push failed');
    }
})
.catch(error => {
    console.error('M-Pesa API error:', error);
    alert('Payment initiation failed. Please try again.');
    this.pageManager.transitionTo('page-checkout');
});
```

## 🧪 Testing M-Pesa in Sandbox

1. **Get Test Credentials**
   - Go to [Daraja Sandbox](https://sandbox.safaricom.co.ke/)
   - Use provided test credentials

2. **Use Test Phone Numbers**
   - 254708374149
   - 254722000000
   - 254729674567

3. **Test M-Pesa PIN**
   - PIN: 1234

4. **Full Test Flow**
   ```
   Backend Running: YES
   Frontend: Open at http://localhost:8000
   Select Service: Hybrid
   Choose Date & Time: Any future date/time
   Payment Method: Deposit
   Phone: 708374149 (will become 254708374149)
   Click Pay → Wait for STK on test phone → Enter PIN 1234
   ```

## 📱 Testing on Mobile

```bash
# Get your computer's IP
# macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows: ipconfig

# Access from phone on same network
# http://192.168.x.x:8000
```

## 🐛 Troubleshooting

### Issue: Butterflies not showing

**Solution:**
- Refresh page
- Check browser console (F12)
- Ensure GSAP CDN loads correctly
- Try in incognito mode

### Issue: Cannot connect to backend

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3000/health

# Should return: {"status":"OK","timestamp":"..."}

# If not, restart backend
npm run dev
```

### Issue: Database connection error

**Solution:**
```bash
# Check MySQL is running
# macOS: brew services start mysql-server
# Ubuntu: sudo systemctl start mysql
# Windows: Start MySQL service

# Verify credentials in .env
# Test connection: mysql -u root -p -h localhost lash_bookings
```

### Issue: M-Pesa callback not received

**Solution:**
- Ensure backend is publicly accessible (not localhost)
- Use ngrok for testing: `ngrok http 3000`
- Update `MPESA_CALLBACK_URL` in environment
- Verify URL is HTTPS in production

## 📚 Documentation

- **README.md** - Full feature documentation
- **MPESA_INTEGRATION.md** - Backend setup and M-Pesa integration
- **DEPLOYMENT.md** - Production deployment guide
- **API Reference** - In MPESA_INTEGRATION.md

## 🎬 Demo Credentials

**For Testing (Sandbox):**

```
Short Code: 174379
Pass Key: bfb279f9aa9bdbcf158e97dd1a503b6e
Test Phone: 254708374149
Test PIN: 1234
```

**For Production:**
- Get from Safaricom Daraja
- [Apply here](https://developer.safaricom.co.ke/)

## 🚀 Deploy to Production

### Quick Deploy (Netlify)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy frontend
netlify deploy

# Follow prompts
# Your site will be live!
```

### Deploy Backend (Heroku)

```bash
# Install Heroku CLI
# Follow their setup

heroku create lashed-by-amarah-api
heroku config:set MPESA_CONSUMER_KEY=xxx
# ... set all env vars
git push heroku main
```

See **DEPLOYMENT.md** for full production guide.

## 💡 Next Steps

1. ✅ **Frontend Ready** - App is ready to use as-is
2. 🔧 **Backend Setup** - Install if you need real payments
3. 🔐 **Get M-Pesa Credentials** - Apply at Daraja API
4. 🌐 **Deploy** - Follow DEPLOYMENT.md for hosting
5. 📊 **Add Admin Dashboard** - Manage bookings and analytics

## 🎨 Customization Tips

| What to Change | Where | Example |
|---|---|---|
| Colors | styles.css | `--pink-soft: #F8C8DC;` |
| Fonts | styles.css | `.font-script { font-family: ... }` |
| Services | app.js | `this.services = { ... }` |
| Hours | index.html | `<p>MON-FRI: 9:00 AM - 6:00 PM</p>` |
| Contact | index.html | Update email, phone, Instagram |
| Animations | animations.js | Change `duration`, `count`, etc |

## 🆘 Getting Help

### Common Questions

**Q: How do I change the pink color?**
A: Edit `styles.css` and change `--pink-soft: #F8C8DC;` to your color

**Q: Can I add more services?**
A: Yes! Add to `this.services` in `app.js` and add a service card to `index.html`

**Q: How do I test M-Pesa without a phone?**
A: Use the demo button to simulate payment confirmation

**Q: How do I make the butterflies bigger/smaller?**
A: Change `font-size` in `.butterfly` class in CSS

### Resources

- [M-Pesa API Docs](https://developer.safaricom.co.ke/docs)
- [Safaricom Daraja](https://developer.safaricom.co.ke/)
- [GSAP Animation Docs](https://gsap.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

## ✨ Tips for Success

1. **Test Thoroughly** - Try all flows before going live
2. **Backup Database** - Set up automated backups
3. **Monitor Logs** - Watch for errors in production
4. **User Testing** - Have real users test before launch
5. **Customer Support** - Have SMS/Email support ready

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** ✅ Production Ready

**Built with 💋✨ for Lashed by Amarah**
