/**
 * VERDANT SKINCARE — Application Logic
 * Vanilla JS, no dependencies
 */

(function() {
    'use strict';

    // ========================
    // UTILITIES
    // ========================
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    
    const prefersReducedMotion = () => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========================
    // MAGNETIC BUTTON EFFECT
    // ========================
    function initMagneticButtons() {
        if (prefersReducedMotion()) return;

        const buttons = $$('[data-magnetic]');
        const RADIUS = 120;
        const STRENGTH = 0.3;
        const SCALE_AT_CLOSEST = 1.04;

        buttons.forEach(btn => {
            let rafId = null;
            let currentX = 0;
            let currentY = 0;
            let targetX = 0;
            let targetY = 0;

            const lerp = (start, end, factor) => start + (end - start) * factor;

            const animate = () => {
                currentX = lerp(currentX, targetX, 0.15);
                currentY = lerp(currentY, targetY, 0.15);

                const distance = Math.sqrt(currentX * currentX + currentY * currentY);
                const maxDist = RADIUS;
                const scale = 1 + (SCALE_AT_CLOSEST - 1) * Math.max(0, 1 - distance / maxDist);

                btn.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;

                if (Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
                    rafId = requestAnimationFrame(animate);
                } else {
                    rafId = null;
                }
            };

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const dx = e.clientX - centerX;
                const dy = e.clientY - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < RADIUS) {
                    targetX = dx * STRENGTH;
                    targetY = dy * STRENGTH;
                } else {
                    targetX = 0;
                    targetY = 0;
                }

                if (!rafId) {
                    rafId = requestAnimationFrame(animate);
                }
            });

            btn.addEventListener('mouseleave', () => {
                targetX = 0;
                targetY = 0;
                if (!rafId) {
                    rafId = requestAnimationFrame(animate);
                }
            });
        });
    }

    // ========================
    // CART SYSTEM
    // ========================
    const Cart = {
        items: [],
        
        init() {
            this.load();
            this.bindEvents();
            this.updateUI();
        },

        load() {
            try {
                const stored = localStorage.getItem('verdant_cart');
                if (stored) this.items = JSON.parse(stored);
            } catch (e) {
                this.items = [];
            }
        },

        save() {
            localStorage.setItem('verdant_cart', JSON.stringify(this.items));
            this.updateUI();
        },

        add(product) {
            const existing = this.items.find(item => item.id === product.id);
            if (existing) {
                existing.qty += 1;
            } else {
                this.items.push({ ...product, qty: 1 });
            }
            this.save();
            this.openDrawer();
        },

        remove(id) {
            this.items = this.items.filter(item => item.id !== id);
            this.save();
        },

        updateQty(id, delta) {
            const item = this.items.find(i => i.id === id);
            if (!item) return;
            
            item.qty += delta;
            if (item.qty <= 0) {
                this.remove(id);
            } else {
                this.save();
            }
        },

        getTotal() {
            return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        },

        getCount() {
            return this.items.reduce((sum, item) => sum + item.qty, 0);
        },

        formatPrice(cents) {
            return '$' + cents.toFixed(2);
        },

        getProductImage(id) {
            // Map product IDs to images
            const images = {
                '1': 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=200&auto=format&fit=crop',
                '2': 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=200&auto=format&fit=crop',
                '3': 'https://images.unsplash.com/photo-1556228720-19de75258b96?q=80&w=200&auto=format&fit=crop',
                '4': 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=200&auto=format&fit=crop',
                '5': 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=200&auto=format&fit=crop',
                '6': 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=200&auto=format&fit=crop',
            };
            return images[id] || images['1'];
        },

        renderItems() {
            const container = $('[data-cart-items]');
            if (!container) return;

            if (this.items.length === 0) {
                container.innerHTML = `
                    <div class="cart-empty state-empty">
                        <p>Your cart is currently empty.</p>
                        <a href="shop.html" class="btn-secondary">Start Shopping</a>
                    </div>`;
                return;
            }

            container.innerHTML = this.items.map(item => `
                <div class="cart-item" data-item-id="${item.id}">
                    <img class="cart-item-img" src="${this.getProductImage(item.id)}" alt="${item.name}" width="80" height="100" loading="lazy">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-price mono-text">$${item.price}</span>
                    </div>
                    <div class="cart-item-actions">
                        <div class="qty-control">
                            <button class="qty-btn" data-qty-decrease="${item.id}" aria-label="Decrease quantity">−</button>
                            <span class="qty-value tabular-nums">${item.qty}</span>
                            <button class="qty-btn" data-qty-increase="${item.id}" aria-label="Increase quantity">+</button>
                        </div>
                        <button class="remove-btn" data-remove="${item.id}">Remove</button>
                    </div>
                </div>
            `).join('');

            // Bind item events
            $$('[data-qty-decrease]', container).forEach(btn => {
                btn.addEventListener('click', () => this.updateQty(btn.dataset.qtyDecrease, -1));
            });
            $$('[data-qty-increase]', container).forEach(btn => {
                btn.addEventListener('click', () => this.updateQty(btn.dataset.qtyIncrease, 1));
            });
            $$('[data-remove]', container).forEach(btn => {
                btn.addEventListener('click', () => this.remove(btn.dataset.remove));
            });
        },

        updateUI() {
            // Update count badge
            const countEl = $('[data-cart-count]');
            if (countEl) {
                const count = this.getCount();
                countEl.textContent = count;
                countEl.dataset.count = count;
            }

            // Update total
            const totalEl = $('[data-cart-total]');
            if (totalEl) {
                totalEl.textContent = this.formatPrice(this.getTotal());
            }

            // Render items
            this.renderItems();
        },

        openDrawer() {
            const drawer = $('#cart-drawer');
            if (drawer) {
                drawer.classList.add('is-open');
                drawer.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                // Focus first focusable element
                const firstFocusable = $('.cart-panel button, .cart-panel a', drawer);
                if (firstFocusable) firstFocusable.focus();
            }
        },

        closeDrawer() {
            const drawer = $('#cart-drawer');
            if (drawer) {
                drawer.classList.remove('is-open');
                drawer.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        },

        bindEvents() {
            // Open triggers
            $$('[data-cart-toggle]').forEach(btn => {
                btn.addEventListener('click', () => this.openDrawer());
            });

            // Close triggers
            $$('[data-cart-close]').forEach(btn => {
                btn.addEventListener('click', () => this.closeDrawer());
            });

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeDrawer();
            });

            // Quick add buttons
            document.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.quick-add-btn');
                if (addBtn) {
                    this.add({
                        id: addBtn.dataset.productId,
                        name: addBtn.dataset.productName,
                        price: parseFloat(addBtn.dataset.productPrice)
                    });
                }
            });
        }
    };

    // ========================
    // MOBILE MENU
    // ========================
    function initMobileMenu() {
        const toggle = $('[data-mobile-toggle]');
        const nav = $('.main-nav');
        
        if (!toggle || !nav) return;

        toggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close on link click
        $$('.nav-list a', nav).forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ========================
    // SHOP FILTERS
    // ========================
    function initShopFilters() {
        const filterBtns = $$('.filter-btn');
        const products = $$('.product-card');
        
        if (filterBtns.length === 0) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;

                products.forEach(product => {
                    if (filter === 'all' || product.dataset.category === filter) {
                        product.hidden = false;
                    } else {
                        product.hidden = true;
                    }
                });
            });
        });
    }

    // ========================
    // ROUTINE QUIZ
    // ========================
    function initQuiz() {
        const quizContainer = $('#routine-quiz');
        if (!quizContainer) return;

        const steps = $$('.quiz-step', quizContainer);
        const resultsStep = $('.quiz-results', quizContainer);
        const recommendedGrid = $('#recommended-grid');
        let currentStep = 1;
        const answers = {};

        // Product database for recommendations
        const products = {
            '1': { id: '1', name: 'Hydra-Repair Serum', price: 68, img: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=400&auto=format&fit=crop', tags: ['dryness', 'aging', 'sensitivity'] },
            '2': { id: '2', name: 'Barrier Lipid Cream', price: 54, img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=400&auto=format&fit=crop', tags: ['dryness', 'sensitivity', 'minimal'] },
            '3': { id: '3', name: 'Renewal Night Oil', price: 72, img: 'https://images.unsplash.com/photo-1556228720-19de75258b96?q=80&w=400&auto=format&fit=crop', tags: ['dryness', 'aging', 'comprehensive'] },
            '4': { id: '4', name: 'Luminance Vit-C', price: 74, img: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=400&auto=format&fit=crop', tags: ['aging', 'moderate', 'comprehensive'] },
            '5': { id: '5', name: 'Matte Balance Gel', price: 48, img: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=400&auto=format&fit=crop', tags: ['acne', 'oily'] },
            '6': { id: '6', name: 'Pure Squalane', price: 42, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=400&auto=format&fit=crop', tags: ['sensitivity', 'minimal', 'dryness'] }
        };

        function showStep(stepNum) {
            steps.forEach(s => {
                s.hidden = true;
                s.classList.remove('active');
            });
            resultsStep.hidden = true;

            if (stepNum === 'results') {
                resultsStep.hidden = false;
                showResults();
            } else {
                const step = $(`.quiz-step[data-step="${stepNum}"]`, quizContainer);
                if (step) {
                    step.hidden = false;
                    step.classList.add('active');
                    // Focus first input
                    const firstInput = $('input', step);
                    if (firstInput) firstInput.focus();
                }
            }
        }

        function validateStep(stepNum) {
            const step = $(`.quiz-step[data-step="${stepNum}"]`, quizContainer);
            if (!step) return false;
            const checked = $('input:checked', step);
            return !!checked;
        }

        function updateNextButton(stepNum) {
            const step = $(`.quiz-step[data-step="${stepNum}"]`, quizContainer);
            if (!step) return;
            const nextBtn = $('.quiz-next, .quiz-submit', step);
            if (nextBtn) {
                nextBtn.disabled = !validateStep(stepNum);
            }
        }

        function showResults() {
            // Simple recommendation logic
            const concern = answers.concern || 'dryness';
            const complexity = answers.complexity || 'moderate';

            let recommended = Object.values(products).filter(p => 
                p.tags.includes(concern) || p.tags.includes(complexity)
            ).slice(0, 3);

            // Ensure at least 2 products
            if (recommended.length < 2) {
                recommended = [products['1'], products['2']];
            }

            const summaries = {
                'dryness': 'Your skin needs deep hydration and barrier support.',
                'aging': 'Targeted actives will help restore elasticity and luminosity.',
                'acne': 'Gentle balancing formulas to clarify without stripping.',
                'sensitivity': 'Ultra-gentle formulations to rebuild your skin barrier.'
            };

            $('#results-summary').textContent = summaries[concern] || 'Here are your personalized picks:';

            recommendedGrid.innerHTML = recommended.map(p => `
                <article class="product-card">
                    <div class="product-image">
                        <img src="${p.img}" alt="${p.name}" width="400" height="500" loading="lazy">
                        <button class="quick-add-btn mono-text magnetic-btn" data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}" data-magnetic>Add — $${p.price}</button>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${p.name}</h3>
                    </div>
                </article>
            `).join('');

            // Re-init magnetic buttons for new elements
            initMagneticButtons();
        }

        // Event delegation for quiz
        quizContainer.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                const step = e.target.closest('.quiz-step');
                if (step) {
                    const stepNum = step.dataset.step;
                    answers[e.target.name] = e.target.value;
                    updateNextButton(stepNum);
                }
            }
        });

        quizContainer.addEventListener('click', (e) => {
            const nextBtn = e.target.closest('.quiz-next');
            const prevBtn = e.target.closest('.quiz-prev');
            const submitBtn = e.target.closest('.quiz-submit');
            const restartBtn = e.target.closest('.quiz-restart');

            if (nextBtn && !nextBtn.disabled) {
                currentStep++;
                showStep(currentStep);
            }

            if (prevBtn) {
                currentStep--;
                showStep(currentStep);
            }

            if (submitBtn && !submitBtn.disabled) {
                showStep('results');
            }

            if (restartBtn) {
                currentStep = 1;
                // Reset radios
                $$('input[type="radio"]', quizContainer).forEach(r => r.checked = false);
                Object.keys(answers).forEach(k => delete answers[k]);
                steps.forEach(s => {
                    const btn = $('.quiz-next, .quiz-submit', s);
                    if (btn) btn.disabled = true;
                });
                showStep(1);
            }
        });

        // Initialize
        showStep(1);
    }

    // ========================
    // CONTACT FORM
    // ========================
    function initContactForm() {
        const form = $('#contact-form');
        if (!form) return;

        const statusEl = $('.form-status', form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Basic validation
            const inputs = $$('input, select, textarea', form);
            let isValid = true;

            inputs.forEach(input => {
                const errorEl = input.parentElement.querySelector('.form-error');
                if (!input.checkValidity()) {
                    isValid = false;
                    if (errorEl) {
                        errorEl.textContent = input.validationMessage;
                    }
                } else if (errorEl) {
                    errorEl.textContent = '';
                }
            });

            if (!isValid) {
                statusEl.className = 'form-status error';
                statusEl.textContent = 'Please correct the errors above.';
                return;
            }

            // Simulate submission
            const submitBtn = $('button[type="submit"]', form);
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';
            statusEl.className = 'form-status';
            statusEl.textContent = '';

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            statusEl.className = 'form-status success';
            statusEl.textContent = 'Message sent successfully. We’ll be in touch within 24 hours.';
            form.reset();

            // Clear success message after 5s
            setTimeout(() => {
                if (statusEl.textContent.includes('successfully')) {
                    statusEl.textContent = '';
                }
            }, 5000);
        });

        // Real-time validation feedback
        $$('input, textarea, select', form).forEach(input => {
            input.addEventListener('blur', () => {
                const errorEl = input.parentElement.querySelector('.form-error');
                if (errorEl) {
                    errorEl.textContent = input.checkValidity() ? '' : input.validationMessage;
                }
            });
        });
    }

    // ========================
    // INITIALIZATION
    // ========================
    function init() {
        initMagneticButtons();
        Cart.init();
        initMobileMenu();
        initShopFilters();
        initQuiz();
        initContactForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();