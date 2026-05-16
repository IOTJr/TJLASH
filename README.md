# 💋✨ Lashed by Amarah - Booking Application

A enchanted, mobile-first lash appointment booking application with animated butterflies, smooth transitions, and integrated M-Pesa payment processing.

## Features

✨ **Enchanted Visual Experience**
- Soft pink (#F8C8DC) and cream aesthetic
- Elegant script typography ("Brush Script MT")
- Floating and cascading butterfly animations
- Smooth page transitions with GSAP
- Luminous glowing effects and hover interactions

🦋 **Signature Animations**
- Background floating butterflies on page load
- Cursor-following butterflies on button clicks
- Cascading butterfly confetti on success
- Shimmer and glow effects on interactive elements
- Smooth cross-dissolve transitions between pages

📱 **Service Selection**
- Three service tiers: Classic, Hybrid, Volume
- Dynamic pricing (500, 700, 950 KES)
- Visual hover effects with scale and shadow
- Instant service information display

📅 **Date & Time Selection**
- Interactive date picker
- 16 available time slots per day
- Date validation (no past dates)
- Visual feedback for selected slots

💳 **Smart Checkout**
- Dynamic price calculation
- Two payment options:
  - Full price payment
  - 50% mandatory deposit
- Real-time amount updates
- M-Pesa phone number validation

🚀 **M-Pesa Integration**
- STK Push payment initiation
- Animated payment processing state
- Countdown timer for payment timeout
- Success confirmation with booking details
- Demo mode for testing (click "Demo: Confirm Payment")

✓ **Success State**
- Large animated checkmark
- Cascading butterfly confetti effect
- Booking confirmation details
- "Before Your Appointment" guidelines
- Professional confirmation message

## Project Structure

```
lash-booking-app/
├── index.html              # Main HTML with complete page structure
├── styles.css              # Custom CSS animations and styling
├── app.js                  # Main application logic and state management
├── animations.js           # Butterfly and transition animations
├── MPESA_INTEGRATION.md    # Backend integration guide
└── README.md              # This file
```

## Quick Start

### 1. Opening the Application

Simply open `index.html` in a modern web browser:

```bash
# Using Python server (recommended)
python -m http.server 8000
# or
python3 -m http.server 8000

# Then visit: http://localhost:8000
```

Or use any local server (VS Code Live Server, Node.js http-server, etc.)

### 2. Using the Demo

The app includes a demo mode for testing:

1. **Service Selection**: Click any service card (Classic, Hybrid, or Volume)
2. **Date & Time**: Select a future date and time slot
3. **Checkout**: Choose payment method (full or deposit)
4. **M-Pesa Phone**: Enter any phone number starting with 7-9 (e.g., 712345678)
5. **Click "Lipa Na M-Pesa"**: This initiates the payment flow
6. **On Payment Page**: Click **"Demo: Confirm Payment"** button to simulate M-Pesa callback
7. **Success!**: View the success state with cascading butterflies

## User Flow

```
1. Welcome Page (Services)
   ↓ [Select service]
   ↓
2. Date & Time Selection
   ↓ [Select date and time]
   ↓
3. Checkout Summary
   ↓ [Choose payment method, enter M-Pesa phone]
   ↓
4. Payment Processing
   ↓ [Customer enters M-Pesa PIN on phone]
   ↓
5. Success Confirmation
   ↓ [Show booking details and guidelines]
```

## Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Tailwind CSS + Custom animations
- **JavaScript**: Vanilla JS (no frameworks)
- **Animation**: GSAP 3.12.2 (GreenSock Animation Platform)
- **Styling**: Tailwind CSS (CDN)
- **Backend Ready**: Node.js/Express integration examples provided

## Configuration

### Services Configuration

Edit service details in `app.js`:

```javascript
this.services = {
    classic: { name: 'Classic Lash', price: 500 },
    hybrid: { name: 'Hybrid Lash', price: 700 },
    volume: { name: 'Volume Lash', price: 950 }
};
```

### Available Time Slots

Edit in `app.js`:

```javascript
this.availableTimes = [
    '09:00', '09:30', '10:00', '10:30', // ... etc
];
```

### Business Hours & Contact

Edit in `index.html` - update these sections:

```html
<h4 class="text-pink-500 font-bold text-lg mb-4">⏰ HOURS</h4>
<!-- MON-FRI: 9:00 AM - 6:00 PM -->
<!-- SAT-SUN: 10:00 AM - 3:00 PM -->

<h4 class="text-pink-500 font-bold text-lg mb-4">📱 CONTACT</h4>
<!-- Update email, phone, Instagram -->
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

**Note**: Requires JavaScript enabled. CSS Grid and CSS Custom Properties support needed.

## IntaSend Integration

For production deployment with real IntaSend payments:

1. **Create / sign in to your IntaSend account**
   - You need an active merchant account to use the secret key and receive webhooks.

2. **Set the environment variables**
   - `INTASEND_SECRET_KEY`
   - `INTASEND_PUBLISHABLE_KEY`
   - `INTASEND_ENVIRONMENT=production`
   - `INTASEND_BASE_URL=https://api.intasend.com`
   - `INTASEND_WEBHOOK_URL=https://lash-booking-app.vercel.app/api/intasend/webhook`

3. **Webhook endpoint**
   - Use `https://lash-booking-app.vercel.app/api/intasend/webhook` in the IntaSend dashboard.
   - IntaSend sends payment collection events to this URL when the payment state changes.

4. **Local development**
   - Copy `.env.example` to `.env.local` and fill in the IntaSend values.
   - Keep the file out of git; it is already ignored.

5. **Test the flow**
   - Start the app locally.
   - Trigger STK push from the payment page.
   - Confirm the webhook and status polling update the booking automatically.

See `MPESA_INTEGRATION.md` for the older M-Pesa notes. The live integration now uses IntaSend.

## Customization

### Colors

Update the color palette in `styles.css`:

```css
:root {
    --pink-soft: #F8C8DC;
    --pink-accent: #E96BA8;
    --rose-accent: #D63384;
    --cream: #FFF8F0;
    --gold-accent: #D4AF37;
}
```

### Fonts

Change script font in `styles.css`:

```css
.font-script {
    font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
}
```

### Animations

Modify butterfly behavior in `animations.js`:

```javascript
// Create floating butterflies on page load
createFloatingButterflies(count = 8)

// Cascade butterflies on success
cascadeButterflies(duration = 3, count = 15)

// Duration and timing of animations
gsap.to(element, {
    duration: 0.6,  // Change duration
    // ... other properties
});
```

## Performance Optimization

- Animations use GSAP with GPU acceleration
- Butterflies are removed from DOM after animation completes
- CSS transforms used for smooth animations
- Lazy loading of animations on page transitions
- Minimal DOM manipulation

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus states for buttons and inputs
- Reduced motion media query support

## Data Storage

The app stores booking data locally during the session:

```javascript
// Session storage (cleared on browser close)
sessionStorage.setItem('booking', JSON.stringify(bookingData));

// Local storage (persistent - demo purposes)
localStorage.setItem('lastBooking', JSON.stringify(bookingData));
localStorage.setItem('lastPayment', JSON.stringify(paymentData));
```

## API Integration Points

The app is designed to integrate with a backend via these endpoints:

1. **POST /api/mpesa/stkpush** - Initiate M-Pesa payment
2. **POST /api/mpesa/callback** - Receive M-Pesa payment confirmation
3. **POST /api/mpesa/query** - Check payment status

See `MPESA_INTEGRATION.md` for full implementation details.

## Troubleshooting

### Butterflies not animating?
- Ensure GSAP CDN is loaded
- Check browser console for JavaScript errors
- Verify JavaScript is enabled

### Page transitions not smooth?
- Check CSS animations are not disabled
- Ensure animations.js is loaded
- Verify page-section elements have proper classes

### Payment flow not working?
- Check if using HTTP (some features require HTTPS)
- Verify backend M-Pesa integration is active
- Use demo button for testing without backend

### Phone validation failing?
- Ensure phone number starts with 7-9 (for 7xx-xxx-xxx format)
- Remove any spaces or special characters
- Example valid format: 712345678

## Development Tips

### Enable Debug Mode

Add to browser console:

```javascript
// View current booking data
console.log(window.lashApp.bookingData);

// Manually set booking data
window.lashApp.bookingData.service = 'hybrid';

// Trigger success manually
window.lashApp.handlePaymentSuccess();

// Auto-confirm payment after 5 seconds
window.demoAutoConfirm(5);
```

### Inspect Stored Data

```javascript
// View last booking
JSON.parse(localStorage.getItem('lastBooking'));

// View last payment
JSON.parse(localStorage.getItem('lastPayment'));
```

## Mobile Responsiveness

The app is fully responsive:
- **Mobile (< 640px)**: Single column layout, touch-optimized buttons
- **Tablet (640px - 1024px)**: Two column layout
- **Desktop (> 1024px)**: Full three column grid

Test on mobile devices for optimal experience.

## Security Notes

⚠️ **This demo application:**
- Does NOT transmit sensitive data without HTTPS
- Uses client-side validation only (implement server-side validation)
- Should NOT be used in production without proper security measures
- Does not implement CSRF protection

**For production:**
1. Always use HTTPS
2. Implement server-side validation
3. Use secure API authentication
4. Follow M-Pesa security best practices
5. Implement proper error handling
6. Never expose API keys in frontend code

## License

This is a custom project for "Lashed by Amarah". 

## Support & Questions

For M-Pesa integration help:
- See `MPESA_INTEGRATION.md`
- Visit [Safaricom Daraja Docs](https://developer.safaricom.co.ke/)

For design customizations:
- Modify `styles.css` for colors/fonts
- Edit `index.html` for layout
- Update `animations.js` for effects

---

**Built with 💋✨ for Lashed by Amarah**

*Transform your lash business with an enchanted booking experience.*
