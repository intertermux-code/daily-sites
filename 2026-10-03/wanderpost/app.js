/**
 * Wanderpost Core Scripts
 * Handles: Mobile Nav, Spring Accordions, Modals, Month Picker, Stories Slider, Form Validation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Remove no-js class
    document.documentElement.classList.remove('no-js');

    initMobileNav();
    initAccordions();
    initModals();
    initMonthPicker();
    initStoriesSlider();
    initEnquiryForm();
});

/* --- MOBILE NAV --- */
function initMobileNav() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.contains('is-open');
        nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', !isOpen);
        
        // Animate hamburger
        const bars = toggle.querySelectorAll('.bar');
        if (!isOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.transform = 'none';
        }
    });
}

/* --- SPRING ACCORDIONS --- */
function initAccordions() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            
            // Close all others (optional: remove this block for multi-open)
            triggers.forEach(t => {
                t.setAttribute('aria-expanded', 'false');
            });

            // Toggle current
            if (!expanded) {
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/* --- JOURNEY MODALS --- */
function initModals() {
    const openBtns = document.querySelectorAll('[data-modal-target]');
    const closeBtns = document.querySelectorAll('.modal-close');
    
    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.showModal();
                // Prevent body scroll
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('dialog');
            if (modal) {
                modal.close();
                document.body.style.overflow = '';
            }
        });
    });

    // Close on backdrop click
    const modals = document.querySelectorAll('dialog');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
              rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                modal.close();
                document.body.style.overflow = '';
            }
        });
        
        modal.addEventListener('close', () => {
            document.body.style.overflow = '';
        });
    });
}

/* --- MONTH PICKER (Destination Page) --- */
function initMonthPicker() {
    const tabs = document.querySelectorAll('.month-tab');
    const cards = document.querySelectorAll('.season-card');
    
    if (tabs.length === 0) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Reset
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            cards.forEach(c => c.classList.remove('active'));

            // Activate
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const season = tab.getAttribute('data-month');
            const targetCard = document.getElementById(`season-${season}`);
            if (targetCard) targetCard.classList.add('active');
        });
    });
}

/* --- STORIES SLIDER --- */
function initStoriesSlider() {
    const slides = document.querySelectorAll('.story-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');
    
    if (slides.length === 0) return;

    let currentIndex = 0;

    function showSlide(index) {
        // Wrap around
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => {
            d.classList.remove('active');
            d.setAttribute('aria-selected', 'false');
        });

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        dots[index].setAttribute('aria-selected', 'true');
        currentIndex = index;
    }

    prevBtn?.addEventListener('click', () => showSlide(currentIndex - 1));
    nextBtn?.addEventListener('click', () => showSlide(currentIndex + 1));
    
    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => showSlide(idx));
    });

    // Auto-advance every 8s
    let interval = setInterval(() => showSlide(currentIndex + 1), 8000);
    
    // Pause on hover
    const sliderContainer = document.getElementById('stories-slider');
    sliderContainer?.addEventListener('mouseenter', () => clearInterval(interval));
    sliderContainer?.addEventListener('mouseleave', () => {
        interval = setInterval(() => showSlide(currentIndex + 1), 8000);
    });
}

/* --- ENQUIRY FORM VALIDATION --- */
function initEnquiryForm() {
    const form = document.getElementById('trip-enquiry-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const statusEl = form.querySelector('.form-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Basic validation
        const name = form.querySelector('#name').value.trim();
        const email = form.querySelector('#email').value.trim();
        
        if (!name || !email) {
            statusEl.textContent = 'Please fill in your name and email to begin.';
            statusEl.className = 'form-status error';
            return;
        }

        // Simulate submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Postcard...';
        statusEl.textContent = '';

        setTimeout(() => {
            statusEl.textContent = 'Message received. Watch your inbox for a reply from our travel designers.';
            statusEl.className = 'form-status success';
            submitBtn.textContent = 'Sent Successfully';
            form.reset();
            
            // Re-enable after delay
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Enquiry';
            }, 3000);
        }, 1500);
    });
}