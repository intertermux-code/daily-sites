// 3D Card Tilt Effect
class CardTilt {
  constructor() {
    this.cards = document.querySelectorAll('.tilt-card');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
      card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
    });
  }

  handleMouseMove(e, card) {
    // Get the card's position and dimensions
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation values based on mouse position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 8; // Max 8 degrees
    const rotateX = ((centerY - y) / centerY) * 8; // Max 8 degrees
    
    // Apply the transform
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    
    // Update the gradient position for the glow effect
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }

  handleMouseLeave(e, card) {
    // Reset the transform when mouse leaves
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  }
}

// Parallax Layers Effect
class ParallaxLayers {
  constructor() {
    this.hero = document.querySelector('.hero');
    if (!this.hero) return;
    
    this.layers = this.hero.querySelectorAll('.layer');
    this.init();
  }

  init() {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Hide parallax layers if reduced motion is preferred
      const layersContainer = this.hero.querySelector('.hero-layers');
      if (layersContainer) {
        layersContainer.style.display = 'none';
      }
      return;
    }
    
    window.addEventListener('scroll', () => this.handleScroll());
  }

  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    this.layers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed')) || 0.5;
      const yPos = -(scrollTop * speed);
      
      layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  }
}

// Tab Navigation for Menu Page
class MenuTabs {
  constructor() {
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.init();
  }

  init() {
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e));
    });
  }

  switchTab(e) {
    const targetTab = e.currentTarget.getAttribute('data-tab');
    
    // Remove active class from all buttons and panes
    this.tabBtns.forEach(btn => btn.classList.remove('active'));
    this.tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Add active class to clicked button
    e.currentTarget.classList.add('active');
    
    // Show corresponding pane
    document.getElementById(`${targetTab}-tab`).classList.add('active');
  }
}

// Reservation Form Validation
class ReservationForm {
  constructor() {
    this.form = document.getElementById('reservationForm');
    this.confirmationMessage = document.getElementById('confirmationMessage');
    this.reservationDetails = document.getElementById('reservationDetails');
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    let isValid = true;
    const inputs = this.form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    if (isValid) {
      // Show confirmation message
      this.showConfirmation();
    }
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.id;
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    // Clear previous error
    if (errorElement) {
      errorElement.textContent = '';
    }
    
    let isValid = true;
    
    // Specific validation rules
    switch (fieldName) {
      case 'name':
        if (!value) {
          this.showError(errorElement, 'Name is required');
          isValid = false;
        } else if (value.length < 2) {
          this.showError(errorElement, 'Name must be at least 2 characters');
          isValid = false;
        }
        break;
        
      case 'phone':
        const phoneRegex = /^[0-9\-\+\s\(\)]{10,15}$/;
        if (!value) {
          this.showError(errorElement, 'Phone number is required');
          isValid = false;
        } else if (!phoneRegex.test(value)) {
          this.showError(errorElement, 'Please enter a valid phone number');
          isValid = false;
        }
        break;
        
      case 'date':
        if (!value) {
          this.showError(errorElement, 'Date is required');
          isValid = false;
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate < today) {
            this.showError(errorElement, 'Please select a future date');
            isValid = false;
          }
        }
        break;
        
      case 'time':
        if (!value) {
          this.showError(errorElement, 'Time is required');
          isValid = false;
        }
        break;
        
      case 'partySize':
        if (!value) {
          this.showError(errorElement, 'Party size is required');
          isValid = false;
        }
        break;
    }
    
    return isValid;
  }

  showError(element, message) {
    if (element) {
      element.textContent = message;
    }
  }

  showConfirmation() {
    const formData = new FormData(this.form);
    const name = formData.get('name');
    const date = formData.get('date');
    const time = formData.get('time');
    const partySize = formData.get('partySize');
    
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this.reservationDetails.innerHTML = `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Party Size:</strong> ${partySize}</p>
    `;
    
    this.confirmationMessage.style.display = 'block';
    
    // Scroll to confirmation
    this.confirmationMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Reset form after 2 seconds
    setTimeout(() => {
      this.form.reset();
    }, 2000);
  }
}

// Gallery Lightbox
class GalleryLightbox {
  constructor() {
    this.galleryItems = document.querySelectorAll('.gallery-item');
    this.lightbox = document.getElementById('lightbox');
    this.lightboxImage = document.querySelector('.lightbox-image');
    this.lightboxCaption = document.querySelector('.lightbox-caption');
    this.closeButton = document.querySelector('.lightbox-close');
    this.init();
  }

  init() {
    this.galleryItems.forEach(item => {
      item.addEventListener('click', () => this.openLightbox(item));
    });
    
    this.closeButton?.addEventListener('click', () => this.closeLightbox());
    
    // Close lightbox when clicking outside the image
    this.lightbox?.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.closeLightbox();
      }
    });
    
    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
        this.closeLightbox();
      }
    });
  }

  openLightbox(item) {
    const img = item.querySelector('img');
    this.lightboxImage.src = img.src;
    this.lightboxImage.alt = img.alt;
    this.lightboxCaption.textContent = item.querySelector('h3').textContent + ': ' + item.querySelector('p').textContent;
    
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
  }

  closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CardTilt();
  new ParallaxLayers();
  new MenuTabs();
  new ReservationForm();
  new GalleryLightbox();
});