/**
 * Mintwise Shared Logic
 * Handles Navigation, Scroll Reveals, Calculator, and Contact Form
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollReveal();
    
    // Page-specific initializations guarded by element existence
    if (document.getElementById('budget-form')) {
        initCalculator();
    }
    
    if (document.getElementById('contact-form')) {
        initContactForm();
    }
});

/**
 * Mobile Navigation Toggle
 */
function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (!toggleBtn || !nav) return;
    
    toggleBtn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger bars
        const bars = toggleBtn.querySelectorAll('.bar');
        if (isOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggleBtn.contains(e.target) && nav.classList.contains('is-open')) {
            toggleBtn.click();
        }
    });
}

/**
 * Intersection Observer for Scroll Animations
 */
function initScrollReveal() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
}

/**
 * Budget Calculator Logic
 */
function initCalculator() {
    const inputs = {
        income: { num: document.getElementById('income'), range: document.getElementById('income-range') },
        housing: { num: document.getElementById('housing'), range: document.getElementById('housing-range') },
        food: { num: document.getElementById('food'), range: document.getElementById('food-range') },
        transport: { num: document.getElementById('transport'), range: document.getElementById('transport-range') },
        other: { num: document.getElementById('other'), range: document.getElementById('other-range') }
    };
    
    const displays = {
        savingsRate: document.getElementById('savings-rate-display'),
        savingsAmt: document.getElementById('savings-amount'),
        expensesAmt: document.getElementById('expenses-amount'),
        remainingAmt: document.getElementById('remaining-amount'),
        warning: document.getElementById('warning-msg')
    };
    
    const svgSegments = {
        expense: document.getElementById('expense-segment'),
        savings: document.getElementById('savings-segment')
    };
    
    const circumference = 2 * Math.PI * 80; // r=80
    
    // Sync number input <-> range slider
    Object.keys(inputs).forEach(key => {
        const pair = inputs[key];
        
        pair.num.addEventListener('input', () => {
            pair.range.value = pair.num.value;
            updateCalculator();
        });
        
        pair.range.addEventListener('input', () => {
            pair.num.value = pair.range.value;
            updateCalculator();
        });
    });
    
    function updateCalculator() {
        const income = parseFloat(inputs.income.num.value) || 0;
        const expenses = 
            (parseFloat(inputs.housing.num.value) || 0) +
            (parseFloat(inputs.food.num.value) || 0) +
            (parseFloat(inputs.transport.num.value) || 0) +
            (parseFloat(inputs.other.num.value) || 0);
            
        const savings = income - expenses;
        let rate = income > 0 ? (savings / income) * 100 : 0;
        
        // Handle negative savings visually
        const isNegative = savings < 0;
        const displayRate = Math.max(0, Math.min(100, rate));
        
        // Update Text
        displays.savingsRate.textContent = `${Math.round(rate)}%`;
        displays.savingsRate.style.color = isNegative ? '#ef4444' : 'var(--c-mint-dark)';
        displays.savingsAmt.textContent = formatCurrency(savings);
        displays.expensesAmt.textContent = formatCurrency(expenses);
        displays.remainingAmt.textContent = formatCurrency(savings);
        
        // Warning State
        if (isNegative) {
            displays.warning.classList.remove('hidden');
            displays.savingsAmt.style.color = '#ef4444';
        } else {
            displays.warning.classList.add('hidden');
            displays.savingsAmt.style.color = 'var(--c-text)';
        }
        
        // Update Donut Chart
        // Expense portion
        const expenseRatio = income > 0 ? Math.min(1, expenses / income) : 0;
        const expenseOffset = circumference - (expenseRatio * circumference);
        
        // Savings portion (only if positive)
        const savingsRatio = income > 0 && savings > 0 ? savings / income : 0;
        const savingsOffset = circumference - (savingsRatio * circumference);
        
        svgSegments.expense.style.strokeDashoffset = expenseOffset;
        svgSegments.expense.style.stroke = isNegative ? '#ef4444' : '#cbd5e1';
        
        svgSegments.savings.style.strokeDashoffset = isNegative ? circumference : savingsOffset;
    }
    
    function formatCurrency(val) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    }
    
    // Initial calculation
    updateCalculator();
}

/**
 * Contact Form Handling
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        // Basic validation
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        
        if (!name || !email || !message) {
            showStatus('Please fill in all required fields.', 'error');
            return;
        }
        
        // Loading state
        btn.disabled = true;
        btn.textContent = 'Sending...';
        showStatus('', '');
        
        // Simulate network request
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Success state
            form.reset();
            showStatus('Message sent successfully! We\'ll be in touch soon.', 'success');
            btn.textContent = 'Sent ✓';
            
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
            }, 3000);
            
        } catch (err) {
            showStatus('Something went wrong. Please try emailing us directly.', 'error');
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
    
    function showStatus(msg, type) {
        statusDiv.textContent = msg;
        statusDiv.className = `form-status ${type}`;
    }
}