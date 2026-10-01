// LumiDent Website JavaScript
// Handles 3D card tilt, magnetic buttons, and other interactive elements

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all interactive components
  initTiltCards();
  initMagneticButtons();
  initSliderComponents();
  initFormHandlers();
  initIntersectionObservers();
});

// 3D Card Tilt Effect
function initTiltCards() {
  const tiltCards = document.querySelectorAll('.tilt-card');
  
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;
      
      const rotateY = ((x - centerX) / centerX) * 5; // Max 5 degrees
      const rotateX = ((centerY - y) / centerY) * 5; // Max 5 degrees
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

// Magnetic Button Effect
function initMagneticButtons() {
  const magneticBtns = document.querySelectorAll('.magnetic-btn');
  
  magneticBtns.forEach(btn => {
    let posX = 0, posY = 0;
    let targetX = 0, targetY = 0;
    let animating = false;
    
    const onMouseMove = (e) => {
      const btnRect = btn.getBoundingClientRect();
      const centerX = btnRect.left + btnRect.width / 2;
      const centerY = btnRect.top + btnRect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + 
        Math.pow(e.clientY - centerY, 2)
      );
      
      if (distance < 120) {
        targetX = (e.clientX - centerX) / 25;
        targetY = (e.clientY - centerY) / 25;
        
        if (!animating) {
          animateButton();
        }
      } else {
        targetX = 0;
        targetY = 0;
      }
    };
    
    const animateButton = () => {
      const ease = 0.1;
      posX += (targetX - posX) * ease;
      posY += (targetY - posY) * ease;
      
      btn.style.transform = `translate(${posX}px, ${posY}px)`;
      
      if (Math.abs(targetX - posX) > 0.1 || Math.abs(targetY - posY) > 0.1) {
        animating = true;
        requestAnimationFrame(animateButton);
      } else {
        animating = false;
      }
    };
    
    document.addEventListener('mousemove', onMouseMove);
  });
}

// Before/After Slider Component
function initSliderComponents() {
  const sliders = document.querySelectorAll('.slider');
  
  sliders.forEach(slider => {
    const handle = slider.querySelector('.slider-handle');
    const container = slider.parentElement;
    
    if (!handle) return;
    
    let isDragging = false;
    
    const updateSlider = (clientX) => {
      const containerRect = container.getBoundingClientRect();
      let percent = (clientX - containerRect.left) / containerRect.width;
      
      // Constrain between 0 and 1
      percent = Math.max(0, Math.min(1, percent));
      
      // Update the clip path to show before/after
      slider.querySelector('.before-img').style.clipPath = 
        `polygon(0 0, ${percent * 100}% 0, ${percent * 100}% 100%, 0 100%)`;
      
      handle.style.left = `${percent * 100}%`;
    };
    
    const startDrag = (e) => {
      isDragging = true;
      e.preventDefault();
      updateSlider(e.clientX);
    };
    
    const onDrag = (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    };
    
    const stopDrag = () => {
      isDragging = false;
    };
    
    handle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events for mobile
    handle.addEventListener('touchstart', (e) => {
      isDragging = true;
      e.preventDefault();
      updateSlider(e.touches[0].clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updateSlider(e.touches[0].clientX);
    });
    
    document.addEventListener('touchend', () => {
      isDragging = false;
    });
  });
}

// Form Handlers
function initFormHandlers() {
  // Appointment Booking Form
  const appointmentForm = document.getElementById('appointment-form');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(appointmentForm);
      const appointmentData = Object.fromEntries(formData);
      
      // Show confirmation message
      const confirmationMsg = document.getElementById('confirmation-message');
      const formContainer = appointmentForm.closest('.booking-form-container');
      
      if (formContainer && confirmationMsg) {
        formContainer.style.display = 'none';
        confirmationMsg.classList.remove('hidden');
      }
    });
    
    // New Appointment Button
    const newAppointmentBtn = document.getElementById('new-appointment');
    if (newAppointmentBtn) {
      newAppointmentBtn.addEventListener('click', () => {
        const confirmationMsg = document.getElementById('confirmation-message');
        const formContainer = document.querySelector('.booking-form-container');
        
        if (formContainer && confirmationMsg) {
          formContainer.style.display = 'grid';
          confirmationMsg.classList.add('hidden');
          
          // Reset form
          appointmentForm.reset();
        }
      });
    }
  }
  
  // Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const contactData = Object.fromEntries(formData);
      
      // Show success message
      alert('Thank you for your message! Our team will contact you shortly.');
      contactForm.reset();
    });
  }
  
  // Set min date for appointment booking to today
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
}

// Intersection Observer for animations
function initIntersectionObservers() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe elements that should animate in
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });
}

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', () => {
    const nav = document.querySelector('.main-nav ul');
    if (nav) {
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    }
  });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
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