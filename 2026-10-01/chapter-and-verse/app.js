// Chapter & Verse - Independent Bookstore JavaScript

// Animated Counters for stats
const animateCounter = (element) => {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 1200; // 1.2 seconds
  const startTime = performance.now();

  const updateCount = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out expo function
    const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentValue = Math.floor(easeOutExpo * target);
    
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(updateCount);
    }
  };
  
  requestAnimationFrame(updateCount);
};

// Initialize counters when they come into view
const initCounters = () => {
  const counterElements = document.querySelectorAll('.stat-number');
  const observerOptions = {
    threshold: 0.5
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counterElements.forEach(counter => {
    counterObserver.observe(counter);
  });
};

// Decode Text Animation
const initDecodeText = () => {
  const decodeElements = document.querySelectorAll('.decode-text');
  
  decodeElements.forEach(element => {
    const originalText = element.textContent;
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';
    let iteration = 0;
    const originalLength = originalText.length;
    
    // Store original text as data attribute
    element.setAttribute('data-original', originalText);
    
    const updateText = () => {
      let newText = '';
      
      for (let i = 0; i < originalLength; i++) {
        if (i < iteration) {
          newText += originalText[i];
        } else {
          newText += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      
      element.textContent = newText;
      iteration++;
      
      if (iteration <= originalLength) {
        setTimeout(updateText, 100);
      }
    };
    
    // Start animation on page load
    updateText();
  });
};

// Genre Filter for Books Page
const initGenreFilter = () => {
  if (!document.querySelector('.genre-btn')) return;
  
  const genreButtons = document.querySelectorAll('.genre-btn');
  const books = document.querySelectorAll('.book');
  
  genreButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      genreButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const selectedGenre = button.getAttribute('data-genre');
      
      // Show/hide books based on selected genre
      books.forEach(book => {
        if (selectedGenre === 'all' || book.getAttribute('data-genre') === selectedGenre) {
          book.style.display = 'block';
        } else {
          book.style.display = 'none';
        }
      });
    });
  });
};

// Form submission handling for book club
const initBookClubForm = () => {
  const form = document.getElementById('bookClubForm');
  const successMessage = document.getElementById('formSuccess');
  
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // In a real implementation, you would send the data to a server here
    // For this demo, we'll just show the success message
    
    // Reset form
    form.reset();
    
    // Show success message
    successMessage.style.display = 'block';
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 5000);
  });
};

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  initDecodeText();
  initGenreFilter();
  initBookClubForm();
});