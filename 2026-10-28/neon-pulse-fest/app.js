document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navList.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // --- Countdown Timer ---
    const countdownEl = document.querySelector('.countdown-container');
    if (countdownEl) {
        const targetDate = new Date('2026-12-18T00:00:00').getTime();
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;
            
            if (distance < 0) {
                document.getElementById('days').innerText = "00";
                document.getElementById('hours').innerText = "00";
                document.getElementById('minutes').innerText = "00";
                document.getElementById('seconds').innerText = "00";
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById('days').innerText = String(days).padStart(2, '0');
            document.getElementById('hours').innerText = String(hours).padStart(2, '0');
            document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
            document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
        };
        
        setInterval(updateCountdown, 1000);
        updateCountdown(); // Initial call
    }

    // --- Lineup Filtering ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const artistCards = document.querySelectorAll('.artist-card');
    const stageSelect = document.querySelector('#stage-select');
    
    let currentDay = 'all';
    let currentStage = 'all';
    
    const applyFilters = () => {
        artistCards.forEach(card => {
            const dayMatch = currentDay === 'all' || card.dataset.day === currentDay;
            const stageMatch = currentStage === 'all' || card.dataset.stage === currentStage;
            
            if (dayMatch && stageMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDay = btn.dataset.filter;
                applyFilters();
            });
        });
    }
    
    if (stageSelect) {
        stageSelect.addEventListener('change', (e) => {
            currentStage = e.target.value;
            applyFilters();
        });
    }

    // --- Spring Accordion ---
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all other items
            document.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // --- Clip-Path Image Reveal ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });
});