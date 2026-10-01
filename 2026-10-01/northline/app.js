// Check if we're on the homepage for cursor spotlight effect
if (document.querySelector('.hero')) {
  // Cursor spotlight effect
  const cursorSpotlight = document.querySelector('.cursor-spotlight');
  
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const xPercent = (x / screenWidth) * 100;
    const yPercent = (y / screenHeight) * 100;
    
    cursorSpotlight.style.setProperty('--mouse-x', `${xPercent}%`);
    cursorSpotlight.style.setProperty('--mouse-y', `${yPercent}%`);
  });
}

// 3D Card Tilt Effect for work cards
const workCards = document.querySelectorAll('.work-card');
let mouseX = 0;
let mouseY = 0;

workCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cardX = e.clientX - rect.left;
    const cardY = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((cardX - centerX) / centerX) * 5; // Max 5 degrees
    const rotateX = ((centerY - cardY) / centerY) * 5; // Max 5 degrees
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  });
});

// Service accordion functionality
document.addEventListener('DOMContentLoaded', () => {
  const expandButtons = document.querySelectorAll('.expand-btn');
  
  expandButtons.forEach(button => {
    button.addEventListener('click', () => {
      const serviceRow = button.closest('.service-row');
      const details = serviceRow.querySelector('.service-details');
      const isExpanded = details.classList.contains('expanded');
      
      // Close all other details
      document.querySelectorAll('.service-details').forEach(detail => {
        detail.classList.remove('expanded');
      });
      
      // Toggle clicked item
      if (!isExpanded) {
        details.classList.add('expanded');
        button.setAttribute('aria-expanded', 'true');
      } else {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });
  
  // Form validation for contact page
  const contactForm = document.getElementById('project-enquiry');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Basic validation
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      
      if (!name || !email || !message) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // In a real implementation, you would submit the form here
      alert('Thank you for your inquiry! We will get back to you soon.');
      contactForm.reset();
    });
  }
});