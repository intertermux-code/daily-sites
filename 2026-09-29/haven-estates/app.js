// Haven Estates JavaScript functionality

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize components based on page
  initMobileMenu();
  initScrollProgress();
  initAnimations();
  
  // Page-specific functionality
  if (document.querySelector('#search-form')) {
    initSearchForm();
  }
  
  if (document.querySelector('#listings-grid')) {
    initFilters();
  }
  
  if (document.querySelector('.gallery-thumbnails')) {
    initGallery();
  }
  
  if (document.querySelector('#contactForm')) {
    initContactForm();
  }
  
  if (document.querySelector('#homePrice')) {
    initMortgageCalculator();
  }
});

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav ul');
  
  if (!mobileToggle || !nav) return;
  
  mobileToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    const isOpen = nav.classList.contains('active');
    mobileToggle.setAttribute('aria-expanded', isOpen);
  });
}

// Scroll Progress Bar
function initScrollProgress() {
  const progressContainer = document.createElement('div');
  progressContainer.className = 'scroll-progress';
  document.body.appendChild(progressContainer);
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = Math.max(0, Math.min(100, (scrollTop / docHeight) * 100));
    
    progressContainer.style.setProperty('--scroll', `${scrollPercent}%`);
    progressContainer.querySelector(':after').style.width = `${scrollPercent}%`;
  });
}

// Animations with Intersection Observer
function initAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add delay based on index for staggered effect
        setTimeout(() => {
          entry.target.classList.add('in');
        }, index * 80);
      }
    });
  }, observerOptions);
  
  // Observe sections and other elements that should animate
  document.querySelectorAll('section, .feature-card, .property-card, .agent-card, .testimonial-card').forEach((el, index) => {
    observer.observe(el);
  });
}

// Search Form Handler (for homepage)
function initSearchForm() {
  const searchForm = document.getElementById('search-form');
  
  if (!searchForm) return;
  
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const location = document.getElementById('location-search').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    const beds = document.getElementById('beds').value;
    
    // In a real application, this would trigger a search
    // For now, we'll just log the values
    console.log({
      location,
      minPrice,
      maxPrice,
      beds
    });
    
    alert(`Searching for properties...\nLocation: ${location || 'Any'}\nMin Price: ${minPrice || 'None'}\nMax Price: ${maxPrice || 'None'}\nBedrooms: ${beds || 'Any'}`);
  });
}

// Property Filters (for listings page)
function initFilters() {
  const applyBtn = document.getElementById('apply-filters');
  
  if (!applyBtn) return;
  
  applyBtn.addEventListener('click', function() {
    // Get filter values
    const location = document.getElementById('location-filter').value;
    const minPrice = document.getElementById('min-price-filter').value;
    const maxPrice = document.getElementById('max-price-filter').value;
    const beds = document.getElementById('beds-filter').value;
    const baths = document.getElementById('baths-filter').value;
    
    // In a real application, this would filter the listings
    // For now, we'll just log the values
    console.log({
      location,
      minPrice,
      maxPrice,
      beds,
      baths
    });
    
    // Show/hide property cards based on filters
    filterPropertyCards({
      location: location.toLowerCase(),
      minPrice: minPrice ? parseInt(minPrice) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice) : Infinity,
      beds: beds ? parseInt(beds) : 0
    });
  });
}

// Filter property cards based on criteria
function filterPropertyCards(filters) {
  const cards = document.querySelectorAll('.property-card');
  const noResults = document.getElementById('no-results');
  
  let visibleCount = 0;
  
  cards.forEach(card => {
    // Skip featured card on listings page
    if (card.classList.contains('featured')) return;
    
    const priceText = card.querySelector('.price').textContent.replace(/[^0-9]/g, '');
    const price = parseInt(priceText);
    const location = card.querySelector('.location').textContent.toLowerCase();
    const bedText = card.querySelector('.feature:nth-child(1)').textContent;
    const bedCount = parseInt(bedText);
    
    let isVisible = true;
    
    // Apply filters
    if (filters.location && !location.includes(filters.location)) {
      isVisible = false;
    }
    
    if (price < filters.minPrice || price > filters.maxPrice) {
      isVisible = false;
    }
    
    if (filters.beds > 0 && bedCount < filters.beds) {
      isVisible = false;
    }
    
    if (isVisible) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Show/hide no results message
  if (visibleCount === 0) {
    noResults.style.display = 'block';
  } else {
    noResults.style.display = 'none';
  }
}

// Gallery functionality for property detail page
function initGallery() {
  const thumbnails = document.querySelectorAll('.gallery-thumbnails img');
  const mainImage = document.querySelector('.gallery-main img');
  
  if (!thumbnails.length || !mainImage) return;
  
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      // Update main image source
      mainImage.src = thumb.src.replace('w=400', 'w=1200').replace('h=300', 'h=800');
    });
  });
}

// Contact form handler
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const message = document.getElementById('message').value;
    
    // In a real application, this would submit to a server
    // For now, we'll just log the values
    console.log({
      name,
      email,
      phone,
      service,
      message
    });
    
    // Show success message
    alert('Thank you for your message! We will contact you shortly.');
    
    // Reset form
    contactForm.reset();
  });
}

// Mortgage Calculator
function initMortgageCalculator() {
  // Elements
  const homePriceInput = document.getElementById('homePrice');
  const downPaymentInput = document.getElementById('downPayment');
  const loanTermSelect = document.getElementById('loanTerm');
  const interestRateInput = document.getElementById('interestRate');
  
  const loanAmountEl = document.getElementById('loanAmount');
  const monthlyPaymentEl = document.getElementById('monthlyPayment');
  const totalInterestEl = document.getElementById('totalInterest');
  const totalPaymentEl = document.getElementById('totalPayment');
  
  // Calculate initial values
  calculateMortgage();
  
  // Add event listeners
  homePriceInput.addEventListener('input', calculateMortgage);
  downPaymentInput.addEventListener('input', calculateMortgage);
  loanTermSelect.addEventListener('change', calculateMortgage);
  interestRateInput.addEventListener('input', calculateMortgage);
  
  function calculateMortgage() {
    // Get values
    const homePrice = parseFloat(homePriceInput.value) || 0;
    const downPaymentPercent = parseFloat(downPaymentInput.value) || 0;
    const loanTerm = parseInt(loanTermSelect.value);
    const interestRate = parseFloat(interestRateInput.value) || 0;
    
    // Calculate loan amount
    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - downPayment;
    
    // Calculate monthly payment
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Calculate total payment and interest
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;
    
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // Update display
    loanAmountEl.textContent = formatter.format(loanAmount);
    monthlyPaymentEl.textContent = formatter.format(monthlyPayment);
    totalInterestEl.textContent = formatter.format(totalInterest);
    totalPaymentEl.textContent = formatter.format(totalPayment);
  }
}