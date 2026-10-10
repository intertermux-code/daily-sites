// Intersection Observer for animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      
      // Add stagger effect for child elements
      const children = entry.target.children;
      Array.from(children).forEach((child, index) => {
        setTimeout(() => {
          child.classList.add('in');
        }, index * 80);
      });
    }
  });
}, observerOptions);

// Observe sections that should animate in
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.hero, .stats-section, .partners-section, .mission-section, .programs-section, .volunteer-section, .stories-section, .donate-section, .history-section, .values-section, .team-section');
  sections.forEach(section => {
    observer.observe(section);
    
    // Also observe immediate children for stagger effect
    Array.from(section.children).forEach(child => {
      if (!child.classList.contains('container')) return;
      
      const grandchildren = child.children;
      Array.from(grandchildren).forEach(grandchild => {
        observer.observe(grandchild);
      });
    });
  });

  // Stats counter animation
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statNumbers = entry.target.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'));
          animateCounter(stat, 0, target, 2000);
        });
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    statObserver.observe(statsSection);
  }

  // Donation widget functionality
  if (document.querySelector('.donation-widget')) {
    setupDonationWidget();
  }
});

function animateCounter(element, start, end, duration) {
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Ease-out function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.floor(easeOutQuart * (end - start) + start);
    
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(animation);
    } else {
      element.textContent = end.toLocaleString();
    }
  }

  requestAnimationFrame(animation);
}

function setupDonationWidget() {
  const amountButtons = document.querySelectorAll('.amount-btn');
  const customAmountInput = document.querySelector('.custom-amount');
  const oneTimeBtn = document.querySelector('.one-time-btn');
  const monthlyBtn = document.querySelector('.monthly-btn');
  const donationForm = document.querySelector('.donation-form');
  const thankYouMessage = document.querySelector('.thank-you-message');

  // Amount selection
  amountButtons.forEach(button => {
    button.addEventListener('click', () => {
      amountButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      customAmountInput.value = '';
    });
  });

  // Custom amount input
  customAmountInput.addEventListener('input', () => {
    amountButtons.forEach(btn => btn.classList.remove('active'));
  });

  // Frequency toggle
  oneTimeBtn.addEventListener('click', () => {
    oneTimeBtn.classList.add('active');
    monthlyBtn.classList.remove('active');
  });

  monthlyBtn.addEventListener('click', () => {
    monthlyBtn.classList.add('active');
    oneTimeBtn.classList.remove('active');
  });

  // Form submission
  donationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get selected amount
    let selectedAmount = '';
    const activeAmountBtn = document.querySelector('.amount-btn.active');
    if (activeAmountBtn) {
      selectedAmount = activeAmountBtn.textContent;
    } else if (customAmountInput.value) {
      selectedAmount = `$${customAmountInput.value}`;
    }
    
    // Get frequency
    const isMonthly = monthlyBtn.classList.contains('active');
    const frequency = isMonthly ? 'monthly' : 'one-time';
    
    // Show thank you message
    thankYouMessage.innerHTML = `
      <h2>Thank You for Your Generosity!</h2>
      <p>Your ${frequency} donation of ${selectedAmount} will make a meaningful difference in our community.</p>
      <p>We've sent a confirmation to your email with details about your contribution.</p>
      <button class="btn btn-primary" onclick="location.reload()">Make Another Donation</button>
    `;
    thankYouMessage.classList.add('active');
    
    // Hide form
    donationForm.style.display = 'none';
  });
}