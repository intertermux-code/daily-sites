// Verdant Skincare - Main JavaScript File

// Cart functionality
let cart = [];

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', () => {
  // Initialize cart functionality
  initCart();
  
  // Initialize animations
  initAnimations();
  
  // Initialize magnetic buttons
  initMagneticButtons();
  
  // Initialize quiz if on routine page
  if (document.getElementById('routine-quiz')) {
    initQuiz();
  }
  
  // Initialize contact form if on contact page
  if (document.getElementById('contactForm')) {
    initContactForm();
  }
});

// Initialize cart functionality
function initCart() {
  const cartBtn = document.querySelector('.cart-btn');
  const closeCart = document.querySelector('.close-cart');
  const overlay = document.querySelector('.overlay');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const checkoutBtn = document.querySelector('.checkout-btn');

  // Open cart
  cartBtn?.addEventListener('click', () => {
    document.querySelector('.cart-drawer').classList.add('open');
    overlay.classList.add('active');
    updateCartUI();
  });

  // Close cart
  closeCart?.addEventListener('click', () => {
    document.querySelector('.cart-drawer').classList.remove('open');
    overlay.classList.remove('active');
  });

  // Close cart when clicking overlay
  overlay?.addEventListener('click', () => {
    document.querySelector('.cart-drawer').classList.remove('open');
    overlay.classList.remove('active');
  });

  // Add to cart event listeners
  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = e.target.dataset.productId;
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price);
      
      addToCart(productId, name, price);
      showAddedToCartNotification(name);
    });
  });

  // Checkout button
  checkoutBtn?.addEventListener('click', () => {
    alert('Proceeding to checkout...');
    // In a real implementation, this would redirect to checkout page
  });
}

// Add item to cart
function addToCart(id, name, price) {
  const existingItem = cart.find(item => item.id === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      quantity: 1
    });
  }
  
  updateCartUI();
}

// Remove item from cart
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
}

// Update item quantity
function updateQuantity(id, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(id);
    return;
  }
  
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity = newQuantity;
    updateCartUI();
  }
}

// Update cart UI
function updateCartUI() {
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartCount = document.querySelector('.cart-count');
  const totalAmount = document.querySelector('.total-amount');
  
  if (!cartItemsContainer || !cartCount || !totalAmount) return;
  
  // Update cart count
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalCount;
  
  // Update cart items
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    totalAmount.textContent = '0.00';
    return;
  }
  
  let total = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const cartItemElement = document.createElement('div');
    cartItemElement.className = 'cart-item';
    cartItemElement.innerHTML = `
      <img src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=100&q=80" alt="${item.name}" width="80" height="80">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.name}</h4>
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
        <div class="cart-item-actions">
          <button class="quantity-btn decrease-qty" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn increase-qty" data-id="${item.id}">+</button>
          <button class="remove-item" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `;
    
    cartItemsContainer.appendChild(cartItemElement);
  });
  
  // Add event listeners to quantity buttons
  document.querySelectorAll('.increase-qty').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        updateQuantity(id, item.quantity + 1);
      }
    });
  });
  
  document.querySelectorAll('.decrease-qty').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        updateQuantity(id, item.quantity - 1);
      }
    });
  });
  
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      removeFromCart(id);
    });
  });
  
  // Update total
  totalAmount.textContent = total.toFixed(2);
}

