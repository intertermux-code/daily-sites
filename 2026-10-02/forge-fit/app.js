/**
 * FORGE Gym — Main Application Script
 */

(function() {
    'use strict';

    // ===== NAVIGATION TOGGLE =====
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            navLinks.classList.toggle('open');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navToggle.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('open');
            });
        });

        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                navToggle.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('open');
                navToggle.focus();
            }
        });
    }

    // ===== 3D CARD TILT =====
    const tiltCards = document.querySelectorAll('.tilt-card');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (tiltCards.length > 0 && !prefersReducedMotion) {
        tiltCards.forEach(function(card) {
            const maxTilt = 8; // degrees
            let currentX = 0;
            let currentY = 0;
            let targetX = 0;
            let targetY = 0;
            let rafId = null;
            let isHovering = false;

            function lerp(start, end, factor) {
                return start + (end - start) * factor;
            }

            function updateTilt() {
                currentX = lerp(currentX, targetX, 0.08);
                currentY = lerp(currentY, targetY, 0.08);
                card.style.transform = 'perspective(1000px) rotateX(' + currentY + 'deg) rotateY(' + currentX + 'deg)';
                
                if (isHovering || Math.abs(currentX - targetX) > 0.1 || Math.abs(currentY - targetY) > 0.1) {
                    rafId = requestAnimationFrame(updateTilt);
                }
            }

            card.addEventListener('mouseenter', function() {
                isHovering = true;
                if (!rafId) updateTilt();
            });

            card.addEventListener('mousemove', function(e) {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                targetX = (mouseX / (rect.width / 2)) * maxTilt;
                targetY = -(mouseY / (rect.height / 2)) * maxTilt;
                
                // Update glare position
                const glareX = ((e.clientX - rect.left) / rect.width) * 100;
                const glareY = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--glare-x', glareX + '%');
                card.style.setProperty('--glare-y', glareY + '%');
            });

            card.addEventListener('mouseleave', function() {
                isHovering = false;
                targetX = 0;
                targetY = 0;
                card.style.setProperty('--glare-x', '50%');
                card.style.setProperty('--glare-y', '50%');
            });
        });
    }

    // ===== SCHEDULE FILTER =====
    const scheduleSection = document.querySelector('.schedule-section');
    if (scheduleSection) {
        const filterBtns = scheduleSection.querySelectorAll('.filter-btn');
        const scheduleDays = scheduleSection.querySelectorAll('.schedule-day');

        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const day = this.getAttribute('data-day');
                
                // Update active state
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                
                // Filter days
                scheduleDays.forEach(function(dayEl) {
                    if (day === 'all') {
                        dayEl.style.display = '';
                    } else {
                        dayEl.style.display = dayEl.getAttribute('data-day') === day ? '' : 'none';
                    }
                });
            });
        });
    }

    // ===== BMI CALCULATOR =====
    const bmiForm = document.querySelector('.bmi-form');
    if (bmiForm) {
        bmiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const heightInput = document.getElementById('bmi-height');
            const weightInput = document.getElementById('bmi-weight');
            const resultEl = document.querySelector('.bmi-result');
            const valueEl = document.querySelector('.bmi-value');
            const categoryEl = document.querySelector('.bmi-category');
            
            if (!heightInput || !weightInput || !resultEl || !valueEl || !categoryEl) return;
            
            const height = parseFloat(heightInput.value);
            const weight = parseFloat(weightInput.value);
            
            if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
                alert('Please enter valid height and weight values.');
                return;
            }
            
            // BMI = weight(kg) / height(m)^2
            const heightM = height / 100;
            const bmi = weight / (heightM * heightM);
            const bmiRounded = bmi.toFixed(1);
            
            let category = '';
            let categoryColor = '';
            
            if (bmi < 18.5) {
                category = 'Underweight';
                categoryColor = 'var(--accent-warn)';
            } else if (bmi < 25) {
                category = 'Normal Weight';
                categoryColor = 'var(--accent-volt)';
            } else if (bmi < 30) {
                category = 'Overweight';
                categoryColor = 'var(--accent-warn)';
            } else {
                category = 'Obese';
                categoryColor = 'var(--accent-safety)';
            }
            
            valueEl.textContent = bmiRounded;
            valueEl.style.color = categoryColor;
            categoryEl.textContent = category;
            resultEl.classList.add('visible');
        });
    }

    // ===== TRIAL FORM =====
    const trialForm = document.querySelector('.trial-form-el');
    if (trialForm) {
        trialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('trial-name');
            const email = document.getElementById('trial-email');
            const phone = document.getElementById('trial-phone');
            const goal = document.getElementById('trial-goal');
            
            if (!name || !email || !phone || !goal) return;
            
            if (!name.value.trim() || !email.value.trim() || !phone.value.trim()) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                alert('Please enter a valid email address.');
                email.focus();
                return;
            }
            
            // Success feedback
            var successMsg = document.createElement('div');
            successMsg.className = 'form-success';
            successMsg.style.cssText = 'padding: var(--space-6); background: var(--accent-volt); color: var(--text-invert); font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; margin-top: var(--space-4);';
            successMsg.textContent = '✓ Trial Request Received. We\u2019ll Be In Touch Within 24 Hours.';
            
            trialForm.reset();
            trialForm.appendChild(successMsg);
            
            setTimeout(function() {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 5000);
        });
    }

    // ===== CONTACT FORM (if exists) =====
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('contact-name');
            const email = document.getElementById('contact-email');
            const message = document.getElementById('contact-message');
            
            if (!name || !email || !message) return;
            
            if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
                alert('Please fill in all fields.');
                return;
            }
            
            var successMsg = document.createElement('div');
            successMsg.style.cssText = 'padding: var(--space-6); background: var(--accent-volt); color: var(--text-invert); font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; margin-top: var(--space-4);';
            successMsg.textContent = '✓ Message Sent. We\u2019ll Respond Within 24 Hours.';
            
            contactForm.reset();
            contactForm.appendChild(successMsg);
            
            setTimeout(function() {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 5000);
        });
    }

})();