/**
 * SIGNAL App Logic
 * Handles navigation, filtering, form validation, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initFilters();
    initSubscribeForm();
    initScrollReveal();
});

/**
 * Mobile Navigation Toggle
 */
function initMobileNav() {
    const toggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-links');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger
        const hamburger = toggle.querySelector('.hamburger');
        if(hamburger) {
            // Simple CSS class toggle could handle icon animation, 
            // but keeping JS minimal per request structure
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navList.contains(e.target) && !toggle.contains(e.target) && navList.classList.contains('open')) {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Article Filtering (Index Page)
 */
function initFilters() {
    const filters = document.querySelectorAll('.filter');
    const cards = document.querySelectorAll('.card');

    if (filters.length === 0) return;

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.filter;

            cards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'flex';
                    // Small stagger animation reset
                    card.style.opacity = '0';
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Newsletter Form Validation (Subscribe Page)
 */
function initSubscribeForm() {
    const form = document.getElementById('newsletter-form');
    const successMsg = document.getElementById('success-message');
    
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const emailInput = form.querySelector('#email');
        const errorMsg = form.querySelector('.error-msg');
        const email = emailInput.value.trim();
        
        // Simple regex for email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            errorMsg.textContent = '> ERROR: INVALID_EMAIL_FORMAT';
            emailInput.style.borderColor = 'var(--accent)';
            return;
        }

        // Simulate API call
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'PROCESSING...';
        submitBtn.disabled = true;

        setTimeout(() => {
            form.hidden = true;
            successMsg.hidden = false;
            // Confetti or particle effect could go here
        }, 1500);
    });
}

/**
 * Scroll Reveal Animation
 * Adds a fade-up effect to elements as they enter viewport
 */
function initScrollReveal() {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Target specific elements for reveal
    const revealElements = document.querySelectorAll('.card, .terminal-window, .team-card, .topic-group');
    
    // Add initial state via JS to prevent flash of unstyled content if CSS fails
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// Helper to add revealed class dynamically
const styleSheet = document.createElement('style');
styleSheet.innerText = `
    .revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(styleSheet);