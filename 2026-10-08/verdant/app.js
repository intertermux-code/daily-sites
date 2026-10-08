// Global variables
let cart = [];
let magneticElements = [];

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', () => {
  // Initialize magnetic buttons
  initMagneticButtons();
  
  // Initialize cart functionality
  initCart();
  
  // Initialize quiz functionality if on routine page
  if (document.querySelector('.quiz-form')) {
    initQuiz();
  }
  
  // Initialize contact form if on contact page
  if (document.querySelector('.contact-form')) {
    initContactForm();
  }
  
  // Initialize accordion functionality if needed
  initAccordion();
});

// Magnetic Button Effect
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.magnetic-btn');
  
  buttons.forEach(button => {
    const magneticArea = button.parentElement;
    
    magneticArea.addEventListener('mousemove', (e) => {
      const rect = magneticArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + 
        Math.pow(e.clientY - centerY, 2)
      );
      
      if (distance < 120) {
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const moveX = Math.cos(angle) * (120 - distance) * 0.1;
        const moveY = Math.sin(angle) * (120 - distance) * 0.1;
        
        button.style.transform = `translate(${moveX}px, ${moveY}px)`;
        if (distance < 30) {
          button.style.transform += ' scale(1.04)';
        } else {
          button.style.transform += ' scale(1)';
        }
      }
    });
    
    magneticArea.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0px, 0px) scale(1)';
    });
  });
}

// Cart Functionality
function initCart() {
  const cartBtn = document.querySelector('.cart-btn');
  const closeCart = document.querySelector('.close-cart');
  const overlay = document.querySelector('.overlay');
  const cartDrawer = document.querySelector('.cart-drawer');
  
  if (!cartBtn || !closeCart || !overlay || !cartDrawer) return;
  
  // Open cart
  cartBtn.addEventListener('click', () => {
    cartDrawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  
  // Close cart
  closeCart.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  // Close cart when clicking on overlay
  overlay.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  // Add to cart buttons
  const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      const productName = btn.dataset.productName;
      const price = parseFloat(btn.dataset.price);
      
      // Check if item is already in cart
      const existingItem = cart.find(item => item.id === productId);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: productId,
          name: productName,
          price: price,
          quantity: 1
        });
      }
      
      updateCartUI();
      showCartNotification(productName);
    });
  });
  
  // Update cart UI
  function updateCartUI() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const totalAmount = document.querySelector('.total-amount');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
      const cartItemElement = document.createElement('div');
      cartItemElement.className = 'cart-item';
      cartItemElement.innerHTML = `
        <img src="https://placehold.co/80x80?text=${item.name.charAt(0)}" alt="${item.name}" width="80" height="80">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-controls">
            <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
            <button class="remove-btn" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Add event listeners to quantity buttons
    document.querySelectorAll('.decrease-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const item = cart.find(item => item.id === id);
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(item => item.id !== id);
        }
        updateCartUI();
      });
    });
    
    document.querySelectorAll('.increase-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const item = cart.find(item => item.id === id);
        item.quantity += 1;
        updateCartUI();
      });
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
      });
    });
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmount.textContent = total.toFixed(2);
  }
  
  // Show cart notification
  function showCartNotification(productName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = `${productName} added to cart!`;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--accent);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 4px;
      z-index: 1000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateY(100px)';
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }
}

// Quiz Functionality
function initQuiz() {
  const quizForm = document.querySelector('.quiz-form');
  const nextBtns = document.querySelectorAll('.next-btn');
  const prevBtns = document.querySelectorAll('.prev-btn');
  const submitBtn = document.querySelector('.submit-btn');
  const restartBtn = document.querySelector('.restart-quiz-btn');
  const quizSteps = document.querySelectorAll('.quiz-step');
  const progressBar = document.querySelector('.progress-fill');
  const currentQuestionEl = document.querySelector('.current-question');
  const totalQuestionsEl = document.querySelector('.total-questions');
  
  let currentStep = 1;
  const totalSteps = quizSteps.length;
  
  // Update progress
  function updateProgress() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${progress}%`;
    currentQuestionEl.textContent = currentStep;
  }
  
  // Show step
  function showStep(stepNumber) {
    quizSteps.forEach((step, index) => {
      if (index + 1 === stepNumber) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
    updateProgress();
  }
  
  // Next button click
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepElement = document.querySelector('.quiz-step.active');
      const currentStepNumber = parseInt(currentStepElement.dataset.step);
      
      // Validate current step
      const inputs = currentStepElement.querySelectorAll('input[required]');
      let isValid = true;
      inputs.forEach(input => {
        if (!input.checked) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        alert('Please select an option before continuing.');
        return;
      }
      
      if (currentStepNumber < totalSteps) {
        currentStep = currentStepNumber + 1;
        showStep(currentStep);
      }
    });
  });
  
  // Previous button click
  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepElement = document.querySelector('.quiz-step.active');
      const currentStepNumber = parseInt(currentStepElement.dataset.step);
      
      if (currentStepNumber > 1) {
        currentStep = currentStepNumber - 1;
        showStep(currentStep);
      }
    });
  });
  
  // Submit quiz
  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get answers
    const concern = document.querySelector('input[name="concern"]:checked').value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const routine = document.querySelector('input[name="routine"]:checked').value;
    
    // Generate recommendations
    generateRecommendations(concern, type, routine);
    
    // Hide form and show results
    quizForm.parentElement.querySelector('.quiz-container').innerHTML = `
      <div class="results-section">
        <h2>Your Personalized Routine</h2>
        <p class="results-intro">Based on your answers, we've crafted a bespoke skincare routine just for you.</p>
        
        <div class="recommended-products">
          <h3>Recommended Products</h3>
          <div class="products-grid card-deck">
            ${generateProductHTML()}
          </div>
        </div>
        
        <div class="routine-summary">
          <h3>Your Daily Routine</h3>
          <ol class="routine-steps">
            ${generateRoutineSteps(concern, type, routine)}
          </ol>
        </div>
        
        <button class="restart-quiz-btn magnetic-btn">Take Quiz Again</button>
      </div>
    `;
    
    // Reinitialize magnetic buttons
    initMagneticButtons();
    
    // Add restart button event listener
    document.querySelector('.restart-quiz-btn').addEventListener('click', () => {
      location.reload();
    });
  });
  
  // Initialize
  updateProgress();
  totalQuestionsEl.textContent = totalSteps;
  
  // Option selection styling
  const options = document.querySelectorAll('.option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options in the same group
      const groupName = option.querySelector('input[type="radio"]').name;
      document.querySelectorAll(`.option input[name="${groupName}"]`).forEach(input => {
        input.closest('.option').classList.remove('selected');
      });
      
      // Add selected class to clicked option
      option.classList.add('selected');
    });
  });
}

