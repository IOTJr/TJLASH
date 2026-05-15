/**
 * Animations Module
 * Handles butterfly animations, transitions, and special effects
 */

class ButterflyAnimationEngine {
    constructor() {
        this.container = document.getElementById('butterfly-container');
        this.butterflySet = ['🦋', '🦋', '✨', '💫'];
        this.activeButterflies = [];
    }

    /**
     * Create and animate floating butterflies in background
     */
    createFloatingButterflies(count = 8) {
        /**
         * Initialize mouse tracking for butterflies
         */
        initializeMouseTracking() {
            let mouseX = window.innerWidth / 2;
            let mouseY = window.innerHeight / 2;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            // Create butterflies that follow the mouse
            setInterval(() => {
                if (Math.random() > 0.7) {
                    this.createMouseFollowingButterfly(mouseX, mouseY);
                }
            }, 2000);
        }

        /**
         * Create butterfly that follows the mouse
         */
        createMouseFollowingButterfly(startX, startY) {
            const butterfly = document.createElement('div');
            const emoji = this.butterflySet[Math.floor(Math.random() * this.butterflySet.length)];
            butterfly.className = 'butterfly';
            butterfly.textContent = emoji;
            butterfly.style.left = startX + 'px';
            butterfly.style.top = startY + 'px';
            butterfly.style.opacity = 0.7;
            butterfly.style.fontSize = '28px';
            this.container.appendChild(butterfly);

            let x = startX;
            let y = startY;
            let targetX = startX;
            let targetY = startY;
            let angle = 0;

            const follower = setInterval(() => {
                // Get current mouse position
                const mouseX = parseFloat(butterfly.dataset.mouseX || startX);
                const mouseY = parseFloat(butterfly.dataset.mouseY || startY);

                // Calculate direction to mouse with smoothing
                targetX += (mouseX - targetX) * 0.1;
                targetY += (mouseY - targetY) * 0.1;

                // Create smooth gliding motion
                x += (targetX - x) * 0.05;
                y += (targetY - y) * 0.05;
                angle += 5;

                butterfly.style.left = x + 'px';
                butterfly.style.top = y + 'px';
                butterfly.style.transform = `rotate(${angle}deg) scale(${0.8 + Math.sin(angle * 0.05) * 0.2})`;
            }, 50);

            // Track mouse position in butterfly dataset
            document.addEventListener('mousemove', (e) => {
                butterfly.dataset.mouseX = e.clientX;
                butterfly.dataset.mouseY = e.clientY;
            });

            // Remove after 8 seconds
            setTimeout(() => {
                clearInterval(follower);
                gsap.to(butterfly, {
                    duration: 0.5,
                    opacity: 0,
                    scale: 0,
                    onComplete: () => butterfly.remove()
                });
            }, 8000);
        }
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const butterfly = this.createButterflyElement();
                this.container.appendChild(butterfly);
                this.animateButterfly(butterfly);
            }, Math.random() * 2000);
        }
    }

    /**
     * Create a single butterfly element
     */
    createButterflyElement() {
        const butterfly = document.createElement('div');
        const emoji = this.butterflySet[Math.floor(Math.random() * this.butterflySet.length)];
        butterfly.className = 'butterfly';
        butterfly.textContent = emoji;
        butterfly.style.left = Math.random() * 100 + '%';
        butterfly.style.top = Math.random() * 50 - 50 + 'px';
        butterfly.style.opacity = Math.random() * 0.5 + 0.3;
        return butterfly;
        // Also start mouse tracking
        setTimeout(() => this.initializeMouseTracking(), 500);
    }

    /**
     * Animate butterfly with GSAP or CSS
     */
    animateButterfly(butterfly) {
        const duration = Math.random() * 8 + 6;
        const startX = parseFloat(butterfly.style.left);
        const startY = parseFloat(butterfly.style.top);
        const endX = Math.random() * 100;
        const endY = window.innerHeight + 100;
        const wobble = Math.random() * 200 - 100;

        gsap.to(butterfly, {
            duration: duration,
            x: wobble,
            y: endY,
            opacity: 0,
            rotation: Math.random() * 360,
            ease: 'power1.inOut',
            onComplete: () => {
                butterfly.remove();
            }
        });
    }

    /**
     * Create cursor-following butterfly
     */
    createCursorButterfly(e) {
        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly-cursor';
        butterfly.textContent = '🦋';
        butterfly.style.left = e.pageX + 'px';
        butterfly.style.top = e.pageY + 'px';
        butterfly.style.opacity = 1;
        
        document.body.appendChild(butterfly);

        gsap.to(butterfly, {
            duration: 1.5,
            x: Math.random() * 200 - 100,
            y: Math.random() * -300,
            opacity: 0,
            rotation: Math.random() * 360,
            scale: 0.5,
            ease: 'power2.out',
            onComplete: () => {
                butterfly.remove();
            }
        });
    }

    /**
     * Cascade butterflies effect (used on success page)
     */
    cascadeButterflies(duration = 3, count = 15) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const butterfly = document.createElement('div');
                const emoji = this.butterflySet[Math.floor(Math.random() * this.butterflySet.length)];
                butterfly.className = 'butterfly butterfly-cascade';
                butterfly.textContent = emoji;
                butterfly.style.left = Math.random() * 100 + '%';
                butterfly.style.top = '-50px';
                butterfly.style.fontSize = (Math.random() * 20 + 24) + 'px';
                butterfly.style.opacity = Math.random() * 0.7 + 0.5;
                
                document.body.appendChild(butterfly);

                setTimeout(() => {
                    butterfly.remove();
                }, duration * 1000);
            }, i * (duration * 1000 / count));
        }
    }

    /**
     * Continuous floating animation for service cards
     */
    addFloatEffectToElement(element) {
        element.style.animation = 'float ' + (4 + Math.random() * 2) + 's ease-in-out infinite';
        element.style.animationDelay = Math.random() * 2 + 's';
    }
}

