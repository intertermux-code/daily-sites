// Word Stagger Animation for Hero Headlines
document.addEventListener('DOMContentLoaded', function() {
  // Word stagger animation for hero headlines
  const heroHeadlines = document.querySelectorAll('.hero-headline');
  heroHeadlines.forEach(headline => {
    const words = headline.querySelectorAll('.word');
    words.forEach((word, index) => {
      setTimeout(() => {
        word.classList.add('visible');
      }, index * 60);
    });
  });

  // Parallax Layers for Hero Section
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (!prefersReducedMotion.matches) {
    const parallaxElements = document.querySelectorAll('[data-speed]');
    
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.speed);
        const yPos = -(scrolled * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    });
  }

  // Pricing Toggle
  const billingToggle = document.getElementById('billingToggle');
  if (billingToggle) {
    billingToggle.addEventListener('click', function() {
      const isYearly = this.getAttribute('aria-pressed') === 'true';
      this.setAttribute('aria-pressed', !isYearly);
      
      // Update prices based on toggle
      const prices = document.querySelectorAll('.price');
      prices.forEach(priceEl => {
        const originalPrice = priceEl.dataset.original || priceEl.textContent.replace('$', '');
        priceEl.dataset.original = originalPrice;
        
        if (!isYearly) {
          // Switching to yearly - apply discount
          const discountedPrice = Math.round(originalPrice * 0.8);
          priceEl.textContent = '$' + discountedPrice;
        } else {
          // Switching to monthly - show original
          priceEl.textContent = '$' + originalPrice;
        }
      });
      
      // Update period text
      const periods = document.querySelectorAll('.period');
      periods.forEach(periodEl => {
        if (!isYearly) {
          // Switching to yearly
          periodEl.textContent = periodEl.textContent.replace('per month', 'per month, billed annually');
        } else {
          // Switching to monthly
          periodEl.textContent = periodEl.textContent.replace('per month, billed annually', 'per month');
        }
      });
    });
  }

  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      const expanded = mainNav.classList.contains('active');
      mobileMenuToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // Form handling for contact page
  const demoForm = document.getElementById('demoForm');
  if (demoForm) {
    demoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(demoForm);
      const name = formData.get('name');
      const email = formData.get('email');
      
      // Show success message
      alert(`Thank you ${name}! We've received your demo request and will contact you at ${email} within 24 hours.`);
      
      // Reset form
      demoForm.reset();
    });
  }

  // Initialize metric counters
  initializeMetricCounters();
});

// Initialize metric counters
function initializeMetricCounters() {
  const metricNumbers = document.querySelectorAll('.metric-number[data-target], .metric-value[data-target]');
  
  metricNumbers.forEach(metric => {
    const target = parseInt(metric.dataset.target);
    const duration = 2000; // Animation duration in ms
    const increment = target / (duration / 16); // Assuming ~60fps
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        metric.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        metric.textContent = target;
      }
    };
    
    // Start animation when element is in viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(updateCounter);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(metric);
  });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});