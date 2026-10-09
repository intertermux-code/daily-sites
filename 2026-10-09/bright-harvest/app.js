// Bright Harvest Website JavaScript

// Stat counter animation
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statElement = entry.target;
      const targetValue = parseInt(statElement.getAttribute('data-target'));
      
      // Animate the stat number
      const duration = 2000; // ms
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out function
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const currentValue = Math.floor(easedProgress * targetValue);
        
        statElement.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          statElement.textContent = targetValue.toLocaleString();
        }
      };
      
      requestAnimationFrame(animate);
      
      // Stop observing this element after animation starts
      statObserver.unobserve(statElement);
    }
  });
}, { threshold: 0.5 });

// Observe all stat elements
document.querySelectorAll('.stat-number').forEach(stat => {
  statObserver.observe(stat);
});

// Spring Accordion functionality
document.querySelectorAll('.accordion-button').forEach(button => {
  button.addEventListener('click', () => {
    const accordionItem = button.closest('.accordion-item');
    const content = accordionItem.querySelector('.accordion-content');
    const isOpen = content.classList.contains('expanded');
    
    // Close all accordion items
    document.querySelectorAll('.accordion-content').forEach(item => {
      item.classList.remove('expanded');
    });
    
    // Toggle clicked item if it wasn't already open
    if (!isOpen) {
      content.classList.add('expanded');
    }
  });
});

// 3D Card Tilt effect
document.querySelectorAll('.stat-card, .partner-logo, .card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // Skip animation if user prefers reduced motion
    }
    
    const cardRect = card.getBoundingClientRect();
    const x = e.clientX - cardRect.left;
    const y = e.clientY - cardRect.top;
    
    const centerX = cardRect.width / 2;
    const centerY = cardRect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * 8; // Max 8 degrees
    const rotateX = ((centerY - y) / centerY) * 8; // Max 8 degrees
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  });
});

// Donation form handling
if (document.querySelector('#donation-form')) {
  const donationForm = document.getElementById('donation-form');
  const amountButtons = document.querySelectorAll('.amount-btn');
  const customAmountInput = document.getElementById('custom-amount');
  const frequencyToggle = document.getElementById('frequency-toggle');
  const frequencyLabel = document.getElementById('frequency-label');
  
  // Set default donation amount
  let selectedAmount = 25;
  const selectedFrequency = 'one-time';
  
  // Handle amount selection
  amountButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      amountButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update selected amount
      selectedAmount = parseInt(button.dataset.amount);
      
      // Clear custom amount if a preset is selected
      if (button.id !== 'custom-amount') {
        customAmountInput.value = '';
      }
    });
  });
  
  // Handle custom amount input
  customAmountInput.addEventListener('input', () => {
    // Remove active class from all preset buttons
    amountButtons.forEach(btn => btn.classList.remove('active'));
    
    // Update selected amount if valid
    const customValue = parseInt(customAmountInput.value);
    if (!isNaN(customValue) && customValue > 0) {
      selectedAmount = customValue;
    }
  });
  
  // Handle frequency toggle
  frequencyToggle.addEventListener('change', () => {
    if (frequencyToggle.checked) {
      frequencyLabel.textContent = 'Monthly';
    } else {
      frequencyLabel.textContent = 'One-Time';
    }
  });
  
  // Form submission
  donationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get the actual donation amount (from custom input if filled, otherwise from selected button)
    let actualAmount = selectedAmount;
    if (customAmountInput.value) {
      actualAmount = parseInt(customAmountInput.value);
    }
    
    const frequency = frequencyToggle.checked ? 'monthly' : 'one-time';
    
    // Show thank you message
    const formData = donationForm.innerHTML;
    donationForm.innerHTML = `
      <div class="thank-you-message">
        <h3>Thank You for Your Generous Donation!</h3>
        <p>We appreciate your contribution of $${actualAmount} (${frequency}).</p>
        <p>Your support helps us continue our mission to fight hunger in our community.</p>
        <button type="button" class="btn btn-primary" id="donate-again-btn">Make Another Donation</button>
      </div>
    `;
    
    // Add event listener to the new button
    document.getElementById('donate-again-btn').addEventListener('click', () => {
      window.location.reload();
    });
  });
}

// Volunteer form handling
if (document.querySelector('#volunteer-form')) {
  const volunteerForm = document.getElementById('volunteer-form');
  
  volunteerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show thank you message
    volunteerForm.innerHTML = `
      <div class="thank-you-message">
        <h3>Thank You for Volunteering!</h3>
        <p>We've received your application and will contact you shortly to discuss available opportunities.</p>
        <p>Your support helps us make a difference in our community.</p>
        <button type="button" class="btn btn-primary" id="volunteer-again-btn">Apply Again</button>
      </div>
    `;
    
    // Add event listener to the new button
    document.getElementById('volunteer-again-btn').addEventListener('click', () => {
      window.location.reload();
    });
  });
}