// Generate recommendations
function generateRecommendations(concern, type, routine) {
  // This function is called in the submit handler
}

// Generate product HTML
function generateProductHTML() {
  // For simplicity, returning a static example
  // In a real implementation, this would be dynamic based on quiz answers
  return `
    <article class="product-card">
      <img src="https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80" alt="Hydrating Serum" width="300" height="300">
      <div class="product-info">
        <h3>Hydrating Serum</h3>
        <p class="price">$48.00</p>
        <button class="add-to-cart-btn" data-product-id="hydra-serum" data-product-name="Hydrating Serum" data-price="48.00">Add to Cart</button>
      </div>
    </article>
    <article class="product-card">
      <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80" alt="Nourishing Cream" width="300" height="300">
      <div class="product-info">
        <h3>Nourishing Cream</h3>
        <p class="price">$52.00</p>
        <button class="add-to-cart-btn" data-product-id="nourish-cream" data-product-name="Nourishing Cream" data-price="52.00">Add to Cart</button>
      </div>
    </article>
    <article class="product-card">
      <img src="https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80" alt="Gentle Cleanser" width="300" height="300">
      <div class="product-info">
        <h3>Gentle Cleanser</h3>
        <p class="price">$36.00</p>
        <button class="add-to-cart-btn" data-product-id="gentle-cleanse" data-product-name="Gentle Cleanser" data-price="36.00">Add to Cart</button>
      </div>
    </article>
  `;
}

// Generate routine steps
function generateRoutineSteps(concern, type, routine) {
  // This would generate steps based on the user's answers
  // For this example, providing a general routine
  return `
    <li>Cleanse your face with a gentle, pH-balanced cleanser to remove impurities without stripping natural oils.</li>
    <li>Apply a targeted serum that addresses your primary concern - hydration, anti-aging, or texture refinement.</li>
    <li>Lock in moisture with a nourishing cream suited to your skin type to maintain optimal hydration levels.</li>
  `;
}

// Contact Form Functionality
function initContactForm() {
  const contactForm = document.querySelector('.contact-form');
  
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      alert('Please fill in all fields.');
      return;
    }
    
    // In a real implementation, you would send this data to a server
    // For this example, we'll just show a success message
    alert('Thank you for your message! We will get back to you soon.');
    
    // Reset form
    contactForm.reset();
  });
}

// Accordion Functionality
function initAccordion() {
  // This is for future expansion if accordion elements are added
  // Currently implementing the CSS-based accordion structure
  const accordionHeaders = document.querySelectorAll('[data-accordion-header]');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isOpen = content.style.gridTemplateRows && content.style.gridTemplateRows !== '0fr';
      
      // Close all other accordions in the same container
      const accordionGroup = header.closest('[data-accordion-group]') || document;
      accordionGroup.querySelectorAll('[data-accordion-content]').forEach(otherContent => {
        if (otherContent !== content) {
          otherContent.style.gridTemplateRows = '0fr';
          otherContent.previousElementSibling.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle current accordion
      if (isOpen) {
        content.style.gridTemplateRows = '0fr';
        header.setAttribute('aria-expanded', 'false');
      } else {
        content.style.gridTemplateRows = '1fr';
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Card Deck Effect (using scroll to fan out cards)
function initCardDeckEffect() {
  const cardDecks = document.querySelectorAll('.card-deck');
  
  if (cardDecks.length > 0) {
    // Initial setup
    cardDecks.forEach(deck => {
      deck.classList.add('fanned-out'); // Apply fanned out state by default
    });
    
    // On scroll, add/remove fanned-out class to create the fanning effect
    window.addEventListener('scroll', () => {
      cardDecks.forEach(deck => {
        // Check if deck is in viewport
        const rect = deck.getBoundingClientRect();
        const isVisible = (
          rect.top < window.innerHeight &&
          rect.bottom >= 0
        );
        
        if (isVisible) {
          // Add fanned-out class after a slight delay to create the effect
          setTimeout(() => {
            deck.classList.add('fanned-out');
          }, 10);
        } else {
          // Remove fanned-out class when out of view
          deck.classList.remove('fanned-out');
        }
      });
    });
  }
}

// Initialize card deck effect when DOM is loaded
document.addEventListener('DOMContentLoaded', initCardDeckEffect);