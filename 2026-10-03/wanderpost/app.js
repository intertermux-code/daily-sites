/**
 * WANDERPOST INTERACTION CONTROLLER
 * Handles: Magnetic Buttons, Animated Counters, Modals, Month Picker, Slider, Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initMagneticButtons();
    initCounters();
    initModals();
    initMonthPicker();
    initStorySlider();
    initEnquiryForm();
    initJourneyFilters();
});

/* --- MOBILE MENU --- */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const drawer = document.getElementById('mobile-nav');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        drawer.hidden = expanded;
        
        // Animate bars
        const bars = toggle.querySelectorAll('.bar');
        if (!expanded) {
            bars[0].style.transform = 'rotate(45deg) translate(3px, 3px)';
            bars[1].style.transform = 'rotate(-45deg) translate(3px, -3px)';
        } else {
            bars.forEach(b => b.style.transform = 'none');
        }
    });
}

/* --- MAGNETIC BUTTONS --- */
function initMagneticButtons() {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const buttons = document.querySelectorAll('[data-magnetic]');
    const radius = 120; // px activation radius
    const strength = 0.3; // lerp factor

    buttons.forEach(btn => {
        let x = 0, y = 0;
        let targetX = 0, targetY = 0;
        let rafId = null;

        const update = () => {
            // Linear interpolation for smooth spring-back
            x += (targetX - x) * strength;
            y += (targetY - y) * strength;

            // Stop updating if negligible movement
            if (Math.abs(targetX - x) < 0.1 && Math.abs(targetY - y) < 0.1) {
                x = targetX;
                y = targetY;
                btn.style.transform = `translate(${x}px, ${y}px)`;
                rafId = null;
                return;
            }

            btn.style.transform = `translate(${x}px, ${y}px)`;
            rafId = requestAnimationFrame(update);
        };

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

            if (dist < radius) {
                // Calculate pull towards cursor
                const pullX = (e.clientX - centerX) * 0.3;
                const pullY = (e.clientY - centerY) * 0.3;
                
                targetX = pullX;
                targetY = pullY;
                
                // Subtle scale at closest point
                const scale = 1 + (0.04 * (1 - dist/radius));
                btn.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            } else {
                targetX = 0;
                targetY = 0;
            }

            if (!rafId) rafId = requestAnimationFrame(update);
        });

        btn.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            if (!rafId) rafId = requestAnimationFrame(update);
        });
    });
}

/* --- ANIMATED COUNTERS --- */
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

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

function animateCounter(el) {
    // Check reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = el.dataset.target + (el.dataset.suffix || '');
        return;
    }

    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1200; // ms
    const startTime = performance.now();

    const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        
        const current = Math.round(easedProgress * target);
        el.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);
}

/* --- MODALS --- */
function initModals() {
    const openBtns = document.querySelectorAll('.open-modal');
    const closeBtns = document.querySelectorAll('.close-modal');
    const dialogs = document.querySelectorAll('.journey-modal');

    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const dialog = document.getElementById(targetId);
            if (dialog) {
                dialog.showModal();
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dialog = btn.closest('dialog');
            if (dialog) {
                dialog.close();
                document.body.style.overflow = '';
            }
        });
    });

    // Close on backdrop click
    dialogs.forEach(dialog => {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.close();
                document.body.style.overflow = '';
            }
        });
    });
}

/* --- MONTH PICKER --- */
function initMonthPicker() {
    const tabs = document.querySelectorAll('.month-tab');
    const panels = document.querySelectorAll('.display-panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update Tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Update Panels
            const month = tab.dataset.month;
            panels.forEach(p => p.classList.remove('active'));
            
            const targetPanel = document.querySelector(`.display-panel[data-panel="${month}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            } else {
                // Fallback to default if specific month panel doesn't exist in HTML
                const defaultPanel = document.querySelector('.display-panel[data-panel="default"]');
                if (defaultPanel) defaultPanel.classList.add('active');
            }
        });
    });
}

/* --- STORY SLIDER --- */
function initStorySlider() {
    const track = document.getElementById('story-track');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');
    const currentEl = document.querySelector('.slider-progress .current');
    
    if (!track || !prevBtn || !nextBtn) return;

    const slides = track.children;
    const total = slides.length;
    let index = 0;

    const update = () => {
        track.style.transform = `translateX(-${index * 100}%)`;
        if (currentEl) currentEl.textContent = String(index + 1).padStart(2, '0');
        
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === total - 1;
        prevBtn.style.opacity = index === 0 ? 0.3 : 1;
        nextBtn.style.opacity = index === total - 1 ? 0.3 : 1;
    };

    prevBtn.addEventListener('click', () => {
        if (index > 0) { index--; update(); }
    });

    nextBtn.addEventListener('click', () => {
        if (index < total - 1) { index++; update(); }
    });

    update(); // Init state
}

/* --- ENQUIRY FORM VALIDATION --- */
function initEnquiryForm() {
    const form = document.getElementById('trip-enquiry-form');
    if (!form) return;

    // Pre-fill destination from URL param
    const params = new URLSearchParams(window.location.search);
    const trip = params.get('trip');
    if (trip) {
        const select = form.querySelector('#destination');
        if (select) select.value = trip;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Basic Validation
        let isValid = true;
        const fields = form.querySelectorAll('[required]');
        
        fields.forEach(field => {
            const errorSpan = field.parentElement.querySelector('.error-msg');
            if (!field.value.trim()) {
                isValid = false;
                if (errorSpan) errorSpan.textContent = 'This field is required';
                field.style.borderBottomColor = '#b00';
            } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                isValid = false;
                if (errorSpan) errorSpan.textContent = 'Please enter a valid email';
                field.style.borderBottomColor = '#b00';
            } else {
                if (errorSpan) errorSpan.textContent = '';
                field.style.borderBottomColor = '';
            }
        });

        if (!isValid) return;

        // Simulate Submission
        const btn = form.querySelector('button[type="submit"]');
        const status = form.querySelector('.form-status');
        
        btn.classList.add('loading');
        btn.disabled = true;
        status.textContent = 'Transmitting...';

        await new Promise(r => setTimeout(r, 1500));

        btn.classList.remove('loading');
        btn.disabled = false;
        status.textContent = '✓ Enquiry Received. We will be in touch within 48 hours.';
        status.style.color = 'var(--color-accent)';
        form.reset();
    });
}

/* --- JOURNEY FILTERS --- */
function initJourneyFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.journey-instrument');
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active State
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            items.forEach(item => {
                if (filter === 'all' || item.dataset.region === filter) {
                    item.style.display = 'flex';
                    // Trigger reflow for animation if desired, 
                    // but simple display toggle is robust for dashboard aesthetic
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}