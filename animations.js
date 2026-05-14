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
    }

    /**
     * Transition between pages with smooth animation
     */
    transitionTo(pageId) {
        // Hide current page
        const currentPages = document.querySelectorAll('.page-section.active');
        currentPages.forEach(page => {
            page.classList.remove('active');
        });

        // Show new page
        setTimeout(() => {
            const newPage = document.getElementById(pageId);
            if (newPage) {
                newPage.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.currentPage = pageId;
            }
        }, 300);
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
            }, 500);
        }
    }
}

/**
 * Export for use in main app
 */
window.ButterflyAnimationEngine = ButterflyAnimationEngine;
window.PageTransitionManager = PageTransitionManager;

/**
 * Initialize animations on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    const pageManager = new PageTransitionManager();
    window.pageManager = pageManager;

    // Add cursor butterfly effect on button clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('button') && !e.target.disabled) {
            pageManager.animationEngine.createCursorButterfly(e);
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
    });
});
