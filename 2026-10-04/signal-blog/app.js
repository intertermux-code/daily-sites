// Debounce function to limit event handler calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle cursor spotlight effect for hero sections
function initCursorSpotlight() {
  const heroes = document.querySelectorAll('.hero');
  
  heroes.forEach(hero => {
    const handleMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate percentage positions
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      
      hero.style.setProperty('--mouse-x', `${xPercent}%`);
      hero.style.setProperty('--mouse-y', `${yPercent}%`);
    };

    hero.addEventListener('mousemove', debounce(handleMouseMove, 16)); // ~60fps
  });
}

// Handle 3D card tilt effect for article cards
function initCardTilt() {
  const cards = document.querySelectorAll('.article-card');
  
  cards.forEach(card => {
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate rotation values (-8deg to 8deg)
      const rotateY = ((x / rect.width) - 0.5) * 16; // Max 8deg
      const rotateX = ((y / rect.height) - 0.5) * -16; // Max 8deg, inverted
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };

    card.addEventListener('mousemove', debounce(handleMouseMove, 16));
    card.addEventListener('mouseleave', handleMouseLeave);
  });
}

// Form validation for subscribe page
function initSubscribeForm() {
  const form = document.querySelector('.subscribe-form');
  if (!form) return;

  const emailInput = form.querySelector('#email');
  const errorMessage = form.querySelector('.error-message');
  const successMessage = form.querySelector('.success-message');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Clear previous messages
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    if (!validateEmail(email)) {
      errorMessage.textContent = 'Please enter a valid email address.';
      return;
    }
    
    // Simulate form submission
    setTimeout(() => {
      successMessage.textContent = 'Thank you for subscribing! Check your email for confirmation.';
      emailInput.value = '';
    }, 300);
  });
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initCursorSpotlight();
  initCardTilt();
  initSubscribeForm();
});