/**
 * NEON PULSE 2026 - Main Application Logic
 * Handles Navigation, Countdown, Filtering, Accordions, and Scroll Reveals
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initCountdown();
    initLineupFilters();
    initAccordions();
    initScrollReveal();
});

/* --- MOBILE NAVIGATION --- */
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.contains('open');
        navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', !isOpen);
        
        // Animate hamburger
        const bars = toggle.querySelectorAll('.bar');
        if (!isOpen) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
            bars[1].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.transform = 'none';
        }
    });

    // Close menu when clicking a link
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            const bars = toggle.querySelectorAll('.bar');
            bars[0].style.transform = 'none';
            bars[1].style.transform = 'none';
        });
    });
}

/* --- COUNTDOWN TIMER --- */
function initCountdown() {
    const targetDate = new Date('December 18, 2026 18:00:00').getTime();
    const els = {
        d: document.getElementById('cd-days'),
        h: document.getElementById('cd-hours'),
        m: document.getElementById('cd-mins'),
        s: document.getElementById('cd-secs')
    };

    if (!els.d) return; // Not on homepage

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            Object.values(els).forEach(el => el.innerText = "00");
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        els.d.innerText = String(days).padStart(2, '0');
        els.h.innerText = String(hours).padStart(2, '0');
        els.m.innerText = String(minutes).padStart(2, '0');
        els.s.innerText = String(seconds).padStart(2, '0');
    };

    setInterval(updateTimer, 1000);
    updateTimer();
}

/* --- LINEUP FILTERING & EXPANSION --- */
function initLineupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.ledger-item');
    
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active State
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filter = btn.dataset.filter;

            items.forEach(item => {
                const day = item.dataset.day;
                if (filter === 'all' || day === filter) {
                    item.style.display = 'grid';
                    // Re-trigger animation
                    item.classList.remove('visible');
                    setTimeout(() => item.classList.add('visible'), 50);
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Expansion Logic
    const expandBtns = document.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.ledger-item');
            const details = row.querySelector('.artist-details');
            const isOpen = details.classList.contains('open');
            
            // Close others
            document.querySelectorAll('.artist-details.open').forEach(d => {
                if (d !== details) {
                    d.classList.remove('open');
                    d.closest('.ledger-item').querySelector('.expand-btn').innerText = '+';
                }
            });

            if (isOpen) {
                details.classList.remove('open');
                btn.innerText = '+';
            } else {
                details.classList.add('open');
                btn.innerText = '-';
            }
        });
    });
}

/* --- ACCORDIONS (INFO PAGE) --- */
function initAccordions() {
    const accordions = document.querySelectorAll('.accordion-item');
    if (!accordions.length) return;

    accordions.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                // Close others
                accordions.forEach(other => {
                    if (other !== item) other.removeAttribute('open');
                });
            }
        });
    });
}

/* --- SCROLL REVEAL OBSERVER --- */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach(el => observer.observe(el));
}