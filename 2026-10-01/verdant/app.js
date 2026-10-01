// Shopping Cart functionality
let cart = [];

// DOM Content Loaded event
document.addEventListener('DOMContentLoaded', function() {
    // Cart functionality
    const cartBtn = document.querySelector('.cart-btn');
    const closeCartBtn = document.querySelector('.close-cart-btn');
    const cartDrawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.overlay');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalAmountElement = document.querySelector('.total-amount');
    const cartCountElement = document.querySelector('.cart-count');

    // Open cart
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            cartDrawer.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close cart
    function closeCart() {
        cartDrawer.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    if (overlay) {
        overlay.addEventListener('click', closeCart);
    }

    // Add to cart
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            
            // Check if product is already in cart
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    quantity: 1
                });
            }
            
            updateCart();
            showAddedToCartNotification(productName);
        });
    });

    // Update cart display
    function updateCart() {
        // Update cart items
        cartItemsContainer.innerHTML = '';
        
        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <img src="https://placehold.co/80x80?text=${item.name.charAt(0)}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease-qty" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                        <button class="quantity-btn increase-qty" data-id="${item.id}">+</button>
                        <button class="remove-item-btn" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        // Add event listeners to quantity buttons
        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const item = cart.find(item => item.id === id);
                if (item) {
                    item.quantity += 1;
                    updateCart();
                }
            });
        });

        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const item = cart.find(item => item.id === id);
                if (item && item.quantity > 1) {
                    item.quantity -= 1;
                    updateCart();
                }
            });
        });

        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const id = this.getAttribute('data-id');
                const item = cart.find(item => item.id === id);
                if (item && this.value > 0) {
                    item.quantity = parseInt(this.value);
                    updateCart();
                }
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                cart = cart.filter(item => item.id !== id);
                updateCart();
            });
        });

        // Update total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalAmountElement.textContent = `$${total.toFixed(2)}`;

        // Update cart count
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalCount;
    }

    // Show notification when item is added to cart
    function showAddedToCartNotification(productName) {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = `${productName} added to cart!`;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#5b7d5a';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
            const answer = this.nextElementSibling;
            answer.style.display = expanded ? 'none' : 'block';
        });
    });

    // Quiz functionality - if we're on the routine page
    if (document.querySelector('.quiz-container')) {
        initializeQuiz();
    }

    // Initialize counter animations when elements come into view
    initCounterAnimations();

    // Initialize marquee animations
    initMarqueeAnimations();
});

