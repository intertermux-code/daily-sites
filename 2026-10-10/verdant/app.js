// Verdant Skincare - JavaScript

// Parallax effect for hero section
class ParallaxHandler {
  constructor() {
    this.layers = document.querySelectorAll('.parallax-layer');
    this.container = document.querySelector('.parallax-container');
    
    // Check if user prefers reduced motion
    const motionOkay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (motionOkay && this.layers.length > 0) {
      this.init();
    }
  }

  init() {
    window.addEventListener('scroll', () => {
      this.updateParallax();
    });
  }

  updateParallax() {
    const scrollTop = window.pageYOffset;
    
    this.layers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed')) || 0.5;
      const yPos = -(scrollTop * speed);
      
      layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  }
}

// 3D Card Tilt effect
class CardTilt {
  constructor() {
    this.cards = document.querySelectorAll('.product-card');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
      card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
    });
  }

  handleMouseMove(e, card) {
    const cardRect = card.getBoundingClientRect();
    const x = e.clientX - cardRect.left;
    const y = e.clientY - cardRect.top;
    
    const centerX = cardRect.width / 2;
    const centerY = cardRect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * 8; // Max 8 degrees
    const rotateX = ((centerY - y) / centerY) * 8; // Max 8 degrees
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    
    // Add glare effect
    const glare = card.querySelector('.card-glare') || this.createGlare(card);
    glare.style.opacity = '0.5';
    glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.8), transparent 70%)`;
  }

  handleMouseLeave(e, card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    const glare = card.querySelector('.card-glare');
    if (glare) {
      glare.style.opacity = '0';
    }
  }

  createGlare(card) {
    const glare = document.createElement('div');
    glare.className = 'card-glare';
    glare.style.position = 'absolute';
    glare.style.top = '0';
    glare.style.left = '0';
    glare.style.right = '0';
    glare.style.bottom = '0';
    glare.style.borderRadius = 'var(--radius-lg)';
    glare.style.pointerEvents = 'none';
    glare.style.zIndex = '1';
    glare.style.opacity = '0';
    glare.style.transition = 'opacity 0.3s ease';
    
    card.style.position = 'relative';
    card.appendChild(glare);
    
    return glare;
  }
}

// Shopping Cart functionality
class ShoppingCart {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    this.cartCountElement = document.querySelector('.cart-count');
    this.cartDrawer = document.getElementById('cart-drawer');
    this.cartOverlay = document.getElementById('cart-overlay');
    this.cartItemsContainer = document.querySelector('.cart-items');
    this.cartTotalElement = document.querySelector('.cart-total');
    
    this.init();
  }

  init() {
    this.updateCartCount();
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        const productId = productCard.dataset.productId;
        const productName = productCard.querySelector('.product-name').textContent;
        const productPrice = parseFloat(productCard.querySelector('.product-price').textContent.replace('$', ''));
        const productImage = productCard.querySelector('img').src;
        
        this.addToCart({
          id: productId,
          name: productName,
          price: productPrice,
          image: productImage,
          quantity: 1
        });
      });
    });
    
    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', () => {
        this.toggleCart();
      });
    }
    
    // Close cart
    document.querySelector('.close-cart').addEventListener('click', () => {
      this.closeCart();
    });
    
    // Close cart when clicking overlay
    this.cartOverlay.addEventListener('click', () => {
      this.closeCart();
    });
    
    // Update cart UI
    this.renderCart();
  }

  addToCart(item) {
    const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push(item);
    }
    
    this.saveCart();
    this.updateCartCount();
    this.renderCart();
    
    // Show feedback
    this.showAddedToCartFeedback();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartCount();
    this.renderCart();
  }

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
      this.saveCart();
      this.renderCart();
    }
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  updateCartCount() {
    const count = this.cart.reduce((total, item) => total + item.quantity, 0);
    if (this.cartCountElement) {
      this.cartCountElement.textContent = count;
    }
  }

  renderCart() {
    this.cartItemsContainer.innerHTML = '';
    
    if (this.cart.length === 0) {
      this.cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
      this.cartTotalElement.textContent = '$0.00';
      return;
    }
    
    let total = 0;
    
    this.cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      const cartItemElement = document.createElement('div');
      cartItemElement.className = 'cart-item';
      cartItemElement.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image" width="80" height="80">
        <div class="cart-item-details">
          <h3 class="cart-item-name">${item.name}</h3>
          <p class="cart-item-price">$${item.price.toFixed(2)}</p>
          <div class="cart-item-controls">
            <button class="quantity-btn minus" data-id="${item.id}">-</button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
            <button class="quantity-btn plus" data-id="${item.id}">+</button>
            <button class="remove-item" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `;
      
      this.cartItemsContainer.appendChild(cartItemElement);
    });
    
    this.cartTotalElement.textContent = `$${total.toFixed(2)}`;
    
    // Add event listeners to quantity controls
    this.cartItemsContainer.querySelectorAll('.quantity-btn.minus').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = this.cart.find(item => item.id === id);
        this.updateQuantity(id, item.quantity - 1);
      });
    });
    
    this.cartItemsContainer.querySelectorAll('.quantity-btn.plus').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = this.cart.find(item => item.id === id);
        this.updateQuantity(id, item.quantity + 1);
      });
    });
    
    this.cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.currentTarget.dataset.id;
        const quantity = parseInt(e.currentTarget.value);
        this.updateQuantity(id, quantity);
      });
    });
    
    this.cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.removeFromCart(id);
      });
    });
  }

  toggleCart() {
    this.cartDrawer.classList.toggle('open');
    this.cartOverlay.classList.toggle('active');
    
    if (this.cartDrawer.classList.contains('open')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeCart() {
    this.cartDrawer.classList.remove('open');
    this.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  showAddedToCartFeedback() {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.textContent = 'Added to cart!';
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.backgroundColor = '#5b7d5a';
    feedback.style.color = 'white';
    feedback.style.padding = '10px 20px';
    feedback.style.borderRadius = '4px';
    feedback.style.zIndex = '9999';
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(feedback);
    
    // Animate in
    setTimeout(() => {
      feedback.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 300);
    }, 2000);
  }
}

// Routine Builder Quiz
class RoutineQuiz {
  constructor() {
    this.quizForm = document.getElementById('routine-quiz');
    this.quizSteps = document.querySelectorAll('.quiz-step');
    this.stepIndicators = document.querySelectorAll('.step');
    this.progressFill = document.getElementById('progress-fill');
    this.resultsSection = document.getElementById('results-section');
    this.restartButton = document.querySelector('.restart-quiz');
    
    this.currentStep = 1;
    this.totalSteps = this.quizSteps.length;
    
    this.init();
  }

  init() {
    // Next step buttons
    document.querySelectorAll('.next-step').forEach(button => {
      button.addEventListener('click', () => {
        this.nextStep();
      });
    });
    
    // Previous step buttons
    document.querySelectorAll('.prev-step').forEach(button => {
      button.addEventListener('click', () => {
        this.prevStep();
      });
    });
    
    // Form submission
    this.quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculateResults();
    });
    
    // Restart quiz
    if (this.restartButton) {
      this.restartButton.addEventListener('click', () => {
        this.restartQuiz();
      });
    }
    
    this.updateProgress();
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateUI();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateUI();
    }
  }

  validateCurrentStep() {
    const currentStepElement = document.querySelector(`#step-${this.currentStep}`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.validity.valid) {
        isValid = false;
      }
    });
    
    // Special validation for multi-select (at least one checked)
    if (currentStepElement.querySelector('.multi-select')) {
      const checkedOptions = currentStepElement.querySelectorAll('input[type="checkbox"]:checked');
      if (checkedOptions.length === 0) {
        isValid = false;
      }
    }
    
    return isValid;
  }

  updateUI() {
    // Hide all steps
    this.quizSteps.forEach(step => step.classList.remove('active'));
    this.stepIndicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Show current step
    document.querySelector(`#step-${this.currentStep}`).classList.add('active');
    document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');
    
    this.updateProgress();
  }

  updateProgress() {
    const progressPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    this.progressFill.style.width = `${progressPercent}%`;
  }

  calculateResults() {
    // In a real implementation, this would calculate personalized recommendations
    // For now, we'll just show the results section
    this.resultsSection.classList.remove('hidden');
    this.quizForm.parentElement.style.display = 'none';
  }

  restartQuiz() {
    this.currentStep = 1;
    this.quizForm.reset();
    this.resultsSection.classList.add('hidden');
    this.quizForm.parentElement.style.display = 'block';
    this.updateUI();
  }
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ParallaxHandler();
  new CardTilt();
  
  // Initialize shopping cart if cart elements exist
  if (document.querySelector('.cart-icon')) {
    new ShoppingCart();
  }
  
  // Initialize routine quiz if quiz exists
  if (document.getElementById('routine-quiz')) {
    new RoutineQuiz();
  }
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });
  }
});