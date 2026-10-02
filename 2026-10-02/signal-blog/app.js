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
  }
}

// Cursor Spotlight Effect
function initCursorSpotlight() {
  const throttleMouseMove = throttle((e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  }, 16); // ~60fps

  document.addEventListener('mousemove', throttleMouseMove);
}

// 3D Card Tilt Effect
function initCardTilt() {
  const cards = document.querySelectorAll('.article-card');
  
  cards.forEach(card => {
    const handleMove = throttle((e) => {
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;
      
      const rotateY = ((x - centerX) / centerX) * 5; // Max 5 degrees
      const rotateX = ((centerY - y) / centerY) * 5; // Max 5 degrees
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    }, 16);

    card.addEventListener('mousemove', handleMove);
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// Form Validation for Subscribe Page
function initFormValidation() {
  const form = document.getElementById('subscribe-form');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const successMessage = document.getElementById('success-message');
  const submitButton = document.querySelector('.btn-submit');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  emailInput.addEventListener('blur', () => {
    validateEmail();
  });

  emailInput.addEventListener('input', () => {
    if (emailError.style.display === 'block') {
      validateEmail();
    }
  });

  function validateEmail() {
    const email = emailInput.value.trim();
    if (email && !emailRegex.test(email)) {
      emailError.style.display = 'block';
      emailInput.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      emailError.style.display = 'none';
      emailInput.setAttribute('aria-invalid', 'false');
      return true;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const isValid = validateEmail();
    if (isValid) {
      // Show success message
      successMessage.style.display = 'block';
      
      // Reset form
      form.reset();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);
    } else {
      // Focus on email field if invalid
      emailInput.focus();
    }
  });
}

// Initialize components based on page
document.addEventListener('DOMContentLoaded', () => {
  initCursorSpotlight();
  initCardTilt();
  initFormValidation();
});