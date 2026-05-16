/**
 * Lashed by Amarah - Main Application
 * Booking system with M-Pesa payment integration
 */

class LashBookingApp {
    constructor() {
        this.bookingData = {
            service: null,
            servicePrice: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null,
            date: null,
            time: null,
            paymentMethod: 'deposit',
            mpesaPhone: null,
            depositAmount: null,
            totalAmount: null,
            invoiceId: null,
            checkoutId: null,
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
        this.pageManager = window.pageManager || null;

        if (this.pageManager) {
            this.pageManager.onPageEnter('page-services');
        } else {
            console.warn('PageManager not ready, deferring initialization');
            setTimeout(() => this.initializeAfterPageManager(), 100);
        }
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
            if (!this.validateCustomerInfo()) {
                alert('Please enter your name, phone number and a valid email before continuing.');
                return;
            }

            const fromEl = this.bookingData.selectedCardElement || null;
            if (this.pageManager && typeof this.pageManager.animateServiceTransition === 'function') {
                this.pageManager.animateServiceTransition(fromEl, 'page-date');
            } else {
                this.pageManager?.transitionTo?.('page-date');
            }
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

        // Customer info inputs (if present)
        const nameEl = document.getElementById('customer-name');
        const phoneEl = document.getElementById('customer-phone');
        const emailEl = document.getElementById('customer-email');

        if (nameEl) {
            nameEl.addEventListener('input', (e) => {
                this.bookingData.customerName = e.target.value.trim();
                this.updateContinueButtonState();
            });
        }

        if (phoneEl) {
            phoneEl.addEventListener('input', (e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                e.target.value = cleaned.slice(0, 9);
                this.bookingData.customerPhone = '+254' + e.target.value;
                this.updateContinueButtonState();
            });
        }

        if (emailEl) {
            emailEl.addEventListener('input', (e) => {
                this.bookingData.customerEmail = e.target.value.trim();
                this.updateContinueButtonState();
            });
        }

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
            c.classList.remove('selected');
            c.style.transform = 'scale(1)';
            const inner = c.querySelector(':scope > div');
            if (inner) {
                inner.style.borderWidth = '2px';
                inner.style.boxShadow = '';
            }
        });

        // Add selection styling
        card.classList.add('selected');
        card.style.transform = 'scale(1.05)';
        const selectedInner = card.querySelector(':scope > div') || card;
        selectedInner.style.borderWidth = '3px';
        gsap.to(selectedInner, {
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

        const serviceLabel = this.services[service]?.name || 'Selected Service';
        const serviceDisplay = document.getElementById('service-display');
        if (serviceDisplay) {
            serviceDisplay.textContent = `${serviceLabel} - ${price} KES`;
        }

        // Reveal customer info form and keep continue disabled until the fields are filled
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.classList.remove('hidden');
        }
        const continueBtn = document.getElementById('btn-select-service');
        this.updateContinueButtonState();
        
        // Create particle effect
        if (this.pageManager?.particleEngine) {
            const rect = card.getBoundingClientRect();
            this.pageManager.particleEngine.createFloatingParticles(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                12
            );
        }

        gsap.to(continueBtn, {
            duration: 0.3,
            opacity: 1,
            scale: 1.05
        });
    }

    /**
     * Check if customer info inputs are valid
     */
    validateCustomerInfo() {
        const name = this.bookingData.customerName || '';
        const phone = (this.bookingData.customerPhone || '').replace(/\D/g, '');
        const email = this.bookingData.customerEmail || '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (name.length < 2) return false;
        if (phone.length < 9) return false;
        if (!emailRegex.test(email)) return false;

        return true;
    }

    /**
     * Enable or disable the continue button based on service selection and contact validity
     */
    updateContinueButtonState() {
        const continueBtn = document.getElementById('btn-select-service');
        if (!continueBtn) {
            return;
        }

        const serviceSelected = !!this.bookingData.service;
        const contactValid = this.validateCustomerInfo();
        continueBtn.disabled = !(serviceSelected && contactValid);
    }

