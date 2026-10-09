// DOM ready function
function domReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

domReady(() => {
  // Initialize components based on page content
  initMobileMenu();
  initServiceRows();
  initImageReveal();
  initCardTilt();
  initFormHandling();
});

// Mobile menu toggle
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav ul');

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });
}

// Expandable service rows
function initServiceRows() {
  const serviceHeaders = document.querySelectorAll('.service-header');

  serviceHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const serviceRow = header.parentElement;
      serviceRow.classList.toggle('expanded');
    });
  });
}

// Image clip-path reveal effect
function initImageReveal() {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1
  });

  // Apply to all images that should reveal
  document.querySelectorAll('.card-image-container img').forEach(img => {
    img.classList.add('image-clip-reveal');
    imageObserver.observe(img);
  });
}

// 3D Card Tilt effect
function initCardTilt() {
  const cards = document.querySelectorAll('.work-card, .team-member, .process-step');

  cards.forEach(card => {
    // Add glare element
    const glare = document.createElement('div');
    glare.className = 'glare';
    card.appendChild(glare);

    // Add tilt class
    card.classList.add('card-tilt');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update glare position
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Calculate rotation values
      const rotateY = ((x / rect.width) - 0.5) * 8; // Max 8 degrees
      const rotateX = ((y / rect.height) - 0.5) * -8; // Max 8 degrees
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
}

// Form handling
function initFormHandling() {
  const form = document.getElementById('projectForm');
  
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Simple validation
    if (!data.name || !data.email || !data.message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real implementation, you would send the data to a server here
    console.log('Form submitted:', data);
    
    // Show success message
    alert('Thank you for your inquiry! We will get back to you soon.');
    
    // Reset form
    form.reset();
  });
}