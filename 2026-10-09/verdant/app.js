// Cart functionality
let cart = [];
const cartIcon = document.querySelector('.cart-icon');
const cartDrawer = document.querySelector('.cart-drawer');
const closeCartBtn = document.querySelector('.close-cart');
const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.body.appendChild(overlay);

// Add to cart buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('add-to-cart')) {
    const productId = e.target.dataset.productId;
    const name = e.target.dataset.name;
    const price = parseFloat(e.target.dataset.price);
    
    // Check if item already in cart
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: name,
        price: price,
        quantity: 1
      });
    }
    
    updateCart();
  }
  
  // Handle cart icon click
  if (e.target.closest('.cart-icon')) {
    cartDrawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Close cart
  if (e.target.classList.contains('close-cart') || e.target.closest('.overlay')) {
    cartDrawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Remove item from cart
  if (e.target.classList.contains('remove-item')) {
    const productId = e.target.dataset.productId;
    cart = cart.filter(item => item.id !== productId);
    updateCart();
  }
  
  // Update quantity
  if (e.target.classList.contains('quantity-btn')) {
    const productId = e.target.closest('.cart-item').dataset.productId;
    const action = e.target.textContent;
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      if (action === '+') {
        item.quantity += 1;
      } else if (action === '-' && item.quantity > 1) {
        item.quantity -= 1;
      } else if (action === '-' && item.quantity === 1) {
        cart = cart.filter(i => i.id !== productId);
      }
      
      updateCart();
    }
  }
});

// Update cart UI
function updateCart() {
  // Update cart items in drawer
  const cartItemsContainer = document.querySelector('.cart-items');
  cartItemsContainer.innerHTML = '';
  
  let total = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const cartItemElement = document.createElement('div');
    cartItemElement.classList.add('cart-item');
    cartItemElement.dataset.productId = item.id;
    
    cartItemElement.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="quantity-btn">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn">+</button>
        <button class="remove-item" data-product-id="${item.id}">×</button>
      </div>
    `;
    
    cartItemsContainer.appendChild(cartItemElement);
  });
  
  // Update total
  document.querySelector('.total-amount').textContent = total.toFixed(2);
  
  // Update cart count in header
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('.cart-count').textContent = totalCount;
}

// Quiz functionality
if (document.querySelector('.quiz-container')) {
  const quizSteps = document.querySelectorAll('.quiz-step');
  const nextButtons = document.querySelectorAll('.next-btn');
  const prevButtons = document.querySelectorAll('.prev-btn');
  const submitButton = document.querySelector('.submit-btn');
  const restartButton = document.querySelector('.restart-quiz');
  const resultsSection = document.getElementById('results');
  
  // Option selection
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('option-btn')) {
      const isMultiSelect = e.target.classList.contains('multi-select');
      
      if (isMultiSelect) {
        e.target.classList.toggle('selected');
      } else {
        // Single selection - remove selected class from siblings
        const parent = e.target.parentElement;
        parent.querySelectorAll('.option-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        e.target.classList.add('selected');
      }
    }
  });
  
  // Navigation
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      const currentStep = document.querySelector('.quiz-step.active');
      const nextStep = currentStep.nextElementSibling;
      
      if (nextStep) {
        currentStep.classList.remove('active');
        nextStep.classList.add('active');
      }
    });
  });
  
  prevButtons.forEach(button => {
    button.addEventListener('click', () => {
      const currentStep = document.querySelector('.quiz-step.active');
      const prevStep = currentStep.previousElementSibling;
      
      if (prevStep) {
        currentStep.classList.remove('active');
        prevStep.classList.add('active');
      }
    });
  });
  
  // Submit quiz
  submitButton.addEventListener('click', () => {
    // Get selections
    const skinType = document.querySelector('#step1 .option-btn.selected')?.dataset.value;
    const concerns = Array.from(document.querySelectorAll('#step2 .option-btn.selected')).map(btn => btn.dataset.value);
    const timeCommitment = document.querySelector('#step3 .option-btn.selected')?.dataset.value;
    
    // Show results
    document.querySelector('.quiz-step.active').classList.remove('active');
    resultsSection.classList.remove('hidden');
  });
  
  // Restart quiz
  restartButton.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    document.getElementById('step1').classList.add('active');
    
    // Clear selections
    document.querySelectorAll('.option-btn.selected').forEach(btn => {
      btn.classList.remove('selected');
    });
  });
}

// Intersection Observer for image reveals
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all images that should be revealed
document.addEventListener('DOMContentLoaded', function() {
  const imagesToObserve = document.querySelectorAll('img');
  imagesToObserve.forEach(img => {
    observer.observe(img);
  });
});

// Animated counters
const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const targetValue = parseInt(entry.target.dataset.target);
      animateCounter(entry.target, 0, targetValue, 1200);
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function animateCounter(element, start, end, duration) {
  let startTime = null;

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const easedProgress = easeOutExpo(progress);
    
    const value = Math.floor(start + (end - start) * easedProgress);
    element.textContent = value.toLocaleString();
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      element.textContent = end.toLocaleString();
    }
  }

  requestAnimationFrame(animation);
}

// Close cart when clicking outside on desktop
document.addEventListener('click', function(e) {
  if (
    cartDrawer.classList.contains('open') && 
    !cartDrawer.contains(e.target) && 
    !e.target.closest('.cart-icon')
  ) {
    cartDrawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});