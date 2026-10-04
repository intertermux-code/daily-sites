// Parallax Layers for Hero Section
document.addEventListener('DOMContentLoaded', () => {
  const parallaxLayers = document.querySelectorAll('.parallax-layer');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    document.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      parallaxLayers.forEach((layer, index) => {
        const speed = parseFloat(layer.getAttribute('data-speed'));
        const yPos = -(scrolled * speed);
        layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    });
  }

  // Day Filter for Schedule Page
  const dayFilterButtons = document.querySelectorAll('.day-filter-btn');
  const scheduleTable = document.querySelector('.schedule-table tbody');

  if (dayFilterButtons.length > 0 && scheduleTable) {
    dayFilterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        dayFilterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get selected day
        const selectedDay = button.getAttribute('data-day');
        
        // Show/hide rows based on selected day
        const rows = scheduleTable.querySelectorAll('tr');
        rows.forEach(row => {
          if (selectedDay === 'all') {
            row.style.display = '';
          } else {
            // Determine the index of the day column (Monday = 1, Tuesday = 2, etc.)
            const dayIndexMap = {
              'monday': 1,
              'tuesday': 2,
              'wednesday': 3,
              'thursday': 4,
              'friday': 5,
              'saturday': 6,
              'sunday': 7
            };
            
            const dayIndex = dayIndexMap[selectedDay];
            const dayCell = row.cells[dayIndex]; // First cell is time, so days start at index 1
            
            if (dayCell) {
              if (dayCell.textContent.trim().toLowerCase() === 'closed') {
                row.style.display = 'none';
              } else {
                row.style.display = '';
              }
            }
          }
        });
      });
    });
  }

  // BMI Calculator
  const calculateBtn = document.getElementById('calculate-bmi');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const weightInput = document.getElementById('weight');
      const heightInput = document.getElementById('height');
      const resultDiv = document.getElementById('result-bmi');
      const bmiValueSpan = document.getElementById('bmi-value');
      const bmiCategorySpan = document.getElementById('bmi-category');

      const weight = parseFloat(weightInput.value);
      const height = parseFloat(heightInput.value);

      if (isNaN(weight) || isNaN(height) || height <= 0) {
        alert('Please enter valid weight and height values.');
        return;
      }

      // Calculate BMI: weight (kg) / [height (m)]²
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      
      // Determine category
      let category = '';
      if (bmi < 18.5) {
        category = 'Underweight';
      } else if (bmi < 25) {
        category = 'Normal weight';
      } else if (bmi < 30) {
        category = 'Overweight';
      } else {
        category = 'Obese';
      }

      // Display result
      bmiValueSpan.textContent = bmi.toFixed(1);
      bmiCategorySpan.textContent = category;
      resultDiv.style.display = 'block';
    });
  }

  // Trial Signup Form
  const trialForm = document.getElementById('trial-signup-form');
  if (trialForm) {
    trialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form values
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const programInterest = document.getElementById('program-interest').value;
      const availability = document.getElementById('availability').value;
      const goals = document.getElementById('goals').value;
      
      // In a real application, you would send this data to a server
      // For now, just show an alert confirming submission
      alert(`Thank you ${firstName} ${lastName}! Your trial signup request has been submitted. We'll contact you shortly at ${email} to schedule your free session.`);
      
      // Reset form
      trialForm.reset();
    });
  }

  // Spring Accordion for FAQ or other collapsible content
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const accordionItem = header.parentElement;
      const accordionContent = accordionItem.querySelector('.accordion-content');
      const isOpen = accordionItem.classList.contains('open');

      // Close all accordion items
      document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.remove('open');
        const content = item.querySelector('.accordion-content');
        content.style.gridTemplateRows = '0fr';
      });

      // Open clicked item if it wasn't already open
      if (!isOpen) {
        accordionItem.classList.add('open');
        accordionContent.style.gridTemplateRows = '1fr';
      }
    });
  });
});