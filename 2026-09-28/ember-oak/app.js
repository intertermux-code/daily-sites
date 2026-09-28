/**
 * Ember & Oak - Shared Application Logic
 * Handles Navigation, Animations, Tabs, Forms, and Lightbox
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initRevealAnimations();
    initMenuTabs();
    initBookingForm();
    initGalleryLightbox();
});

/* --- NAVIGATION --- */
function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger
        const hamburger = toggle.querySelector('.hamburger');
        if (isOpen) {
            hamburger.style.transform = 'rotate(45deg)';
            hamburger.style.backgroundColor = 'transparent';
            hamburger.querySelector('::before') // Note: pseudo-elements can't be styled directly via JS easily, handled via class usually, but keeping simple here
        } else {
            hamburger.style.transform = 'rotate(0)';
            hamburger.style.backgroundColor = 'var(--text-main)';
        }
    });

    // Close mobile nav on link click
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/* --- SCROLL REVEAL ANIMATION --- */
function initRevealAnimations() {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.reveal-group').forEach(el => el.classList.add('visible'));
        return;
    }

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-group').forEach(group => {
        observer.observe(group);
    });
}

/* --- MENU TABS --- */
function initMenuTabs() {
    const tabsContainer = document.querySelector('.menu-tabs');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.menu-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => {
                p.classList.remove('active');
                p.hidden = true;
            });

            // Activate clicked
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            const panelId = tab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.hidden = false;
                panel.classList.add('active');
                // Trigger subtle fade-in for panel content
                panel.style.opacity = '0';
                requestAnimationFrame(() => {
                    panel.style.transition = 'opacity 0.4s ease';
                    panel.style.opacity = '1';
                });
            }
        });
    });
}

/* --- BOOKING FORM VALIDATION --- */
function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    const successState = document.getElementById('booking-success');
    
    // Set min date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // Clear previous errors
        form.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        // Validate fields
        const fields = [
            { id: 'name', msg: 'Please enter your full name.' },
            { id: 'email', msg: 'Please enter a valid email address.', type: 'email' },
            { id: 'phone', msg: 'Please enter a valid phone number.' },
            { id: 'date', msg: 'Please select a future date.' },
            { id: 'time', msg: 'Please select a time slot.' },
            { id: 'guests', msg: 'Please select party size.' }
        ];

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorSpan = input.parentElement.querySelector('.error-msg');
            
            if (!input.value.trim()) {
                showError(input, errorSpan, field.msg);
                isValid = false;
            } else if (field.type === 'email' && !isValidEmail(input.value)) {
                showError(input, errorSpan, field.msg);
                isValid = false;
            }
        });

        if (isValid) {
            // Simulate API call
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            setTimeout(() => {
                form.hidden = true;
                successState.hidden = false;
                
                // Populate confirmation details
                document.getElementById('conf-name').textContent = document.getElementById('name').value;
                document.getElementById('conf-guests').textContent = document.getElementById('guests').value;
                document.getElementById('conf-date').textContent = formatDate(document.getElementById('date').value);
                document.getElementById('conf-time').textContent = document.getElementById('time').options[document.getElementById('time').selectedIndex].text;
                document.getElementById('conf-email').textContent = document.getElementById('email').value;
                
                // Focus management for accessibility
                successState.querySelector('h2').focus();
            }, 1500);
        }
    });

    function showError(input, span, msg) {
        input.classList.add('input-error');
        span.textContent = msg;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@);
    }

    function formatDate(dateStr) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }
}

/* --- GALLERY LIGHTBOX --- */
function initGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    
    if (!lightbox || galleryItems.length === 0) return;

    const lbImg = lightbox.querySelector('.lb-content img');
    const lbCaption = lightbox.querySelector('.lb-caption');
    const closeBtn = lightbox.querySelector('.lb-close');
    const prevBtn = lightbox.querySelector('.lb-prev');
    const nextBtn = lightbox.querySelector('.lb-next');
    
    let currentIndex = 0;
    const images = Array.from(galleryItems).map(item => ({
        src: item.querySelector('img').src.replace('w=800', 'w=1600').replace('w=1200', 'w=2400'), // Request higher res
        alt: item.querySelector('img').alt,
        caption: item.querySelector('figcaption')?.textContent || ''
    }));

    function openLightbox(index) {
        currentIndex = index;
        updateLightboxContent();
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        galleryItems[currentIndex].focus();
    }

    function updateLightboxContent() {
        lbImg.src = images[currentIndex].src;
        lbImg.alt = images[currentIndex].alt;
        lbCaption.textContent = images[currentIndex].caption;
    }

    function navigate(direction) {
        currentIndex = (currentIndex + direction + images.length) % images.length;
        updateLightboxContent();
    }

    // Event Listeners
    galleryItems.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', () => openLightbox(index));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(index);
            }
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });
}