// Quiz functionality
function initializeQuiz() {
    const quizContainer = document.querySelector('.quiz-container');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const quizQuestions = document.querySelectorAll('.quiz-question');
    const progressBarFill = document.querySelector('.progress-fill');
    const currentStepElement = document.querySelector('.current-step');
    const totalStepsElement = document.querySelector('.total-steps');
    const resultsSection = document.querySelector('.results-section');
    
    let currentStep = 0;
    const totalSteps = quizQuestions.length;
    const userAnswers = {};

    // Set total steps in UI
    totalStepsElement.textContent = totalSteps;

    // Update progress
    function updateProgress() {
        const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
        progressBarFill.style.width = `${progressPercentage}%`;
        currentStepElement.textContent = currentStep + 1;
    }

    // Show current question
    function showCurrentQuestion() {
        quizQuestions.forEach((question, index) => {
            if (index === currentStep) {
                question.classList.add('active');
            } else {
                question.classList.remove('active');
            }
        });
        
        // Enable/disable prev button
        prevBtn.disabled = currentStep === 0;
        
        // Update next button text
        if (currentStep === totalSteps - 1) {
            nextBtn.textContent = 'See Results';
        } else {
            nextBtn.textContent = 'Next';
        }
        
        updateProgress();
    }

    // Handle option selection
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const step = parseInt(this.closest('.quiz-question').getAttribute('data-step'));
            const value = this.getAttribute('data-value');
            
            // Remove selected class from all options in this step
            document.querySelectorAll(`[data-step="${step}"] .option-btn`).forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Store the answer
            userAnswers[step] = value;
        });
    });

    // Next button click
    nextBtn.addEventListener('click', function() {
        // Check if an option is selected for current step
        const selectedOption = document.querySelector(`[data-step="${currentStep + 1}"] .option-btn.selected`);
        
        if (!selectedOption && currentStep < totalSteps - 1) {
            alert('Please select an option before continuing.');
            return;
        }

        if (currentStep < totalSteps - 1) {
            currentStep++;
            showCurrentQuestion();
        } else {
            // Show results
            showResults();
        }
    });

    // Previous button click
    prevBtn.addEventListener('click', function() {
        if (currentStep > 0) {
            currentStep--;
            showCurrentQuestion();
        }
    });

    // Show results based on answers
    function showResults() {
        quizContainer.style.display = 'none';
        resultsSection.classList.remove('hidden');
        
        // Generate recommendations based on answers
        generateRecommendations(userAnswers);
    }

    // Generate recommendations based on user answers
    function generateRecommendations(answers) {
        const recommendationsGrid = document.querySelector('.recommendations-grid');
        
        // Simple recommendation logic based on answers
        let recommendedProducts = [];
        
        // Based on skin type
        switch(answers[1]) {
            case 'oily':
                recommendedProducts.push({
                    id: 'cleansing-gel',
                    name: 'Purifying Cleansing Gel',
                    description: 'Oil-free gel cleanser that removes excess sebum without stripping.',
                    price: 28.00,
                    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            case 'dry':
                recommendedProducts.push({
                    id: 'cleansing-balm',
                    name: 'Nourishing Cleansing Balm',
                    description: 'Creamy balm that gently removes impurities while hydrating.',
                    price: 34.00,
                    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            default:
                recommendedProducts.push({
                    id: 'cleansing-oil',
                    name: 'Gentle Cleansing Oil',
                    description: 'Lightweight oil-based cleanser removes impurities while maintaining natural moisture balance.',
                    price: 32.00,
                    image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=1600&q=80'
                });
        }
        
        // Based on skin concern
        switch(answers[2]) {
            case 'hydration':
                recommendedProducts.push({
                    id: 'hydra-serum',
                    name: 'Intense Hydration Serum',
                    description: 'Concentrated blend of hyaluronic acid and botanical extracts for intense hydration.',
                    price: 45.00,
                    image: 'https://images.unsplash.com/photo-1611215120524-9e1f6f30c1f4?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            case 'aging':
                recommendedProducts.push({
                    id: 'retinol-serum',
                    name: 'Advanced Retinol Serum',
                    description: 'Potent anti-aging serum with encapsulated retinol and peptides.',
                    price: 58.00,
                    image: 'https://images.unsplash.com/photo-1611215120524-9e1f6f30c1f4?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            case 'brightening':
                recommendedProducts.push({
                    id: 'vitamin-c-serum',
                    name: 'Brightening Vitamin C Serum',
                    description: 'Stabilized vitamin C formula to reduce dark spots and improve radiance.',
                    price: 42.00,
                    image: 'https://images.unsplash.com/photo-1611215120524-9e1f6f30c1f4?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            default:
                recommendedProducts.push({
                    id: 'multi-serum',
                    name: 'Multi-Corrective Serum',
                    description: 'All-in-one serum addressing multiple skin concerns with antioxidants.',
                    price: 52.00,
                    image: 'https://images.unsplash.com/photo-1611215120524-9e1f6f30c1f4?auto=format&fit=crop&w=1600&q=80'
                });
        }
        
        // Based on time commitment
        switch(answers[3]) {
            case 'minimal':
                recommendedProducts.push({
                    id: 'all-in-one',
                    name: 'Daily Essentials Kit',
                    description: 'Two-step routine with cleanser and multi-tasking moisturizer.',
                    price: 65.00,
                    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            case 'comprehensive':
                recommendedProducts.push({
                    id: 'complete-routine',
                    name: 'Complete Care Collection',
                    description: 'Full 5-step routine with specialized treatments for optimal results.',
                    price: 145.00,
                    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1600&q=80'
                });
                break;
            default:
                recommendedProducts.push({
                    id: 'balanced-kit',
                    name: 'Balanced Routine Kit',
                    description: 'Three-step routine with cleanser, serum, and moisturizer.',
                    price: 98.00,
                    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1600&q=80'
                });
        }
        
        // Render recommendations
        recommendationsGrid.innerHTML = '';
        recommendedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" width="250" height="250">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>
            `;
            recommendationsGrid.appendChild(productCard);
        });
        
        // Re-initialize add to cart buttons for recommendations
        document.querySelectorAll('.recommendations-grid .add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                const productName = this.getAttribute('data-name');
                const productPrice = parseFloat(this.getAttribute('data-price'));
                
                // Check if product is already in cart
                const existingItem = cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        quantity: 1
                    });
                }
                
                updateCart();
                showAddedToCartNotification(productName);
            });
        });
    }

    // Restart quiz
    const restartQuizBtn = document.querySelector('.restart-quiz');
    if (restartQuizBtn) {
        restartQuizBtn.addEventListener('click', function() {
            // Reset answers
            userAnswers.length = 0;
            currentStep = 0;
            
            // Clear selections
            document.querySelectorAll('.option-btn.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Hide results and show quiz
            resultsSection.classList.add('hidden');
            quizContainer.style.display = 'block';
            
            // Show first question
            showCurrentQuestion();
        });
    }

    // Add all to cart button
    const addAllBtn = document.querySelector('.add-all-btn');
    if (addAllBtn) {
        addAllBtn.addEventListener('click', function() {
            const products = document.querySelectorAll('.recommendations-grid .product-card');
            products.forEach(product => {
                const button = product.querySelector('.add-to-cart-btn');
                if (button) {
                    const productId = button.getAttribute('data-product-id');
                    const productName = button.getAttribute('data-name');
                    const productPrice = parseFloat(button.getAttribute('data-price'));
                    
                    // Check if product is already in cart
                    const existingItem = cart.find(item => item.id === productId);
                    
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        cart.push({
                            id: productId,
                            name: productName,
                            price: productPrice,
                            quantity: 1
                        });
                    }
                }
            });
            
            updateCart();
            showAddedToCartNotification('All products added to cart!');
            
            // Close the results section and open cart
            resultsSection.classList.add('hidden');
            cartDrawer.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Initialize the first question
    showCurrentQuestion();
}

// Counter animation function
function initCounterAnimations() {
    const counters = document.querySelectorAll('.count-up');
    
    if (counters.length === 0) return;
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetValue = parseInt(target.getAttribute('data-target'));
                
                if (!target.getAttribute('data-animated')) {
                    animateCounter(target, targetValue);
                    target.setAttribute('data-animated', 'true');
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, targetValue) {
    let currentValue = 0;
    const duration = 1200; // ms
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutExpo)
        const easedProgress = progress < 0.5 ? 
            Math.pow(2, 20 * progress - 10) / 2 : 
            1 - Math.pow(2, -20 * progress + 10) / 2;
        
        currentValue = Math.floor(easedProgress * targetValue);
        
        // Format number with commas
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue.toLocaleString();
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Marquee animation function
function initMarqueeAnimations() {
    const marquees = document.querySelectorAll('.marquee');
    
    marquees.forEach(marquee => {
        // Duplicate content for seamless scrolling
        const content = marquee.innerHTML;
        marquee.innerHTML = content + content;
    });
}