/**
 * Chapter & Verse - Shared Application Logic
 * Handles Navigation, Filtering, and Motion Choreography
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initWordStagger();
    initBookFilter();
});

/**
 * Mobile Navigation Toggle
 */
function initMobileNav() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger to X
        const hamburger = toggle.querySelector('.hamburger');
        if (isOpen) {
            hamburger.style.transform = 'rotate(45deg)';
            hamburger.style.background = 'transparent';
            // Pseudo elements handled via CSS classes ideally, 
            // but inline for simplicity in single-file constraint without extra CSS bloat
        } else {
            hamburger.style.transform = 'rotate(0)';
            hamburger.style.background = 'var(--color-ink)';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains('is-open')) {
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Word Stagger Animation Choreography
 * Splits headline text into spans and applies staggered delays
 */
function initWordStagger() {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const targets = document.querySelectorAll('.word-stagger-target');
    
    targets.forEach(target => {
        // Only process if words aren't already wrapped (server-side rendering check)
        if (target.querySelector('.word')) {
            const words = target.querySelectorAll('.word');
            words.forEach((word, index) => {
                // 60ms stagger as per design DNA
                word.style.animationDelay = `${index * 60}ms`;
            });
        }
    });
}

/**
 * Book Shelf Genre Filter
 * Filters books on books.html based on data attributes
 */
function initBookFilter() {
    const filterContainer = document.querySelector('.filter-group');
    const shelf = document.getElementById('book-shelf');
    
    if (!filterContainer || !shelf) return;

    const buttons = filterContainer.querySelectorAll('.filter-btn');
    const books = shelf.querySelectorAll('.shelf-book');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            books.forEach(book => {
                const genre = book.dataset.genre;
                const shouldShow = filter === 'all' || genre === filter;
                
                if (shouldShow) {
                    book.classList.remove('hidden');
                    // Reset animation for re-entry feel (optional polish)
                    book.style.opacity = '0';
                    requestAnimationFrame(() => {
                        book.style.transition = 'opacity 0.3s ease';
                        book.style.opacity = '1';
                    });
                } else {
                    book.classList.add('hidden');
                }
            });
        });
    });
}