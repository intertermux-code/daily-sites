/**
 * NORTHLINE CORE INTERACTIONS
 * Vanilla JS only. No dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initRevealObserver();
    initDecodeText();
    initServiceAccordion();
    initContactForm();
});

/**
 * Mobile Navigation Toggle
 */
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger bars
        const bars = toggle.querySelectorAll('.bar');
        if (isOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            bars[0].style.transform = '';
            bars[1].style.transform = '';
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navList.classList.contains('is-open')) {
            toggle.click();
            toggle.focus();
        }
    });
}

/**
 * Secondary Motion: Blur-Fade Ascend via IntersectionObserver
 * Stagger siblings by 80ms
 */
function initRevealObserver() {
    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll('.reveal-blur');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Find sibling index for staggering
                const parent = entry.target.parentElement;
                const siblings = Array.from(parent.querySelectorAll(':scope > .reveal-blur'));
                const index = siblings.indexOf(entry.target);
                
                // Apply stagger delay only if part of a group
                const delay = index >= 0 ? index * 80 : 0;
                entry.target.style.transitionDelay = `${delay}ms`;
                
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

/**
 * Primary Motion: Decode Text Effect
 * Cycles random glyphs before resolving to final text
 */
function initDecodeText() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = document.querySelectorAll('.decode-text');
    if (!targets.length) return;

    const chars = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    targets.forEach(target => {
        const finalText = target.dataset.final || target.textContent;
        const duration = 1500; // ms
        const intervalTime = 50;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const interval = setInterval(() => {
            const progress = currentStep / steps;
            const resolvedCount = Math.floor(progress * finalText.length);
            
            let display = '';
            for (let i = 0; i < finalText.length; i++) {
                if (finalText[i] === ' ') {
                    display += ' ';
                } else if (i < resolvedCount) {
                    display += finalText[i];
                } else {
                    display += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            
            target.textContent = display;
            currentStep++;

            if (currentStep >= steps) {
                clearInterval(interval);
                target.textContent = finalText;
            }
        }, intervalTime);
    });
}

/**
 * Services Accordion Logic
 * Keyboard accessible expanding rows
 */
function initServiceAccordion() {
    const rows = document.querySelectorAll('.service-row');
    if (!rows.length) return;

    rows.forEach(row => {
        // Click handler
        row.addEventListener('click', () => toggleRow(row));
        
        // Keyboard handler
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleRow(row);
            }
        });
    });

    function toggleRow(activeRow) {
        const isActive = activeRow.classList.contains('is-active');
        
        // Close all others (optional: remove this loop for multi-open)
        rows.forEach(r => r.classList.remove('is-active'));
        
        if (!isActive) {
            activeRow.classList.add('is-active');
        }
    }
}

/**
 * Contact Form Validation & Submission Simulation
 */
function initContactForm() {
    const form = document.getElementById('projectForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset errors
        form.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        const statusEl = form.querySelector('.form-status');
        const btn = form.querySelector('button[type="submit"]');
        const btnText = btn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        
        // Basic Validation
        let isValid = true;
        const name = form.querySelector('#name');
        const email = form.querySelector('#email');
        const message = form.querySelector('#message');

        if (!name.value.trim()) {
            showError(name, 'Name is required');
            isValid = false;
        }
        
        if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            showError(email, 'Valid email is required');
            isValid = false;
        }
        
        if (!message.value.trim()) {
            showError(message, 'Please describe your project');
            isValid = false;
        }

        if (!isValid) return;

        // Loading State
        btn.disabled = true;
        btnText.textContent = 'TRANSMITTING...';
        statusEl.textContent = '';
        statusEl.style.color = 'var(--text-muted)';

        // Simulate Network Request
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Success State
            statusEl.textContent = '✓ TRANSMISSION RECEIVED. WE WILL CONTACT YOU SHORTLY.';
            statusEl.style.color = 'var(--accent)';
            form.reset();
            btnText.textContent = 'SENT';
            
            setTimeout(() => {
                btn.disabled = false;
                btnText.textContent = originalText;
            }, 3000);
            
        } catch (err) {
            // Error State
            statusEl.textContent = '✕ CONNECTION FAILED. PLEASE TRY EMAIL DIRECTLY.';
            statusEl.style.color = '#ff4444';
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    });

    function showError(input, msg) {
        const errorEl = input.parentElement.querySelector('.error-msg');
        if (errorEl) errorEl.textContent = msg;
        input.focus();
    }
}