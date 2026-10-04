// Editorial Swiss x Card Deck Design System JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components that exist on the current page

  // Initialize clip-path image reveals
  initClipPathReveals();

  // Initialize blur-fade ascend animations
  initBlurFadeAscend();

  // Initialize gallery filtering if on gallery page
  if (document.querySelector('.gallery-grid')) {
    initGalleryFilter();
  }

  // Initialize lightbox if gallery exists
  if (document.querySelector('#lightbox')) {
    initLightbox();
  }

  // Initialize form submission if on contact page
  if (document.querySelector('#booking-form')) {
    initFormSubmission();
  }
});

// Clip-Path Image Reveal functionality
function initClipPathReveals() {
  const images = document.querySelectorAll('img');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  images.forEach(img => {
    img.classList.add('clip-path-reveal');
    imageObserver.observe(img);
  });
}

// Blur-Fade Ascend functionality
function initBlurFadeAscend() {
  const sections = document.querySelectorAll('section, .work-card, .testimonial-card, .package-card, .skill-card, .add-on-card, .step, .gallery-item');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    section.classList.add('blur-fade-ascend');
    sectionObserver.observe(section);
  });
}

// Gallery filtering functionality
function initGalleryFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
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
  const closeBtn = document.querySelector('.close-lightbox');

  galleryItems.forEach(item => {
    const img = item.querySelector('img');
    const caption = item.querySelector('figcaption');
    
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = caption.textContent;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  closeBtn.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Form submission functionality
function initFormSubmission() {
  const form = document.getElementById('booking-form');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const formObject = Object.fromEntries(formData);
    
    // Basic validation
    if (!formObject.fullName || !formObject.email || !formObject.venueLocation) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Show success message
    alert('Thank you for your inquiry! We will contact you shortly to discuss your wedding photography needs.');
    
    // Reset form
    form.reset();
  });
}