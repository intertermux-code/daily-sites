// Scroll Progress Bar
function initScrollProgressBar() {
  const progressBar = document.createElement('div');
  progressBar.classList.add('scroll-progress-bar');
  document.body.appendChild(progressBar);

  function updateProgressBar() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min(scrollTop / docHeight, 1);
    
    // Update the progress bar's scale
    progressBar.style.transform = `scaleX(${scrollPercent})`;
  }

  // Update on scroll
  window.addEventListener('scroll', updateProgressBar);
  
  // Initial update
  updateProgressBar();
}

// Animated Counters
function initAnimatedCounters() {
  const counters = document.querySelectorAll('.counter');
  
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -50px 0px'
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        animateValue(entry.target, 0, target, 2000);
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });

  function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = end.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  }
}

// Donation Widget Functionality
function initDonationWidget() {
  if (!document.getElementById('donation-form')) return;

  const amountButtons = document.querySelectorAll('.amount-btn');
  const customAmountInput = document.getElementById('custom-amount');
  const frequencyButtons = document.querySelectorAll('.frequency-btn');
  const donationForm = document.getElementById('donation-form');
  const thankYouMessage = document.querySelector('.thank-you-message');
  const newDonationButton = document.getElementById('new-donation');

  // Set up amount selection
  amountButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      amountButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      
      // Clear custom amount when selecting preset amount
      customAmountInput.value = '';
    });
  });

  // Handle custom amount input
  customAmountInput.addEventListener('input', () => {
    // Remove active class from all preset buttons
    amountButtons.forEach(btn => btn.classList.remove('active'));
  });

  // Set up frequency selection
  frequencyButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      frequencyButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
    });
  });

  // Handle form submission
  donationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get selected amount
    let selectedAmount = null;
    const activeAmountBtn = document.querySelector('.amount-btn.active');
    if (activeAmountBtn) {
      selectedAmount = activeAmountBtn.getAttribute('data-amount');
    } else if (customAmountInput.value) {
      selectedAmount = customAmountInput.value;
    }
    
    // Get selected frequency
    const activeFreqBtn = document.querySelector('.frequency-btn.active');
    const frequency = activeFreqBtn ? activeFreqBtn.getAttribute('data-frequency') : 'one-time';
    
    // Show thank you message
    donationForm.classList.add('hidden');
    thankYouMessage.classList.remove('hidden');
    
    // Log donation details to console (simulating submission)
    console.log(`Donation submitted: $${selectedAmount} (${frequency})`);
  });

  // Handle "New Donation" button
  newDonationButton.addEventListener('click', () => {
    thankYouMessage.classList.add('hidden');
    donationForm.classList.remove('hidden');
    
    // Reset form
    donationForm.reset();
    amountButtons.forEach(btn => btn.classList.remove('active'));
    frequencyButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.frequency-btn[data-frequency="one-time"]').classList.add('active');
  });
}

// Volunteer Form Functionality
function initVolunteerForm() {
  if (!document.getElementById('volunteer-form')) return;

  const volunteerForm = document.getElementById('volunteer-form');
  const confirmationMessage = document.querySelector('.confirmation-message');
  const newVolunteerButton = document.getElementById('new-volunteer');

  // Handle form submission
  volunteerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show confirmation message
    volunteerForm.classList.add('hidden');
    confirmationMessage.classList.remove('hidden');
    
    // Get form values (simulating submission)
    const formData = new FormData(volunteerForm);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    console.log(`Volunteer application submitted: ${firstName} ${lastName}, ${email}`);
  });

  // Handle "Apply Again" button
  newVolunteerButton.addEventListener('click', () => {
    confirmationMessage.classList.add('hidden');
    volunteerForm.classList.remove('hidden');
    
    // Reset form
    volunteerForm.reset();
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (!mobileMenuToggle || !mainNav) return;

  mobileMenuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    
    // Update aria-expanded attribute
    const isExpanded = mainNav.classList.contains('active');
    mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
  });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgressBar();
  initAnimatedCounters();
  initDonationWidget();
  initVolunteerForm();
  initMobileMenu();
});