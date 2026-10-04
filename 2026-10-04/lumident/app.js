// LumiDent JavaScript functionality

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }

    // Word Stagger Animation for Headlines
    const words = document.querySelectorAll('.word');
    if (words.length > 0) {
        // Add animation delay dynamically if not already set
        words.forEach((word, index) => {
            if (!word.style.animationDelay) {
                word.style.animationDelay = `${index * 60}ms`;
            }
        });
    }

    // Scroll Animation for Sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections that should animate on scroll
    const sectionsToAnimate = document.querySelectorAll('section:not(.hero-section)');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });

    // Handle Appointment Booking Form
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const fullName = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const service = document.getElementById('service').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const notes = document.getElementById('notes').value;

            // Show confirmation message
            const confirmationMessage = document.getElementById('confirmation-message');
            const appointmentDetailsList = document.getElementById('appointment-details');

            // Clear previous details
            appointmentDetailsList.innerHTML = '';

            // Add appointment details to the list
            const details = [
                { label: 'Name:', value: fullName },
                { label: 'Email:', value: email },
                { label: 'Phone:', value: phone },
                { label: 'Service:', value: getServiceLabel(service) },
                { label: 'Date:', value: formatDate(date) },
                { label: 'Time:', value: time }
            ];

            if (notes) {
                details.push({ label: 'Notes:', value: notes });
            }

            details.forEach(detail => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${detail.label}</strong> ${detail.value}`;
                appointmentDetailsList.appendChild(li);
            });

            // Show confirmation
            confirmationMessage.classList.remove('hidden');
            
            // Scroll to confirmation
            confirmationMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // Handle Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show success message
            const successMessage = document.getElementById('form-success');
            successMessage.classList.remove('hidden');
            
            // Reset form
            contactForm.reset();
            
            // Scroll to success
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // Initialize Before/After Sliders
    initializeBeforeAfterSliders();

    // Set min date for booking to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

// Helper Functions
function getServiceLabel(serviceValue) {
    const serviceLabels = {
        'dental-checkup': 'Dental Checkup',
        'cleaning': 'Professional Cleaning',
        'implant': 'Dental Implant Consultation',
        'orthodontics': 'Orthodontics Consultation',
        'cosmetic': 'Cosmetic Dentistry',
        'emergency': 'Emergency Appointment'
    };
    return serviceLabels[serviceValue] || serviceValue;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function initializeBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.slider-container');
    
    sliders.forEach(sliderContainer => {
        const sliderHandle = sliderContainer.querySelector('.slider-handle');
        const beforeImage = sliderContainer.querySelector('.before-image');
        
        if (sliderHandle && beforeImage) {
            let isDragging = false;
            
            // Mouse events
            sliderHandle.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            // Touch events for mobile
            sliderHandle.addEventListener('touchstart', startDragTouch);
            document.addEventListener('touchmove', dragTouch);
            document.addEventListener('touchend', stopDrag);
            
            function startDrag(e) {
                e.preventDefault();
                isDragging = true;
            }
            
            function startDragTouch(e) {
                isDragging = true;
            }
            
            function drag(e) {
                if (!isDragging) return;
                
                const containerRect = sliderContainer.getBoundingClientRect();
                let position = (e.clientX - containerRect.left) / containerRect.width;
                
                position = Math.max(0, Math.min(1, position));
                
                beforeImage.style.clipPath = `polygon(0 0, ${position * 100}% 0, ${position * 100}% 100%, 0 100%)`;
                sliderHandle.style.left = `${position * 100}%`;
            }
            
            function dragTouch(e) {
                if (!isDragging) return;
                
                const containerRect = sliderContainer.getBoundingClientRect();
                let position = (e.touches[0].clientX - containerRect.left) / containerRect.width;
                
                position = Math.max(0, Math.min(1, position));
                
                beforeImage.style.clipPath = `polygon(0 0, ${position * 100}% 0, ${position * 100}% 100%, 0 100%)`;
                sliderHandle.style.left = `${position * 100}%`;
            }
            
            function stopDrag() {
                isDragging = false;
            }
        }
    });
}