/**
 * SIGNAL - Core Interactions
 * Handles: Blur-Fade Ascend, Spring Accordion, Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
    initRevealObserver();
    initAccordions();
    initSubscribeForm();
    initMobileMenu();
});

/**
 * BLUR-FADE ASCEND
 * Secondary motion signature. Staggered entrance via IntersectionObserver.
 */
function initRevealObserver() {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.reveal-trigger').forEach(el => el.classList.add('in'));
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Group siblings for staggering
    const groups = document.querySelectorAll('.reveal-group, .diorama-track, .trending-grid, .topics-grid, .team-grid, .accordion-group');
    
    groups.forEach(group => {
        const items = group.querySelectorAll('.reveal-trigger');
        items.forEach((item, index) => {
            // Apply stagger delay only to direct children triggers
            item.style.transitionDelay = `${index * 80}ms`;
            observer.observe(item);
        });
    });

    // Observe standalone triggers
    document.querySelectorAll('.reveal-trigger:not(.diorama-item):not(.trend-item):not(.topic-card):not(.team-member):not(.accordion-item)').forEach(el => {
        observer.observe(el);
    });
}

/**
 * SPRING ACCORDION
 * Primary motion signature. Grid row transition with chevron rotation.
 * Only one panel open at a time.
 */
function initAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const expanded = header.getAttribute('aria-expanded') === 'true';
            const panel = header.nextElementSibling;
            
            // Close all others first
            headers.forEach(otherHeader => {
                if (otherHeader !== header) {
                    otherHeader.setAttribute('aria-expanded', 'false');
                    const otherPanel = otherHeader.nextElementSibling;
                    if (otherPanel) otherPanel.setAttribute('aria-hidden', 'true');
                }
            });

            // Toggle current
            if (expanded) {
                header.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
            } else {
                header.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
            }
        });

        // Initialize state
        const panel = header.nextElementSibling;
        if (panel) {
            panel.setAttribute('aria-hidden', 'true');
        }
    });
}

/**
 * SUBSCRIBE FORM VALIDATION
 * Real-time feedback without blocking paste or using autofocus.
 */
function initSubscribeForm() {
    const form = document.getElementById('subscribe-form');
    if (!form) return;

    const emailInput = form.querySelector('#email');
    const errorMsg = form.querySelector('.error-msg');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Simple email regex
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    emailInput.addEventListener('blur', () => validate());
    emailInput.addEventListener('input', () => {
        if (errorMsg.textContent) validate(); // Only re-validate on input if error exists
    });

    function validate() {
        const val = emailInput.value.trim();
        if (!val) {
            showError('Please enter your email address.');
            return false;
        }
        if (!isValidEmail(val)) {
            showError('Please enter a valid email format.');
            return false;
        }
        clearError();
        return true;
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        emailInput.style.borderColor = 'var(--accent)';
    }

    function clearError() {
        errorMsg.textContent = '';
        emailInput.style.borderColor = 'var(--ink)';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validate()) {
            // Simulate submission
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = 'Welcome to Signal ✓';
                submitBtn.style.background = 'var(--accent)';
                submitBtn.style.borderColor = 'var(--accent)';
                form.reset();
            }, 1500);
        }
    });
}

/**
 * MOBILE MENU TOGGLE
 * Basic accessibility-compliant toggle
 */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        
        // In a full implementation, this would toggle a class on nav
        // For this demo, we rely on CSS media queries for simplicity
        // but maintain the ARIA state correctly.
        if (!expanded) {
            nav.style.display = 'flex';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.background = 'var(--bg-paper)';
            nav.style.padding = 'var(--sp-4).style.borderBottom = '1px solid var(--ink)';
            nav.querySelector('ul').style.flexDirection = 'column';
        } else {
            nav.style.display = '';
            nav.style.position = '';
            nav.style.top = '';
            nav.style.left = '';
            nav.style.right = '';
            nav.style.background = '';
            nav.style.padding = '';
            nav.style.borderBottom = '';
            nav.querySelector('ul').style.flexDirection = '';
        }
    });
}