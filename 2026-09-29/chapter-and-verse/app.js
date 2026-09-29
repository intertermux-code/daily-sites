// Scroll Progress Bar
const scrollProgress = document.querySelector('.scroll-progress');

if (scrollProgress) {
  const updateScrollProgress = () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.offsetHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = scrollTop / (docHeight - winHeight);
    const translateValue = Math.min(scrollPercent * 100, 100);
    
    scrollProgress.style.transform = `scaleX(${translateValue / 100})`;
  };

  window.addEventListener('scroll', updateScrollProgress);
}

// Parallax effect for hero sections
const parallaxLayers = document.querySelectorAll('.parallax-layer');

if (parallaxLayers.length > 0) {
  const handleParallax = () => {
    const scrolled = window.pageYOffset;
    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed'));
      const yPos = -(scrolled * speed);
      layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  };

  // Check if user prefers reduced motion
  const motionOkay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (motionOkay) {
    window.addEventListener('scroll', handleParallax);
  }
}

// Book filtering functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const bookItems = document.querySelectorAll('.book-item');

if (filterButtons.length > 0 && bookItems.length > 0) {
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get selected genre
      const selectedGenre = button.getAttribute('data-genre');
      
      // Show/hide books based on genre
      bookItems.forEach(item => {
        if (selectedGenre === 'all' || item.getAttribute('data-genre') === selectedGenre) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Form submission handling for book club signup
const bookClubForm = document.getElementById('bookClubForm');

if (bookClubForm) {
  bookClubForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simple validation feedback
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    
    if (!nameInput.value.trim() || !emailInput.value.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real implementation, you would submit the form here
    alert('Thank you for joining our book club! We will contact you shortly.');
    bookClubForm.reset();
  });
}

// Handle focus visibility for better accessibility
document.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-navigation');
  }
});

document.addEventListener('mousedown', function() {
  document.body.classList.remove('keyboard-navigation');
});