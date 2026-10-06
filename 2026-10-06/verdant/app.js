// Cart functionality
let cart = [];
const cartDrawer = document.getElementById('cartDrawer');
const closeCart = document.querySelector('.close-cart');
const cartItemsContainer = document.querySelector('.cart-items');
const cartTotalElement = document.querySelector('.total-price');
const cartCountElement = document.querySelector('.cart-count');
const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.body.appendChild(overlay);

// Product data
const products = {
  'cleansing-oil': {
    id: 'cleansing-oil',
    name: 'Gentle Cleansing Oil',
    price: 42.00,
    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80'
  },
  'hydrating-serum': {
    id: 'hydrating-serum',
    name: 'Hydrating Serum',
    price: 58.00,
    image: 'https://images.unsplash.com/photo-1591862713051-5e0d9dec0e6b?auto=format&fit=crop&w=600&q=80'
  },
  'moisturizer': {
    id: 'moisturizer',
    name: 'Nourishing Moisturizer',
    price: 48.00,
    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80'
  },
  'eye-cream': {
    id: 'eye-cream',
    name: 'Brightening Eye Cream',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80'
  },
  'toner': {
    id: 'toner',
    name: 'Exfoliating Toner',
    price: 38.00,
    image: 'https://images.unsplash.com/photo-1591862713051-5e0d9dec0e6b?auto=format&fit=crop&w=600&q=80'
  },
  'night-oil': {
    id: 'night-oil',
    name: 'Restorative Night Oil',
    price: 62.00,
    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80'
  }
};

// Add to cart functionality
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
  button.addEventListener('click', () => {
    const productId = button.dataset.productId;
    addToCart(productId);
    updateCartUI();
    openCart();
  });
});

function addToCart(productId) {
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: products[productId].name,
      price: products[productId].price,
      image: products[productId].image,
      quantity: 1
    });
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = newQuantity;
    updateCartUI();
  }
}

function updateCartUI() {
  // Update cart items
  cartItemsContainer.innerHTML = '';
  
  cart.forEach(item => {
    const cartItemElement = document.createElement('div');
    cartItemElement.classList.add('cart-item');
    cartItemElement.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}" width="80" height="80">
      </div>
      <div class="cart-item-details">
        <h3 class="cart-item-name">${item.name}</h3>
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
        <div class="cart-item-controls">
          <button class="quantity-btn minus" data-product-id="${item.id}">-</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn plus" data-product-id="${item.id}">+</button>
          <button class="remove-item" data-product-id="${item.id}">Remove</button>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(cartItemElement);
  });
  
  // Add event listeners to quantity buttons
  document.querySelectorAll('.quantity-btn.minus').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      updateQuantity(productId, cart.find(item => item.id === productId).quantity - 1);
    });
  });
  
  document.querySelectorAll('.quantity-btn.plus').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      updateQuantity(productId, cart.find(item => item.id === productId).quantity + 1);
    });
  });
  
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      removeFromCart(productId);
    });
  });
  
  // Update total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotalElement.textContent = `$${total.toFixed(2)}`;
  
  // Update cart count
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountElement.textContent = totalCount;
}

// Cart drawer functionality
document.querySelector('.cart-btn').addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartDrawer);
overlay.addEventListener('click', closeCartDrawer);

