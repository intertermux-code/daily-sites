// Lenscraft Wedding Photography Portfolio - JavaScript

// Cursor Spotlight Effect for Hero Section
function initCursorSpotlight() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Update spotlight position based on mouse coordinates
  document.addEventListener('mousemove', throttle((e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    hero.style.setProperty('--mouse-x', `${x}%`);
    hero.style.setProperty('--mouse-y', `${y}%`);
  }, 16)); // ~60fps
}

// Throttle function to limit event handler calls
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
  };
}

// Filterable Gallery
function initGalleryFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (!filterButtons.length || !galleryItems.length) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
      galleryItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.style.display = 'block';
          // Trigger reflow to ensure proper animation
          void item.offsetWidth;
          item.style.opacity = '1';
        } else {
          item.style.display = 'none';
          item.style.opacity = '0';
        }
      });
    });
  });
}

// Lightbox functionality
function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const closeBtn = document.querySelector('.close-lightbox');

  if (!galleryItems.length) return;

  galleryItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        const imgSrc = e.target.src;
        const title = item.querySelector('.gallery-overlay h3').textContent;
        const desc = item.querySelector('.gallery-overlay p').textContent;
        
        lightboxImg.src = imgSrc;
        lightboxTitle.textContent = title;
        lightboxDesc.textContent = desc;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    });
  });

  // Close lightbox
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = ''; // Restore scrolling
  };

  closeBtn.addEventListener('click', closeLightbox);
  
  // Close when clicking outside the image
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!mobileToggle || !navLinks) return;

  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const isExpanded = navLinks.classList.contains('active');
    mobileToggle.setAttribute('aria-expanded', isExpanded);
  });
}

// Form handling for contact page
function initContactForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.fullName || !data.email || !data.location) {
      alert('Please fill in all required fields.');
      return;
    }

    // In a real implementation, you would send the data to a server here
    console.log('Form submitted:', data);
    
    // Show success message
    alert('Thank you for your inquiry! We will contact you shortly to discuss your special day.');
    
    // Reset form
    form.reset();
  });
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initCursorSpotlight();
  initGalleryFilter();
  initLightbox();
  initMobileMenu();
  initContactForm();
});