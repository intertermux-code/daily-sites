// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }

    // Animated Counters for Stats Section
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length > 0) {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -50px 0px'
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const targetElement = entry.target;
                    const targetValue = parseInt(targetElement.getAttribute('data-target'));
                    
                    // Only animate if the value hasn't been animated yet
                    if (!targetElement.dataset.animated) {
                        animateCounter(targetElement, 0, targetValue);
                        targetElement.dataset.animated = 'true';
                    }
                }
            });
        }, observerOptions);

        statNumbers.forEach(stat => {
            counterObserver.observe(stat);
        });

        function animateCounter(element, start, end) {
            const duration = 1200; // 1.2 seconds
            const startTime = performance.now();

            function updateProgress(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease-out exponential function
                const easedProgress = 1 - Math.pow(2, -10 * progress);
                const currentValue = Math.floor(start + (end - start) * easedProgress);
                
                // Format number with commas
                element.textContent = currentValue.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(updateProgress);
                } else {
                    element.textContent = end.toLocaleString();
                }
            }
            
            requestAnimationFrame(updateProgress);
        }
    }

    // Magnetic Button Effect
    const magneticButtons = document.querySelectorAll('.magnetic-btn');
    
    magneticButtons.forEach(button => {
        let xTo = 0;
        let yTo = 0;
        let xFrom = 0;
        let yFrom = 0;
        let request;

        const lerp = (start, end, factor) => start * (1 - factor) + end * factor;

        const animate = () => {
            xFrom = lerp(xFrom, xTo, 0.2);
            yFrom = lerp(yFrom, yTo, 0.2);

            // Apply transformation with clamping to prevent excessive movement
            const clampedX = Math.max(Math.min(xFrom, 12), -12);
            const clampedY = Math.max(Math.min(yFrom, 12), -12);

            button.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
            request = requestAnimationFrame(animate);
        };

        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate distance from center
            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;
            
            // Normalize and scale the movement (reduce intensity)
            xTo = distanceX / 10;
            yTo = distanceY / 10;
            
            // Scale down the effect to make it more subtle
            xTo *= 0.3;
            yTo *= 0.3;
        });

        button.addEventListener('mouseenter', () => {
            cancelAnimationFrame(request);
            animate();
        });

        button.addEventListener('mouseleave', () => {
            xTo = 0;
            yTo = 0;
        });
    });

    // Handle Appointment Form Submission
    const appointmentForm = document.getElementById('appointment-form');
    const confirmationMessage = document.getElementById('confirmation-message');
    const backToFormButton = document.getElementById('back-to-form');

    if (appointmentForm && confirmationMessage && backToFormButton) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show confirmation message
            appointmentForm.style.display = 'none';
            confirmationMessage.style.display = 'block';
            
            // Scroll to confirmation message
            confirmationMessage.scrollIntoView({ behavior: 'smooth' });
        });

        backToFormButton.addEventListener('click', function() {
            // Reset form and show it again
            appointmentForm.reset();
            appointmentForm.style.display = 'block';
            confirmationMessage.style.display = 'none';
            
            // Scroll to form
            appointmentForm.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Set minimum date for appointment form to today
    const dateInput = document.getElementById('preferred-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Handle Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // Initialize Image Sliders for Before/After Gallery
    initializeImageSliders();
});

// Function to initialize image sliders
function initializeImageSliders() {
    const sliderContainers = document.querySelectorAll('.slider-container');
    
    sliderContainers.forEach(container => {
        const slider = container.querySelector('.image-slider');
        const handle = container.querySelector('.slider-handle');
        
        if (slider && handle) {
            let isDragging = false;
            
            // Mouse events
            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const containerRect = slider.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
                const percentage = (x / containerRect.width) * 100;
                
                // Update the slider position
                slider.querySelector('.slider-image.before').style.width = `${percentage}%`;
                slider.querySelector('.slider-image.after').style.left = `${percentage}%`;
                slider.querySelector('.slider-image.after').style.width = `${100 - percentage}%`;
                handle.style.left = `${percentage}%`;
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            // Touch events for mobile
            handle.addEventListener('touchstart', (e) => {
                isDragging = true;
                e.preventDefault();
            });
            
            document.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                const containerRect = slider.getBoundingClientRect();
                const touch = e.touches[0];
                const x = Math.max(0, Math.min(touch.clientX - containerRect.left, containerRect.width));
                const percentage = (x / containerRect.width) * 100;
                
                // Update the slider position
                slider.querySelector('.slider-image.before').style.width = `${percentage}%`;
                slider.querySelector('.slider-image.after').style.left = `${percentage}%`;
                slider.querySelector('.slider-image.after').style.width = `${100 - percentage}%`;
                handle.style.left = `${percentage}%`;
            });
            
            document.addEventListener('touchend', () => {
                isDragging = false;
            });
        }
    });
}