/**
 * Application Configuration Module
 * Centralized configuration with environment support
 */

const AppConfig = (() => {
    // Environment detection
    const ENV = {
        isDev: !window.location.hostname.includes('vercel') && !window.location.hostname.includes('pages'),
        isProd: window.location.protocol === 'https:',
        isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    };

    // Service definitions
    const SERVICES = {
        classic: {
            id: 'classic',
            name: 'Classic Lash',
            description: 'Soft and wispy. Perfect for a natural look that enhances your features.',
            price: 500,
            icon: '✨',
            color: 'pink',
            image: 'images/Classic%20-%20B%20-%20B%20_%20_15mm%20_%20Mixed%2012-13.jpg'
        },
        hybrid: {
            id: 'hybrid',
            name: 'Hybrid Lash',
            description: 'Bold and defined. The perfect blend of classic and volume for impact.',
            price: 700,
            icon: '💫',
            color: 'pink-600',
            image: 'images/HYBRID%20EYELASH%20EXTENSIONS.jpg'
        },
        volume: {
            id: 'volume',
            name: 'Volume Lash',
            description: 'Dramatic and glamorous. Full lash volume for maximum beauty impact.',
            price: 950,
            icon: '⭐',
            color: 'rose',
            image: 'images/Mega%20volume.jpg'
        }
    };

    // Business hours
    const HOURS = {
        MON_FRI: { start: '09:00', end: '18:00' },
        SAT_SUN: { start: '10:00', end: '15:00' },
        LUNCH: { start: '12:30', end: '14:00' }
    };

    // Appointment duration (in minutes)
    const APPOINTMENT_DURATION = 90;

    // Available time slots
    const TIME_SLOTS = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
    ];

    // Payment configuration
    const PAYMENT = {
        depositPercentage: 0.5, // 50% deposit
        mpesaTimeout: 60000, // 60 seconds
        minAmount: 100,
        maxAmount: 10000,
        currency: 'KES'
    };

    // Contact information
    const CONTACT = {
        email: 'hello@email.com',
        phone: '(123)456-7890',
        instagram: '@yourspace',
        businessName: 'Lashed by Amarah'
    };

    // Booking policies
    const POLICIES = {
        depositRequired: true,
        depositRefundable: false,
        cancellationNoticeHours: 24,
        rescheduleFee: 0,
        lateArrivalMinutes: 15
    };

    // Animation configuration
    const ANIMATIONS = {
        butterfly: {
            count: 6,
            duration: { min: 6, max: 14 },
            cascade: { count: 20, duration: 4 }
        },
        particles: {
            confetti: 50,
            floating: 8
        },
        transitions: {
            duration: 0.6,
            delay: 0.3
        }
    };

    // API endpoints (for future integration)
    const API = {
        mpesa: {
            stk: ENV.isDev ? '/api/mpesa/stk' : 'https://api.example.com/mpesa/stk',
            query: ENV.isDev ? '/api/mpesa/query' : 'https://api.example.com/mpesa/query',
            callback: ENV.isDev ? '/api/mpesa/callback' : 'https://api.example.com/mpesa/callback'
        },
        bookings: {
            create: ENV.isDev ? '/api/bookings' : 'https://api.example.com/bookings',
            update: ENV.isDev ? '/api/bookings/:id' : 'https://api.example.com/bookings/:id',
            get: ENV.isDev ? '/api/bookings/:id' : 'https://api.example.com/bookings/:id'
        }
    };

    // Feature flags
    const FEATURES = {
        enableMpesa: !ENV.isDev,
        enableEmailConfirmation: true,
        enableSMSReminders: true,
        enableGuestBooking: true,
        enableMultipleServices: false,
        demoMode: ENV.isDev
    };

    // Get service by ID
    const getService = (serviceId) => SERVICES[serviceId] || null;

    // Get all services
    const getAllServices = () => Object.values(SERVICES);

    // Get service price
    const getServicePrice = (serviceId) => {
        const service = getService(serviceId);
        return service ? service.price : 0;
    };

    // Calculate deposit amount
    const calculateDeposit = (totalAmount) => {
        return Math.ceil(totalAmount * PAYMENT.depositPercentage);
    };

    // Validate time slot
    const isValidTimeSlot = (time) => TIME_SLOTS.includes(time);

    // Validate date
    const isValidDate = (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    };

    // Get business day
    const isBusinessDay = (date) => {
        const day = new Date(date).getDay();
        return day !== 0 && day !== 6; // Not Sunday or Saturday
    };

    // Log configuration for debugging
    const logConfig = () => {
        if (ENV.isDev) {
            console.log('🔧 Application Configuration:', {
                ENV,
                SERVICES: Object.keys(SERVICES),
                FEATURES,
                API
            });
        }
    };

    return {
        // Getters
        ENV,
        SERVICES,
        HOURS,
        APPOINTMENT_DURATION,
        TIME_SLOTS,
        PAYMENT,
        CONTACT,
        POLICIES,
        ANIMATIONS,
        API,
        FEATURES,

        // Methods
        getService,
        getAllServices,
        getServicePrice,
        calculateDeposit,
        isValidTimeSlot,
        isValidDate,
        isBusinessDay,
        logConfig
    };
})();

// Initialize and log configuration
document.addEventListener('DOMContentLoaded', () => {
    AppConfig.logConfig();
    
    // Make available globally
    window.AppConfig = AppConfig;
});
