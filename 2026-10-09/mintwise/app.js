// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuToggle && mainNav) {
  mobileMenuToggle.addEventListener('click', () => {
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
    mainNav.classList.toggle('active');
  });
}

// Calculate savings rate for the calculator page
function calculateSavings() {
  if (!document.querySelector('#calculate-btn')) return;

  // Get input values
  const income = parseFloat(document.getElementById('income').value) || 0;
  const housing = parseFloat(document.getElementById('housing').value) || 0;
  const food = parseFloat(document.getElementById('food').value) || 0;
  const transportation = parseFloat(document.getElementById('transportation').value) || 0;
  const utilities = parseFloat(document.getElementById('utilities').value) || 0;
  const entertainment = parseFloat(document.getElementById('entertainment').value) || 0;
  const other = parseFloat(document.getElementById('other').value) || 0;

  // Calculate total expenses and savings
  const totalExpenses = housing + food + transportation + utilities + entertainment + other;
  const monthlySavings = income - totalExpenses;
  const savingsRate = income > 0 ? (monthlySavings / income) * 100 : 0;

  // Update the display
  document.getElementById('total-income').textContent = income.toFixed(2);
  document.getElementById('total-expenses').textContent = totalExpenses.toFixed(2);
  document.getElementById('monthly-savings').textContent = monthlySavings.toFixed(2);
  document.getElementById('savings-rate').textContent = savingsRate.toFixed(1);

  // Update the donut chart
  const savingsPercentage = Math.min(Math.max(savingsRate, 0), 100); // Clamp between 0 and 100
  const circumference = 251.2; // Based on circle radius (40) * 2 * PI
  const offset = circumference - (savingsPercentage / 100) * circumference;

  document.getElementById('savings-arc').style.strokeDasharray = `${(savingsPercentage / 100) * circumference} ${circumference}`;
  document.getElementById('savings-arc').style.strokeDashoffset = 0;
  document.getElementById('spent-arc').style.strokeDashoffset = -offset;

  document.getElementById('chart-savings-rate').textContent = savingsRate.toFixed(1);

  // Update assessment text
  const assessmentText = document.getElementById('assessment-text');
  if (savingsRate >= 20) {
    assessmentText.textContent = "Excellent! You're saving 20% or more of your income. This is considered the gold standard for healthy financial habits.";
  } else if (savingsRate >= 10) {
    assessmentText.textContent = "Good job! You're saving 10-19% of your income. Consider ways to increase your savings rate even further.";
  } else if (savingsRate > 0) {
    assessmentText.textContent = "You're saving something, which is better than nothing. Try to increase your savings rate to at least 10%.";
  } else {
    assessmentText.textContent = "Your expenses exceed your income. Consider reducing expenses or increasing income to achieve a positive savings rate.";
  }
}

// Add event listener to the calculate button
if (document.getElementById('calculate-btn')) {
  document.getElementById('calculate-btn').addEventListener('click', calculateSavings);
  
  // Also calculate when inputs change
  const inputs = document.querySelectorAll('#income, #housing, #food, #transportation, #utilities, #entertainment, #other');
  inputs.forEach(input => {
    input.addEventListener('input', calculateSavings);
  });
}

// FAQ accordion functionality
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't already active
    if (!isActive) {
      faqItem.classList.add('active');
    }
  });
});

// Pricing toggle functionality
const billingToggle = document.getElementById('billing-toggle');
if (billingToggle) {
  billingToggle.addEventListener('click', () => {
    const isAnnual = billingToggle.getAttribute('aria-checked') === 'true';
    billingToggle.setAttribute('aria-checked', !isAnnual);
    
    // Update price displays
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const annualPrices = document.querySelectorAll('.annual-price');
    
    if (isAnnual) {
      // Switch to monthly
      monthlyPrices.forEach(price => price.style.display = 'inline');
      annualPrices.forEach(price => price.style.display = 'none');
    } else {
      // Switch to annual
      monthlyPrices.forEach(price => price.style.display = 'none');
      annualPrices.forEach(price => price.style.display = 'inline');
    }
  });
}

// Form submission handling
const contactForm = document.getElementById('supportForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // In a real application, you would send this data to a server
    // For now, just show an alert
    alert(`Thank you, ${name}! Your message has been sent. We'll respond to ${email} shortly.`);
    
    // Reset form
    contactForm.reset();
  });
}

// Intersection Observer for animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements that should animate in
document.addEventListener('DOMContentLoaded', () => {
  // Find all elements that should be animated
  const animateElements = document.querySelectorAll(
    '.hero-content, .security-item, .feature-card, .feature-section, .spec-card, .pricing-card, .faq-item'
  );
  
  // Add stagger delay to elements
  animateElements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 80}ms`;
    observer.observe(el);
  });
});