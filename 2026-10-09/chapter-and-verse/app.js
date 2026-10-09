// Magnetic Buttons Implementation
class MagneticButton {
  constructor(button) {
    this.button = button;
    this.originalX = 0;
    this.originalY = 0;
    
    // Store original transform to combine with magnetic effect
    this.originalTransform = this.button.style.transform || '';
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    
    this.button.addEventListener('mousemove', this.handleMouseMove);
    this.button.addEventListener('mouseleave', this.handleMouseLeave);
  }
  
  handleMouseMove(e) {
    const rect = this.button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) + 
      Math.pow(e.clientY - centerY, 2)
    );
    
    if (distance < 120) {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const moveDistance = Math.min(10, (120 - distance) / 10);
      
      const moveX = Math.cos(angle) * moveDistance;
      const moveY = Math.sin(angle) * moveDistance;
      
      this.button.style.transform = `${this.originalTransform} translate(${moveX}px, ${moveY}px) scale(1.04)`;
    }
  }
  
  handleMouseLeave() {
    this.button.style.transform = this.originalTransform;
  }
}

// Initialize magnetic buttons
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.btn-primary');
  buttons.forEach(button => new MagneticButton(button));
});

// 3D Card Tilt Implementation
class TiltCard {
  constructor(card) {
    this.card = card;
    this.originalX = 0;
    this.originalY = 0;
    this.currentX = 0;
    this.currentY = 0;
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.animate = this.animate.bind(this);
    
    this.card.addEventListener('mousemove', this.handleMouseMove);
    this.card.addEventListener('mouseleave', this.handleMouseLeave);
    
    this.rafId = requestAnimationFrame(this.animate);
  }
  
  handleMouseMove(e) {
    const rect = this.card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    this.targetX = x * 8; // Max 8 degrees
    this.targetY = -y * 8; // Invert Y for natural feel
  }
  
  handleMouseLeave() {
    this.targetX = 0;
    this.targetY = 0;
  }
  
  animate() {
    this.currentX += (this.targetX - this.currentX) * 0.1;
    this.currentY += (this.targetY - this.currentY) * 0.1;
    
    this.card.style.transform = `perspective(1000px) rotateX(${this.currentY}deg) rotateY(${this.currentX}deg)`;
    
    this.rafId = requestAnimationFrame(this.animate);
  }
  
  destroy() {
    cancelAnimationFrame(this.rafId);
  }
}

// Initialize tilt cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => new TiltCard(card));
});

// Book filtering functionality
if (document.querySelector('.genre-filter')) {
  const filterButtons = document.querySelectorAll('.genre-btn');
  const books = document.querySelectorAll('.book');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      
      const selectedGenre = button.getAttribute('data-genre');
      
      books.forEach(book => {
        if (selectedGenre === 'all' || book.classList.contains(selectedGenre)) {
          book.style.display = 'block';
        } else {
          book.style.display = 'none';
        }
      });
    });
  });
}

// Form submission handling
if (document.getElementById('bookClubForm')) {
  const form = document.getElementById('bookClubForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Show success message
    alert(`Thank you, ${data.fullName}! Your application to join the book club has been received. We'll contact you shortly.`);
    
    // Reset form
    form.reset();
  });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});