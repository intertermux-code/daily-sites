// Age gate functionality
const ageGateModal = document.getElementById('age-gate-modal');
const ageConfirmBtn = document.getElementById('age-confirm-btn');
const ageDenyBtn = document.getElementById('age-deny-btn');

// Check if user has already confirmed age
const hasConfirmedAge = localStorage.getItem('hasConfirmedAge');

if (!hasConfirmedAge) {
  // Show age gate modal
  setTimeout(() => {
    ageGateModal.classList.remove('hidden');
  }, 500);
} else {
  // Remove modal from DOM if user already confirmed age
  ageGateModal.style.display = 'none';
}

ageConfirmBtn.addEventListener('click', () => {
  localStorage.setItem('hasConfirmedAge', 'true');
  ageGateModal.classList.add('hidden');
});

ageDenyBtn.addEventListener('click', () => {
  // Redirect to another site or show exit page
  window.location.href = 'https://www.google.com';
});

// Animated counters
const counters = document.querySelectorAll('.stat-number');
const speed = 200; // Lower is faster

const animateCounter = (counter) => {
  const target = +counter.getAttribute('data-target');
  const count = +counter.innerText;
  
  if(count < target) {
    counter.innerText = Math.ceil(count + target/speed);
    setTimeout(() => animateCounter(counter), 20);
  } else {
    counter.innerText = target.toLocaleString();
  }
};

// Intersection Observer for counters
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(counter => {
  counterObserver.observe(counter);
});

// Clip-path image reveal
const images = document.querySelectorAll('.image-container img, .history-image img');

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      entry.target.classList.add('loaded');
      imageObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

images.forEach(image => {
  // Set initial clip-path
  image.style.clipPath = 'inset(12% 8% round 12px)';
  image.classList.remove('loaded');
  imageObserver.observe(image);
});

// Beer detail modals
const beerCards = document.querySelectorAll('.beer-card');
const beerDetailModal = document.getElementById('beer-detail-modal');
const closeBeerModal = document.querySelector('.close-beer-modal');
const beerDetailContent = document.querySelector('.beer-detail-content');

if (beerCards.length > 0) {
  beerCards.forEach(card => {
    card.addEventListener('click', () => {
      // In a real implementation, we would populate the modal with specific beer data
      // For now, just show the modal
      beerDetailModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
  });
}

if (closeBeerModal) {
  closeBeerModal.addEventListener('click', () => {
    beerDetailModal.classList.add('hidden');
    document.body.style.overflow = ''; // Re-enable scrolling
  });
}

// Close modal when clicking outside content
if (beerDetailModal) {
  beerDetailModal.addEventListener('click', (e) => {
    if (e.target === beerDetailModal) {
      beerDetailModal.classList.add('hidden');
      document.body.style.overflow = ''; // Re-enable scrolling
    }
  });
}