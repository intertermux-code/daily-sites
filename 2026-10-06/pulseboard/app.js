/**
 * Pulseboard — Shared Application Logic
 * Handles: Mobile Nav, Animated Counters, Billing Toggle, Form Validation, Scroll Reveals
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollReveal();
    initAnimatedCounters();
    initBillingToggle();
    initContactForm();
});

/* =========================================
   Mobile Navigation
   ========================================= */
function initMobileNav() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const drawer = document.getElementById('mobile-nav');
    
    if (!toggle || !drawer) return;
    
    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        drawer.hidden = isOpen;
        
        // Animate hamburger
        const lines = toggle.querySelectorAll('.hamburger-line');
        if (!isOpen) {
            lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            lines[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            lines[0].style.transform = '';
            lines[1].style.transform = '';
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            toggle.click();
            toggle.focus();
        }
    });
}

/* =========================================
   Scroll Reveal (IntersectionObserver)
   Only animates if prefers-reduced-motion allows
   ========================================= */
function initScrollReveal() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    const groups = document.querySelectorAll('.reveal-group');
    if (!groups.length) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    
    groups.forEach(group => observer.observe(group));
}

/* =========================================
   Animated Counters
   Signature motion: easeOutExpo over 1.2s
   Formats with locale separators
   ========================================= */
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.metric-value[data-target]');
    if (!counters.length) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                const decimals = parseInt(el.dataset.decimals, 10) || 0;
                
                if (prefersReducedMotion) {
                    el.textContent = formatNumber(target, decimals) + suffix;
                } else {
                    animateCounter(el, target, decimals, suffix);
                }
                
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target, decimals, suffix) {
    const duration = 1200; // 1.2s
    const startTime = performance.now();
    
    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const currentValue = easedProgress * target;
        
        element.textContent = formatNumber(currentValue, decimals) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function formatNumber(num, decimals) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

/* =========================================
   Billing Toggle (Pricing Page)
   ========================================= */
function initBillingToggle() {
    const toggle = document.querySelector('.billing-toggle');
    if (!toggle) return;
    
    const amounts = document.querySelectorAll('.amount[data-monthly]');
    
    toggle.addEventListener('click', () => {
        const isYearly = toggle.getAttribute('aria-checked') === 'true';
        const newState = !isYearly;
        
        toggle.setAttribute('aria-checked', String(newState));
        
        amounts.forEach(amount => {
            const price = newState ? amount.dataset.yearly : amount.dataset.monthly;
            amount.textContent = price;
        });
    });
}

/* =========================================
   Contact Form Validation & Submission
   ========================================= */
function initContactForm() {
    const form = document.getElementById('demo-request-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        const statusEl = form.querySelector('.form-status');
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        
        // Validate
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            const errorEl = field.parentElement.querySelector('.error-message');
            
            if (!field.value.trim()) {
                if (errorEl) errorEl.textContent = 'This field is required.';
                isValid = false;
            } else if (field.type === 'email' && !isValidEmail(field.value)) {
                if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
                isValid = false;
            }
        });
        
        if (!isValid) {
            statusEl.textContent = 'Please correct the errors above.';
            statusEl.classList.add('error');
            return;
        }
        
        // Simulate submission
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('is-loading');
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            statusEl.textContent = 'Request received. We\'ll be in touch within 4 hours.';
            statusEl.classList.add('success');
            form.reset();
        } catch (err) {
            statusEl.textContent = 'Something went wrong. Please try again or email us directly.';
            statusEl.classList.add('error');
        } finally {
            submitBtn.classList.remove('is-loading');
        }
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}