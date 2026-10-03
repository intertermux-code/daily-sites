/**
 * LENSCRAFT INTERACTION LAYER
 * Handles Parallax, Spring Accordions, Gallery Filtering, Lightbox, and Forms
 */

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initParallax();
    initAccordions();
    initGallery();
    initContactForm();
});

/* --- NAVIGATION --- */
function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger bars
        const bars = toggle.querySelectorAll('.bar');
        if (isOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.transform = 'none';
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navList.classList.contains('open')) {
            toggle.click();
        }
    });
}

/* --- PARALLAX ENGINE --- */
function initParallax() {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layers = document.querySelectorAll('.parallax-layer');
    if (layers.length === 0) return;

    let ticking = false;

    function updateParallax() {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        
        // Only animate when hero is visible
        if (scrollY <= heroHeight * 1.5) {
            layers.forEach(layer => {
                const speed = parseFloat(layer.dataset.speed) || 0;
                const yPos = -(scrollY * speed);
                layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });
}

/* --- SPRING ACCORDION --- */
function initAccordions() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            const panel = trigger.closest('.accordion-item').querySelector('.accordion-panel');
            
            // Close all others (optional: remove this block for multi-open)
            triggers.forEach(otherTrigger => {
                if (otherTrigger !== trigger) {
                    otherTrigger.setAttribute('aria-expanded', 'false');
                    const otherPanel = otherTrigger.closest('.accordion-item').querySelector('.accordion-panel');
                    otherPanel.setAttribute('hidden', '');
                }
            });

            // Toggle current
            if (expanded) {
                trigger.setAttribute('aria-expanded', 'false');
                panel.setAttribute('hidden', '');
            } else {
                trigger.setAttribute('aria-expanded', 'true');
                panel.removeAttribute('hidden');
            }
        });
    });
}

/* --- GALLERY FILTER & LIGHTBOX --- */
function initGallery() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.gallery-item');
    const emptyState = document.querySelector('.empty-state');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox?.querySelector('.lightbox-img');
    const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
    const closeBtn = lightbox?.querySelector('.lightbox-close');

    // Filtering Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filter = btn.dataset.filter;
            let visibleCount = 0;

            items.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.classList.remove('hidden');
                    visibleCount++;
                } else {
                    item.classList.add('hidden');
                }
            });

            // Handle empty state
            if (emptyState) {
                emptyState.hidden = visibleCount > 0;
            }
        });
    });

    // Lightbox Logic
    const triggers = document.querySelectorAll('.gallery-trigger');
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const img = trigger.querySelector('img');
            if (!img || !lightbox) return;

            // Use higher res version for lightbox (replace w=800 with w=1600)
            const highResSrc = img.src.replace('w=800', 'w=1600');
            lightboxImg.src = highResSrc;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = img.alt;
            
            lightbox.showModal();
            document.body.style.overflow = 'hidden';
        });
    });

    function closeLightbox() {
        if (lightbox) {
            lightbox.close();
            document.body.style.overflow = '';
            setTimeout(() => { lightboxImg.src = ''; }, 300); // Clear after transition
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        lightbox.addEventListener('cancel', (e) => {
            e.preventDefault(); // Prevent default ESC behavior to handle cleanup
            closeLightbox();
        });
    }
}

/* --- CONTACT FORM HANDLING --- */
function initContactForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    // Pre-select package from URL param
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get('package');
    if (pkg) {
        const select = form.querySelector('#package');
        if (select) select.value = pkg;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = form.querySelector('.form-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Basic validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Loading State
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        statusEl.textContent = '';
        statusEl.className = 'form-status';

        // Simulate network request
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Success State
            statusEl.textContent = '✓ Inquiry received. We\'ll be in touch within 48 hours.';
            statusEl.classList.add('success');
            form.reset();
        } catch (err) {
            // Error State
            statusEl.textContent = 'Something went wrong. Please email us directly at hello@lenscraft.com';
            statusEl.classList.add('error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}