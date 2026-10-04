// Lenscraft Wedding Photography Portfolio - JavaScript

// Magnetic Button Effect
class MagneticButton {
  constructor(element) {
    this.element = element;
    this.originalX = 0;
    this.originalY = 0;
    this.strength = 0.15;
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }
  
  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Calculate distance from center (for scaling effect)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const proximity = Math.min(distance / maxDistance, 1);
    
    // Apply magnetic effect if within 120px radius
    if (distance <= 120) {
      const moveX = deltaX * this.strength;
      const moveY = deltaY * this.strength;
      
      this.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      
      // Add subtle scale when very close
      if (proximity < 0.3) {
        this.element.style.transform += ' scale(1.04)';
      }
    }
  }
  
  handleMouseLeave() {
    this.element.style.transform = 'translate(0, 0) scale(1)';
  }
}

// Initialize magnetic buttons
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary');
  buttons.forEach(button => {
    new MagneticButton(button);
  });
}

// Cursor Spotlight Effect
function initCursorSpotlight() {
  const heroBg = document.getElementById('hero-bg');
  if (!heroBg) return;
  
  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  heroBg.appendChild(spotlight);
  
  let mouseX = 0;
  let mouseY = 0;
  let isVisible = false;
  
  // Throttle mouse movement for performance
  let ticking = false;
  
  function updateSpotlight() {
    spotlight.style.background = `radial-gradient(circle, rgba(141,125,119,0.15) 0%, transparent 70%)`;
    spotlight.style.left = `${mouseX - 150}px`;
    spotlight.style.top = `${mouseY - 150}px`;
    ticking = false;
  }
  
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!ticking) {
      requestAnimationFrame(updateSpotlight);
      ticking = true;
    }
    
    if (!isVisible) {
      spotlight.style.opacity = '1';
      isVisible = true;
    }
  }
  
  function onMouseLeave() {
    spotlight.style.opacity = '0';
    isVisible = false;
  }
  
  heroBg.addEventListener('mousemove', onMouseMove);
  heroBg.addEventListener('mouseleave', onMouseLeave);
}

// Gallery Filtering
function initGalleryFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (!filterButtons.length || !galleryItems.length) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
      // Show/hide items based on filter
      galleryItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Lightbox functionality
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  const lightboxPrev = lightbox.querySelector('.lightbox-nav.prev');
  const lightboxNext = lightbox.querySelector('.lightbox-nav.next');
  
  const galleryItems = document.querySelectorAll('.gallery-item');
  let currentIndex = 0;
  
  // Open lightbox
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      currentIndex = index;
      updateLightboxImage();
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    });
  });
  
  // Close lightbox
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Navigation
  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightboxImage();
  });
  
  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateLightboxImage();
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      updateLightboxImage();
    } else if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % galleryItems.length;
      updateLightboxImage();
    }
  });
  
  function updateLightboxImage() {
    const img = galleryItems[currentIndex].querySelector('img');
    lightboxImg.src = img.src.replace('w=800', 'w=1200').replace('w=600', 'w=1200');
    lightboxImg.alt = img.alt;
  }
  
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
}

// Form submission handling
function initFormHandling() {
  const bookingForm = document.getElementById('booking-form');
  if (!bookingForm) return;
  
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(bookingForm);
    const data = Object.fromEntries(formData);
    
    // Simple validation
    if (!data.name || !data.email) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real application, you would send this data to a server
    console.log('Booking inquiry submitted:', data);
    
    // Show success message
    alert('Thank you for your inquiry! I will contact you shortly to discuss your special day.');
    
    // Reset form
    bookingForm.reset();
  });
}

// Initialize all features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initMagneticButtons();
  initCursorSpotlight();
  initGalleryFilter();
  initLightbox();
  initFormHandling();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});