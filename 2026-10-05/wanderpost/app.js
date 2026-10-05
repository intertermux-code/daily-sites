/**
 * WANDERPOST — SHARED APPLICATION LOGIC
 * Vanilla JS, No Dependencies
 * Guards all page-specific functionality via element existence checks
 */

(function() {
    'use strict';

    // =====================
    // UTILITIES
    // =====================
    const qs = (selector, parent = document) => parent.querySelector(selector);
    const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];
    
    const prefersReducedMotion = () => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // =====================
    // MOBILE NAVIGATION
    // =====================
    function initMobileNav() {
        const toggle = qs('.nav-toggle');
        const navList = qs('.nav-list');
        
        if (!toggle || !navList) return;

        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            navList.classList.toggle('open');
            
            // Prevent body scroll when menu open
            document.body.style.overflow = expanded ? '' : 'hidden';
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('open')) {
                toggle.setAttribute('aria-expanded', 'false');
                navList.classList.remove('open');
                document.body.style.overflow = '';
                toggle.focus();
            }
        });

        // Close when clicking nav links
        qsa('a', navList).forEach(link => {
            link.addEventListener('click', () => {
                toggle.setAttribute('aria-expanded', 'false');
                navList.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // =====================
    // PARALLAX EFFECT (INDEX HERO)
    // =====================
    function initParallax() {
        if (prefersReducedMotion()) return;
        
        const layers = qsa('.parallax-layer[data-speed]');
        if (layers.length === 0) return;

        let ticking = false;

        function updateParallax() {
            const scrollY = window.scrollY;
            const heroHeight = qs('.hero-section')?.offsetHeight || 0;
            
            // Only animate when hero is visible
            if (scrollY > heroHeight) {
                ticking = false;
                return;
            }

            layers.forEach(layer => {
                const speed = parseFloat(layer.dataset.speed);
                const yOffset = scrollY * speed;
                layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
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

    // =====================
    // JOURNEY ACCORDION (JOURNEYS PAGE)
    // =====================
    function initJourneyAccordion() {
        const expandButtons = qsa('.expand-btn');
        if (expandButtons.length === 0) return;

        expandButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('aria-controls');
                const targetPanel = qs(`#${targetId}`);
                const isExpanded = btn.getAttribute('aria-expanded') === 'true';

                // Close all others (optional: remove this block for multi-open)
                expandButtons.forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.setAttribute('aria-expanded', 'false');
                        const otherId = otherBtn.getAttribute('aria-controls');
                        const otherPanel = qs(`#${otherId}`);
                        if (otherPanel) otherPanel.hidden = true;
                    }
                });

                // Toggle current
                btn.setAttribute('aria-expanded', String(!isExpanded));
                targetPanel.hidden = isExpanded;

                // Smooth scroll into view if opening
                if (!isExpanded) {
                    setTimeout(() => {
                        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });
        });

        // Handle URL hash for direct linking to specific journey
        const hash = window.location.hash.slice(1);
        if (hash) {
            const targetBtn = qs(`[aria-controls="detail-${hash}"]`);
            if (targetBtn) {
                targetBtn.click();
            }
        }
    }

    // =====================
    // MONTH PICKER (DESTINATION PAGE)
    // =====================
    function initMonthPicker() {
        const tabs = qsa('.month-tab');
        const panels = qsa('.month-panel');
        
        if (tabs.length === 0 || panels.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const month = tab.dataset.month;

                // Update tabs
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                // Update panels
                panels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.dataset.panel === month) {
                        panel.classList.add('active');
                    }
                });
            });
        });

        // Keyboard navigation for tabs
        const tabList = qs('[role="tablist"]');
        if (tabList) {
            tabList.addEventListener('keydown', (e) => {
                const currentIndex = tabs.indexOf(document.activeElement);
                let newIndex;

                if (e.key === 'ArrowRight') {
                    newIndex = (currentIndex + 1) % tabs.length;
                } else if (e.key === 'ArrowLeft') {
                    newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                } else if (e.key === 'Home') {
                    newIndex = 0;
                } else if (e.key === 'End') {
                    newIndex = tabs.length - 1;
                } else {
                    return;
                }

                e.preventDefault();
                tabs[newIndex].focus();
                tabs[newIndex].click();
            });
        }
    }

    // =====================
    // STORIES SLIDER (STORIES PAGE)
    // =====================
    function initStoriesSlider() {
        const slides = qsa('.story-slide');
        const prevBtn = qs('.slider-btn.prev');
        const nextBtn = qs('.slider-btn.next');
        const counter = qs('.slider-counter');

        if (slides.length === 0 || !prevBtn || !nextBtn) return;

        let currentIndex = 0;
        const totalSlides = slides.length;

        function updateSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            if (counter) {
                counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
            }
        }

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlide(currentIndex);
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlide(currentIndex);
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!qs('.stories-slider-section')?.contains(document.activeElement)) return;
            if (e.key === 'ArrowLeft') prevBtn.click();
            if (e.key === 'ArrowRight') nextBtn.click();
        });
    }

    // =====================
    // ENQUIRY FORM VALIDATION (ENQUIRY PAGE)
    // =====================
    function initEnquiryForm() {
        const form = qs('#trip-enquiry-form');
        if (!form) return;

        // Pre-fill destination from URL param
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            const destSelect = qs('#destination', form);
            if (destSelect) destSelect.value = ref;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Clear previous errors
            qsa('.error-msg', form).forEach(el => el.textContent = '');

            // Validate required fields
            const name = qs('#name', form);
            const email = qs('#email', form);
            const consent = qs('#consent', form);

            if (!name.value.trim()) {
                showError(name, 'Please enter your name');
                isValid = false;
            }

            if (!email.value.trim() || !isValidEmail(email.value)) {
                showError(email, 'Please enter a valid email address');
                isValid = false;
            }

            if (!consent.checked) {
                showError(consent, 'Consent is required to proceed');
                isValid = false;
            }

            if (isValid) {
                // Simulate submission
                const submitBtn = qs('button[type="submit"]', form);
                const originalText = submitBtn.textContent;
                
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending…';
                submitBtn.style.opacity = '0.7';

                setTimeout(() => {
                    submitBtn.textContent = 'Enquiry Received ✓';
                    submitBtn.style.background = '#4a8c6f';
                    submitBtn.style.opacity = '1';
                    
                    // Reset after delay
                    setTimeout(() => {
                        form.reset();
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                        submitBtn.style.background = '';
                    }, 3000);
                }, 1500);
            } else {
                // Focus first invalid field
                const firstError = qs('.error-msg:not(:empty)', form);
                if (firstError) {
                    const input = firstError.previousElementSibling?.tagName === 'LABEL' 
                        ? firstError.previousElementSibling.previousElementSibling 
                        : firstError.previousElementSibling;
                    input?.focus();
                }
            }
        });

        function showError(input, message) {
            const errorEl = input.closest('.form-group, .checkbox-group')?.querySelector('.error-msg');
            if (errorEl) errorEl.textContent = message;
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
    }

    // =====================
    // INITIALIZATION
    // =====================
    function init() {
        initMobileNav();
        initParallax();
        initJourneyAccordion();
        initMonthPicker();
        initStoriesSlider();
        initEnquiryForm();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();