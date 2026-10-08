// Magnetic button effect
class MagneticButton {
  constructor(element) {
    this.element = element;
    this.container = element.parentElement;
    this.resetPosition();
    
    // Only initialize if not preferring reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.init();
    }
  }

  init() {
    this.container.style.position = 'relative';
    this.element.style.transition = 'transform 0.2s ease-out';
    
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  handleMouseMove(e) {
    const containerRect = this.container.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const distanceX = e.clientX - containerCenterX;
    const distanceY = e.clientY - containerCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < 120) {
      const strength = Math.min(distance / 120, 1);
      const moveX = (distanceX / containerRect.width) * 20 * strength;
      const moveY = (distanceY / containerRect.height) * 20 * strength;
      
      this.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      
      // Add slight scale when closest
      if (distance < 30) {
        this.element.style.transform += ' scale(1.04)';
      }
    } else {
      this.resetPosition();
    }
  }

  handleMouseLeave() {
    this.resetPosition();
  }

  resetPosition() {
    this.element.style.transform = 'translate(0, 0)';
  }
}

// Initialize magnetic buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const magneticButtons = document.querySelectorAll('.magnetic');
  
  magneticButtons.forEach(button => {
    new MagneticButton(button);
  });

  // Initialize clip-path image reveal
  const imageRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1
  });

  // Observe all images for clip-path reveal
  const imagesToReveal = document.querySelectorAll('img');
  imagesToReveal.forEach(img => {
    // Add the image-reveal class to all images
    img.classList.add('image-reveal');
    imageRevealObserver.observe(img);
  });

  // Initialize animated counters in metrics band
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target.querySelector('.metric-number');
        if (counter && !counter.dataset.animated) {
          animateCounter(counter);
        }
      }
    });
  }, {
    threshold: 0.5
  });

  const metricsBand = document.querySelector('.metrics-band');
  if (metricsBand) {
    counterObserver.observe(metricsBand);
  }

  // Initialize pricing toggle functionality
  const toggle = document.getElementById('billing-toggle');
  if (toggle) {
    toggle.addEventListener('change', function() {
      const monthlyPrices = document.querySelectorAll('.monthly-price');
      const yearlyPrices = document.querySelectorAll('.yearly-price');
      
      if (this.checked) {
        // Yearly pricing selected
        monthlyPrices.forEach(el => el.style.display = 'none');
        yearlyPrices.forEach(el => el.style.display = 'inline');
      } else {
        // Monthly pricing selected
        monthlyPrices.forEach(el => el.style.display = 'inline');
        yearlyPrices.forEach(el => el.style.display = 'none');
      }
    });
  }

  // Form submission handling
  const contactForm = document.getElementById('demo-request-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple form validation
      const fullName = document.getElementById('full-name').value;
      const email = document.getElementById('email').value;
      
      if (fullName && email) {
        // Show success message or submit form
        alert('Thank you for your request! Our team will contact you shortly.');
        contactForm.reset();
      }
    });
  }
});

// Counter animation function
function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // ms
  const startTime = performance.now();
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out function
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    const currentValue = Math.floor(easedProgress * target);
    
    if (element.textContent.includes('.')) {
      // Handle decimal numbers
      const decimalValue = (easedProgress * target).toFixed(1);
      element.textContent = decimalValue;
    } else {
      element.textContent = currentValue;
    }
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target;
      element.dataset.animated = 'true';
    }
  }
  
  requestAnimationFrame(updateCounter);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Account for fixed header
        behavior: 'smooth'
      });
    }
  });
});