    /**
     * Generate available time slots
     */
    generateTimeSlots() {
        const container = document.getElementById('time-slots');
        container.innerHTML = '';

        this.availableTimes.forEach((time, index) => {
            const slot = document.createElement('button');
            slot.className = 'time-slot';
            slot.textContent = time;
            slot.type = 'button';
            slot.style.opacity = '0';
            slot.style.animationDelay = (index * 0.05) + 's';
            
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => {
                    s.classList.remove('selected');
                    gsap.to(s, { duration: 0.2, scale: 1 });
                });
                slot.classList.add('selected');
                gsap.to(slot, { duration: 0.3, scale: 1.1 });
                
                this.bookingData.time = time;
                
                // Create particle effect
                const rect = slot.getBoundingClientRect();
                this.pageManager.particleEngine.createFloatingParticles(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    6
                );

                document.getElementById('btn-continue-checkout').disabled = false;
                
                // Animate button
                gsap.to(document.getElementById('btn-continue-checkout'), {
                    duration: 0.3,
                    scale: 1.05
                });
            });

            // Animate in the slot
            gsap.to(slot, {
                duration: 0.4,
                opacity: 1,
                delay: index * 0.05,
                ease: 'back.out'
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

        // Create confetti effect on payment initiation
        this.pageManager.particleEngine.createFloatingParticles(
            payButton.getBoundingClientRect().left + payButton.getBoundingClientRect().width / 2,
            payButton.getBoundingClientRect().top + payButton.getBoundingClientRect().height / 2,
            15
        );

        // Show loading state
        payButton.textContent = 'Processing... 🔄';
        payButton.disabled = true;

        // Transition to payment processing page
        setTimeout(() => {
            this.pageManager.transitionTo('page-payment');
            this.pageManager.onPageEnter('page-payment');

            // In production, this would call your backend M-Pesa endpoint
            this.callMpesaAPI();

            // Set timeout for demo (60 seconds)
            this.startPaymentTimeout();

            // Reset button
            payButton.textContent = 'Lipa Na M-Pesa 🚀';
            payButton.disabled = false;
        }, 300);
    }

    /**
     * Call IntaSend API (Backend Integration)
     */
    async callMpesaAPI() {
        const paymentPayload = {
            phone: this.bookingData.mpesaPhone,
            amount: this.bookingData.depositAmount,
            bookingId: this.bookingData.bookingId,
            service: this.bookingData.service,
            date: this.bookingData.date,
            time: this.bookingData.time,
            customerId: this.generateCustomerId(),
            customerName: this.bookingData.customerName,
            email: this.bookingData.customerEmail
        };

        console.log('Calling IntaSend API with payload:', paymentPayload);

        try {
            const response = await fetch('/api/mpesa/stkpush', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentPayload)
            });

            const data = await response.json();

            console.log('IntaSend STK Push sent:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'IntaSend STK Push failed');
            }

            this.bookingData.invoiceId = data.invoiceId || null;
            this.bookingData.checkoutId = data.checkoutId || null;

            const confirmation = [
                this.bookingData.invoiceId ? `Invoice: ${this.bookingData.invoiceId}` : null,
                this.bookingData.checkoutId ? `Checkout: ${this.bookingData.checkoutId}` : null
            ].filter(Boolean).join(' | ');

            const paymentMessage = document.getElementById('payment-note');
            if (paymentMessage && confirmation) {
                paymentMessage.textContent = `IntaSend request sent. ${confirmation}`;
            }

            return data;
        } catch (error) {
            console.error('IntaSend API error:', error);
            alert('Payment initiation failed. Please try again.');
            this.pageManager.transitionTo('page-checkout');
            return null;
        }
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

        // Create delayed particle bursts for celebration effect
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.pageManager.particleEngine.createConfetti(30);
                }, i * 300);
            }
        }, 600);

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
            customerName: null,
            customerPhone: null,
            customerEmail: null,
            date: null,
            time: null,
            paymentMethod: 'deposit',
            mpesaPhone: null,
            depositAmount: null,
            totalAmount: null,
            invoiceId: null,
            checkoutId: null,
            bookingId: null
        };

        // Reset UI
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
            card.style.transform = 'scale(1)';
            const inner = card.querySelector(':scope > div');
            if (inner) {
                inner.style.borderWidth = '2px';
                inner.style.boxShadow = '';
            }
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

    /**
     * Ensure pageManager is attached once available
     */
    initializeAfterPageManager() {
        if (window.pageManager) {
            this.pageManager = window.pageManager;
            this.pageManager.onPageEnter('page-services');
        } else {
            setTimeout(() => this.initializeAfterPageManager(), 100);
        }
    }
}

/**
 * Initialize application when DOM is ready
 */
function initApp() {
    try {
        window.lashApp = new LashBookingApp();
        console.log('Lashed by Amarah Booking App Initialized');
    } catch (e) {
        console.error('Failed to initialize LashBookingApp', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

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
