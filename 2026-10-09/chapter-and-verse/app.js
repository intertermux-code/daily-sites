// Chapter & Verse Bookstore - JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all interactive components
  initBookShelfFilter();
  initCardTiltEffect();
  initFormHandlers();
});

// Book Shelf Filter functionality
function initBookShelfFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const bookSpines = document.querySelectorAll('.book-spine');
  const bookDetailCards = document.querySelectorAll('.book-detail-card');

  if (!filterButtons.length) return;

  // Add click event listeners to filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const genre = button.getAttribute('data-genre');

      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Filter book spines
      bookSpines.forEach(spine => {
        if (genre === 'all' || spine.getAttribute('data-genre') === genre) {
          spine.style.display = 'block';
        } else {
          spine.style.display = 'none';
        }
      });

      // Show corresponding book details if on books page
      if (window.location.pathname.includes('books.html')) {
        bookDetailCards.forEach(card => {
          card.classList.remove('active');
          if (genre === 'all') {
            // Show first card by default when 'all' is selected
            if (card === bookDetailCards[0]) {
              card.classList.add('active');
            }
          } else {
            // This would require mapping between spine and detail card
            // For simplicity in this implementation, we'll just remove active class
            // Real implementation would have data attributes to map them
          }
        });
      }
    });
  });
}

// 3D Card Tilt Effect
function initCardTiltEffect() {
  const cards = document.querySelectorAll('.book-card');

  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;
      
      const rotateY = ((x - centerX) / centerX) * 8; // Max 8 degrees
      const rotateX = ((centerY - y) / centerY) * 8; // Max 8 degrees
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// Form handlers
function initFormHandlers() {
  const signupForm = document.querySelector('.signup-form');
  
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(signupForm);
      
      // Simple validation
      const name = formData.get('name');
      const email = formData.get('email');
      
      if (!name || !email) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // In a real application, you would send the data to a server here
      // For this example, we'll just show a success message
      alert(`Thank you, ${name}! Your application to join our book club has been received. We'll contact you at ${email}.`);
      
      // Reset form
      signupForm.reset();
    });
  }
}

// Utility function to debounce expensive functions
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