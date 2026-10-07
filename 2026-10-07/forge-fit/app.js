// FORGE Gym Website JavaScript

// DOM ready function
function domReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

domReady(() => {
  // Initialize all components
  initMobileMenu();
  initScrollProgress();
  initAccordion();
  initScheduleFilter();
  initBmiCalculator();
  initTrialForm();
});

// Mobile Menu Toggle
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!menuToggle || !mobileMenu) return;

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    mobileMenu.classList.toggle('active');
  });
}

// Scroll Progress Bar
function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  function updateProgressBar() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.max(0, Math.min(100, (scrollTop / docHeight) * 100));
    
    const progressFill = progressBar.querySelector('::after') || progressBar;
    progressFill.style.width = `${scrollPercent}%`;
  }

  window.addEventListener('scroll', updateProgressBar, { passive: true });
  updateProgressBar(); // Initial call
}

// Accordion functionality
function initAccordion() {
  const accordions = document.querySelectorAll('.accordion');
  
  accordions.forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    
    if (!header) return;
    
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      const content = accordion.querySelector('.accordion-content');
      
      // Close all other accordions in the same container
      const allAccordions = accordion.parentElement.querySelectorAll('.accordion');
      allAccordions.forEach(acc => {
        if (acc !== accordion) {
          const otherHeader = acc.querySelector('.accordion-header');
          const otherContent = acc.querySelector('.accordion-content');
          
          if (otherHeader && otherContent) {
            otherHeader.setAttribute('aria-expanded', 'false');
            otherContent.classList.remove('expanded');
            otherContent.setAttribute('hidden', '');
          }
        }
      });
      
      // Toggle current accordion
      header.setAttribute('aria-expanded', !isExpanded);
      
      if (isExpanded) {
        content.classList.remove('expanded');
        content.setAttribute('hidden', '');
      } else {
        content.classList.add('expanded');
        content.removeAttribute('hidden');
      }
    });
  });
}

// Schedule Day Filter
function initScheduleFilter() {
  const dayButtons = document.querySelectorAll('.day-btn');
  const scheduleTable = document.querySelector('.schedule-table');
  
  if (!dayButtons.length || !scheduleTable) return;
  
  dayButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      dayButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const selectedDay = button.dataset.day;
      
      // Show/hide table rows based on selected day
      const rows = scheduleTable.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        if (selectedDay === 'all') {
          row.style.display = '';
        } else {
          // Find the cell corresponding to the selected day
          // Monday is index 1, Tuesday is index 2, etc.
          const dayIndexMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 7
          };
          
          const targetIndex = dayIndexMap[selectedDay];
          if (targetIndex !== undefined) {
            const dayCell = row.cells[targetIndex];
            if (dayCell) {
              row.style.display = dayCell.textContent.trim() === 'Closed' ? 'none' : '';
            }
          }
        }
      });
    });
  });
}

// BMI Calculator
function initBmiCalculator() {
  const calculateBtn = document.getElementById('calculate-bmi');
  const weightInput = document.getElementById('weight');
  const heightInput = document.getElementById('height');
  const resultContainer = document.getElementById('result');
  const bmiValueEl = document.getElementById('bmi-value');
  const bmiCategoryEl = document.getElementById('bmi-category');
  
  if (!calculateBtn || !weightInput || !heightInput || !resultContainer || !bmiValueEl || !bmiCategoryEl) return;
  
  calculateBtn.addEventListener('click', () => {
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value);
    
    if (isNaN(weight) || isNaN(height) || height <= 0 || weight <= 0) {
      alert('Please enter valid weight and height values.');
      return;
    }
    
    // Calculate BMI: weight(kg) / height(m)^2
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Determine category
    let category = '';
    if (bmi < 18.5) {
      category = 'UNDERWEIGHT';
    } else if (bmi < 25) {
      category = 'NORMAL WEIGHT';
    } else if (bmi < 30) {
      category = 'OVERWEIGHT';
    } else {
      category = 'OBESITY';
    }
    
    // Display results
    bmiValueEl.textContent = bmi.toFixed(1);
    bmiCategoryEl.textContent = category;
    
    // Add glow effect to the result
    bmiValueEl.classList.add('glow-text');
    bmiCategoryEl.classList.add('glow-text');
    
    resultContainer.classList.add('show');
  });
}

// Trial Form Submission
function initTrialForm() {
  const form = document.getElementById('trial-signup-form');
  
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const dob = document.getElementById('dob').value;
    const interest = document.getElementById('interest').value;
    const comments = document.getElementById('comments').value;
    
    // Basic validation
    if (!firstName || !lastName || !email || !phone || !dob || !interest) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real implementation, you would send this data to a server
    // For now, we'll just show a success message
    alert(`Thank you ${firstName}! Your trial request has been submitted. We'll contact you shortly.`);
    
    // Reset form
    form.reset();
  });
}