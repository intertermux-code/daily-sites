// LumiDent JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (mobileToggle && navList) {
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            navList.style.display = isExpanded ? 'none' : 'flex';
            navList.style.flexDirection = 'column';
            navList.style.position = 'absolute';
            navList.style.top = '100%';
            navList.style.left = '0';
            navList.style.right = '0';
            navList.style.background = 'white';
            navList.style.padding = '16px';
            navList.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
    }

    // Cursor Spotlight (Hero Only)
    const heroSection = document.querySelector('.chapter-hero');
    const spotlight = document.querySelector('.cursor-spotlight');
    
    if (heroSection && spotlight) {
        let rafId = null;
        
        const updateSpotlight = (x, y) => {
            const rect = heroSection.getBoundingClientRect();
            const xPercent = ((x - rect.left) / rect.width) * 100;
            const yPercent = ((y - rect.top) / rect.height) * 100;
            
            spotlight.style.setProperty('--mouse-x', `${xPercent}%`);
            spotlight.style.setProperty('--mouse-y', `${yPercent}%`);
            spotlight.style.opacity = '1';
        };
        
        heroSection.addEventListener('pointermove', (e) => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                updateSpotlight(e.clientX, e.clientY);
                rafId = null;
            });
        });
        
        heroSection.addEventListener('pointerleave', () => {
            spotlight.style.opacity = '0';
        });
    }

    // 3D Card Tilt
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8; // Max 8deg
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });

    // Before/After Slider
    const sliders = document.querySelectorAll('[data-slider]');
    
    sliders.forEach(slider => {
        const handle = slider.querySelector('.slider-handle');
        const afterImage = slider.querySelector('.after-image');
        
        if (!handle || !afterImage) return;
        
        let isDragging = false;
        
        const startDrag = () => isDragging = true;
        const stopDrag = () => isDragging = false;
        
        const drag = (e) => {
            if (!isDragging) return;
            
            const rect = slider.getBoundingClientRect();
            let x = e.clientX || (e.touches && e.touches[0].clientX);
            
            if (x !== undefined) {
                x = Math.max(0, Math.min(x - rect.left, rect.width));
                const percent = (x / rect.width) * 100;
                
                handle.style.left = `${percent}%`;
                afterImage.style.clipPath = `inset(0 0 0 ${percent}%)`;
            }
        };
        
        handle.addEventListener('mousedown', startDrag);
        handle.addEventListener('touchstart', startDrag);
        
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);
        
        window.addEventListener('mousemove', drag);
        window.addEventListener('touchmove', drag);
        
        // Keyboard support
        handle.addEventListener('keydown', (e) => {
            const currentLeft = parseFloat(handle.style.left) || 50;
            let newLeft = currentLeft;
            
            if (e.key === 'ArrowLeft') newLeft = Math.max(0, currentLeft - 5);
            if (e.key === 'ArrowRight') newLeft = Math.min(100, currentLeft + 5);
            
            if (newLeft !== currentLeft) {
                handle.style.left = `${newLeft}%`;
                afterImage.style.clipPath = `inset(0 0 0 ${newLeft}%)`;
                e.preventDefault();
            }
        });
    });

    // Booking Form Validation
    const bookingForm = document.getElementById('booking-form');
    const confirmationDiv = document.getElementById('booking-confirmation');
    
    if (bookingForm && confirmationDiv) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            
            // Clear previous errors
            document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
            
            // Validate required fields
            const requiredFields = ['service', 'date', 'time', 'firstName', 'lastName', 'email', 'phone'];
            
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                const errorSpan = document.getElementById(`${fieldId}-error`);
                
                if (!field.value.trim()) {
                    isValid = false;
                    if (errorSpan) errorSpan.textContent = 'This field is required.';
                } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                    isValid = false;
                    if (errorSpan) errorSpan.textContent = 'Please enter a valid email address.';
                }
            });
            
            if (isValid) {
                // Populate confirmation details
                const serviceSelect = document.getElementById('service');
                document.getElementById('confirm-service').textContent = serviceSelect.options[serviceSelect.selectedIndex].text;
                document.getElementById('confirm-date').textContent = document.getElementById('date').value;
                document.getElementById('confirm-time').textContent = document.getElementById('time').options[document.getElementById('time').selectedIndex].text;
                document.getElementById('confirm-name').textContent = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`;
                
                // Show confirmation
                bookingForm.classList.add('hidden');
                confirmationDiv.classList.remove('hidden');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        // Book Another Button
        const bookAnotherBtn = document.getElementById('book-another');
        if (bookAnotherBtn) {
            bookAnotherBtn.addEventListener('click', () => {
                bookingForm.reset();
                bookingForm.classList.remove('hidden');
                confirmationDiv.classList.add('hidden');
            });
        }
    }
});
```