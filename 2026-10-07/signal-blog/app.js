// Word Stagger Animation for Hero Headlines
document.addEventListener('DOMContentLoaded', () => {
  // Initialize word stagger animations on page load
  const heroTitles = document.querySelectorAll('.hero-title');
  heroTitles.forEach(title => {
    const words = title.querySelectorAll('.word');
    words.forEach((word, index) => {
      word.style.animationDelay = `${index * 60}ms`;
    });
  });

  // Initialize Intersection Observer for blur-fade animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, observerOptions);

  // Observe elements with 'in' class
  document.querySelectorAll('.in').forEach(el => {
    observer.observe(el);
  });

  // Stagger animations for article cards
  const articleCards = document.querySelectorAll('.article-card');
  articleCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 80}ms`;
    card.classList.add('in');
  });

  // Newsletter form handling
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value;
      
      if (email && /\S+@\S+\.\S+/.test(email)) {
        // In a real implementation, you would send this to your backend
        alert('Thank you for subscribing! Check your email for confirmation.');
        emailInput.value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    });
  });

  // Search functionality
  const searchInputs = document.querySelectorAll('input[type="search"]');
  searchInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // In a real implementation, this would trigger search
        console.log('Searching for:', input.value);
      }
    });
  });
});