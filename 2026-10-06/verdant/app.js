/**
 * VERDANT SKINCARE - Main Application Logic
 * Handles: Cart, Quiz, Animations, Mobile Nav
 */

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initCart();
    initMobileNav();
    initQuiz();
});

/* --- ANIMATIONS (Blur-Fade Ascend) --- */
function initAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-on-scroll, .reveal-group').forEach(el => observer.observe(el));
}

/* --- MOBILE NAV --- */
function initMobileNav() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.primary-nav');
    
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });
}

/* --- CART SYSTEM --- */
function initCart() {
    const state = {
        items: JSON.parse(localStorage.getItem('verdant_cart') || '[]'),
        isOpen: false
    };

    const els = {
        drawer: document.getElementById('cart-drawer'),
        toggles: document.querySelectorAll('.cart-toggle'),
        closeBtns: document.querySelectorAll('[data-cart-close]'),
        counts: document.querySelectorAll('[data-cart-count]'),
        itemsContainer: document.querySelector('[data-cart-items]'),
        total: document.querySelector('[data-cart-total]'),
        quickAdds: document.querySelectorAll('.quick-add-btn')
    };

    // Render initial state
    render();

    // Event Listeners
    els.toggles.forEach(btn => btn.addEventListener('click', () => open()));
    els.closeBtns.forEach(btn => btn.addEventListener('click', () => close()));
    
    // Quick Add Buttons
    els.quickAdds.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            
            const product = {
                id: card.dataset.productId,
                name: card.dataset.productName || card.querySelector('.product-title').textContent,
                price: parseFloat(card.dataset.productPrice || card.querySelector('.mono-num').textContent.replace('$','')),
                image: card.dataset.productImg || card.querySelector('img').src
            };
            
            addItem(product);
            open();
        });
    });

    // Routine Add Button
    const routineBtn = document.querySelector('.add-routine-btn');
    if (routineBtn) {
        routineBtn.addEventListener('click', () => {
            // Simplified: adds both recommended items
            addItem({ id: 'p3', name: 'Fermented Rice Essence', price: 42, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80' });
            addItem({ id: 'p2', name: 'Barrier Repair Cream', price: 54, image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&w=400&q=80' });
            open();
        });
    }

    function open() {
        state.isOpen = true;
        els.drawer.classList.add('open');
        els.drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        state.isOpen = false;
        els.drawer.classList.remove('open');
        els.drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function addItem(product) {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
            existing.qty++;
        } else {
            state.items.push({ ...product, qty: 1 });
        }
        save();
        render();
    }

    function removeItem(id) {
        state.items = state.items.filter(i => i.id !== id);
        save();
        render();
    }

    function updateQty(id, delta) {
        const item = state.items.find(i => i.id === id);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) removeItem(id);
            else { save(); render(); }
        }
    }

    function save() {
        localStorage.setItem('verdant_cart', JSON.stringify(state.items));
    }

    function render() {
        // Update Counts
        const count = state.items.reduce((sum, i) => sum + i.qty, 0);
        els.counts.forEach(el => el.textContent = count);

        // Update Total
        const total = state.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
        if (els.total) els.total.textContent = `$${total.toFixed(2)}`;

        // Render Items
        if (!els.itemsContainer) return;
        
        if (state.items.length === 0) {
            els.itemsContainer.innerHTML = `
                <div class="cart-empty-state">
                    <p>Your cart is empty.</p>
                    <a href="shop.html" class="btn btn-text">Start Shopping</a>
                </div>`;
            return;
        }

        els.itemsContainer.innerHTML = state.items.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" width="80" height="100">
                <div class="cart-item-info">
                    <div class="cart-item-header">
                        <span class="cart-item-title">${item.name}</span>
                        <span class="mono-num">$${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="window.verdantCart.update('${item.id}', -1)" aria-label="Decrease quantity">−</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="window.verdantCart.update('${item.id}', 1)" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="window.verdantCart.remove('${item.id}')">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Expose for inline handlers (simple approach for vanilla JS without bundler)
    window.verdantCart = { update: updateQty, remove: removeItem };
}

/* --- ROUTINE QUIZ --- */
function initQuiz() {
    const steps = document.querySelectorAll('.quiz-step');
    const result = document.querySelector('.quiz-result');
    const progressBar = document.querySelector('.progress-bar');
    
    if (steps.length === 0) return;

    let currentStep = 1;

    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
            // Simple logic: just advance step regardless of answer for this demo
            // In production, collect data-value attributes
            nextStep();
        });
    });

    function nextStep() {
        const currentEl = document.querySelector(`.quiz-step[data-step="${currentStep}"]`);
        if (currentEl) currentEl.classList.remove('active');

        currentStep++;
        
        const nextEl = document.querySelector(`.quiz-step[data-step="${currentStep}"]`);
        if (nextEl) {
            nextEl.classList.add('active');
            if (progressBar) progressBar.style.width = `${(currentStep / 3) * 100}%`;
        } else {
            // Show Result
            if (result) {
                result.style.display = 'block';
                if (progressBar) progressBar.style.width = '100%';
            }
        }
    }
}