// Check if we're on a page that needs the counter functionality
if (document.querySelector('.stat-number')) {
  // Animated counters
  const animateCounter = (element) => {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 1200; // 1.2 seconds
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out expo function: f(x) = x * x * x * x * x * x * x * x * x * x * x * x * x * x * x * x
      // Actually implementing proper easeOutExpo: f(x) = 1 - pow(2, -10 * x)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(easeProgress * target);

      element.textContent = currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(updateCount);
  };

  // Intersection Observer for counters
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -50px 0px'
  });

  // Observe all stat numbers
  document.querySelectorAll('.stat-number').forEach(stat => {
    counterObserver.observe(stat);
  });
}

// Check if we're on a page that needs the accordion functionality
if (document.querySelector('.faq-question')) {
  // Spring accordion functionality
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const isOpen = question.getAttribute('aria-expanded') === 'true';
      const answer = question.nextElementSibling;
      
      // Close all other accordions
      faqQuestions.forEach(otherQuestion => {
        if (otherQuestion !== question) {
          otherQuestion.setAttribute('aria-expanded', 'false');
          const otherAnswer = otherQuestion.nextElementSibling;
          otherAnswer.classList.remove('expanded');
          otherAnswer.style.gridTemplateRows = '0fr';
        }
      });

      // Toggle current accordion
      question.setAttribute('aria-expanded', !isOpen);
      if (isOpen) {
        answer.classList.remove('expanded');
        answer.style.gridTemplateRows = '0fr';
      } else {
        answer.classList.add('expanded');
        answer.style.gridTemplateRows = '1fr';
      }
    });
  });
}

// Check if we're on the gallery page
if (document.querySelector('.gallery-item')) {
  // Gallery filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      galleryItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox functionality
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.querySelector('.lightbox-img');
  const lightboxCaption = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const galleryImages = document.querySelectorAll('.gallery-item img');

  galleryImages.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src.replace('w=800', 'w=1200'); // Get higher resolution image
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = img.parentElement.querySelector('.gallery-overlay h3').textContent + 
                                   ' - ' + 
                                   img.parentElement.querySelector('.gallery-overlay p').textContent;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    });
  });

  // Close lightbox
  closeBtn.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    }
  });
}

// Form submission handling for contact page
if (document.getElementById('bookingForm')) {
  const form = document.getElementById('bookingForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simple validation
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    if (!fullName || !email || !message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real implementation, you would submit the form to a server here
    alert('Thank you for your inquiry! We will contact you shortly.');
    form.reset();
  });
}

// Initialize FAQ accordions with closed state
document.querySelectorAll('.faq-answer').forEach(answer => {
  answer.style.gridTemplateRows = '0fr';
});