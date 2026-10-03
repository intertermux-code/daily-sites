/**
 * Pulseboard Core Scripts
 * Handles: Scroll Progress, Mobile Nav, Pricing Toggle, 
 * Animated Counters, Clip-Path Reveals, Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initMobileNav();
    initRevealObserver();
    
    // Page-specific initializations guarded by element existence
    if (document.querySelector('.metric-value')) initCounters();
    if (document.querySelector('#billing-switch')) initPricingToggle();
    if (document.querySelector('#demo-request-form')) initContactForm();
});

/* --- SCROLL PROGRESS BAR --- */
function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    let ticking = false;
    
    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        
        progressBar.style.transform = `scaleX(${progress})`;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateProgress);
            ticking = true;
        }
    }, { passive: true });
}

/* --- MOBILE NAVIGATION --- */
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        navList.classList.toggle('is-open', !isOpen);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navList.classList.contains('is-open')) {
            toggle.setAttribute('aria-expanded', 'false');
            navList.classList.remove('is-open');
            toggle.focus();
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (navList.classList.contains('is-open') && 
            !navList.contains(e.target) && 
            !toggle.contains(e.target)) {
            toggle.setAttribute('aria-expanded', 'false');
            navList.classList.remove('is-open');
        }
    });
}

/* --- INTERSECTION OBSERVER FOR REVEALS --- */
function initRevealObserver() {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-clip');
    
    if (prefersReducedMotion) {
        revealElements.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, parseInt(delay, 10));
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

/* --- ANIMATED COUNTERS --- */
function initCounters() {
    const counters = document.querySelectorAll('.metric-value');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                const isDecimal = target % 1 !== 0;
                
                if (prefersReducedMotion) {
                    el.textContent = (isDecimal ? target.toFixed(2) : Math.floor(target)) + suffix;
                } else {
                    animateValue(el, 0, target, 1500, suffix, isDecimal);
                }
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
}

function animateValue(el, start, end, duration, suffix, isDecimal) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;
        
        el.textContent = (isDecimal ? current.toFixed(2) : Math.floor(current)) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/* --- PRICING TOGGLE --- */
function initPricingToggle() {
    const toggle = document.getElementById('billing-switch');
    const amounts = document.querySelectorAll('.amount');
    
    toggle.addEventListener('click', () => {
        const isYearly = toggle.getAttribute('aria-checked') === 'true';
        const newState = !isYearly;
        
        toggle.setAttribute('aria-checked', String(newState));
        
        amounts.forEach(amount => {
            const value = newState ? amount.dataset.yearly : amount.dataset.monthly;
            // Small animation for number change
            amount.style.opacity = '0';
            amount.style.transform = 'translateY(-5px)';
            
            setTimeout(() => {
                amount.textContent = value;
                amount.style.opacity = '1';
                amount.style.transform = 'translateY(0)';
            }, 150);
        });
    });
}

/* --- CONTACT FORM VALIDATION --- */
function initContactForm() {
    const form = document.getElementById('demo-request-form');
    const statusEl = form.querySelector('.form-status');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous states
        statusEl.className = 'form-status';
        statusEl.textContent = '';
        form.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        
        // Basic validation
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            const errorEl = field.parentElement.querySelector('.error-msg');
            if (!field.value.trim()) {
                isValid = false;
                if (errorEl) errorEl.textContent = 'This field is required';
                field.setAttribute('aria-invalid', 'true');
            } else if (field.type === 'email' && !isValidEmail(field.value)) {
                isValid = false;
                if (errorEl) errorEl.textContent = 'Please enter a valid email frequency';
                field.setAttribute('aria-invalid', 'true');
            } else {
                field.removeAttribute('aria-invalid');
            }
        });
        
        if (!isValid) return;
        
        // Simulate submission
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;
        
        // Simulated network delay
        await new Promise(resolve => setTimeout(resolve, 1800));
        
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        
        // Success state
        statusEl.classList.add('success');
        statusEl.textContent = '✓ Transmission received. Stand by for response.';
        form.reset();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
            statusEl.className = 'form-status';
            statusEl.textContent = '';
        }, 5000);
    });
    
    // Real-time validation clearing
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => {
            const errorEl = field.parentElement.querySelector('.error-msg');
            if (errorEl && field.value.trim()) {
                errorEl.textContent = '';
                field.removeAttribute('aria-invalid');
            }
        });
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}