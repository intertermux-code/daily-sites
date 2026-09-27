/**
 * Haven Estates - Main Application Logic
 * Handles navigation, filtering, calculations, and animations.
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initListingsFilter();
    initMortgageCalculator();
    initScrollAnimations();
    initContactForm();
});

/* --- NAVIGATION --- */
function initNavigation() {
    const toggleBtn = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');

    if (!toggleBtn || !navList) return;

    toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isExpanded);
        navList.classList.toggle('active');
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.main-nav') && navList.classList.contains('active')) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            navList.classList.remove('active');
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navList.classList.contains('active')) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            navList.classList.remove('active');
            toggleBtn.focus();
        }
    });
}

/* --- LISTINGS FILTERING --- */
function initListingsFilter() {
    const filterForm = document.getElementById('listing-filters');
    const cards = Array.from(document.querySelectorAll('.property-card'));
    const countDisplay = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    const clearBtns = document.querySelectorAll('#clear-filters, .reset-trigger');
    const sortSelect = document.getElementById('sort-select');
    const grid = document.getElementById('listings-grid');

    if (!filterForm || cards.length === 0) return;

    const filters = {
        minPrice: document.getElementById('filter-price-min'),
        maxPrice: document.getElementById('filter-price-max'),
        beds: document.getElementById('filter-beds'),
        baths: document.getElementById('filter-baths')
    };

    function applyFilters() {
        const minPrice = parseInt(filters.minPrice.value) || 0;
        const maxPrice = parseInt(filters.maxPrice.value) || Infinity;
        const minBeds = parseInt(filters.beds.value) || 0;
        const minBaths = parseFloat(filters.baths.value) || 0;

        let visibleCount = 0;

        cards.forEach(card => {
            const price = parseInt(card.dataset.price);
            const beds = parseInt(card.dataset.beds);
            const baths = parseFloat(card.dataset.baths);

            const matches = 
                price >= minPrice && 
                price <= maxPrice && 
                beds >= minBeds && 
                baths >= minBaths;

            if (matches) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        // Update UI state
        if (countDisplay) countDisplay.textContent = `Showing ${visibleCount} propert${visibleCount === 1 ? 'y' : 'ies'}`;
        
        if (visibleCount === 0) {
            if (grid) grid.classList.add('hidden');
            if (noResults) noResults.classList.remove('hidden');
        } else {
            if (grid) grid.classList.remove('hidden');
            if (noResults) noResults.classList.add('hidden');
        }

        applySorting();
    }

    function applySorting() {
        if (!sortSelect || !grid) return;
        
        const sortBy = sortSelect.value;
        const visibleCards = Array.from(grid.querySelectorAll('.property-card:not(.hidden)'));
        
        visibleCards.sort((a, b) => {
            const priceA = parseInt(a.dataset.price);
            const priceB = parseInt(b.dataset.price);
            
            if (sortBy === 'price-high') return priceB - priceA;
            if (sortBy === 'price-low') return priceA - priceB;
            return 0; // newest/default relies on DOM order
        });

        // Re-append sorted elements
        visibleCards.forEach(card => grid.appendChild(card));
    }

    // Event listeners
    Object.values(filters).forEach(input => {
        if (input) input.addEventListener('change', applyFilters);
    });

    if (sortSelect) sortSelect.addEventListener('change', applySorting);

    clearBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            Object.values(filters).forEach(input => {
                if (input) input.selectedIndex = 0;
            });
            applyFilters();
        });
    });

    // Initial check
    applyFilters();
}

/* --- MORTGAGE CALCULATOR --- */
function initMortgageCalculator() {
    const priceInput = document.getElementById('calc-price');
    const downInput = document.getElementById('calc-down');
    const rateInput = document.getElementById('calc-rate');
    const yearsInput = document.getElementById('calc-years');
    const resultDisplay = document.getElementById('monthly-payment');

    if (!priceInput || !resultDisplay) return;

    function calculate() {
        const principal = parseFloat(priceInput.value) * (1 - parseFloat(downInput.value) / 100);
        const monthlyRate = parseFloat(rateInput.value) / 100 / 12;
        const numPayments = parseFloat(yearsInput.value) * 12;

        if (principal <= 0 || monthlyRate <= 0 || numPayments <= 0) {
            resultDisplay.textContent = '$0';
            return;
        }

        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        // Format as currency
        resultDisplay.textContent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(payment);
    }

    [priceInput, downInput, rateInput, yearsInput].forEach(input => {
        if (input) input.addEventListener('input', calculate);
    });

    calculate(); // Initial calc
}

/* --- SCROLL ANIMATIONS --- */
function initScrollAnimations() {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* --- CONTACT FORM --- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        // Simulate submission
        btn.disabled = true;
        btn.textContent = 'Sending...';
        
        setTimeout(() => {
            btn.textContent = 'Message Sent!';
            btn.classList.replace('btn-gold', 'btn-primary');
            form.reset();
            
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.classList.replace('btn-primary', 'btn-gold');
            }, 3000);
        }, 1500);
    });
}