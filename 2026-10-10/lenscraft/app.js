// Throttle function to limit event handler execution
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Initialize spotlight effect on hero sections
function initSpotlightEffect() {
  const heroElements = document.querySelectorAll('.hero, .gallery-hero, .about-hero, .pricing-hero, .contact-hero');
  
  heroElements.forEach(hero => {
    const bgElement = hero.querySelector('.hero-background');
    if (!bgElement) return;

    // Enable spotlight effect
    hero.setAttribute('spotlight-active', '');
    
    // Track mouse movement
    const handleMouseMove = throttle((e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update CSS custom properties for radial gradient
      bgElement.style.background = `
        radial-gradient(circle at ${x}px ${y}px, rgba(212, 200, 169, 0.3), transparent 70%),
        linear-gradient(to bottom, rgba(250, 248, 244, 0.9), rgba(250, 248, 244, 0.7)),
        url('${bgElement.style.backgroundImage ? getComputedStyle(bgElement).backgroundImage.replace(/url\(["']?([^"']*)["']?\)/, '$1') : 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80'}) no-repeat center center
      `;
      bgElement.style.backgroundSize = 'cover';
    }, 16); // ~60fps
    
    hero.addEventListener('mousemove', handleMouseMove);
    
    // Reset background on mouse leave
    hero.addEventListener('mouseleave', () => {
      bgElement.style.background = `
        linear-gradient(to bottom, rgba(250, 248, 244, 0.9), rgba(250, 248, 244, 0.7)),
        url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80') no-repeat center center
      `;
      bgElement.style.backgroundSize = 'cover';
    });
  });
}

// Initialize gallery filtering
function initGalleryFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryGrid = document.getElementById('gallery-grid');
  
  if (!filterButtons.length || !galleryGrid) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
      // Show/hide items based on filter
      const items = galleryGrid.querySelectorAll('.mosaic-item');
      items.forEach(item => {
        if (filterValue === 'all' || item.classList.contains(`filter-${filterValue}`)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Initialize lightbox functionality
function initLightbox() {
  const galleryItems = document.querySelectorAll('.mosaic-item img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  
  if (!galleryItems.length) return;
  
  galleryItems.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxCaption.textContent = img.alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    });
  });
  
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    }
  });
  
  // Close lightbox on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    }
  });
}

// Initialize form submission
function initForm() {
  const contactForm = document.getElementById('booking-form');
  
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(contactForm);
    const formObject = Object.fromEntries(formData);
    
    // Simple validation
    if (!formObject.fullName || !formObject.email) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real implementation, you would send the data to a server here
    console.log('Form submitted:', formObject);
    
    // Show success message
    alert('Thank you for your inquiry! We will contact you shortly.');
    
    // Reset form
    contactForm.reset();
  });
}

// Initialize mobile menu toggle
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (!menuToggle || !navMenu) return;
  
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initSpotlightEffect();
  initGalleryFilter();
  initLightbox();
  initForm();
  initMobileMenu();
});