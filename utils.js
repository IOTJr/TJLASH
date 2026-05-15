/**
 * Advanced Utilities Module
 * Demonstrates powerful programming patterns for the lash booking application
 * Features: Functional programming, Observer pattern, Caching, Validation
 */

/**
 * Type definitions (JavaScript documentation comments for type safety)
 * @typedef {Object} BookingData
 * @property {string} service - Service type
 * @property {number} servicePrice - Price of service
 * @property {string} date - Booking date
 * @property {string} time - Booking time
 * @property {string} mpesaPhone - M-Pesa phone number
 * @property {number} depositAmount - Deposit amount
 */

/**
 * Validation Utilities - Functional approach with composable validators
 */
const Validators = (() => {
    const validators = new Map();

    /**
     * Create a validator function
     */
    const createValidator = (name, fn) => {
        validators.set(name, fn);
        return fn;
    };

    /**
     * Compose multiple validators
     */
    const compose = (...validatorFns) => (value) => {
        return validatorFns.every(fn => fn(value));
    };

    /**
     * Define validators
     */
    const emailValidator = createValidator('email', (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    });

    const phoneValidator = createValidator('phone', (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 12 && cleaned.startsWith('254');
    });

    const dateValidator = createValidator('date', (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    });

    const priceValidator = createValidator('price', (price) => {
        return typeof price === 'number' && price > 0;
    });

    const serviceValidator = createValidator('service', (service) => {
        const validServices = ['classic', 'hybrid', 'volume'];
        return validServices.includes(service);
    });

    return {
        emailValidator,
        phoneValidator,
        dateValidator,
        priceValidator,
        serviceValidator,
        compose,
        getAll: () => Array.from(validators.values())
    };
})();

/**
 * Observable Pattern - Observer pattern for reactive state management
 */
class Observable {
    constructor(initialValue) {
        this.value = initialValue;
        this.subscribers = new Set();
    }

    /**
     * Subscribe to changes
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        // Return unsubscribe function
        return () => this.subscribers.delete(callback);
    }

    /**
     * Get current value
     */
    getValue() {
        return this.value;
    }

    /**
     * Set new value and notify subscribers
     */
    setValue(newValue) {
        if (this.value !== newValue) {
            const oldValue = this.value;
            this.value = newValue;
            this.notifySubscribers(oldValue, newValue);
        }
    }

    /**
     * Notify all subscribers
     */
    notifySubscribers(oldValue, newValue) {
        this.subscribers.forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error('Error in subscriber callback:', error);
            }
        });
    }

    /**
     * Transform value with a function
     */
    map(fn) {
        const mapped = new Observable(fn(this.value));
        this.subscribe((newValue) => {
            mapped.setValue(fn(newValue));
        });
        return mapped;
    }

    /**
     * Filter values
     */
    filter(predicate) {
        const filtered = new Observable(predicate(this.value) ? this.value : undefined);
        this.subscribe((newValue) => {
            if (predicate(newValue)) {
                filtered.setValue(newValue);
            }
        });
        return filtered;
    }
}

/**
 * Caching System - Memoization for expensive operations
 */
class CacheManager {
    constructor(ttl = 3600000) { // Default 1 hour TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * Generate cache key from arguments
     */
    generateKey(...args) {
        return JSON.stringify(args);
    }

    /**
     * Get value from cache
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    /**
     * Set value in cache
     */
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Memoize a function
     */
    memoize(fn) {
        return (...args) => {
            const key = this.generateKey(...args);
            const cached = this.get(key);

            if (cached !== null) {
                console.log('Cache hit for:', key);
                return cached;
            }

            const result = fn(...args);
            this.set(key, result);
            return result;
        };
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * Rate Limiter - Functional rate limiting
 */
class RateLimiter {
    constructor(maxCalls, timeWindow = 60000) {
        this.maxCalls = maxCalls;
        this.timeWindow = timeWindow;
        this.calls = [];
    }

    /**
     * Check if action is allowed
     */
    isAllowed() {
        const now = Date.now();
        this.calls = this.calls.filter(timestamp => now - timestamp < this.timeWindow);

        if (this.calls.length < this.maxCalls) {
            this.calls.push(now);
            return true;
        }

        return false;
    }

    /**
     * Get remaining calls
     */
    getRemaining() {
        const now = Date.now();
        this.calls = this.calls.filter(timestamp => now - timestamp < this.timeWindow);
        return Math.max(0, this.maxCalls - this.calls.length);
    }

    /**
     * Reset limiter
     */
    reset() {
        this.calls = [];
    }
}

/**
 * Event Emitter - Event system for decoupled communication
 */
class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    /**
     * Register event listener
     */
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Emit event
     */
    emit(eventName, data) {
        if (!this.events.has(eventName)) return;
        
        this.events.get(eventName).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }

    /**
     * Remove event listener
     */
    off(eventName, callback) {
        if (!this.events.has(eventName)) return;
        
        const callbacks = this.events.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Listen to event only once
     */
    once(eventName, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(eventName, wrapper);
        };
        this.on(eventName, wrapper);
    }
}

/**
 * State Machine - For managing complex state transitions
 */
class StateMachine {
    constructor(initialState, states) {
        this.currentState = initialState;
        this.states = states;
        this.listeners = new Set();
    }

    /**
     * Transition to new state
     */
    transition(newState) {
        if (!this.states.includes(newState)) {
            throw new Error(`Invalid state: ${newState}`);
        }

        const oldState = this.currentState;
        this.currentState = newState;
        this.notifyListeners(oldState, newState);
    }

    /**
     * Get current state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify listeners of state change
     */
    notifyListeners(oldState, newState) {
        this.listeners.forEach(callback => {
            try {
                callback(newState, oldState);
            } catch (error) {
                console.error('Error in state change listener:', error);
            }
        });
    }
}

/**
 * Number Formatter - Format numbers with locale support
 */
const NumberFormatter = (() => {
    const formatter = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return {
        formatCurrency: (amount) => formatter.format(amount),
        formatNumber: (num) => new Intl.NumberFormat('en-KE').format(num),
        parseNumber: (str) => parseInt(str.replace(/\D/g, ''), 10)
    };
})();

/**
 * Date Utilities - Functional date operations
 */
const DateUtils = (() => {
    const formatDate = (date) => {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const isFutureDate = (date) => date > new Date();

    const getBusinessDays = (startDate, endDate) => {
        let count = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    };

    return {
        formatDate,
        isToday,
        isFutureDate,
        getBusinessDays,
        addDays: (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }
    };
})();

/**
 * Logger - Structured logging with levels
 */
class Logger {
    constructor(namespace = 'App') {
        this.namespace = namespace;
        this.level = 'info'; // debug, info, warn, error
    }

    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.namespace}:${level.toUpperCase()}] ${message}`, data);
    }

    debug(message, data) {
        this.log('debug', message, data);
    }

    info(message, data) {
        this.log('info', message, data);
    }

    warn(message, data) {
        this.log('warn', message, data);
    }

    error(message, data) {
        this.log('error', message, data);
    }
}

/**
 * Deep clone utility using structuredClone API
 */
const deepClone = (obj) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    // Fallback for older browsers
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce utility for function throttling
 */
const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Throttle utility for rate limiting function calls
 */
const throttle = (fn, delay = 300) => {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
};

/**
 * Export all utilities
 */
window.BookingUtils = {
    Validators,
    Observable,
    CacheManager,
    RateLimiter,
    EventEmitter,
    StateMachine,
    NumberFormatter,
    DateUtils,
    Logger,
    deepClone,
    debounce,
    throttle
};

console.log('✨ Advanced Booking Utilities Module Loaded');
