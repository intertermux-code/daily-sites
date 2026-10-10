// Verdant Skincare - JavaScript

// Cart functionality
let cart = [];
const cartCount = document.querySelector('.cart-count');
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');
const closeCart = document.querySelector('.close-cart');
const cartItemsContainer = document.querySelector('.cart-items');
const totalPriceElement = document.querySelector('.total-price');
const checkoutBtn = document.querySelector('.checkout-btn');

// Open cart drawer
function openCart() {
    cartDrawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCartDisplay();
}

// Close cart drawer
function closeCartDrawer() {
    cartDrawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Update cart count display
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Update cart items display
function updateCartDisplay() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        totalPriceElement.textContent = '$0.00';
        checkoutBtn.disabled = true;
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemTotal = parseFloat(item.price.replace('$', '')) * item.quantity;
        total += itemTotal;

        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    <button class="remove-item" data-id="${item.id}">✕</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemElement);
    });

    totalPriceElement.textContent = `$${total.toFixed(2)}`;
    checkoutBtn.disabled = false;

    // Add event listeners to quantity buttons and remove buttons
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => adjustQuantity(btn.dataset.id, -1));
    });

    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => adjustQuantity(btn.dataset.id, 1));
    });

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const newQuantity = parseInt(e.target.value);
            if (newQuantity > 0) {
                updateQuantity(e.target.dataset.id, newQuantity);
            } else {
                updateQuantity(e.target.dataset.id, 1);
            }
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
}

