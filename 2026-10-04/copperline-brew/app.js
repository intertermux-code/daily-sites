// Copperline Brewing Co. JavaScript

// Age Gate Modal
document.addEventListener('DOMContentLoaded', function() {
    const ageGateModal = document.getElementById('age-gate-modal');
    const enterBtn = document.getElementById('enter-btn');
    const exitBtn = document.getElementById('exit-btn');
    
    // Check if user has already confirmed age
    const hasConfirmedAge = localStorage.getItem('hasConfirmedAge');
    
    if (!hasConfirmedAge) {
        // Show age gate modal
        setTimeout(() => {
            ageGateModal.classList.add('active');
        }, 500);
    }
    
    enterBtn.addEventListener('click', function() {
        localStorage.setItem('hasConfirmedAge', 'true');
        ageGateModal.classList.remove('active');
    });
    
    exitBtn.addEventListener('click', function() {
        window.location.href = 'https://www.google.com';
    });
    
    // Close modal if user presses Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && ageGateModal.classList.contains('active')) {
            window.location.href = 'https://www.google.com';
        }
    });

    // Beer Detail Modal
    if (document.querySelector('.beer-detail-btn')) {
        const beerDetailModal = document.getElementById('beer-detail-modal');
        const closeBeerModal = document.getElementById('close-beer-modal');
        const modalBeerImage = document.getElementById('modal-beer-image');
        const modalBeerName = document.getElementById('modal-beer-name');
        const modalBeerStyle = document.getElementById('modal-beer-style');
        const modalBeerAbv = document.getElementById('modal-beer-abv');
        const modalBeerIbu = document.getElementById('modal-beer-ibu');
        const modalBeerDescription = document.getElementById('modal-beer-description');
        const modalBeerTastingNotes = document.getElementById('modal-beer-tasting-notes');
        
        const beerCards = document.querySelectorAll('.beer-card');
        
        // Beer data
        const beerData = {
            'amber-wave': {
                name: 'Amber Wave',
                style: 'Amber Ale',
                abv: '5.2%',
                ibu: '28',
                image: 'https://images.unsplash.com/photo-1514924904165-0a8fa3a0f3a3?auto=format&fit=crop&w=600&q=80',
                description: 'A smooth amber ale with notes of caramel and toasted malt.',
                tastingNotes: 'This well-balanced ale features a rich amber color with a creamy head. The aroma carries hints of caramel and biscuit, leading to a smooth, malty finish.'
            },
            'midnight-stout': {
                name: 'Midnight Stout',
                style: 'Oatmeal Stout',
                abv: '6.8%',
                ibu: '42',
                image: 'https://images.unsplash.com/photo-15592db34d3-b6bc9da6c4ec?auto=format&fit=crop&w=600&q=80',
                description: 'Rich and creamy stout with hints of chocolate and coffee.',
                tastingNotes: 'Dark and luxurious with a velvety texture. Notes of roasted coffee and dark chocolate blend seamlessly with a subtle oat sweetness.'
            },
            'citrus-burst': {
                name: 'Citrus Burst',
                style: 'IPA',
                abv: '6.5%',
                ibu: '65',
                image: 'https://images.unsplash.com/photo-1513448069979-6dfca5c60b76?auto=format&fit=crop&w=600&q=80',
                description: 'Bright and hoppy IPA bursting with citrus flavors.',
                tastingNotes: 'An explosion of citrus fruits including grapefruit, orange, and lemon zest. Balanced with a firm bitter backbone and a dry finish.'
            },
            'winter-warmer': {
                name: 'Winter Warmer',
                style: 'Winter Ale',
                abv: '7.2%',
                ibu: '32',
                image: 'https://images.unsplash.com/photo-1554982540-06088b4c7ad6?auto=format&fit=crop&w=600&q=80',
                description: 'Spiced ale perfect for cold winter nights.',
                tastingNotes: 'A warming blend of cinnamon, nutmeg, and orange peel complement a rich, malty base. Perfect for sipping by the fire.'
            },
            'barrel-aged': {
                name: 'Barrel Aged Reserve',
                style: 'Imperial Stout',
                abv: '11.2%',
                ibu: '75',
                image: 'https://images.unsplash.com/photo-1525267818972-aae2ea4e4df2?auto=format&fit=crop&w=600&q=80',
                description: 'Aged in bourbon barrels for rich, complex flavors.',
                tastingNotes: 'Deep, complex flavors of vanilla, oak, and bourbon meld with rich chocolate and coffee notes. Aged for 12 months in charred bourbon barrels.'
            },
            'hoppy-wheat': {
                name: 'Hoppy Wheat',
                style: 'Hefeweizen',
                abv: '4.8%',
                ibu: '18',
                image: 'https://images.unsplash.com/photo-1573504285343-e9a181f1f4c7?auto=format&fit=crop&w=600&q=80',
                description: 'Light wheat beer with tropical hop notes.',
                tastingNotes: 'A refreshing twist on the classic hefeweizen with additions of tropical hops. Notes of mango, pineapple, and citrus complement the traditional banana and clove esters.'
            }
        };
        
        // Add event listeners to all beer detail buttons
        document.querySelectorAll('.beer-detail-btn').forEach(button => {
            button.addEventListener('click', function() {
                const beerId = this.getAttribute('data-beer-id');
                const beer = beerData[beerId];
                
                if (beer) {
                    modalBeerImage.src = beer.image;
                    modalBeerImage.alt = `${beer.name} ${beer.style}`;
                    modalBeerName.textContent = beer.name;
                    modalBeerStyle.textContent = beer.style;
                    modalBeerAbv.textContent = beer.abv;
                    modalBeerIbu.textContent = beer.ibu;
                    modalBeerDescription.textContent = beer.description;
                    modalBeerTastingNotes.textContent = beer.tastingNotes;
                    
                    beerDetailModal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
                }
            });
        });
        
        // Close beer modal
        closeBeerModal.addEventListener('click', function() {
            beerDetailModal.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
        
        // Close modal if clicking outside content
        beerDetailModal.addEventListener('click', function(e) {
            if (e.target === beerDetailModal) {
                beerDetailModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && beerDetailModal.classList.contains('active')) {
                beerDetailModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add delay for staggered effect
                setTimeout(() => {
                    entry.target.classList.add('in');
                }, index * 80); // Stagger by 80ms
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with blur-fade-ascend class
    document.querySelectorAll('.timeline-entry').forEach((el, index) => {
        el.classList.add('blur-fade-ascend');
        observer.observe(el);
    });

    // Parallax effect for hero section (disabled if user prefers reduced motion)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        const parallaxLayers = document.querySelectorAll('.parallax-layer');
        
        if (parallaxLayers.length > 0) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                
                parallaxLayers.forEach(layer => {
                    const speed = parseFloat(layer.getAttribute('data-speed'));
                    const yPos = -(scrolled * speed);
                    layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
                });
            });
        }
    }
});