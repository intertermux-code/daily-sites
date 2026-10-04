// Neon Pulse Festival JavaScript

// Countdown Timer for Homepage
function updateCountdown() {
    const targetDate = new Date('December 18, 2026 00:00:00').getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Initialize countdown if on homepage
if (document.getElementById('days')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}

// Lineup Filter Functionality
if (document.querySelector('.lineup-filters')) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const artistCards = document.querySelectorAll('.artist-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            artistCards.forEach(card => {
                if (filterValue === 'all') {
                    card.style.display = 'block';
                } else {
                    if (card.getAttribute('data-day') === filterValue || 
                        card.getAttribute('data-stage') === filterValue) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
}

// FAQ Accordion
if (document.querySelector('.faq-question')) {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.classList.contains('open');
            
            // Close all answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.classList.remove('open');
            });
            
            // Open clicked answer if it wasn't already open
            if (!isOpen) {
                answer.classList.add('open');
            }
        });
    });
}

// Clip-Path Image Reveal using Intersection Observer
const imageReveals = document.querySelectorAll('.image-reveal');

if (imageReveals.length > 0) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    imageReveals.forEach(image => {
        imageObserver.observe(image);
    });
}

// Magnetic Buttons
const magneticElements = document.querySelectorAll('.magnetic');

magneticElements.forEach(button => {
    let posX = 0;
    let posY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let originalX = 0;
    let originalY = 0;
    
    button.addEventListener('mouseenter', () => {
        originalX = button.offsetLeft;
        originalY = button.offsetTop;
    });
    
    button.addEventListener('mousemove', (e) => {
        posX = e.pageX - button.getBoundingClientRect().left - window.scrollX;
        posY = e.pageY - button.getBoundingClientRect().top - window.scrollY;
        
        // Calculate distance from center
        const rect = button.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = posX - centerX;
        const deltaY = posY - centerY;
        
        // Only apply effect if cursor is close enough
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < 120) {
            // Apply magnetic effect with smooth transition
            button.style.transform = `translate(${deltaX * 0.1}px, ${deltaY * 0.1}px)`;
        }
    });
    
    button.addEventListener('mouseleave', () => {
        // Reset to original position
        button.style.transform = 'translate(0, 0)';
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});