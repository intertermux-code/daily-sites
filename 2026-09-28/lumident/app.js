/**
 * LumiDent Shared Scripts
 * Handles navigation, scroll reveals, form validation, and comparison sliders
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollReveal();
    initBookingForm();
    initComparisonSliders();
});

/* Mobile Navigation */
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger
        const spans = toggle.querySelectorAll('span');
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
        }
    });

    // Close on link click
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            const spans = toggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
        });
    });
}

/* Scroll Reveal Animation */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        elements.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

/* Booking Form Validation */
function initBookingForm() {
    const form = document.getElementById('appointmentForm');
    const successState = document.getElementById('bookingSuccess');
    
    if (!form || !successState) return;

    // Set min date to today
    const dateInput = form.querySelector('#date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

        // Validate required fields
        const requiredFields =]');
        requiredFields.forEach(field => {
            const group = field.closest('.form-group');
            if (!field.value.trim()) {
                isValid = false;
                if (group) group.classList.add('has-error');
            }
        });

        // Validate email format
        const email = form.querySelector('#email');
        if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            isValid = false;
            const group = email.closest('.form-group');
            if (group) group.classList.add('has-error');
        }

        if (isValid) {
            // Simulate submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            setTimeout(() => {
                form.hidden = true;
                successState.hidden = false;
                successState.focus();
            }, 1500);
        } else {
            // Focus first error
            const firstError = form.querySelector('.has-error input, .has-error select');
            if (firstError) firstError.focus();
        }
    });
}

/* Before/After Comparison Slider */
function initComparisonSliders() {
    const sliders = document.querySelectorAll('[data-comparison]');
    if (!sliders.length) return;

    sliders.forEach(slider => {
        const input = slider.querySelector('.slider-handle');
        const afterWrapper = slider.querySelector('.img-after-wrapper');
        const line = slider.querySelector('.slider-line');
        const button = slider.querySelector('.slider-button');

        if (!input || !afterWrapper) return;

        const updateSlider = () => {
            const value = input.value;
            afterWrapper.style.width = `${value}%`;
            line.style.left = `${value}%`;
            button.style.left = `${value}%`;
        };

        input.addEventListener('input', updateSlider);
        
        // Touch support enhancement
        input.addEventListener('touchstart', () => {
            input.style.cursor = 'grabbing';
        }, { passive: true });
        
        input.addEventListener('touchend', () => {
            input.style.cursor = 'ew-resize';
        });
    });
}