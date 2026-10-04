// Decode Text Effect
function initDecodeText() {
    const decodeTextElements = document.querySelectorAll('.decode-text');
    
    decodeTextElements.forEach(element => {
        const originalText = element.textContent;
        const length = originalText.length;
        let iteration = 0;
        
        // Set initial state
        element.textContent = originalText.split('').map(() => getRandomChar()).join('');
        
        const interval = setInterval(() => {
            const newText = originalText
                .split('')
                .map((char, i) => {
                    if (i < iteration) {
                        return char;
                    }
                    return getRandomChar();
                })
                .join('');
                
            element.textContent = newText;
            iteration++;
            
            if (iteration > length) {
                clearInterval(interval);
            }
        }, 100);
    });
}

function getRandomChar() {
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars.charAt(Math.floor(Math.random() * chars.length));
}

// Animated Counters
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetValue = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, targetValue);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element, targetValue) {
    let startValue = 0;
    const duration = 1200; // ms
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out expo function
        const easedProgress = progress < 1 ? 1 - Math.pow(2, -10 * progress) : 1;
        const currentValue = Math.floor(easedProgress * targetValue);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue.toLocaleString();
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (!menuToggle || !mainNav) return;
    
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        
        // Update aria-expanded attribute
        const isExpanded = mainNav.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Gallery Lightbox
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    
    if (!galleryItems.length || !lightbox) return;
    
    let currentIndex = 0;
    const images = Array.from(galleryItems).map(item => ({
        src: item.querySelector('img').src,
        alt: item.querySelector('img').alt
    }));
    
    function openLightbox(index) {
        currentIndex = index;
        lightboxImage.src = images[currentIndex].src;
        lightboxImage.alt = images[currentIndex].alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
    }
    
    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        lightboxImage.src = images[currentIndex].src;
        lightboxImage.alt = images[currentIndex].alt;
    }
    
    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        lightboxImage.src = images[currentIndex].src;
        lightboxImage.alt = images[currentIndex].alt;
    }
    
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });
    
    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });
    
    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowRight':
                showNext();
                break;
            case 'ArrowLeft':
                showPrev();
                break;
        }
    });
}

// Reservation Form Validation
function initReservationForm() {
    const form = document.getElementById('reservationForm');
    const confirmationDiv = document.getElementById('reservationConfirmation');
    
    if (!form) return;
    
    // Add event listeners for validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearError);
    });
    
    form.addEventListener('submit', handleFormSubmit);
    
    document.getElementById('newReservationBtn')?.addEventListener('click', () => {
        confirmationDiv.style.display = 'none';
        form.style.display = 'block';
        form.reset();
    });
    
    function validateField(e) {
        const field = e.target;
        let isValid = true;
        let errorMessage = '';
        
        switch (field.id) {
            case 'fullName':
                if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = 'Full name is required';
                } else if (field.value.trim().length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters';
                }
                break;
                
            case 'phone':
                const phoneRegex = /^[0-9\-\+\s\(\)]{10,15}$/;
                if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = 'Phone number is required';
                } else if (!phoneRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
                break;
                
            case 'date':
                const selectedDate = new Date(field.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (!field.value) {
                    isValid = false;
                    errorMessage = 'Date is required';
                } else if (selectedDate < today) {
                    isValid = false;
                    errorMessage = 'Please select a future date';
                }
                break;
                
            case 'time':
                if (!field.value) {
                    isValid = false;
                    errorMessage = 'Time is required';
                }
                break;
                
            case 'partySize':
                if (!field.value) {
                    isValid = false;
                    errorMessage = 'Party size is required';
                }
                break;
        }
        
        if (!isValid) {
            showError(field.id, errorMessage);
        }
        
        return isValid;
    }
    
    function showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
    
    function clearError(e) {
        const errorElement = document.getElementById(e.target.id + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const allInputs = form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;
        
        allInputs.forEach(input => {
            if (!validateField({ target: input })) {
                isFormValid = false;
            }
        });
        
        if (isFormValid) {
            // Show confirmation
            form.style.display = 'none';
            confirmationDiv.style.display = 'block';
            
            // Scroll to confirmation
            confirmationDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Menu Tabs
function initMenuTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.menu-tab');
    
    if (!tabButtons.length || !tabPanels.length) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initDecodeText();
    initAnimatedCounters();
    initMobileMenu();
    initLightbox();
    initReservationForm();
    initMenuTabs();
});