/**
 * Mintwise Core Interactions
 * Handles: Cursor Spotlight, Calculator Logic, Form Validation, Scroll Reveals
 */

document.addEventListener('DOMContentLoaded', () => {
    initCursorSpotlight();
    initCalculator();
    initContactForm();
    initScrollReveal();
});

/**
 * 1. CURSOR SPOTLIGHT EFFECT
 * Updates CSS variables for radial gradient position
 */
function initCursorSpotlight() {
    const container = document.querySelector('.spotlight-container');
    if (!container) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    
    container.addEventListener('pointermove', (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                container.style.setProperty('--mouse-x', `${x}px`);
                container.style.setProperty('--mouse-y', `${y}px`);
                ticking = false;
            });
            ticking = true;
        }
    });

    // Hide spotlight when cursor leaves
    container.addEventListener('pointerleave', () => {
        container.style.setProperty('--mouse-x', `-50%`);
        container.style.setProperty('--mouse-y', `-50%`);
    });
}

/**
 * 2. BUDGET CALCULATOR LOGIC
 * Real-time SVG donut chart updates
 */
function initCalculator() {
    const form = document.getElementById('budget-form');
    if (!form) return;

    const inputs = {
        income: document.getElementById('monthly-income'),
        fixed: document.getElementById('fixed-expenses'),
        variable: document.getElementById('variable-expenses')
    };
    
    const displays = {
        totalExpenses: document.getElementById('total-expenses-display'),
        monthlySavings: document.getElementById('monthly-savings-display'),
        savingsRate: document.getElementById('savings-rate-display')
    };

    const savingsSegment = document.querySelector('.savings-segment');
    const circumference = 2 * Math.PI * 80; // r=80

    function updateCalculation() {
        const income = parseFloat(inputs.income.value) || 0;
        const fixed = parseFloat(inputs.fixed.value) || 0;
        const variable = parseFloat(inputs.variable.value) || 0;

        const totalExpenses = fixed + variable;
        const savings = Math.max(0, income - totalExpenses);
        const rate = income > 0 ? (savings / income) * 100 : 0;

        // Update Text
        displays.totalExpenses.textContent = formatCurrency(totalExpenses);
        displays.monthlySavings.textContent = formatCurrency(savings);
        displays.savingsRate.textContent = `${Math.round(rate)}%`;

        // Update SVG
        // dashoffset = circumference - (percentage / 100) * circumference
        // Note: The savings segment is drawn ON TOP of the expense segment in this simplified model
        // Actually, for a proper donut, we adjust the savings segment length
        const offset = circumference - (rate / 100) * circumference;
        savingsSegment.style.strokeDashoffset = offset;
        
        // Color feedback for negative savings
        if (savings < 0) {
            savingsSegment.style.stroke = '#ef4444';
            displays.savingsRate.style.color = '#ef4444';
        } else {
            savingsSegment.style.stroke = '#10b981';
            displays.savingsRate.style.color = 'var(--color-text)';
        }
    }

    function formatCurrency(num) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
    }

    // Attach listeners
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', updateCalculation);
    });

    // Initial calc
    updateCalculation();
}

/**
 * 3. CONTACT FORM HANDLING
 * Client-side validation + simulated submission
 */
function initContactForm() {
    const form = document.getElementById('support-form');
    if (!form) return;

    const statusEl = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Loading State
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        statusEl.textContent = '';
        statusEl.className = 'form-status';

        // Simulate Network Request
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Success State
            statusEl.textContent = 'Message sent successfully. We\'ll be in touch shortly.';
            statusEl.classList.add('success');
            form.reset();
        } catch (err) {
            // Error State
            statusEl.textContent = 'Something went wrong. Please try emailing us directly.';
            statusEl.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/**
 * 4. SCROLL REVEAL OBSERVER
 * Simple fade-up for secondary content
 */
function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const reveals = document.querySelectorAll('.reveal-on-scroll');
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
    });
}