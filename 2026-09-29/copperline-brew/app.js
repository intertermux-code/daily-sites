// Age gate functionality
document.addEventListener('DOMContentLoaded', function() {
    const ageGate = document.getElementById('age-gate');
    const ageConfirm = document.getElementById('age-confirm');
    
    // Check if user has already confirmed age
    const ageConfirmed = localStorage.getItem('ageConfirmed');
    
    if (!ageConfirmed) {
        // Show age gate
        setTimeout(() => {
            ageGate.classList.add('active');
        }, 500);
    } else {
        // Remove age gate if already confirmed
        ageGate.style.display = 'none';
    }
    
    ageConfirm.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.setItem('ageConfirmed', 'true');
        ageGate.classList.remove('active');
        setTimeout(() => {
            ageGate.style.display = 'none';
        }, 300);
    });
    
    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('#nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        });
    });
    
    // Beer detail modals
    if (document.querySelector('.view-details')) {
        const viewDetailButtons = document.querySelectorAll('.view-details');
        const modal = document.getElementById('beer-modal');
        const closeModal = document.querySelector('.close-btn');
        const modalBody = document.querySelector('.modal-body');
        
        // Beer data
        const beerData = {
            1: {
                name: "COPPERHEAD IPA",
                style: "IPA",
                abv: "6.8%",
                ibu: "65",
                description: "Aggressive hop profile with citrus notes and a malty backbone. Brewed with Cascade and Centennial hops for a bold, resinous character.",
                ingredients: "Pale malt, Crystal malt, Cascade hops, Centennial hops, Citra hops, Yeast",
                brewingNotes: "Dry-hopped twice for intense aroma. Fermented at 68°F for optimal hop utilization."
            },
            2: {
                name: "RAILYARD STOUT",
                style: "Stout",
                abv: "7.2%",
                ibu: "45",
                description: "Rich, creamy stout with chocolate and coffee undertones. Features roasted barley and specialty grains for depth.",
                ingredients: "Roasted barley, Chocolate malt, Coffee, Flaked oats, Pale malt, Yeast",
                brewingNotes: "Conditioned with real coffee beans and cocoa nibs. Nitrogenated for creamy texture."
            },
            3: {
                name: "BLUEPRINT PILSNER",
                style: "Pilsner",
                abv: "4.9%",
                ibu: "32",
                description: "Clean, crisp pilsner with noble hop character. Traditional German brewing techniques meet modern precision.",
                ingredients: "Pilsner malt, Saaz hops, German lager yeast, Water",
                brewingNotes: "Lagered for 6 weeks at cold temperatures for clean finish. Traditional decoction mash process."
            },
            4: {
                name: "STEELWORKER PORTER",
                style: "Porter",
                abv: "5.8%",
                ibu: "38",
                description: "Robust porter with hints of caramel and roasted malt. Balanced sweetness with moderate bitterness.",
                ingredients: "Chocolate malt, Roasted barley, Caramel malt, Pale malt, English hops, Ale yeast",
                brewingNotes: "Brewed with brown sugar for subtle complexity. Aged on oak chips for 3 weeks."
            },
            5: {
                name: "ASSEMBLY LAGER",
                style: "Lager",
                abv: "4.5%",
                ibu: "22",
                description: "Smooth, clean lager with subtle hop bitterness. Crisp and refreshing with a delicate malt profile.",
                ingredients: "German Pilsner malt, Hallertau hops, German lager yeast, Rice adjunct",
                brewingNotes: "Cold-conditioned for 8 weeks using traditional Bavarian methods. Smooth carbonation."
            },
            6: {
                name: "CONSTRUCTION WHEAT",
                style: "Wheat Ale",
                abv: "4.7%",
                ibu: "18",
                description: "Refreshing wheat ale with citrus notes and a smooth finish. Light and easy-drinking with subtle spice.",
                ingredients: "Wheat malt, Pale malt, Citrus zest, Coriander, Belgian witbier yeast",
                brewingNotes: "Dry-spiced with coriander and orange peel. Unfiltered for cloudy appearance."
            }
        };
        
        viewDetailButtons.forEach(button => {
            button.addEventListener('click', function() {
                const beerId = this.getAttribute('data-beer-id');
                const beer = beerData[beerId];
                
                if (beer) {
                    modalBody.innerHTML = `
                        <h2>${beer.name}</h2>
                        <div class="beer-detail-stats">
                            <span class="style-tag">${beer.style}</span>
                            <div class="beer-stats">
                                <span class="abv">ABV: ${beer.abv}</span>
                                <span class="ibu">IBU: ${beer.ibu}</span>
                            </div>
                        </div>
                        <p>${beer.description}</p>
                        <h3>Ingredients</h3>
                        <p>${beer.ingredients}</p>
                        <h3>Brewing Notes</h3>
                        <p>${beer.brewingNotes}</p>
                    `;
                    
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent background scrolling
                }
            });
        });
        
        closeModal.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
        
        // Close modal when clicking outside content
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = ''; // Re-enable scrolling
            }
        });
    }
    
    // Parallax effect for hero section
    if (document.querySelector('.parallax-layer')) {
        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (!isReducedMotion) {
            const parallaxLayers = document.querySelectorAll('.parallax-layer');
            
            document.addEventListener('scroll', function() {
                const scrolled = window.pageYOffset;
                
                parallaxLayers.forEach(layer => {
                    const speed = parseFloat(layer.getAttribute('data-speed'));
                    const yPos = -(scrolled * speed);
                    layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
                });
            });
        }
    }
    
    // Animated counters for stats
    if (document.querySelector('[data-count]')) {
        const counters = document.querySelectorAll('[data-count]');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-count'));
                    const duration = 1200; // ms
                    const increment = target / (duration / 16); // approx 60fps
                    let current = 0;
                    
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            entry.target.textContent = Math.floor(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            entry.target.textContent = target;
                        }
                    };
                    
                    updateCounter();
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }
});