/**
 * EMBER & OAK — Shared JavaScript
 * Vanilla JS only. No.
 * Features: Mobile Nav, Parallax, Spring Accordion, Menu Tabs, 
 *           Gallery Lightbox, Reservation Form Validation
 */

(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── MOBILE NAV ────────────────────────────────────────
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.getElementById('nav-list');

    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!expanded));
            navList.classList.toggle('open');
        });

        // Close nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navList.contains(e.target)) {
                navToggle.setAttribute('aria-expanded', 'false');
                navList.classList.remove('open');
            }
        });

        // Close nav on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('open')) {
                navToggle.setAttribute('aria-expanded', 'false');
                navList.classList.remove('open');
                navToggle.focus();
            }
        });
    }

    // ─── PARALLAX LAYERS ───────────────────────────────────
    if (!prefersReducedMotion) {
        const parallaxLayers = document.querySelectorAll('.parallax-layer[data-speed]');
        
        if (parallaxLayers.length > 0) {
            let ticking = false;

            function updateParallax() {
                const scrollY = window.scrollY;
                parallaxLayers.forEach(layer => {
                    const speed = parseFloat(layer.dataset.speed) || 0;
                    layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
                });
                ticking = false;
            }

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            }, { passive: true });
        }
    }

    // ─── SPRING ACCORDION ──────────────────────────────────
    const accordionItems = document.querySelectorAll('.accordion-item');

    if (accordionItems.length > 0) {
        accordionItems.forEach(item => {
            const trigger = item.querySelector('.accordion-trigger');
            const panel = item.querySelector('.accordion-panel');

            if (!trigger || !panel) return;

            // Initialize: set aria-hidden based on active state
            const isActive = item.classList.contains('active');
            panel.setAttribute('aria-hidden', String(!isActive));

            trigger.addEventListener('click', () => {
                const isOpen = trigger.getAttribute('aria-expanded') === 'true';

                // Close all others (single-open behavior)
                accordionItems.forEach(otherItem => {
                    const otherTrigger = otherItem.querySelector('.accordion-trigger');
                    const otherPanel = otherItem.querySelector('.accordion-panel');
                    if (otherTrigger && otherPanel && otherItem !== item) {
                        otherTrigger.setAttribute('aria-expanded', 'false');
                        otherPanel.setAttribute('aria-hidden', 'true');
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current
                if (isOpen) {
                    trigger.setAttribute('aria-expanded', 'false');
                    panel.setAttribute('aria-hidden', 'true');
                    item.classList.remove('active');
                } else {
                    trigger.setAttribute('aria-expanded', 'true');
                    panel.setAttribute('aria-hidden', 'false');
                    item.classList.add('active');
                }
            });
        });
    }

    // ─── MENU TABS ─────────────────────────────────────────
    const tabButtons = document.querySelectorAll('.tab-btn[role="tab"]');
    const tabPanels = document.querySelectorAll('.menu-panel[role="tabpanel"]');

    if (tabButtons.length > 0 && tabPanels.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('aria-controls');

                // Deactivate all
                tabButtons.forEach(b => {
                    b.setAttribute('aria-selected', 'false');
                    b.classList.remove('active');
                });
                tabPanels.forEach(p => {
                    p.classList.remove('active');
                    p.hidden = true;
                });

                // Activate clicked
                btn.setAttribute('aria-selected', 'true');
                btn.classList.add('active');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.hidden = false;
                }
            });

            // Keyboard navigation between tabs
            btn.addEventListener('keydown', (e) => {
                const tabs = Array.from(tabButtons);
                const idx = tabs.indexOf(btn);
                let newIdx = idx;

                if (e.key === 'ArrowRight') newIdx = (idx + 1) % tabs.length;
                else if (e.key === 'ArrowLeft') newIdx = (idx - 1 + tabs.length) % tabs.length;
                else if (e.key === 'Home') newIdx = 0;
                else if (e.key === 'End') newIdx = tabs.length - 1;
                else return;

                e.preventDefault();
                tabs[newIdx].focus();
                tabs[newIdx].click();
            });
        });
    }

    // ─── GALLERY LIGHTBOX ──────────────────────────────────
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxBackdrop = document.querySelector('.lightbox-backdrop');
    const lbPrev = document.querySelector('.lb-prev');
    const lbNext = document.querySelector('.lb-next');

    if (galleryItems.length > 0 && lightbox && lightboxImg) {
        let currentIndex = 0;
        const images = Array.from(galleryItems).map(item => ({
            src: item.querySelector('img').src.replace('w=800', 'w=1600'),
            alt: item.querySelector('img').alt
        }));

        function openLightbox(index) {
            currentIndex = index;
            lightboxImg.src = images[currentIndex].src;
            lightboxImg.alt = images[currentIndex].alt;
            lightbox.showModal ? lightbox.showModal() : lightbox.setAttribute('open', '');
            document.body.style.overflow = 'hidden';
            lightboxClose.focus();
        }

        function closeLightbox() {
            lightbox.close ? lightbox.close() : lightbox.removeAttribute('open');
            document.body.style.overflow = '';
            galleryItems[currentIndex]?.focus();
        }

        function navigate(dir) {
            currentIndex = (currentIndex + dir + images.length) % images.length;
            lightboxImg.style.opacity = '0';
            setTimeout(() => {
                lightboxImg.src = images[currentIndex].src;
                lightboxImg.alt = images[currentIndex].alt;
                lightboxImg.style.opacity = '1';
            }, 150);
        }

        galleryItems.forEach((item, i) => {
            item.addEventListener('click', () => openLightbox(i));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(i);
                }
            });
        });

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
        if (lbPrev) lbPrev.addEventListener('click', () => navigate(-1));
        if (lbNext) lbNext.addEventListener('click', () => navigate(1));

        // Keyboard nav in lightbox
        lightbox.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        // Transition for image swap
        lightboxImg.style.transition = 'opacity 150ms ease';
    }

    // ─── RESERVATION FORM VALIDATION ───────────────────────
    const bookingForm = document.getElementById('booking-form');
    const formStatus = document.getElementById('form-status');

    if (bookingForm && formStatus) {
        const validators = {
            name: (v) => v.trim().length >= 2 ? '' : 'Please enter your full name.',
            phone: (v) => /^[\d\s\-\(\)\+]{7,}$/.test(v.trim()) ? '' : 'Please enter a valid phone number.',
            email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
            date: (v) => {
                if (!v) return 'Please select a date.';
                const selected = new Date(v);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selected >= today ? '' : 'Please select a future date.';
            },
            time: (v) => v ? '' : 'Please select a time.',
            guests: (v) => v ? '' : 'Please select party size.'
        };

        function validateField(field) {
            const name = field.name || field.id;
            const validator = validators[name];
            if (!validator) return '';

            const errorMsg = validator(field.value);
            const errorEl = field.parentElement.querySelector('.error-msg');
            
            if (errorMsg) {
                field.classList.add('error');
                if (errorEl) errorEl.textContent = errorMsg;
            } else {
                field.classList.remove('error');
                if (errorEl) errorEl.textContent = '';
            }
            return errorMsg;
        }

        // Inline validation on blur
        Object.keys(validators).forEach(fieldName => {
            const field = bookingForm.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field) {
                field.addEventListener('blur', () => validateField(field));
                field.addEventListener('input', () => {
                    if (field.classList.contains('error')) validateField(field);
                });
            }
        });

        // Set min date to today
        const dateInput = bookingForm.querySelector('#date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let hasErrors = false;
            Object.keys(validators).forEach(fieldName => {
                const field = bookingForm.querySelector(`[name="${fieldName}"], #${fieldName}`);
                if (field && validateField(field)) hasErrors = true;
            });

            if (hasErrors) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please correct the errors above before submitting.';
                // Focus first error field
                const firstError = bookingForm.querySelector('.error');
                if (firstError) firstError.focus();
                return;
            }

            // Simulate submission
            const submitBtn = bookingForm.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Confirming…';
            formStatus.className = 'form-status';
            formStatus.textContent = '';

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                formStatus.className = 'form-status success';
                formStatus.textContent = '✓ Reservation confirmed! A confirmation email has been sent. We look forward to welcoming you.';
                bookingForm.reset();
                
                // Clear any lingering error states
                bookingForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
                bookingForm.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
            }, 1500);
        });
    }

})();