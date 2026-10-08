// Neon Pulse Festival JavaScript

// Decode Text Effect
function initDecodeText() {
    const decodeElements = document.querySelectorAll('.decode-text');
    
    decodeElements.forEach(element => {
        const originalText = element.textContent;
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/`~';
        
        // Store original text
        element.dataset.original = originalText;
        
        // Animate the text
        let iteration = 0;
        const originalLength = originalText.length;
        
        const interval = setInterval(() => {
            element.textContent = originalText
                .split('')
                .map((char, index) => {
                    if (index < iteration) {
                        return char;
                    }
                    
                    if (Math.random() > 0.3) {
                        return chars[Math.floor(Math.random() * chars.length)];
                    }
                    
                    return char;
                })
                .join('');
            
            if (iteration >= originalLength) {
                clearInterval(interval);
                element.textContent = originalText;
            }
            
            iteration += 1 / 3; // Adjust speed
        }, 100);
    });
}

// Animated Counters
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 1200; // 1.2 seconds
                const startTime = performance.now();
                
                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Ease out expo function
                    const easeProgress = progress < 1 ? 1 - Math.pow(2, -10 * progress) : 1;
                    
                    const currentValue = Math.floor(easeProgress * target);
                    counter.textContent = currentValue.toLocaleString();
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString();
                    }
                }
                
                requestAnimationFrame(updateCounter);
                observer.unobserve(counter);
            }
        });
    }, {
        threshold: 0.5
    });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// Countdown Timer
function initCountdownTimer() {
    const countdownEl = document.querySelector('.countdown-timer');
    if (!countdownEl) return;
    
    const targetDate = new Date('2026-12-18T00:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference <= 0) {
            document.querySelector('.days').textContent = '00';
            document.querySelector('.hours').textContent = '00';
            document.querySelector('.minutes').textContent = '00';
            document.querySelector('.seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        document.querySelector('.days').textContent = String(days).padStart(2, '0');
        document.querySelector('.hours').textContent = String(hours).padStart(2, '0');
        document.querySelector('.minutes').textContent = String(minutes).padStart(2, '0');
        document.querySelector('.seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Lineup Filter
function initLineupFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const lineupItems = document.querySelectorAll('.lineup-item');
    
    if (!filterButtons.length || !lineupItems.length) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            lineupItems.forEach(item => {
                if (filterValue === 'all') {
                    item.classList.remove('hidden');
                } else {
                    const day = item.getAttribute('data-day');
                    const stage = item.getAttribute('data-stage');
                    
                    if (filterValue.startsWith('day') && day === filterValue) {
                        item.classList.remove('hidden');
                    } else if (filterValue.startsWith('stage') && stage === filterValue) {
                        item.classList.remove('hidden');
                    } else if (filterValue !== 'all') {
                        item.classList.add('hidden');
                    } else {
                        item.classList.remove('hidden');
                    }
                }
            });
        });
    });
}

// FAQ Accordion
function initFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isOpen = question.getAttribute('aria-expanded') === 'true';
            const answer = question.nextElementSibling;
            
            // Close all other items
            faqQuestions.forEach(q => {
                if (q !== question) {
                    q.setAttribute('aria-expanded', 'false');
                    q.nextElementSibling.classList.remove('open');
                }
            });
            
            // Toggle current item
            question.setAttribute('aria-expanded', !isOpen);
            if (isOpen) {
                answer.classList.remove('open');
            } else {
                answer.classList.add('open');
            }
        });
    });
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (!menuToggle || !mainNav) return;
    
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
    initDecodeText();
    initAnimatedCounters();
    initCountdownTimer();
    initLineupFilter();
    initFAQAccordion();
    initMobileMenu();
});