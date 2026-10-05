/**
 * NORTHLINE INTERACTION LAYER
 * Handles Magnetic Buttons, Scroll Reveals, Mobile Menu, and Accordions
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollReveal();
    initMagneticButtons();
    initServiceAccordions();
});

/**
 * 1. MOBILE MENU
 */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger lines
        const spans = toggle.querySelectorAll('span');
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.transform = '';
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
            toggle.click();
        }
    });
}

/**
 * 2. SCROLL REVEAL (Blur-Fade Ascend)
 * Uses IntersectionObserver to add .in class
 * Staggering handled via CSS nth-child transitions
 */
function initScrollReveal() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        document.querySelectorAll('.reveal-item, .reveal-group > *').forEach(el => {
            el.classList.add('in');
        });
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe individual items
    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
    
    // Observe groups (trigger parent, let CSS stagger children)
    document.querySelectorAll('.reveal-group').forEach(el => observer.observe(el));
}

/**
 * 3. MAGNETIC BUTTONS
 * Translates button towards cursor within radius using rAF lerp
 */
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.magnetic-btn');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || buttons.length === 0) return;

    buttons.forEach(btn => {
        let boundingRect = btn.getBoundingClientRect();
        let mouseX = 0, mouseY = 0;
        let btnX = 0, btnY = 0;
        let currentX = 0, currentY = 0;
        
        // Configuration
        const magnetStrength = 0.3; // How much it follows (0-1)
        const resetSpeed = 0.1; // Lerp factor when leaving
        
        // Update rect on resize/scroll
        const updateRect = () => { boundingRect = btn.getBoundingClientRect(); };
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, { passive: true });

        btn.addEventListener('mousemove', (e) => {
            const distX = e.clientX - boundingRect.left - boundingRect.width / 2;
            const distY = e.clientY - boundingRect.top - boundingRect.height / 2;
            
            // Only apply if within reasonable distance (optional optimization)
            mouseX = distX * magnetStrength;
            mouseY = distY * magnetStrength;
            
            // Scale effect at proximity
            btn.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.04)`;
        });

        btn.addEventListener('mouseleave', () => {
            mouseX = 0;
            mouseY = 0;
            btn.style.transform = `translate(0px, 0px) scale(1)`;
        });

        // Animation Loop for smooth lerp
        const animate = () => {
            // Linear interpolation
            currentX += (mouseX - currentX) * 0.15;
            currentY += (mouseY - currentY) * 0.15;
            
            // Only update DOM if values are significant enough
            if (Math.abs(mouseX - currentX) > 0.01 || Math.abs(mouseY - currentY) > 0.01) {
                 // Note: We set transform directly here for performance, 
                 // overriding hover state only while moving
                 if(mouseX !== 0 || mouseY !== 0) {
                     btn.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.04)`;
                 } else {
                     // Returning to rest
                     btn.style.transform = `translate(${currentX}px, ${currentY}px) scale(1)`;
                 }
            }
            requestAnimationFrame(animate);
        };
        
        // Start loop only when hovered to save battery? 
        // For simplicity and "always ready" feel, we keep one global loop or per-element.
        // Per-element is safer for isolation.
        requestAnimationFrame(animate);
    });
}

/**
 * 4. SERVICE ACCORDIONS
 * Exclusive open behavior (optional) + smooth height animation
 */
function initServiceAccordions() {
    const details = document.querySelectorAll('.service-row');
    
    details.forEach(detail => {
        detail.addEventListener('toggle', () => {
            // Optional: Close others when one opens
            if (detail.open) {
                details.forEach(other => {
                    if (other !== detail) other.removeAttribute('open');
                });
            }
        });
    });
}