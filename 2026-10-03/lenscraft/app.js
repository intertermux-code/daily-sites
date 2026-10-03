/**
 * LENSCRAFT INTERACTIVE MODULE
 * Handles Magnetic Buttons, 3D Tilt Cards, Gallery Filtering, Lightbox, Mobile Menu
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initMagneticButtons();
    initTiltCards();
    initGallery();
    initContactForm();
});

/* =========================================
   MOBILE MENU
   ========================================= */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        nav.classList.toggle('open', !isOpen);
        document.body.style.overflow = !isOpen ? 'hidden' : '';
    });

    // Close on link click
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.setAttribute('aria-expanded', 'false');
            nav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* =========================================
   MAGNETIC BUTTONS (Primary Signature Motion)
   Uses rAF lerp for smooth spring-back effect
   ========================================= */
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');
    if (!buttons.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const RADIUS = 120;
    const STRENGTH = 0.3;
    const LERP_FACTOR = 0.15;

    buttons.forEach(btn => {
        let currentX = 0, currentY = 0;
        let targetX = 0, targetY = 0;
        let isHovering = false;
        let rafId = null;

        const update = () => {
            // Linear interpolation for smooth return
            currentX += (targetX - currentX) * LERP_FACTOR;
            currentY += (targetY - currentY) * LERP_FACTOR;

            // Only apply transform if significant movement
            if (Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1 || isHovering) {
                const scale = isHovering ? 1.04 : 1;
                btn.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
                rafId = requestAnimationFrame(update);
            } else {
                btn.style.transform = '';
                rafId = null;
            }
        };

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const distX = e.clientX - centerX;
            const distY = e.clientY - centerY;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist < RADIUS) {
                isHovering = true;
                targetX = distX * STRENGTH;
                targetY = distY * STRENGTH;
            } else {
                isHovering = false;
                targetX = 0;
                targetY = 0;
            }

            if (!rafId) rafId = requestAnimationFrame(update);
        });

        btn.addEventListener('mouseleave', () => {
            isHovering = false;
            targetX = 0;
            targetY = 0;
            if (!rafId) rafId = requestAnimationFrame(update);
        });
    });
}

/* =========================================
   3D TILT CARDS (Secondary Signature Motion)
   Perspective rotation + glare follow
   ========================================= */
function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const MAX_ROTATION = 8;
    const LERP_FACTOR = 0.1;

    cards.forEach(card => {
        let currentRotX = 0, currentRotY = 0;
        let targetRotX = 0, targetRotY = 0;
        let glareX = 50, glareY = 50;
        let isHovering = false;
        let rafId = null;

        const glareEl = card.querySelector('.card-glare');

        const update = () => {
            currentRotX += (targetRotX - currentRotX) * LERP_FACTOR;
            currentRotY += (targetRotY - currentRotY) * LERP_FACTOR;

            if (Math.abs(currentRotX) > 0.05 || Math.abs(currentRotY) > 0.05 || isHovering) {
                card.style.transform = `perspective(1000px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
                if (glareEl) {
                    glareEl.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4), transparent 60%)`;
                }
                rafId = requestAnimationFrame(update);
            } else {
                card.style.transform = '';
                rafId = null;
            }
        };

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalize to -1 to 1
            const normX = (x / rect.width) * 2 - 1;
            const normY = (y / rect.height) * 2 - 1;

            isHovering = true;
            targetRotY = normX * MAX_ROTATION;
            targetRotX = -normY * MAX_ROTATION; // Invert X axis for natural tilt
            
            glareX = (x / rect.width) * 100;
            glareY = (y / rect.height) * 100;

            if (!rafId) rafId = requestAnimationFrame(update);
        });

        card.addEventListener('mouseleave', () => {
            isHovering = false;
            targetRotX = 0;
            targetRotY = 0;
            if (!rafId) rafId = requestAnimationFrame(update);
        });
    });
}

/* =========================================
   GALLERY FILTERING & LIGHTBOX
   ========================================= */
function initGallery() {
    // Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.gallery-item');
    
    if (filterBtns.length && items.length) {
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

                items.forEach(item => {
                    const show = filter === 'all' || item.dataset.category === filter;
                    item.style.display = show ? 'block' : 'none';
                });
            });
        });
    }

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const triggers = document.querySelectorAll('.gallery-trigger');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    if (!lightbox || !triggers.length) return;

    let currentIndex = 0;
    let visibleItems = [];

    const getVisibleItems = () => {
        return Array.from(document.querySelectorAll('.gallery-item')).filter(
            el => el.style.display !== 'none'
        );
    };

    const openLightbox = (index) => {
        visibleItems = getVisibleItems();
        currentIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const updateLightboxImage = () => {
        const item = visibleItems[currentIndex];
        if (!item) return;
        const img = item.querySelector('img');
        // Load higher res version by replacing w=800 with w=1600
        const highResSrc = img.src.replace('w=800', 'w=1600');
        lbImg.src = highResSrc;
        lbImg.alt = img.alt;
    };

    const navigate = (dir) => {
        currentIndex = (currentIndex + dir + visibleItems.length) % visibleItems.length;
        updateLightboxImage();
    };

    triggers.forEach((trigger, i) => {
        trigger.addEventListener('click', () => {
            // Find actual index among visible items
            const parentItem = trigger.closest('.gallery-item');
            const visItems = getVisibleItems();
            const idx = visItems.indexOf(parentItem);
            openLightbox(idx >= 0 ? idx : 0);
        });
    });

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => navigate(-1));
    nextBtn?.addEventListener('click', () => navigate(1));

    // Keyboard navigation
    lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });

    // Click outside to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}

/* =========================================
   CONTACT FORM HANDLING
   ========================================= */
function initContactForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    // Pre-select package from URL param
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get('package');
    if (pkg) {
        const select = form.querySelector('#package');
        if (select) select.value = pkg;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        // Simple validation visual feedback
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--accent)';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) return;

        // Simulate submission
        btn.disabled = true;
        btn.textContent = 'Sending...';
        
        setTimeout(() => {
            btn.textContent = 'Inquiry Sent ✓';
            btn.style.background = '#2d6a4f';
            btn.style.borderColor = '#2d6a4f';
            form.reset();
            
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.borderColor = '';
            }, 3000);
        }, 1500);
    });
}