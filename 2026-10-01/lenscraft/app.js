// Word Stagger Animation for Hero Headlines
function initWordStagger() {
    const heroTitles = document.querySelectorAll('.hero-title');
    
    heroTitles.forEach(title => {
        const words = title.querySelectorAll('.word');
        
        // Check if reduced motion is preferred
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // If reduced motion is preferred, show all words immediately
            words.forEach(word => {
                word.style.opacity = '1';
                word.style.transform = 'translateY(0) rotate(0)';
            });
            return;
        }
        
        // Calculate stagger delay based on position
        words.forEach((word, index) => {
            word.style.animationDelay = `${index * 60}ms`;
        });
    });
}

// Blur-Fade Ascend Animation
function initBlurFadeAscend() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                
                // Add stagger effect to child elements
                const children = entry.target.querySelectorAll(':scope > *');
                children.forEach((child, index) => {
                    child.style.transitionDelay = `${index * 80}ms`;
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with the blur-fade-ascend class
    document.querySelectorAll('.blur-fade-ascend').forEach(el => {
        observer.observe(el);
    });
}

// Gallery Filtering
function initGalleryFilter() {
    if (!document.querySelector('.gallery-grid')) return;

    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            // Show/hide gallery items based on filter
            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

// Lightbox functionality
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');
    
    if (!lightbox) return;

    let currentIndex = 0;
    let filteredItems = [];

    // Open lightbox
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-overlay')) return;
            
            // Only consider visible items for lightbox navigation
            filteredItems = Array.from(galleryItems).filter(i => !i.classList.contains('hidden'));
            
            currentIndex = filteredItems.indexOf(item);
            openLightbox(currentIndex);
        });
    });

    function openLightbox(index) {
        const item = filteredItems[index];
        const img = item.querySelector('img');
        const caption = item.querySelector('.gallery-overlay h3').textContent + ': ' + 
                       item.querySelector('.gallery-overlay p').textContent;
        
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Close lightbox
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Navigation
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
        openLightbox(currentIndex);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % filteredItems.length;
        openLightbox(currentIndex);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;

        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                currentIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
                openLightbox(currentIndex);
                break;
            case 'ArrowRight':
                currentIndex = (currentIndex + 1) % filteredItems.length;
                openLightbox(currentIndex);
                break;
        }
    });
}

// Form submission handling
function initFormHandling() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            
            // Simple validation
            let isValid = true;
            const requiredFields = ['fullName', 'email', 'location'];
            
            requiredFields.forEach(field => {
                const fieldElement = contactForm.querySelector(`#${field}`);
                if (!formData.get(field)) {
                    fieldElement.style.borderColor = '#ff0000';
                    isValid = false;
                } else {
                    fieldElement.style.borderColor = '';
                }
            });
            
            if (isValid) {
                // In a real implementation, you would send the data to a server here
                alert('Thank you for your inquiry! We will contact you shortly.');
                contactForm.reset();
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initWordStagger();
    initBlurFadeAscend();
    initGalleryFilter();
    initLightbox();
    initFormHandling();
});