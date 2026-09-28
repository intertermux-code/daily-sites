/**
 * NORTHLINE AGENCY - MAIN SCRIPTS
 * Handles Navigation, Accordions, Forms, and Filters
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initAccordions();
    initContactForm();
    initWorkFilters();
});

/* --- MOBILE NAVIGATION --- */
function initMobileNav() {
    const toggleBtn = document.querySelector('.menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (!toggleBtn || !nav) return;

    toggleBtn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger bars
        const bars = toggleBtn.querySelectorAll('.bar');
        if (isOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });

    // Close nav when clicking outside or on link
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggleBtn.contains(e.target) && nav.classList.contains('is-open')) {
            toggleBtn.click();
        }
    });
}

/* --- SERVICES ACCORDION --- */
function initAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            const isActive = item.classList.contains('active');

            // Close all others (optional: remove this block for multi-open)
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.accordion-content').style.maxHeight = null;
                }
            });

            // Toggle current
            if (isActive) {
                item.classList.remove('active');
                header.setAttribute('aria-expanded', 'false');
                content.style.maxHeight = null;
            } else {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}

/* --- CONTACT FORM VALIDATION --- */
function initContactForm() {
    const form = document.getElementById('projectForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const statusEl = form.querySelector('.form-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        statusEl.textContent = '';
        statusEl.className = 'form-status';

        // Simple Validation
        const name = form.querySelector('#name');
        const email = form.querySelector('#email');
        const message = form.querySelector('#message');

        if (!name.value.trim()) {
            showError(name, 'Name is required');
            isValid = false;
        }

        if (!email.value.trim() || !isValidEmail(email.value)) {
            showError(email, 'Valid email is required');
            isValid = false;
        }

        if (!message.value.trim()) {
            showError(message, 'Please tell us about your project');
            isValid = false;
        }

        if (!isValid) return;

        // Simulate Submission
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'TRANSMITTING...';
        submitBtn.disabled = true;

        try {
            // Fake API delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            statusEl.textContent = 'MESSAGE RECEIVED. WE WILL BE IN TOUCH SHORTLY.';
            statusEl.classList.add('success');
            form.reset();
        } catch (err) {
            statusEl.textContent = 'TRANSMISSION FAILED. PLEASE TRY EMAIL DIRECTLY.';
            statusEl.classList.add('error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    function showError(input, msg) {
        const errorSpan = input.parentElement.querySelector('.error-msg');
        if (errorSpan) errorSpan.textContent = msg;
        input.focus();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

/* --- WORK FILTERS --- */
function initWorkFilters() {
    const filterBtns = document.querySelectorAll('.filter-chip');
    const items = document.querySelectorAll('.work-item');

    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.filter;

            items.forEach(item => {
                if (category === 'all' || item.dataset.category.includes(category)) {
                    item.style.display = 'block';
                    // Small animation reset
                    item.style.opacity = '0';
                    requestAnimationFrame(() => {
                        item.style.transition = 'opacity 0.3s ease';
                        item.style.opacity = '1';
                    });
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}