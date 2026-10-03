/**
 * LENSCRAFT INTERACTIVITY
 * Handles: Mobile Nav, Blur-Fade Reveal, 3D Tilt Cards, Gallery Filter, Lightbox, Form
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MOBILE NAVIGATION ---
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isOpen);
            navList.classList.toggle('open');
            document.body.style.overflow = isOpen ? '' : 'hidden';
        });

        // Close on link click
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.setAttribute('aria-expanded', 'false');
                navList.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // --- 2. BLUR-FADE ASCEND REVEAL ---
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        const revealElements = document.querySelectorAll('.reveal-group, .reveal-item');
        
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // If reduced motion, just show everything immediately
        document.querySelectorAll('.reveal-group, .reveal-item').forEach(el => el.classList.add('in'));
    }

    // --- 3. 3D CARD TILT EFFECT ---
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    if (!prefersReducedMotion && tiltCards.length > 0) {
        tiltCards.forEach(card => {
            const inner = card.querySelector('.tile-inner, .gallery-trigger, .value-card, .price-card') || card;
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -8; // Max 8deg
                const rotateY = ((x - centerX) / centerX) * 8;
                
                requestAnimationFrame(() => {
                    inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                });
            });
            
            card.addEventListener('mouseleave', () => {
                inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            });
        });
    }

    // --- 4. GALLERY FILTER ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                
                const filter = btn.dataset.filter;
                
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = '';
                        // Re-trigger animation slightly
                        item.classList.remove('in');
                        void item.offsetWidth; // Force reflow
                        item.classList.add('in');
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- 5. LIGHTBOX ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const triggers = document.querySelectorAll('.gallery-trigger');
    const closeBtns = document.querySelectorAll('[data-close]');
    
    if (lightbox && triggers.length > 0) {
        let lastFocused;
        
        const openLightbox = (src, alt) => {
            lastFocused = document.activeElement;
            lightboxImg.src = src.replace('w=800', 'w=1600'); // Load higher res
            lightboxImg.alt = alt;
            lightboxCaption.textContent = alt;
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            lightbox.querySelector('.lightbox-close').focus();
        };
        
        const closeLightbox = () => {
            lightbox.classList.remove('open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            setTimeout(() => { lightboxImg.src = ''; }, 400);
            if (lastFocused) lastFocused.focus();
        };
        
        triggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const img = trigger.querySelector('img');
                openLightbox(img.src, img.alt);
            });
        });
        
        closeBtns.forEach(btn => btn.addEventListener('click', closeLightbox));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
        });
    }

    // --- 6. CONTACT FORM HANDLING ---
    const form = document.getElementById('booking-form');
    const statusDiv = document.getElementById('form-status');
    
    if (form) {
        // Pre-select package from URL param
        const params = new URLSearchParams(window.location.search);
        const pkg = params.get('package');
        if (pkg) {
            const select = form.querySelector('#package');
            if (select) select.value = pkg;
        }
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Basic validation visual
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            statusDiv.textContent = '';
            statusDiv.style.color = 'var(--ink)';
            
            // Simulate network request
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                statusDiv.textContent = '✓ Inquiry received. We will be in touch within 48 hours.';
                statusDiv.style.color = '#2d5a27'; // Success green
                form.reset();
            }, 1500);
        });
    }
});