// Show added to cart notification
function showAddedToCartNotification(productName) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'added-to-cart-notification';
  notification.textContent = `${productName} added to cart`;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: var(--sage-500);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1001;
    animation: slideInUp 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
  `;
  
  // Add animation styles if not present
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove notification after animation
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize animations
function initAnimations() {
  // Check if we should respect reduced motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (mediaQuery.matches) {
    // Skip animations if reduced motion is preferred
    return;
  }
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        
        // Stagger child elements if needed
        const children = entry.target.querySelectorAll('.timeline-entry, .product-card, .ingredient-card');
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('in');
          }, index * 80); // Stagger by 80ms
        });
      }
    });
  }, observerOptions);
  
  // Observe elements that should animate
  document.querySelectorAll('.timeline-section, .bestsellers, .ingredients-showcase, .quiz-section, .contact-section').forEach(el => {
    el.classList.add('blur-fade-enter');
    observer.observe(el);
  });
}

// Initialize magnetic buttons
function initMagneticButtons() {
  // Check if we should respect reduced motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (mediaQuery.matches) {
    // Skip magnetic effect if reduced motion is preferred
    return;
  }
  
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
  
  buttons.forEach(button => {
    let xTo = 0;
    let yTo = 0;
    let xFrom = 0;
    let yFrom = 0;
    let requestAnimationFrameId = null;
    
    const updatePosition = () => {
      const xDist = xTo - xFrom;
      const yDist = yTo - yFrom;
      
      if (Math.abs(xDist) < 0.1 && Math.abs(yDist) < 0.1) {
        xFrom = xTo;
        yFrom = yTo;
      } else {
        xFrom += xDist / 8;
        yFrom += yDist / 8;
      }
      
      button.style.transform = `translate(${xFrom}px, ${yFrom}px)`;
      
      if (xDist > 0.1 || yDist > 0.1) {
        requestAnimationFrameId = requestAnimationFrame(updatePosition);
      }
    };
    
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      
      // Only move if cursor is within 120px radius
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 120) {
        // Normalize and scale the movement
        const maxMove = 8; // Maximum movement in pixels
        xTo = Math.max(Math.min(dx * 0.05, maxMove), -maxMove);
        yTo = Math.max(Math.min(dy * 0.05, maxMove), -maxMove);
        
        if (!requestAnimationFrameId) {
          requestAnimationFrameId = requestAnimationFrame(updatePosition);
        }
      }
    });
    
    button.addEventListener('mouseleave', () => {
      xTo = 0;
      yTo = 0;
      
      if (requestAnimationFrameId) {
        cancelAnimationFrame(requestAnimationFrameId);
        requestAnimationFrameId = null;
      }
      
      // Animate back to original position
      button.style.transition = 'transform 0.3s ease';
      button.style.transform = 'translate(0, 0)';
      
      // Reset transition after animation completes
      setTimeout(() => {
        button.style.transition = '';
      }, 300);
    });
  });
}

// Initialize quiz functionality
function initQuiz() {
  const quizForm = document.getElementById('routine-quiz');
  const questions = document.querySelectorAll('.question');
  const nextButtons = document.querySelectorAll('.next-btn');
  const prevButtons = document.querySelectorAll('.prev-btn');
  const progressBar = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  const resultsSection = document.querySelector('.results-section');
  const restartButton = document.querySelector('.restart-quiz');
  
  let currentQuestion = 0;
  
  // Update progress
  function updateProgress() {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  }
  
  // Show current question
  function showCurrentQuestion() {
    questions.forEach((q, index) => {
      q.classList.toggle('active', index === currentQuestion);
    });
    updateProgress();
  }
  
  // Next button click
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Validate current question
      const currentQ = questions[currentQuestion];
      const requiredField = currentQ.querySelector('input[required]');
      
      if (requiredField && !requiredField.checked) {
        alert('Please select an option before continuing.');
        return;
      }
      
      if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showCurrentQuestion();
      }
    });
  });
  
  // Previous button click
  prevButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (currentQuestion > 0) {
        currentQuestion--;
        showCurrentQuestion();
      }
    });
  });
  
  // Form submission
  quizForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect answers
    const concern = document.querySelector('input[name="concern"]:checked')?.value;
    const time = document.querySelector('input[name="time"]:checked')?.value;
    const ingredients = document.querySelector('input[name="ingredients"]:checked')?.value;
    
    // Show results
    document.querySelector('.quiz-container').style.display = 'none';
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  });
  
  // Restart quiz
  restartButton?.addEventListener('click', () => {
    // Reset form
    quizForm.reset();
    currentQuestion = 0;
    showCurrentQuestion();
    resultsSection.classList.add('hidden');
    document.querySelector('.quiz-container').style.display = 'block';
    
    // Scroll to top
    quizForm.scrollIntoView({ behavior: 'smooth' });
  });
  
  // Initialize
  updateProgress();
}

// Initialize contact form
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Simulate form submission
    alert(`Thank you for your message, ${name}! We'll get back to you soon.`);
    
    // Reset form
    contactForm.reset();
  });
}

// Utility function to debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}