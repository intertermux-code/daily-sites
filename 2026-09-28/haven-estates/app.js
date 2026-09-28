/**
 * Haven Estates - Shared Application Logic
 * Handles navigation, filtering, calculator, and animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollReveal();
    initListingsFilter();
    initMortgageCalculator();
    initContactForm();
    initInteractiveRows();
});

/* --- MOBILE NAVIGATION --- */
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-list');
    
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !isOpen);
        menu.classList.toggle('is-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('is-open')) {
            toggle.setAttribute('aria-expanded', 'false');
            menu.classList.remove('is-open
    });
}

/* --- SCROLL REVEAL ANIMATION --- */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

/* --- LISTINGS FILTER LOGIC --- */
function initListingsFilter() {
    const grid = document.getElementById('listings-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.listing-card'));
    const noResults = document.getElementById('no-results');
    const locationSelect = document.getElementById('filter-location');
    const priceSelect = document.getElementById('filter-price');
    const bedsSelect = document.getElementById('filter-beds');
    const resetBtn = document.getElementById('reset-filters');

    function filterListings() {
        const locVal = locationSelect.value;
        const priceVal = parseInt(priceSelect.value, 10);
        const bedsVal = parseInt(bedsSelect.value, 10);
        
        let visibleCount = 0;

        cards.forEach(card => {
            const cardLoc = card.dataset.location;
            const cardPrice = parseInt(card.dataset.price, 10);
            const cardBeds = parseInt(card.dataset.beds, 10);

            const matchLoc = locVal === 'all' || cardLoc === locVal;
            const matchPrice = cardPrice <= priceVal;
            const matchBeds = cardBeds >= bedsVal;

            if (matchLoc && matchPrice && matchBeds) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (visibleCount === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }

    [locationSelect, priceSelect, bedsSelect].forEach(el => {
        if (el) el.addEventListener('change', filterListings);
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            locationSelect.value = 'all';
            priceSelect.value = '99999999';
            bedsSelect.value = '0';
            filterListings();
        });
    }
}

/* --- MORTGAGE CALCULATOR --- */
function initMortgageCalculator() {
    const priceInput = document.getElementById('calc-price');
    if (!priceInput) return;

    const downInput = document.getElementById('calc-down');
    const rateInput = document.getElementById('calc-rate');
    const yearsInput = document.getElementById('calc-years');
    const resultDisplay = document.getElementById('monthly-payment');

    function calculate() {
        const principal = parseFloat(priceInput.value) * (1 - parseFloat(downInput.value) / 100);
        const annualRate = parseFloat(rateInput.value) / 100;
        const months = parseInt(yearsInput.value, 10) * 12;
        
        if (principal <= 0 || months <= 0) {
            resultDisplay.textContent = '$0';
            return;
        }

        const monthlyRate = annualRate / 12;
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        
        resultDisplay.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(payment);
    }

    [priceInput, downInput, rateInput, yearsInput].forEach(el => {
        el.addEventListener('input', calculate);
    });

    calculate(); // Initial calc
}

/* --- CONTACT FORM HANDLING --- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const statusDiv = document.getElementById('form-status');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Basic validation
        const name = form.querySelector('#name');
        const email = form.querySelector('#email');
        const message = form.querySelector('#message');
        
        if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
            statusDiv.textContent = 'Please fill in all required fields.';
            statusDiv.className = 'form-status error';
            return;
        }

        // Simulate submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending…';
        submitBtn.disabled = true;

        setTimeout(() => {
            statusDiv.textContent = 'Thank you. Your inquiry has been received. An agent will contact you within 24 hours.';
            statusDiv.className = 'form-status success';
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
}

/* --- INTERACTIVE TABLE ROWS --- */
function initInteractiveRows() {
    const rows = document.querySelectorAll('.interactive-row');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking the link itself
            if (e.target.closest('a')) return;
            const href = row.dataset.href;
            if (href) window.location.href = href;
        });
        
        // Keyboard accessibility
        row.setAttribute('tabindex', '0');
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const href = row.dataset.href;
                if (href) window.location.href = href;
            }
        });
    });
}