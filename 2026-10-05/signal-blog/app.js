/**
 * Signal — Shared Application Logic
 * Handles: Mobile Nav, Spring Accordion, Magnetic Buttons, Form Validation
 */

(function() {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ==========================================
    // Mobile Navigation
    // ==========================================
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', () => {
            const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', String(!expanded));
            mobileNav.hidden = expanded;
            
            // Prevent body scroll when nav is open
            document.body.style.overflow = expanded ? '' : 'hidden';
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileNav.hidden) {
                mobileToggle.setAttribute('aria-expanded', 'false');
                mobileNav.hidden = true;
                document.body.style.overflow = '';
                mobileToggle.focus();
            }
        });

        // Close when clicking a link inside mobile nav
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.setAttribute('aria-expanded', 'false');
                mobileNav.hidden = true;
                document.body.style.overflow = '';
            });
        });
    }

    // ==========================================
    // Spring Accordion
    // Only one panel open at a time
    // Uses grid-template-rows: 0fr -> 1fr transition
    // ==========================================
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');

    if (accordionTriggers.length > 0) {
        accordionTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const isOpen = trigger.getAttribute('aria-expanded') === 'true';
                
                // Close all panels first
                accordionTriggers.forEach(t => {
                    t.setAttribute('aria-expanded', 'false');
                });

                // If clicked panel was closed, open it
                if (!isOpen) {
                    trigger.setAttribute('aria-expanded', 'true');
                }
            });

            // Keyboard support
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trigger.click();
                }
            });
        });
    }

    // ==========================================
    // Magnetic Buttons
    // Translate toward cursor within 120px radius
    // Spring back on mouseleave using rAF lerp
    // ==========================================
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    if (magneticBtns.length > 0 && !prefersReducedMotion) {
        const MAGNETIC_RADIUS = 120;
        const LERP_FACTOR = 0.15;
        const MAX_SCALE = 1.04;

        magneticBtns.forEach(btn => {
            let currentX = 0;
            let currentY = 0;
            let targetX = 0;
            let targetY = 0;
            let rafId = null;
            let isHovering = false;

            const updatePosition = () => {
                // Lerp toward target
                currentX += (targetX - currentX) * LERP_FACTOR;
                currentY += (targetY - currentY) * LERP_FACTOR;

                // Calculate distance for scale effect
                const distance = Math.sqrt(currentX * currentX + currentY * currentY);
                const maxDist = MAGNETIC_RADIUS;
                const scale = 1 + (MAX_SCALE - 1) * Math.max(0, 1 - distance / maxDist);

                btn.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px) scale(${scale.toFixed(4)})`;

                // Continue animation if still moving significantly
                const delta = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
                if (delta > 0.1 || isHovering) {
                    rafId = requestAnimationFrame(updatePosition);
                } else {
                    // Snap to rest when close enough and not hovering
                    if (!isHovering) {
                        btn.style.transform = 'translate(0, 0) scale(1)';
                        rafId = null;
                    }
                }
            };

            btn.addEventListener('mouseenter', () => {
                isHovering = true;
                if (!rafId) {
                    rafId = requestAnimationFrame(updatePosition);
                }
            });

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const deltaX = e.clientX - centerX;
                const deltaY = e.clientY - centerY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance <= MAGNETIC_RADIUS) {
                    // Map distance to translation (stronger pull closer to center)
                    const strength = 1 - distance / MAGNETIC_RADIUS;
                    targetX = deltaX * strength * 0.4;
                    targetY = deltaY * strength * 0.4;
                } else {
                    targetX = 0;
                    targetY = 0;
                }
            });

            btn.addEventListener('mouseleave', () => {
                isHovering = false;
                targetX = 0;
                targetY = 0;
                if (!rafId) {
                    rafId = requestAnimationFrame(updatePosition);
                }
            });

            // Clean up on page hide
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            });
        });
    }

    // ==========================================
    // Subscribe Form Validation
    // Client-side validation with error states
    // ==========================================
    const subscribeForm = document.getElementById('subscribe-form');
    const formSuccess = document.getElementById('form-success');

    if (subscribeForm && formSuccess) {
        const emailInput = subscribeForm.querySelector('#email');
        const nameInput = subscribeForm.querySelector('#name');
        const submitBtn = subscribeForm.querySelector('button[type="submit"]');
        const emailError = subscribeForm.querySelector('#email ~ .field-error');

        const validateEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        const showError = (input, errorEl, message) => {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = message;
        };

        const clearError = (input, errorEl) => {
            input.classList.remove('error');
            if (errorEl) errorEl.textContent = '';
        };

        // Real-time email validation on blur
        emailInput.addEventListener('blur', () => {
            if (emailInput.value && !validateEmail(emailInput.value)) {
                showError(emailInput, emailError, 'Please enter a valid email address.');
            } else {
                clearError(emailInput, emailError);
            }
        });

        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('error') && validateEmail(emailInput.value)) {
                clearError(emailInput, emailError);
            }
        });

        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Validate email
            if (!emailInput.value || !validateEmail(emailInput.value)) {
                showError(emailInput, emailError, !emailInput.value ? 'Email is required.' : 'Please enter a valid email address.');
                isValid = false;
            } else {
                clearError(emailInput, emailError);
            }

            // Validate name
            if (!nameInput.value.trim()) {
                nameInput.classList.add('error');
                isValid = false;
            } else {
                nameInput.classList.remove('error');
            }

            if (!isValid) {
                // Focus first invalid field
                const firstInvalid = subscribeForm.querySelector('.error');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // Simulate submission
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.classList.remove('loading');
                subscribeForm.hidden = true;
                formSuccess.hidden = false;
                
                // Announce success to screen readers
                formSuccess.setAttribute('role', 'status');
                formSuccess.focus();
            }, 1800);
        });
    }

    // ==========================================
    // Dynamic Date Update
    // ==========================================
    const dateElements = document.querySelectorAll('#current-date, .header-date');
    if (dateElements.length > 0) {
        const now = new Date();
        const formatted = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit', 
            year: 'numeric' 
        });
        dateElements.forEach(el => { el.textContent = formatted; });
    }

})();