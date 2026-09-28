/**
 * FORGE GYM - MAIN APPLICATION SCRIPT
 * Handles Navigation, Animations, Schedule Filtering, and BMI Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollReveal();
    initScheduleFilter();
    initBMICalculator();
    initContactForm();
});

/* --- MOBILE MENU --- */
function initMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.primary-nav');
    
    if (!toggleBtn || !nav) return;

    toggleBtn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger
        const lines = toggleBtn.querySelectorAll('.hamburger-line');
        if (isOpen) {
            lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            lines[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            lines[0].style.transform = 'none';
            lines[1].style.transform = 'none';
        }
    });

    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('is-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
            const lines = toggleBtn.querySelectorAll('.hamburger-line');
            lines[0].style.transform = 'none';
            lines[1].style.transform = 'none';
        });
    });
}

/* --- SCROLL REVEAL ANIMATION --- */
function initScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-on-scroll, .reveal-group, .reveal-stagger');
    elements.forEach(el => observer.observe(el));
}

/* --- SCHEDULE FILTER --- */
function initScheduleFilter() {
    const filterContainer = document.querySelector('.schedule-filters');
    const rows = document.querySelectorAll('.schedule-row');
    const noResults = document.getElementById('no-results');

    if (!filterContainer || rows.length === 0) return;

    const buttons = filterContainer.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const day = btn.dataset.day;
            let visibleCount = 0;

            rows.forEach(row => {
                if (day === 'all' || row.dataset.day === day) {
                    row.classList.remove('hidden');
                    visibleCount++;
                } else {
                    row.classList.add('hidden');
                }
            });

            // Handle empty state
            if (noResults) {
                if (visibleCount === 0) {
                    noResults.classList.remove('hidden');
                } else {
                    noResults.classList.add('hidden');
                }
            }
        });
    });
}

/* --- BMI CALCULATOR --- */
function initBMICalculator() {
    const calcBtn = document.getElementById('calc-bmi');
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const resultBox = document.getElementById('bmi-result');
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiStatusEl = document.getElementById('bmi-status');

    if (!calcBtn) return;

    calcBtn.addEventListener('click', () => {
        const weight = parseFloat(weightInput.value);
        const heightCm = parseFloat(heightInput.value);

        if (!weight || !heightCm || weight <= 0 || heightCm <= 0) {
            alert('Please enter valid weight and height values.');
            return;
        }

        const heightM = heightCm / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        
        let status = '';
        let color = '';

        if (bmi < 18.5) { status = 'UNDERWEIGHT'; color = '#4d88ff'; }
        else if (bmi < 25) { status = 'NORMAL WEIGHT'; color = '#d4ff3f'; }
        else if (bmi < 30) { status = 'OVERWEIGHT'; color = '#ffaa3f'; }
        else { status = 'OBESE'; color = '#ff4d4d'; }

        bmiValueEl.textContent = bmi;
        bmiStatusEl.textContent = status;
        bmiStatusEl.style.color = color;
        resultBox.classList.remove('hidden');
        
        // Simple entrance animation reset
        resultBox.style.animation = 'none';
        resultBox.offsetHeight; /* trigger reflow */
        resultBox.style.animation = 'fadeIn 0.4s ease forwards';
    });
}

/* --- CONTACT/TRIAL FORM --- */
function initContactForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fname = document.getElementById('fname').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!fname || !email) {
            alert('Please fill in all required fields.');
            return;
        }

        // Simulate submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'PROCESSING...';
        
        setTimeout(() => {
            submitBtn.textContent = 'PASS CLAIMED!';
            submitBtn.style.background = '#4dff88';
            submitBtn.style.borderColor = '#4dff88';
            form.reset();
            
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.style.borderColor = '';
            }, 3000);
        }, 1500);
    });
}