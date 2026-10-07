// Northline Creative Agency - JavaScript

// Word Stagger Animation for Hero Titles
function initWordStagger() {
  const heroTitles = document.querySelectorAll('.hero-title');
  
  heroTitles.forEach(title => {
    const words = title.querySelectorAll('.word');
    
    words.forEach((word, index) => {
      // Add slight delay for each word
      setTimeout(() => {
        word.classList.add('loaded');
      }, index * 60);
    });
  });
}

// Blur-Fade Ascend Animation for Sections
function initSectionAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all sections with animation
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });

  // Also observe service rows separately for horizontal animation
  document.querySelectorAll('.service-row').forEach(row => {
    observer.observe(row);
  });
}

// Mobile Navigation Toggle
function initMobileNav() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
}

// Form Submission Handler
function initFormHandler() {
  const form = document.getElementById('projectForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const formData = new FormData(form);
      
      // In a real implementation, you would send the data to a server here
      // For now, we'll just show a success message
      
      // Show success feedback
      alert('Thank you for your project enquiry! We will contact you shortly.');
      
      // Reset form
      form.reset();
    });
  }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initWordStagger();
  initSectionAnimations();
  initMobileNav();
  initFormHandler();
});