// Neon Pulse Festival - Terminal/CRT Neon-Noir Theme JavaScript

// Countdown Timer for Festival
function initializeCountdown() {
    const countdownElement = document.getElementById('festival-countdown');
    if (!countdownElement) return;

    const festivalDate = new Date('2026-12-18T00:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const timeRemaining = festivalDate - now;

        if (timeRemaining <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Mobile Menu Toggle
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (!menuToggle || !mainNav) return;

    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}

// Accordion for FAQ
function initializeAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');
            
            content.classList.toggle('open');
            
            // Rotate the accordion icon
            if (icon) {
                icon.style.transform = content.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0)';
            }
        });
    });
}

// Filter functionality for lineup page
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const lineupItems = document.querySelectorAll('.lineup-item');

    if (!filterButtons.length || !lineupItems.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.dataset.filter;
            
            lineupItems.forEach(item => {
                if (filterValue === 'all' || item.dataset.category === filterValue) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

// Intersection Observer for animations
function initializeAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                
                // Handle image reveal animations
                if (entry.target.classList.contains('clip-path-reveal')) {
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, 100);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with blur-fade-ascend class
    document.querySelectorAll('.blur-fade-ascend').forEach((element, index) => {
        setTimeout(() => {
            observer.observe(element);
        }, index * 80); // Stagger the animations
    });

    // Observe elements with clip-path-reveal class
    document.querySelectorAll('.clip-path-reveal').forEach((element, index) => {
        setTimeout(() => {
            observer.observe(element);
        }, index * 80); // Stagger the animations
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCountdown();
    initializeMobileMenu();
    initializeAccordion();
    initializeFilters();
    initializeAnimations();
});