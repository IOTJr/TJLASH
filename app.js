/**
 * Lashed by Amarah - Main Application
 * Booking system with M-Pesa payment integration
 */

class LashBookingApp {
    constructor() {
        this.bookingData = {
            service: null,
            servicePrice: null,
            date: null,
            time: null,
            paymentMethod: 'deposit',
            mpesaPhone: null,
            depositAmount: null,
            totalAmount: null,
            bookingId: null
        };

        this.services = {
            classic: { name: 'Classic Lash', price: 500 },
            hybrid: { name: 'Hybrid Lash', price: 700 },
            volume: { name: 'Volume Lash', price: 950 }
        };

        this.availableTimes = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30'
        ];

        this.initializeEventListeners();
        this.pageManager = window.pageManager;
        this.pageManager.onPageEnter('page-services');
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Service Selection
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => this.selectService(card));
        });

        // Service Page Navigation with butterfly transition
        document.getElementById('btn-select-service').addEventListener('click', () => {
            const fromEl = this.bookingData.selectedCardElement || null;
            this.pageManager.animateServiceTransition(fromEl, 'page-date');
            // generate time slots after a short delay to allow transition
            setTimeout(() => this.generateTimeSlots(), 700);
        });

        // Date Page Navigation
        document.getElementById('btn-back-services').addEventListener('click', () => {
            this.pageManager.transitionTo('page-services');
            this.pageManager.onPageEnter('page-services');
        });

        document.getElementById('btn-continue-checkout').addEventListener('click', () => {
            if (this.validateDateSelection()) {
                this.updateCheckoutSummary();
                this.pageManager.transitionTo('page-checkout');
                this.pageManager.onPageEnter('page-checkout');
            }
        });

        // Checkout Page Navigation
        document.getElementById('btn-back-date').addEventListener('click', () => {
            this.pageManager.transitionTo('page-date');
            this.pageManager.onPageEnter('page-date');
        });

        // Date Picker
        document.getElementById('date-picker').addEventListener('change', (e) => {
            this.bookingData.date = e.target.value;
            this.validateDateSelection();
        });

        // Payment Method Selection
        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.bookingData.paymentMethod = e.target.value;
                this.updatePaymentAmount();
            });
        });

        // M-Pesa Phone Input
        document.getElementById('mpesa-phone').addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            const formatted = value.slice(0, 9);
            e.target.value = formatted;
            this.bookingData.mpesaPhone = '+254' + formatted;
        });

        // Pay Deposit Button
        document.getElementById('btn-pay-deposit').addEventListener('click', () => {
            this.initiateMpesaPayment();
        });

        // Demo Confirm Button
        document.getElementById('btn-demo-confirm').addEventListener('click', () => {
            this.handlePaymentSuccess();
        });

        // Home Button (Success Page)
        document.getElementById('btn-home').addEventListener('click', () => {
            this.resetBooking();
            this.pageManager.transitionTo('page-services');
            this.pageManager.onPageEnter('page-services');
        });
    }

    /**
     * Handle service selection
     */
    selectService(card) {
        // Remove previous selection
        document.querySelectorAll('.service-card').forEach(c => {
            c.style.transform = 'scale(1)';
            c.style.borderWidth = '2px';
        });

        // Add selection styling
        card.style.transform = 'scale(1.05)';
        card.style.borderWidth = '3px';
        gsap.to(card, {
            duration: 0.3,
            boxShadow: '0 0 30px rgba(233, 107, 168, 0.5)'
        });

        // Store booking data
        const service = card.dataset.service;
        const price = parseInt(card.dataset.price);
        this.bookingData.service = service;
        this.bookingData.servicePrice = price;
        // store selected element for transitions
        this.bookingData.selectedCardElement = card;

        // Enable continue button
        document.getElementById('btn-select-service').disabled = false;
        gsap.to(document.getElementById('btn-select-service'), {
            duration: 0.3,
            opacity: 1
        });
    }

    /**
     * Generate available time slots
     */
    generateTimeSlots() {
        const container = document.getElementById('time-slots');
        container.innerHTML = '';

        this.availableTimes.forEach(time => {
            const slot = document.createElement('button');
            slot.className = 'time-slot';
            slot.textContent = time;
            slot.type = 'button';
            
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                this.bookingData.time = time;
                document.getElementById('btn-continue-checkout').disabled = false;
            });

            container.appendChild(slot);
        });
    }

    /**
     * Validate date selection
     */
    validateDateSelection() {
        if (!this.bookingData.date || !this.bookingData.time) {
            alert('Please select both a date and time.');
            return false;
        }

        const selectedDate = new Date(this.bookingData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert('Please select a future date.');
            this.bookingData.date = null;
            document.getElementById('date-picker').value = '';
            return false;
        }

        return true;
    }

    /**
     * Update checkout summary
     */
    updateCheckoutSummary() {
        const serviceName = this.services[this.bookingData.service].name;
        const formattedDate = new Date(this.bookingData.date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        document.getElementById('checkout-service').textContent = serviceName;
        document.getElementById('checkout-date').textContent = formattedDate;
        document.getElementById('checkout-time').textContent = this.bookingData.time;
        document.getElementById('total-amount').textContent = this.bookingData.servicePrice + ' KES';

        // Update payment options
        const fullPrice = this.bookingData.servicePrice;
        const depositPrice = Math.ceil(fullPrice / 2);

        document.getElementById('full-price').textContent = fullPrice + ' KES';
        document.getElementById('deposit-price').textContent = depositPrice + ' KES';

        // Set default to deposit
        this.updatePaymentAmount();
    }

    /**
     * Update payment amount based on selection
     */
    updatePaymentAmount() {
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const totalPrice = this.bookingData.servicePrice;
        let amountToPay;
        let note;

        if (paymentMethod === 'full') {
            amountToPay = totalPrice;
            note = 'Full payment. See you at your appointment!';
            this.bookingData.depositAmount = totalPrice;
        } else {
            amountToPay = Math.ceil(totalPrice / 2);
            const balance = totalPrice - amountToPay;
            note = `50% deposit. Balance: ${balance} KES at appointment`;
            this.bookingData.depositAmount = amountToPay;
        }

        document.getElementById('payment-amount').textContent = amountToPay + ' KES';
        document.getElementById('payment-note').textContent = note;
    }

    /**
     * Validate payment inputs
     */
    validatePaymentInputs() {
        const phone = document.getElementById('mpesa-phone').value;

        if (!phone || phone.length < 9) {
            alert('Please enter a valid M-Pesa phone number');
            return false;
        }

        if (!this.bookingData.depositAmount) {
            alert('Payment amount not set');
            return false;
        }

        return true;
    }

    /**
     * Initiate M-Pesa payment
     */
    initiateMpesaPayment() {
        if (!this.validatePaymentInputs()) {
            return;
        }

        // Generate booking ID
        this.bookingData.bookingId = this.generateBookingId();

        // Trigger pay button animation
        const payButton = document.getElementById('btn-pay-deposit');
        gsap.to(payButton, {
            duration: 0.3,
            scale: 0.95
        });

        // Transition to payment processing page
        this.pageManager.transitionTo('page-payment');
        this.pageManager.onPageEnter('page-payment');

        // In production, this would call your backend M-Pesa endpoint
        this.callMpesaAPI();

        // Set timeout for demo (60 seconds)
        this.startPaymentTimeout();
    }

    /**
     * Call M-Pesa API (Backend Integration)
     */
    callMpesaAPI() {
        const paymentPayload = {
            phone: this.bookingData.mpesaPhone,
            amount: this.bookingData.depositAmount,
            bookingId: this.bookingData.bookingId,
            service: this.bookingData.service,
            date: this.bookingData.date,
            time: this.bookingData.time,
            customerId: this.generateCustomerId()
        };

        console.log('Calling M-Pesa API with payload:', paymentPayload);

        // In production:
        /*
        fetch('/api/mpesa/stkpush', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN'
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
        */
    }

    /**
     * Handle M-Pesa payment success (called via webhook or demo button)
     */
    handlePaymentSuccess() {
        // Stop timeout counter
        if (this.paymentTimeoutId) {
            clearInterval(this.paymentTimeoutId);
        }

        // Prepare success data
        const successData = {
            bookingId: this.bookingData.bookingId,
            reference: 'MPE' + this.bookingData.bookingId,
            amount: this.bookingData.depositAmount,
            phone: this.bookingData.mpesaPhone,
            timestamp: new Date().toLocaleString()
        };

        // Save to local storage (demo purposes)
        localStorage.setItem('lastBooking', JSON.stringify(this.bookingData));
        localStorage.setItem('lastPayment', JSON.stringify(successData));

        // Transition to success page
        this.pageManager.transitionTo('page-success');
        this.pageManager.onPageEnter('page-success');

        // Update success page with booking details
        document.getElementById('confirmation-details').textContent = 
            `Booking ID: ${successData.bookingId} | Confirmed: ${successData.timestamp}`;
    }

    /**
     * Start payment timeout counter
     */
    startPaymentTimeout() {
        let timeRemaining = 60;
        const counter = document.getElementById('timeout-counter');

        this.paymentTimeoutId = setInterval(() => {
            timeRemaining--;
            counter.textContent = timeRemaining;

            if (timeRemaining <= 0) {
                clearInterval(this.paymentTimeoutId);
                alert('Payment timeout. Please try again.');
                this.pageManager.transitionTo('page-checkout');
                this.pageManager.onPageEnter('page-checkout');
            }
        }, 1000);
    }

    /**
     * Generate unique booking ID
     */
    generateBookingId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `BK${timestamp}${random}`.slice(-10);
    }

    /**
     * Generate customer ID
     */
    generateCustomerId() {
        return 'CUST' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    /**
     * Reset booking data
     */
    resetBooking() {
        this.bookingData = {
            service: null,
            servicePrice: null,
            date: null,
            time: null,
            paymentMethod: 'deposit',
            mpesaPhone: null,
            depositAmount: null,
            totalAmount: null,
            bookingId: null
        };

        // Reset UI
        document.querySelectorAll('.service-card').forEach(card => {
            card.style.transform = 'scale(1)';
            card.style.borderWidth = '2px';
        });

        document.getElementById('btn-select-service').disabled = true;
        document.getElementById('btn-continue-checkout').disabled = true;
        document.getElementById('date-picker').value = '';
        document.getElementById('mpesa-phone').value = '';
        document.getElementById('time-slots').innerHTML = '';

        // Reset payment method to deposit
        document.querySelector('input[name="payment-method"][value="deposit"]').checked = true;
    }

    /**
     * Export booking data for API integration
     */
    getBookingPayload() {
        return {
            bookingDetails: this.bookingData,
            metadata: {
                createdAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
                appVersion: '1.0.0'
            }
        };
    }
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    window.lashApp = new LashBookingApp();
    console.log('Lashed by Amarah Booking App Initialized');
});

/**
 * M-Pesa Webhook Handler (For backend integration)
 * This would be called from your backend when M-Pesa sends the callback
 */
window.handleMpesaCallback = function(callbackData) {
    console.log('M-Pesa Callback Received:', callbackData);

    if (callbackData.resultCode === 0) {
        // Payment successful
        window.lashApp.handlePaymentSuccess();
    } else {
        // Payment failed
        alert('Payment failed: ' + (callbackData.resultDesc || 'Unknown error'));
        window.pageManager.transitionTo('page-checkout');
    }
};

/**
 * Demo: Trigger payment success after 5 seconds
 * Remove this in production
 */
window.demoAutoConfirm = function(delaySeconds = 5) {
    setTimeout(() => {
        if (window.lashApp) {
            window.lashApp.handlePaymentSuccess();
        }
    }, delaySeconds * 1000);
};