// Add to cart function
function addToCart(product) {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }

    updateCartCount();
    updateCartDisplay();

    // Show confirmation
    const confirmMsg = document.createElement('div');
    confirmMsg.className = 'cart-confirmation';
    confirmMsg.textContent = `${product.name} added to cart`;
    confirmMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--clr-primary);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
    `;
    document.body.appendChild(confirmMsg);

    setTimeout(() => {
        confirmMsg.remove();
    }, 2000);
}

// Adjust quantity function
function adjustQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartCount();
            updateCartDisplay();
        }
    }
}

// Update quantity function
function updateQuantity(id, newQuantity) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = newQuantity;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartCount();
            updateCartDisplay();
        }
    }
}

// Remove from cart function
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartCount();
    updateCartDisplay();
}

// Initialize cart from localStorage if available
function initCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartCount();
    updateCartDisplay();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Event listeners for cart
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', () => {
        const productCard = button.closest('.product-card');
        const product = {
            id: productCard.dataset.productId,
            name: productCard.querySelector('h3').textContent,
            price: productCard.querySelector('.price').textContent,
            image: productCard.querySelector('.product-image').style.backgroundImage.match(/url\("(.+)"\)/)[1]
        };
        
        addToCart(product);
    });
});

document.querySelector('.cart-btn').addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartDrawer);
overlay.addEventListener('click', closeCartDrawer);

// Close cart with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer.classList.contains('active')) {
        closeCartDrawer();
    }
});

// Quiz functionality
if (document.getElementById('routineQuiz')) {
    const quizForm = document.getElementById('routineQuiz');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const restartQuiz = document.getElementById('restartQuiz');
    const resultsSection = document.getElementById('resultsSection');
    const progressFill = document.getElementById('progressFill');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    
    let currentStep = 1;
    const totalSteps = 3;
    
    // Update progress
    function updateProgress() {
        const progressPercentage = (currentStep / totalSteps) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        currentQuestionSpan.textContent = currentStep;
        totalQuestionsSpan.textContent = totalSteps;
    }
    
    // Show current question
    function showCurrentQuestion() {
        document.querySelectorAll('.question-group').forEach((group, index) => {
            if (index + 1 === currentStep) {
                group.classList.remove('hidden');
            } else {
                group.classList.add('hidden');
            }
        });
        
        // Update button visibility
        prevBtn.disabled = currentStep === 1;
        nextBtn.disabled = currentStep === totalSteps;
        
        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
        
        updateProgress();
    }
    
    // Navigation
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            currentStep++;
            showCurrentQuestion();
        }
    });
    
    prevBtn.addEventListener('click', () => {
        currentStep--;
        showCurrentQuestion();
    });
    
    // Validate current step
    function validateCurrentStep() {
        const currentGroup = document.getElementById(`question${currentStep}`);
        const requiredInputs = currentGroup.querySelectorAll('input[required]');
        
        for (const input of requiredInputs) {
            if (!input.checked) {
                return false;
            }
        }
        return true;
    }
    
    // Submit quiz
    quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get answers
        const skinType = document.querySelector('input[name="skinType"]:checked').value;
        const concern = document.querySelector('input[name="concern"]:checked').value;
        const time = document.querySelector('input[name="time"]:checked').value;
        
        // Generate recommendations based on answers
        generateRecommendations(skinType, concern, time);
        
        // Show results
        resultsSection.classList.remove('hidden');
        quizForm.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Generate recommendations
    function generateRecommendations(skinType, concern, time) {
        // Morning routine recommendations
        const morningProducts = document.getElementById('morningProducts');
        morningProducts.innerHTML = '';
        
        // Cleanser recommendation
        const cleanser = document.createElement('div');
        cleanser.className = 'recommended-product';
        cleanser.innerHTML = `
            <h4>Botanical Cleanser</h4>
            <p>Gentle daily cleanser for ${skinType} skin</p>
            <button class="add-to-cart-btn small-btn" data-product-id="1">Add to Cart</button>
        `;
        morningProducts.appendChild(cleanser);
        
        // Treatment recommendation based on concern
        const treatment = document.createElement('div');
        treatment.className = 'recommended-product';
        let treatmentName = '';
        let treatmentDesc = '';
        
        switch(concern) {
            case 'hydration':
                treatmentName = 'Hydrating Serum';
                treatmentDesc = 'Intensive moisture boost for dehydrated skin';
                break;
            case 'aging':
                treatmentName = 'Anti-Aging Serum';
                treatmentDesc = 'Targeted formula for fine lines and firmness';
                break;
            case 'texture':
                treatmentName = 'Refining Toner';
                treatmentDesc = 'Gentle exfoliation for smoother texture';
                break;
            case 'brightness':
                treatmentName = 'Brightening Essence';
                treatmentDesc = 'Even tone and luminous glow';
                break;
        }
        
        treatment.innerHTML = `
            <h4>${treatmentName}</h4>
            <p>${treatmentDesc}</p>
            <button class="add-to-cart-btn small-btn" data-product-id="2">Add to Cart</button>
        `;
        morningProducts.appendChild(treatment);
        
        // Moisturizer recommendation
        const moisturizer = document.createElement('div');
        moisturizer.className = 'recommended-product';
        moisturizer.innerHTML = `
            <h4>Nourishing Moisturizer</h4>
            <p>Daily hydration for ${skinType} skin</p>
            <button class="add-to-cart-btn small-btn" data-product-id="3">Add to Cart</button>
        `;
        morningProducts.appendChild(moisturizer);
        
        // Evening routine recommendations
        const eveningProducts = document.getElementById('eveningProducts');
        eveningProducts.innerHTML = '';
        
        // Evening cleanser
        const eveningCleanser = document.createElement('div');
        eveningCleanser.className = 'recommended-product';
        eveningCleanser.innerHTML = `
            <h4>Deep Cleanse Balm</h4>
            <p>Removes makeup and impurities for ${skinType} skin</p>
            <button class="add-to-cart-btn small-btn" data-product-id="4">Add to Cart</button>
        `;
        eveningProducts.appendChild(eveningCleanser);
        
        // Night treatment
        const nightTreatment = document.createElement('div');
        nightTreatment.className = 'recommended-product';
        nightTreatment.innerHTML = `
            <h4>Restorative Night Cream</h4>
            <p>Overnight repair for ${skinType} skin</p>
            <button class="add-to-cart-btn small-btn" data-product-id="5">Add to Cart</button>
        `;
        eveningProducts.appendChild(nightTreatment);
        
        // Weekly treatments
        const weeklyProducts = document.getElementById('weeklyProducts');
        weeklyProducts.innerHTML = '';
        
        const mask = document.createElement('div');
        mask.className = 'recommended-product';
        mask.innerHTML = `
            <h4>Rejuvenating Mask</h4>
            <p>Weekly treatment for ${concern} concerns</p>
            <button class="add-to-cart-btn small-btn" data-product-id="6">Add to Cart</button>
        `;
        weeklyProducts.appendChild(mask);
        
        // Add event listeners to new add-to-cart buttons
        document.querySelectorAll('.recommended-product .add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                
                if (productCard) {
                    const product = {
                        id: productCard.dataset.productId,
                        name: productCard.querySelector('h3').textContent,
                        price: productCard.querySelector('.price').textContent,
                        image: productCard.querySelector('.product-image').style.backgroundImage.match(/url\("(.+)"\)/)[1]
                    };
                    
                    addToCart(product);
                }
            });
        });
    }
    
    // Restart quiz
    restartQuiz.addEventListener('click', () => {
        quizForm.reset();
        currentStep = 1;
        resultsSection.classList.add('hidden');
        showCurrentQuestion();
    });
    
    // Initialize quiz
    updateProgress();
}

// Contact form submission
if (document.getElementById('contactForm')) {
    const contactForm = document.getElementById('contactForm');
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        // In a real implementation, you would send this data to a server
        // For now, just show a success message
        alert(`Thank you, ${name}! Your message has been sent. We'll get back to you soon.`);
        
        // Reset form
        contactForm.reset();
    });
}

// Cursor spotlight effect for hero section
if (document.querySelector('.hero')) {
    const hero = document.querySelector('.hero');
    
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        hero.style.setProperty('--mouse-x', `${x}px`);
        hero.style.setProperty('--mouse-y', `${y}px`);
    });
}

// Card tilt effect
if (document.querySelectorAll('.product-card')) {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate rotation based on mouse position
            const rotateY = ((x - rect.width / 2) / rect.width) * 10; // Max 5 degrees
            const rotateX = ((rect.height / 2 - y) / rect.height) * 10; // Max 5 degrees
            
            // Apply rotation
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0px)`;
            
            // Update glare position
            card.style.setProperty('--glare-x', `${x}px`);
            card.style.setProperty('--glare-y', `${y}px`);
        });
        
        card.addEventListener('mouseleave', () => {
            // Reset rotation
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
    });
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', initCart);