/**
 * Page Transition Manager
 */
class PageTransitionManager {
    constructor() {
        this.currentPage = null;
        this.animationEngine = new ButterflyAnimationEngine();
        this.particleEngine = new ParticleEffectEngine();
    }

    /**
     * Transition between pages with smooth animation
     */
    transitionTo(pageId) {
        // Hide current page
        const currentPages = document.querySelectorAll('.page-section.active');
        currentPages.forEach(page => {
            page.classList.remove('active');
            // Add hidden so Tailwind doesn't keep it visible
            page.classList.add('hidden');
        });

        // Show new page
        setTimeout(() => {
            const newPage = document.getElementById(pageId);
            if (newPage) {
                // Ensure it's visible then animate in
                newPage.classList.remove('hidden');
                newPage.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.currentPage = pageId;
            }
        }, 300);
    }

    /**
     * Animate a butterfly flying from the selected service card into the next page,
     * then perform a page transition. Used for the continue button visual.
     */
    animateServiceTransition(fromElement, targetPageId) {
        if (!fromElement) {
            this.transitionTo(targetPageId);
            this.onPageEnter(targetPageId);
            return;
        }

        const rect = fromElement.getBoundingClientRect();
        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly fly-transition';
        butterfly.textContent = '🦋';
        butterfly.style.left = rect.left + rect.width / 2 + 'px';
        butterfly.style.top = rect.top + rect.height / 2 + 'px';
        butterfly.style.fontSize = '48px';
        butterfly.style.zIndex = 9999;
        document.body.appendChild(butterfly);

        // Animate butterfly to center-top then remove and transition
        const targetX = window.innerWidth / 2 - 24; // center offset
        const targetY = 80; // near top

        gsap.to(butterfly, {
            duration: 0.9,
            x: targetX - (rect.left + rect.width / 2),
            y: targetY - (rect.top + rect.height / 2),
            rotation: 360,
            scale: 1.2,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to(butterfly, { duration: 0.4, opacity: 0, scale: 0.6, onComplete: () => butterfly.remove() });
                this.transitionTo(targetPageId);
                this.onPageEnter(targetPageId);
            }
        });
    }

    /**
     * Initialize page on entry
     */
    onPageEnter(pageId) {
        if (pageId === 'page-services') {
            this.animationEngine.createFloatingButterflies(6);
        } else if (pageId === 'page-success') {
            setTimeout(() => {
                this.animationEngine.cascadeButterflies(4, 20);
                this.particleEngine.createConfetti(50);
            }, 500);
        }
    }
}

/**
 * Particle Effect Engine
 */
class ParticleEffectEngine {
    constructor() {
        this.particles = [];
    }

    /**
     * Create confetti particles
     */
    createConfetti(count = 50) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '-10px';
            particle.style.width = (Math.random() * 8 + 5) + 'px';
            particle.style.height = (Math.random() * 8 + 5) + 'px';
            particle.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
            particle.style.animationDelay = (Math.random() * 0.5) + 's';
            particle.style.animationDuration = (Math.random() * 1 + 2.5) + 's';
            
            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 3500);
        }
    }

    /**
     * Create floating particles on interaction
     */
    createFloatingParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const emojis = ['✨', '💫', '⭐', '💖', '✨'];
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--tx', (Math.random() * 100 - 50) + 'px');
            particle.style.fontSize = (Math.random() * 20 + 16) + 'px';
            particle.style.animationDuration = (Math.random() * 0.8 + 1.2) + 's';
            
            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 2000);
        }
    }
}

/**
 * Export for use in main app
 */
window.ButterflyAnimationEngine = ButterflyAnimationEngine;
window.PageTransitionManager = PageTransitionManager;
window.ParticleEffectEngine = ParticleEffectEngine;

/**
 * Initialize animations on page load
 */
function initAnimations() {
    const pageManager = new PageTransitionManager();
    window.pageManager = pageManager;

    // Add cursor butterfly effect on button clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('button') && !e.target.disabled) {
            pageManager.animationEngine.createCursorButterfly(e);
            // Also create floating particles for extra visual feedback
            setTimeout(() => {
                pageManager.particleEngine.createFloatingParticles(e.pageX, e.pageY, 5);
            }, 100);
        }
    });

    // Initial animation
    pageManager.animationEngine.createFloatingButterflies(6);

    // Add smooth transitions to all service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                duration: 0.3,
                scale: 1.02,
                boxShadow: '0 0 30px rgba(233, 107, 168, 0.3)',
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.3,
                scale: 1,
                boxShadow: 'none',
                ease: 'power2.out'
            });
        });

        // Add click particle effect
        card.addEventListener('click', () => {
            const rect = card.getBoundingClientRect();
            pageManager.particleEngine.createFloatingParticles(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                8
            );
        });
    });

    // Add loading state animations to time slots
    setTimeout(() => {
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach((slot, index) => {
            slot.style.animationDelay = (index * 0.05) + 's';
        });
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    initAnimations();
}