function openCart() {
  cartDrawer.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Quiz functionality
if (document.getElementById('routineQuiz')) {
  const quizForm = document.getElementById('routineQuiz');
  const questions = document.querySelectorAll('.question');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const showResultsBtn = document.getElementById('showResults');
  const progressFill = document.getElementById('progressFill');
  const currentQuestionEl = document.getElementById('currentQuestion');
  const totalQuestionsEl = document.getElementById('totalQuestions');
  const resultsSection = document.getElementById('resultsSection');
  const recommendedProductsEl = document.getElementById('recommendedProducts');
  const routineSummaryEl = document.getElementById('routineSummary');
  const addToCartAllBtn = document.getElementById('addToCartAll');

  let currentQuestionIndex = 0;
  const totalQuestions = questions.length;

  totalQuestionsEl.textContent = totalQuestions;

  function showQuestion(index) {
    questions.forEach((question, i) => {
      if (i === index) {
        question.classList.add('active');
      } else {
        question.classList.remove('active');
      }
    });

    currentQuestionEl.textContent = index + 1;
    
    // Update progress
    const progress = ((index + 1) / totalQuestions) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Show/hide buttons based on current question
    prevBtn.style.display = index === 0 ? 'none' : 'block';
    nextBtn.style.display = index === totalQuestions - 1 ? 'none' : 'block';
    showResultsBtn.style.display = index === totalQuestions - 1 ? 'block' : 'none';
  }

  function navigateToQuestion(direction) {
    const currentInputs = questions[currentQuestionIndex].querySelectorAll('input[type="radio"]');
    let isValid = true;
    
    // Check if all inputs in current question are filled
    currentInputs.forEach(input => {
      if (!input.checked) {
        isValid = false;
      }
    });
    
    if (!isValid && direction === 1) {
      alert('Please select an option before continuing.');
      return;
    }
    
    currentQuestionIndex += direction;
    
    if (currentQuestionIndex < 0) currentQuestionIndex = 0;
    if (currentQuestionIndex >= totalQuestions) currentQuestionIndex = totalQuestions - 1;
    
    showQuestion(currentQuestionIndex);
  }

  prevBtn.addEventListener('click', () => navigateToQuestion(-1));
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToQuestion(1);
  });
  
  showResultsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showResults();
  });

  function showResults() {
    // Get answers
    const skinType = document.querySelector('input[name="skin-type"]:checked')?.value || '';
    const concern = document.querySelector('input[name="concern"]:checked')?.value || '';
    const time = document.querySelector('input[name="time"]:checked')?.value || '';

    // Generate recommendations based on answers
    const recommendations = generateRecommendations(skinType, concern, time);
    
    // Display recommended products
    recommendedProductsEl.innerHTML = '';
    recommendations.products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.classList.add('product-card');
      productCard.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" width="280" height="280">
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="price">$${product.price.toFixed(2)}</p>
          <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
        </div>
      `;
      recommendedProductsEl.appendChild(productCard);
    });
    
    // Add event listeners to new "Add to Cart" buttons
    recommendedProductsEl.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', () => {
        const productId = button.dataset.productId;
        addToCart(productId);
        updateCartUI();
        openCart();
      });
    });
    
    // Display routine summary
    routineSummaryEl.innerHTML = '';
    recommendations.routine.forEach(step => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${step.title}:</strong> ${step.description}`;
      routineSummaryEl.appendChild(li);
    });
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  function generateRecommendations(skinType, concern, time) {
    // Define recommendations based on answers
    let productRecs = [];
    let routine = [];

    // Skin type determines base products
    if (skinType === 'oily') {
      productRecs.push(products['cleansing-oil'], products['toner']);
    } else if (skinType === 'dry') {
      productRecs.push(products['moisturizer'], products['night-oil']);
    } else if (skinType === 'combination') {
      productRecs.push(products['cleansing-oil'], products['moisturizer']);
    } else if (skinType === 'sensitive') {
      productRecs.push(products['cleansing-oil'], products['moisturizer']);
    }

    // Concern determines additional products
    if (concern === 'aging') {
      productRecs.push(products['hydrating-serum'], products['night-oil']);
      routine = [
        { title: "Morning", description: "Cleanse, apply serum, moisturize with SPF" },
        { title: "Evening", description: "Double cleanse, apply serum, nourish with night oil" }
      ];
    } else if (concern === 'hydration') {
      productRecs.push(products['hydrating-serum'], products['moisturizer']);
      routine = [
        { title: "Morning", description: "Cleanse, apply hydrating serum, moisturize" },
        { title: "Evening", description: "Cleanse, apply serum, moisturize deeply" }
      ];
    } else if (concern === 'texture') {
      productRecs.push(products['toner'], products['hydrating-serum']);
      routine = [
        { title: "Morning", description: "Cleanse, tone, apply serum, moisturize" },
        { title: "Evening", description: "Double cleanse, tone, apply serum, moisturize" }
      ];
    } else if (concern === 'blemishes') {
      productRecs.push(products['cleansing-oil'], products['toner']);
      routine = [
        { title: "Morning", description: "Gentle cleanse, tone, moisturize with SPF" },
        { title: "Evening", description: "Double cleanse, tone, treat with targeted products, moisturize" }
      ];
    }

    // Time affects complexity of routine
    if (time === 'quick') {
      routine = [
        { title: "Daily", description: "Cleanser, moisturizer, sunscreen (AM)" }
      ];
    } else if (time === 'thorough') {
      routine = [
        { title: "Morning", description: "Double cleanse, tone, serum, eye cream, moisturizer, SPF" },
        { title: "Evening", description: "Double cleanse, exfoliate 2x/week, serum, eye cream, moisturizer, facial oil" }
      ];
    }

    // Ensure we have at least 2 products
    if (productRecs.length < 2) {
      productRecs = [products['cleansing-oil'], products['moisturizer']];
    }

    // Remove duplicates
    const seen = new Set();
    productRecs = productRecs.filter(item => {
      if (item && seen.has(item.id)) {
        return false;
      }
      if (item) seen.add(item.id);
      return !!item;
    });

    return { products: productRecs, routine };
  }

  // Initialize quiz
  showQuestion(currentQuestionIndex);

  // Add to cart all functionality
  addToCartAllBtn?.addEventListener('click', () => {
    recommendedProductsEl.querySelectorAll('.add-to-cart-btn').forEach(button => {
      const productId = button.dataset.productId;
      addToCart(productId);
    });
    updateCartUI();
    openCart();
  });
}

// Accordion functionality for FAQ section
if (document.querySelector('.accordion')) {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      
      // Close all accordions
      accordionHeaders.forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        const content = h.nextElementSibling;
        content.classList.remove('expanded');
        content.style.gridTemplateRows = '0fr';
      });
      
      // Open clicked accordion if it wasn't already open
      if (!expanded) {
        header.setAttribute('aria-expanded', 'true');
        const content = header.nextElementSibling;
        content.classList.add('expanded');
        content.style.gridTemplateRows = '1fr';
      }
    });
  });
}

// Parallax effect for hero section (disabled if reduced motion is preferred)
if ('matchMedia' in window && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Skip parallax if reduced motion is preferred
} else {
  if (document.querySelector('.hero-layers')) {
    const heroLayers = document.querySelectorAll('.hero-layer');
    
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      heroLayers.forEach(layer => {
        const speed = layer.getAttribute('data-speed');
        const yPos = -(scrolled * speed);
        layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    });
  }
}

// Mobile menu toggle
document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
  const nav = document.querySelector('.main-nav ul');
  nav.classList.toggle('show');
});