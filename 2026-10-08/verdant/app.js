// Cart functionality
let cart = [];
const cartCountElement = document.querySelector('.cart-count');
const cartItemsElement = document.querySelector('.cart-items');
const cartTotalElement = document.querySelector('.total-amount');
const cartDrawer = document.querySelector('.cart-drawer');
const closeCartButton = document.querySelector('.close-cart');

// Add to cart functionality
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
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
        openCart();
    });
});

// Update cart display
function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
    
    // Update cart items in drawer
    cartItemsElement.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <img src="https://placehold.co/80x80/eef4ee/5b7d5a?text=${item.name.charAt(0)}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-controls">
                    <button class="quantity-btn decrease-qty" data-id="${item.id}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-btn increase-qty" data-id="${item.id}">+</button>
                    <button class="remove-item" data-id="${item.id}">Remove</button>
                </div>
            </div>
        `;
        cartItemsElement.appendChild(cartItemElement);
    });
    
    // Update total
    cartTotalElement.textContent = total.toFixed(2);
    
    // Add event listeners to quantity controls
    document.querySelectorAll('.decrease-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const item = cart.find(item => item.id === id);
            if (item && item.quantity > 1) {
                item.quantity -= 1;
            } else if (item && item.quantity === 1) {
                cart = cart.filter(item => item.id !== id);
            }
            updateCart();
        });
    });
    
    document.querySelectorAll('.increase-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const item = cart.find(item => item.id === id);
            if (item) {
                item.quantity += 1;
                updateCart();
            }
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const item = cart.find(item => item.id === id);
            if (item && e.target.value > 0) {
                item.quantity = parseInt(e.target.value);
                updateCart();
            }
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            cart = cart.filter(item => item.id !== id);
            updateCart();
        });
    });
}

// Cart drawer functionality
document.querySelector('.cart-btn').addEventListener('click', openCart);
closeCartButton.addEventListener('click', closeCart);

function openCart() {
    cartDrawer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartDrawer.classList.remove('active');
    document.body.style.overflow = '';
}

// Close cart when clicking outside
cartDrawer.addEventListener('click', (e) => {
    if (e.target === cartDrawer) {
        closeCart();
    }
});

// Checkout button
document.querySelector('.checkout-btn').addEventListener('click', () => {
    alert('Proceeding to checkout!');
    closeCart();
});

// Decode text animation for hero section
if (document.querySelector('.decode-text')) {
    const decodeText = document.querySelector('.decode-text');
    const originalText = decodeText.textContent;
    decodeText.setAttribute('data-target', originalText);
    
    // The animation is handled in CSS, so we just need to trigger it
    // by ensuring the element has the data-target attribute
}

// Quiz functionality for routine page
if (document.querySelector('.quiz-container')) {
    let currentQuestion = 1;
    let userSelections = {};
    
    // Option selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from siblings
            const parent = btn.parentElement;
            parent.querySelectorAll('.option-btn').forEach(sibling => {
                sibling.classList.remove('selected');
            });
            
            // Add selected class to clicked button
            btn.classList.add('selected');
        });
    });
    
    // Next button functionality
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedOption = document.querySelector(`#question-${currentQuestion} .option-btn.selected`);
            if (!selectedOption) {
                alert('Please select an option');
                return;
            }
            
            // Store selection
            userSelections[`q${currentQuestion}`] = selectedOption.dataset.value;
            
            // Move to next question
            document.getElementById(`question-${currentQuestion}`).classList.remove('active');
            currentQuestion++;
            document.getElementById(`question-${currentQuestion}`).classList.add('active');
            
            // Update progress
            updateProgress();
        });
    });
    
    // Results button functionality
    document.querySelector('.results-btn').addEventListener('click', () => {
        const selectedOption = document.querySelector(`#question-${currentQuestion} .option-btn.selected`);
        if (!selectedOption) {
            alert('Please select an option');
            return;
        }
        
        // Store final selection
        userSelections[`q${currentQuestion}`] = selectedOption.dataset.value;
        
        // Show results
        showResults();
    });
    
    // Restart quiz
    document.querySelector('.restart-quiz').addEventListener('click', () => {
        // Reset selections
        userSelections = {};
        currentQuestion = 1;
        
        // Hide results, show first question
        document.querySelector('.quiz-results').classList.add('hidden');
        document.querySelectorAll('.quiz-question').forEach(q => q.classList.remove('active'));
        document.getElementById('question-1').classList.add('active');
        
        // Reset progress
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector('.progress-fill').style.width = '0%';
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index === 0) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    });
    
    function updateProgress() {
        const progressPercent = (currentQuestion - 1) * 33.33;
        document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index < currentQuestion) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
    
    function showResults() {
        // Hide questions, show results
        document.querySelectorAll('.quiz-question').forEach(q => q.classList.remove('active'));
        document.querySelector('.quiz-results').classList.remove('hidden');
        
        // Generate recommendations based on selections
        const recommendations = generateRecommendations(userSelections);
        
        // Populate recommended products
        const recommendedProductsContainer = document.querySelector('.recommended-products');
        recommendedProductsContainer.innerHTML = '';
        
        recommendations.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" width="200" height="200">
                <h3>${product.name}</h3>
                <p>$${product.price}</p>
                <button class="add-to-cart" data-product-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>
            `;
            recommendedProductsContainer.appendChild(productCard);
        });
        
        // Populate routine steps
        document.querySelector('.morning-routine').innerHTML = '';
        recommendations.morning.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            document.querySelector('.morning-routine').appendChild(li);
        });
        
        document.querySelector('.evening-routine').innerHTML = '';
        recommendations.evening.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            document.querySelector('.evening-routine').appendChild(li);
        });
        
        // Re-initialize add to cart buttons in results
        document.querySelectorAll('.recommended-products .add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const name = e.target.dataset.name;
                const price = parseFloat(e.target.dataset.price);
                
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
                openCart();
            });
        });
    }
    
    function generateRecommendations(selections) {
        // Based on user selections, recommend products and routines
        const recommendations = {
            products: [],
            morning: [],
            evening: []
        };
        
        // Define product database
        const products = {
            'cleansing-oil': {
                id: 'cleansing-oil',
                name: 'Gentle Cleansing Oil',
                price: '32.00',
                image: 'https://images.unsplash.com/photo-1600857062241-98c0a9ed8f6d?auto=format&fit=crop&w=600&q=80'
            },
            'hydrating-serum': {
                id: 'hydrating-serum',
                name: 'Hydrating Serum',
                price: '42.00',
                image: 'https://images.unsplash.com/photo-1591862713051-5e0d3d4e8f1a?auto=format&fit=crop&w=600&q=80'
            },
            'night-cream': {
                id: 'night-cream',
                name: 'Nourishing Night Cream',
                price: '48.00',
                image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80'
            },
            'toning-mist': {
                id: 'toning-mist',
                name: 'Toning Mist',
                price: '28.00',
                image: 'https://images.unsplash.com/photo-1591862515276-a2bcf4ab9d6e?auto=format&fit=crop&w=600&q=80'
            },
            'exfoliating-treatment': {
                id: 'exfoliating-treatment',
                name: 'Exfoliating Treatment',
                price: '36.00',
                image: 'https://images.unsplash.com/photo-1580428180085-20e9bf93f8ca?auto=format&fit=crop&w=600&q=80'
            },
            'eye-serum': {
                id: 'eye-serum',
                name: 'Eye Revival Serum',
                price: '40.00',
                image: 'https://images.unsplash.com/photo-1591862515276-a2bcf4ab9d6e?auto=format&fit=crop&w=600&q=80'
            }
        };
        
        // Generate recommendations based on answers
        if (selections.q1 === 'dryness') {
            recommendations.products.push(products['hydrating-serum'], products['night-cream']);
            recommendations.morning.push('Cleanse with gentle cleanser', 'Apply hydrating serum', 'Moisturize with nourishing cream');
            recommendations.evening.push('Double cleanse with cleansing oil', 'Apply hydrating serum', 'Finish with night cream');
        } else if (selections.q1 === 'oiliness') {
            recommendations.products.push(products['cleansing-oil'], products['toning-mist']);
            recommendations.morning.push('Cleanse with balancing cleanser', 'Apply toning mist', 'Use lightweight moisturizer');
            recommendations.evening.push('Double cleanse with cleansing oil', 'Apply toning mist', 'Use oil-free moisturizer');
        } else if (selections.q1 === 'aging') {
            recommendations.products.push(products['hydrating-serum'], products['night-cream'], products['eye-serum']);
            recommendations.morning.push('Cleanse gently', 'Apply vitamin C serum', 'Apply hydrating serum', 'Moisturize and apply SPF');
            recommendations.evening.push('Double cleanse', 'Apply hydrating serum', 'Use retinol alternative', 'Apply eye serum', 'Finish with night cream');
        } else if (selections.q1 === 'sensitivity') {
            recommendations.products.push(products['cleansing-oil'], products['night-cream']);
            recommendations.morning.push('Cleanse with gentle oil cleanser', 'Apply soothing serum', 'Moisturize with calming cream');
            recommendations.evening.push('Double cleanse gently', 'Apply soothing serum', 'Finish with nourishing night cream');
        }
        
        if (selections.q2 === 'dry') {
            recommendations.products.push(products['night-cream'], products['hydrating-serum']);
        } else if (selections.q2 === 'oily') {
            recommendations.products.push(products['cleansing-oil'], products['toning-mist']);
        } else if (selections.q2 === 'combination') {
            recommendations.products.push(products['cleansing-oil'], products['hydrating-serum']);
        }
        
        if (selections.q3 === 'simple') {
            recommendations.morning = ['Cleanse', 'Moisturize', 'SPF'];
            recommendations.evening = ['Cleanse', 'Moisturize'];
        } else if (selections.q3 === 'moderate') {
            recommendations.morning = ['Cleanse', 'Tone', 'Serum', 'Moisturize', 'SPF'];
            recommendations.evening = ['Cleanse', 'Tone', 'Serum', 'Moisturize'];
        } else if (selections.q3 === 'extensive') {
            recommendations.morning = ['Cleanse', 'Tone', 'Treatment serum', 'Eye cream', 'Moisturize', 'SPF'];
            recommendations.evening = ['Makeup removal', 'Cleanse', 'Exfoliate (2x/week)', 'Tone', 'Treatment serum', 'Eye cream', 'Moisturize', 'Face oil (optional)'];
        }
        
        // Ensure we have at least 2 products
        if (recommendations.products.length < 2) {
            recommendations.products.push(products['cleansing-oil'], products['hydrating-serum']);
        }
        
        return recommendations;
    }
}

// Form submission for contact page
if (document.getElementById('contactForm')) {
    document.getElementById('contactForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        document.getElementById('contactForm').reset();
    });
}

// Animation on scroll functionality
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe elements that should animate on scroll
document.querySelectorAll('.in').forEach(el => {
    observer.observe(el);
});