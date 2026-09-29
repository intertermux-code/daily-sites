// Magnetic Button Effect
class MagneticButton {
  constructor(element) {
    this.element = element;
    this.originalX = 0;
    this.originalY = 0;
    this.lerpAmount = 0.1;
    this.clientX = 0;
    this.clientY = 0;
    this.isActive = false;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    this.init();
  }

  init() {
    this.element.addEventListener('mouseenter', this.handleMouseEnter);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  handleMouseEnter() {
    this.isActive = true;
    document.body.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseLeave() {
    this.isActive = false;
    document.body.removeEventListener('mousemove', this.handleMouseMove);
    // Reset to original position
    gsap.to(this.element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  handleMouseMove(e) {
    if (!this.isActive) return;

    const rect = this.element.getBoundingClientRect();
    const magnetArea = 120; // Radius in pixels
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (distance < magnetArea) {
      const strength = Math.min(1, (magnetArea - distance) / magnetArea);
      const moveX = distanceX * strength * 0.2;
      const moveY = distanceY * strength * 0.2;
      
      gsap.to(this.element, {
        x: moveX,
        y: moveY,
        duration: 0.1,
        ease: 'power2.out'
      });
    } else {
      gsap.to(this.element, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }
}

// 3D Card Tilt Effect
class CardTilt {
  constructor(element) {
    this.element = element;
    this.cardInner = element.querySelector('.card-inner');
    this.maxRotation = 8; // Maximum rotation in degrees
    this.lerpAmount = 0.05;
    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    this.init();
  }

  init() {
    this.element.addEventListener('mouseenter', this.handleMouseEnter);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  handleMouseEnter() {
    document.body.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Normalize the values to -1 to 1 range
    this.targetX = (mouseY / (rect.height / 2)) * this.maxRotation;
    this.targetY = -(mouseX / (rect.width / 2)) * this.maxRotation;
  }

  handleMouseLeave() {
    document.body.removeEventListener('mousemove', this.handleMouseMove);
    // Reset to original position
    gsap.to(this.cardInner, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  update() {
    // Apply smoothing with lerp
    this.currentX += (this.targetX - this.currentX) * this.lerpAmount;
    this.currentY += (this.targetY - this.currentY) * this.lerpAmount;

    if (this.cardInner) {
      gsap.set(this.cardInner, {
        rotationX: this.currentX,
        rotationY: this.currentY,
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${this.currentX}deg) rotateY(${this.currentY}deg)`
      });
    }
  }
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize magnetic buttons
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
  buttons.forEach(button => {
    new MagneticButton(button);
  });

  // Initialize 3D card tilts
  const cards = document.querySelectorAll('.card-3d');
  const cardInstances = [];
  
  cards.forEach(card => {
    const cardInstance = new CardTilt(card);
    cardInstances.push(cardInstance);
  });

  // Animation loop for card tilts
  function animateCards() {
    cardInstances.forEach(instance => {
      instance.update();
    });
    requestAnimationFrame(animateCards);
  }
  
  if (cardInstances.length > 0) {
    animateCards();
  }

  // Mobile menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // Appointment form handling
  const appointmentForm = document.getElementById('appointment-form');
  const confirmationMessage = document.getElementById('confirmation-message');
  const newAppointmentBtn = document.getElementById('new-appointment');

  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simple validation
      const requiredFields = appointmentForm.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = 'var(--error)';
        } else {
          field.style.borderColor = 'var(--border)';
        }
      });

      if (isValid) {
        // Show confirmation message
        appointmentForm.classList.add('hidden');
        confirmationMessage.classList.remove('hidden');
        
        // Reset form
        appointmentForm.reset();
      }
    });
  }

  if (newAppointmentBtn) {
    newAppointmentBtn.addEventListener('click', () => {
      confirmationMessage.classList.add('hidden');
      appointmentForm.classList.remove('hidden');
    });
  }

  // Contact form handling
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simple validation
      const requiredFields = contactForm.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = 'var(--error)';
        } else {
          field.style.borderColor = 'var(--border)';
        }
      });

      if (isValid) {
        alert('Thank you for your message! We will contact you shortly.');
        contactForm.reset();
      }
    });
  }

  // Before/After Slider functionality
  const sliders = document.querySelectorAll('.image-slider');
  
  sliders.forEach(slider => {
    const track = slider.querySelector('.slider-track');
    const handle = slider.querySelector('.slider-handle');
    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos)); // Clamp between 0 and 1
      
      // Update the width of the first image to reveal the second
      track.style.clipPath = `inset(0 ${100 - (pos * 100)}% 0 0)`;
      
      // Update handle position
      handle.style.left = `${pos * 100}%`;
    };

    const handleMouseDown = (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    };

    const handleTouchStart = (e) => {
      isDragging = true;
      updateSlider(e.touches[0].clientX);
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      updateSlider(e.touches[0].clientX);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    handle.addEventListener('mousedown', handleMouseDown);
    handle.addEventListener('touchstart', handleTouchStart);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    // Initialize slider position
    handle.style.left = '50%';
    track.style.clipPath = 'inset(0 50% 0 0)';
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
});

// Utility function for smooth animation updates
function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}