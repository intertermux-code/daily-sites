// Neon Pulse Festival - JavaScript

// Countdown Timer
function updateCountdown() {
    const targetDate = new Date('2026-12-18T00:00:00').getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Update countdown every second
updateCountdown();
setInterval(updateCountdown, 1000);

// Scroll Progress Bar
function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progress-bar').style.width = scrolled + '%';
}

window.addEventListener('scroll', updateProgressBar);

// Magnetic Button Effect
class MagneticButton {
    constructor(element) {
        this.element = element;
        this.x = 0;
        this.y = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.speed = 0.1;
        
        this.init();
    }
    
    init() {
        this.element.addEventListener('mousemove', (e) => {
            const rect = this.element.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left - rect.width / 2;
            this.mouseY = e.clientY - rect.top - rect.height / 2;
        });
        
        this.element.addEventListener('mouseleave', () => {
            this.mouseX = 0;
            this.mouseY = 0;
        });
        
        this.animate();
    }
    
    animate() {
        this.x += (this.mouseX - this.x) * this.speed;
        this.y += (this.mouseY - this.y) * this.speed;
        
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize magnetic buttons
document.querySelectorAll('.magnetic-btn').forEach(btn => {
    new MagneticButton(btn);
});

// Lineup Filter Functionality
if (document.querySelector('.filter-controls')) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const lineupCards = document.querySelectorAll('.lineup-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.dataset.filter;
            
            lineupCards.forEach(card => {
                if (filterValue === 'all' || card.classList.contains(filterValue)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// FAQ Accordion
if (document.querySelector('.faq-section')) {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.classList.contains('open');
            
            // Close all answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.classList.remove('open');
            });
            
            // Toggle current answer if it wasn't already open
            if (!isOpen) {
                answer.classList.add('open');
            }
        });
    });
}

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}

// Card Stack Effect on Scroll
if (document.querySelector('.card-stack')) {
    const cards = document.querySelectorAll('.card');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        cardObserver.observe(card);
    });
}