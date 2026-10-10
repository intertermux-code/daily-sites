// Countdown Timer for Homepage
function updateCountdown() {
    const targetDate = new Date('December 18, 2026 00:00:00').getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Update countdown every second
if (document.querySelector('.countdown-timer')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const mainMenu = document.getElementById('main-menu');

if (menuToggle && mainMenu) {
    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        mainMenu.classList.toggle('active');
    });
}

// FAQ Accordion
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const expanded = question.getAttribute('aria-expanded') === 'true';
        question.setAttribute('aria-expanded', !expanded);
        
        const answer = question.nextElementSibling;
        if (expanded) {
            answer.classList.remove('open');
        } else {
            answer.classList.add('open');
        }
    });
});

// Lineup Filtering
if (document.getElementById('day-filter') && document.getElementById('stage-filter')) {
    const dayFilter = document.getElementById('day-filter');
    const stageFilter = document.getElementById('stage-filter');
    const lineupCards = document.querySelectorAll('.lineup-card');

    function filterLineup() {
        const selectedDay = dayFilter.value;
        const selectedStage = stageFilter.value;

        lineupCards.forEach(card => {
            const cardDay = card.dataset.day;
            const cardStage = card.dataset.stage;

            const showCard = (selectedDay === 'all' || cardDay === selectedDay) && 
                            (selectedStage === 'all' || cardStage === selectedStage);

            card.style.display = showCard ? 'block' : 'none';
        });
    }

    dayFilter.addEventListener('change', filterLineup);
    stageFilter.addEventListener('change', filterLineup);
}

// Intersection Observer for Image Reveal Effect
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.clipPath = 'inset(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply clip-path reveal to images
document.addEventListener('DOMContentLoaded', () => {
    const imagesToReveal = document.querySelectorAll('img[src*="images.unsplash"]');
    
    imagesToReveal.forEach(img => {
        // Set initial clip-path for reveal effect
        img.style.clipPath = 'inset(12% 8% round 12px)';
        img.style.transition = 'clip-path 0.9s ease-out';
        
        // Observe for intersection
        observer.observe(img);
    });
});