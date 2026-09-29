// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuToggle && mainNav) {
  mobileMenuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
  });
}

// Modal functionality for journey details
const journeyCards = document.querySelectorAll('[data-modal-target]');
const modals = document.querySelectorAll('.modal-overlay');
const closeModalButtons = document.querySelectorAll('.close-modal');

journeyCards.forEach(card => {
  card.addEventListener('click', () => {
    const targetModalId = card.getAttribute('data-modal-target');
    const targetModal = document.getElementById(targetModalId);
    
    if (targetModal) {
      targetModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Focus the close button for accessibility
      const closeButton = targetModal.querySelector('.close-modal');
      if (closeButton) {
        closeButton.focus();
      }
    }
  });
});

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal-overlay');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    }
  });
});

// Close modal when clicking on overlay
modals.forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modals.forEach(modal => {
      if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
});

// Month picker functionality for destination guide
const monthButtons = document.querySelectorAll('.month-btn');
const monthInfo = document.getElementById('month-info');

if (monthButtons.length > 0 && monthInfo) {
  const monthDescriptions = {
    jan: "January in Kyoto brings crisp winter air and fewer crowds. Perfect for visiting temples without the usual bustle.",
    feb: "February marks the beginning of spring with early blossoms. Plum festivals begin around this time.",
    mar: "March offers pleasant weather and early spring blooms. Great for temple visits and garden walks.",
    apr: "April is cherry blossom season - the most popular time to visit Kyoto. Expect crowds but unforgettable beauty.",
    may: "May brings comfortable temperatures and lush greenery. Ideal for hiking trails and outdoor activities.",
    jun: "June is the rainy season with frequent showers but also the emergence of beautiful hydrangeas.",
    jul: "July is hot and humid with summer festivals. The Gion Matsuri festival occurs during this month.",
    aug: "August continues the hot summer weather. Many locals escape to cooler mountain areas.",
    sep: "September brings relief from heat and the beginning of autumn colors. Comfortable for sightseeing.",
    oct: "October offers cool temperatures and beautiful autumn foliage. Popular season for leaf peeping.",
    nov: "November is prime autumn season with spectacular fall colors throughout the city.",
    dec: "December is cool but pleasant with winter illuminations at temples and shrines."
  };

  monthButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      monthButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update info text
      const monthKey = button.getAttribute('data-month');
      monthInfo.innerHTML = `<p>${monthDescriptions[monthKey]}</p>`;
    });
  });
}

// Stories slider functionality
const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.slider-nav.prev');
const nextBtn = document.querySelector('.slider-nav.next');
const indicators = document.querySelectorAll('.indicator');

let currentSlide = 0;

function showSlide(index) {
  // Hide all slides
  slides.forEach(slide => slide.classList.remove('active'));
  
  // Remove active class from all indicators
  indicators.forEach(indicator => indicator.classList.remove('active'));
  
  // Show current slide
  if (slides[index]) {
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
  } else {
    // If index is out of bounds, go to first slide
    slides[0].classList.add('active');
    indicators[0].classList.add('active');
    currentSlide = 0;
  }
}

// Next button click
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  });
}

// Previous button click
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  });
}

// Indicator click
indicators.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    currentSlide = index;
    showSlide(currentSlide);
  });
});

// Auto-advance slides every 8 seconds
setInterval(() => {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}, 8000);

// Form submission handling
const enquiryForm = document.getElementById('trip-enquiry-form');

if (enquiryForm) {
  enquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(enquiryForm);
    
    // Simple validation - check required fields
    const requiredFields = ['destination', 'travel-dates', 'duration', 'group-size', 'full-name', 'email'];
    let isValid = true;
    
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        isValid = false;
        break;
      }
    }
    
    if (isValid) {
      // Show success message
      alert('Thank you for your enquiry! Our team will contact you shortly to discuss your journey.');
      enquiryForm.reset();
    } else {
      alert('Please fill in all required fields.');
    }
  });
}
