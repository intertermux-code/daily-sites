/**
 * Wanderpost Core Scripts
 * Handles: Nav, Spotlight, Parallax, Ledger Accordion, Tabs, Slider, Form
 */

document.documentElement.classList.remove('no-js');

// Utility: Throttle for performance
const throttle = (fn, wait) => {
    let lastTime = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastTime >= wait) {
            lastTime = now;
            fn.apply(null, args);
        }
    };
};

// 1. Mobile Navigation
const initNav = () => {
    const toggle = document.querySelector('.nav-toggle');
    const list = document.querySelector('.nav-list');
    if (!toggle || !list) return;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        list.classList.toggle('open');
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && list.classList.contains('open')) {
            toggle.setAttribute('aria-expanded', 'false');
            list.classList.remove('open');
            toggle.focus();
        }
    });
};

// 2. Cursor Spotlight (Hero Only)
const initSpotlight = () => {
    const hero = document.querySelector('.hero');
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const spotlight = hero.querySelector('.hero-spotlight');
    
    const updatePos = (e) => {
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        spotlight.style.setProperty('--x', `${x}%`);
        spotlight.style.setProperty('--y', `${y}%`);
    };

    hero.addEventListener('pointermove', throttle(updatePos, 16)); // ~60fps cap
};

// 3. Parallax Layers (Hero Only)
const initParallax = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const layers = document.querySelectorAll('[data-speed]');
    if (!layers.length) return;

    let ticking = false;
    
    const updateLayers = () => {
        const scrollY = window.scrollY;
        layers.forEach(layer => {
            const speed = parseFloat(layer.dataset.speed);
            const offset = scrollY * speed;
            layer.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateLayers);
            ticking = true;
        }
    }, { passive: true });
};

// 4. Ledger Accordion (Journeys Page)
const initLedger = () => {
    const summaries = document.querySelectorAll('.row-summary');
    if (!summaries.length) return;

    summaries.forEach(summary => {
        summary.addEventListener('click', () => {
            const expanded = summary.getAttribute('aria-expanded') === 'true';
            const detailId = summary.getAttribute('aria-controls');
            const detail = document.getElementById(detailId);
            
            // Optional: Close others for accordion behavior
            summaries.forEach(s => {
                if (s !== summary) {
                    s.setAttribute('aria-expanded', 'false');
                    const otherId = s.getAttribute('aria-controls');
                    const otherDetail = document.getElementById(otherId);
                    if (otherDetail) otherDetail.hidden = true;
                }
            });

            summary.setAttribute('aria-expanded', !expanded);
            detail.hidden = expanded;
        });

        // Keyboard support
        summary.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                summary.click();
            }
        });
    });
};

// 5. Month Picker Tabs (Destination Page)
const initTabs = () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => {
                p.hidden = true;
                p.classList.remove('active');
            });

            // Activate clicked
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const panelId = tab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            panel.hidden = false;
            panel.classList.add('active');
        });
    });
};

// 6. Stories Slider
const initSlider = () => {
    const slides = document.querySelectorAll('.story-slide');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const counter = document.querySelector('.counter');
    if (!slides.length || !prevBtn || !nextBtn) return;

    let current = 0;
    const total = slides.length;

    const updateSlide = () => {
        slides.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === current);
            slide.hidden = idx !== current;
        });
        if (counter) counter.textContent = `0${current + 1} / 0${total}`;
    };

    nextBtn.addEventListener('click', () => {
        current = (current + 1) % total;
        updateSlide();
    });

    prevBtn.addEventListener('click', () => {
        current = (current - 1 + total) % total;
        updateSlide();
    });

    // Initialize state
    updateSlide();
};

// 7. Enquiry Form Handling
const initForm = () => {
    const form = document.querySelector('.enquiry-form');
    if (!form) return;

    // Pre-fill journey from URL param
    const params = new URLSearchParams(window.location.search);
    const journeyParam = params.get('journey');
    if (journeyParam) {
        const select = form.querySelector('#journey-select');
        if (select) select.value = journeyParam;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('.btn-submit');
        const loader = btn.querySelector('.btn-loader');
        const text = btn.querySelector('.btn-text');
        const status = form.querySelector('.form-status');
        
        // Basic validation
        let valid = true;
        form.querySelectorAll('[required]').forEach(input => {
            const errSpan = input.parentElement.querySelector('.error-msg');
            if (!input.value.trim()) {
                valid = false;
                if (errSpan) errSpan.textContent = 'This field is required';
                input.style.borderBottomColor = '#b03030';
            } else {
                if (errSpan) errSpan.textContent = '';
                input.style.borderBottomColor = '';
            }
        });

        if (!valid) return;

        // Simulate submission
        btn.disabled = true;
        text.style.opacity = '0';
        loader.style.display = 'block';
        status.textContent = '';

        await new Promise(r => setTimeout(r, 1500));

        loader.style.display = 'none';
        text.style.opacity = '1';
        btn.disabled = false;
        status.textContent = 'Enquiry received. We will be in touch within 48 hours.';
        status.className = 'form-status success';
        form.reset();
    });
};

// Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initSpotlight();
    initParallax();
    initLedger();
    initTabs();
    initSlider();
    initForm();
});