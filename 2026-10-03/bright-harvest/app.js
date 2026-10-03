/**
 * Bright Harvest - Interactive Logic
 * Handles: Navigation, Magnetic Buttons, Spring Accordion, Counters, Forms
 */

document.addEventListener('DOMContentLoaded', () => {
    // Remove no-js class
    document.documentElement.classList.remove('no-js');

    initNavigation();
    initRevealObserver();
    initMagneticButtons();
    initAccordion();
    initCounters();
    initDonationForm();
    initVolunteerForm();
});

/* ----------------------------------------
   NAVIGATION
---------------------------------------- */
function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.main-nav') && navList.classList.contains('open')) {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/* ----------------------------------------
   REVEAL OBSERVER (Entrance Animations)
---------------------------------------- */
function initRevealObserver() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-group').forEach(el => observer.observe(el));
}

/* ----------------------------------------
   MAGNETIC BUTTONS
---------------------------------------- */
function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return; // Disable on touch/mobile

    const buttons = document.querySelectorAll('.magnetic-btn');
    const strength = 0.4; // How much it moves toward cursor
    const radius = 120; // Activation radius in px

    buttons.forEach(btn => {
        let bounds;
        
        const onMouseMove = (e) => {
            const { x, y } = e;
            const dx = x - (bounds.left + bounds.width / 2);
            const dy = y - (bounds.top + bounds.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                // Lerp-like effect via direct assignment for responsiveness
                requestAnimationFrame(() => {
                    btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px) scale(1.04)`;
                });
            } else {
                resetBtn();
            }
        };

        const resetBtn = () => {
            btn.style.transform = 'translate(0px, 0px) scale(1)';
        };

        btn.addEventListener('mouseenter', () => {
            bounds = btn.getBoundingClientRect();
            document.addEventListener('mousemove', onMouseMove);
        });

        btn.addEventListener('mouseleave', () => {
            document.removeEventListener('mousemove', onMouseMove);
            resetBtn();
        });
    });
}

/* ----------------------------------------
   SPRING ACCORDION
---------------------------------------- */
function initAccordion() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            const panelId = trigger.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            
            // Close all others (single-open behavior)
            triggers.forEach(otherTrigger => {
                if (otherTrigger !== trigger) {
                    otherTrigger.setAttribute('aria-expanded', 'false');
                    const otherPanel = document.getElementById(otherTrigger.getAttribute('aria-controls'));
                    if (otherPanel) otherPanel.classList.remove('active');
                }
            });

            // Toggle current
            trigger.setAttribute('aria-expanded', !expanded);
            if (!expanded) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    });
}

/* ----------------------------------------
   IMPACT COUNTERS
---------------------------------------- */
function initCounters() {
    const counters = document.querySelectorAll('.impact-number[data-target]');
    if (!counters.length) return;

    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const duration = 2000; // ms
        const start = performance.now();

        const update = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(ease * target);
            
            el.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target.toLocaleString();
            }
        };

        requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
}

/* ----------------------------------------
   DONATION FORM LOGIC
---------------------------------------- */
function initDonationForm() {
    const('donation-form');
    const successState = document.getElementById('donation-success');
    if (!form || !successState) return;

    // Frequency Toggle
    const freqOptions = form.querySelectorAll('.toggle-option');
    freqOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            freqOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
        });
    });

    // Amount Selection
    const amountOptions = form.querySelectorAll('.amount-option');
    const customInput = document.getElementById('custom-amount-input');

    amountOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            amountOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            opt.querySelector('input[type="radio"]').checked = true;

            // Handle custom input enable/disable
            if (opt.classList.contains('custom-amount')) {
                customInput.disabled = false;
                customInput.focus();
            } else {
                customInput.disabled = true;
                customInput.value = '';
            }
        });
    });

    // Fake Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.querySelector('.btn-text').textContent;
        
        // Loading state
        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = 'Processing...';
        btn.classList.add('loading');

        setTimeout(() => {
            form.hidden = true;
            successState.hidden = false;
            successState.focus();
        }, 1500);
    });
}

/* ----------------------------------------
   VOLUNTEER FORM VALIDATION
---------------------------------------- */
function initVolunteerForm() {
    const form = document.getElementById('volunteer-signup');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Basic validation check
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        btn.disabled = true;
        btn.textContent = 'Sending Application...';

        // Simulate API call
        setTimeout(() => {
            btn.textContent = 'Application Received!';
            btn.style.backgroundColor = 'var(--color-secondary)';
            btn.style.borderColor = 'var(--color-secondary)';
            form.reset();
            
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
                alert('Thank you for volunteering! We will be in touch within 48 hours.');
            }, 2000);
        }, 1500);
    });
}