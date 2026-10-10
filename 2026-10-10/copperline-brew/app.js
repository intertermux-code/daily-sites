// Age gate functionality
document.addEventListener('DOMContentLoaded', () => {
  const ageGateModal = document.getElementById('age-gate-modal');
  const ageConfirmBtn = document.getElementById('age-confirm-btn');
  const ageDenyBtn = document.getElementById('age-deny-btn');

  // Check if user has already confirmed age
  const ageConfirmed = localStorage.getItem('ageConfirmed');
  
  if (!ageConfirmed) {
    // Show age gate modal
    setTimeout(() => {
      ageGateModal.classList.add('active');
    }, 500);
  } else {
    // Hide age gate if already confirmed
    ageGateModal.style.display = 'none';
  }

  ageConfirmBtn.addEventListener('click', () => {
    localStorage.setItem('ageConfirmed', 'true');
    ageGateModal.classList.remove('active');
    
    // After a short delay, hide the modal completely
    setTimeout(() => {
      ageGateModal.style.display = 'none';
    }, 300);
  });

  ageDenyBtn.addEventListener('click', () => {
    // Redirect to responsible drinking resource or close window
    window.location.href = 'https://responsibledrinking.org';
  });

  // Beer detail modals
  if (document.querySelector('.beer-detail-btn')) {
    const beerDetailModal = document.getElementById('beer-detail-modal');
    const closeBeerModal = document.getElementById('close-beer-modal');
    const beerDetailImage = document.querySelector('.beer-detail-image img');
    const beerDetailTitle = document.querySelector('.beer-detail-info h2');
    const beerDetailAbv = document.querySelector('.beer-detail-info .abv');
    const beerDetailIbu = document.querySelector('.beer-detail-info .ibu');
    const beerDetailStyle = document.querySelector('.beer-detail-info .style');
    const beerDetailDescription = document.querySelector('.beer-detail-info .beer-description');
    const beerDetailMalt = document.querySelector('.beer-detail-info .malt-value');
    const beerDetailHops = document.querySelector('.beer-detail-info .hops-value');
    const beerDetailYeast = document.querySelector('.beer-detail-info .yeast-value');
    const beerDetailFermentation = document.querySelector('.beer-detail-info .fermentation-value');

    // Beer data
    const beerData = {
      amber: {
        name: "Copperline Amber",
        abv: "5.8% ABV",
        ibu: "32 IBU",
        style: "American Amber Ale",
        description: "A perfectly balanced amber ale with rich caramel notes and a smooth finish. Brewed with a blend of crystal and caramel malts, creating its distinctive amber color and complex flavor profile.",
        image: "https://images.unsplash.com/photo-1514924953505-723a1d5f2e6d?auto=format&fit=crop&w=600&q=80",
        malt: "Pale malt, Crystal 40L, Crystal 80L, Caramel wheat",
        hops: "Cascade, Centennial",
        yeast: "California Ale Yeast",
        fermentation: "Warm fermentation at 68°F"
      },
      ipa: {
        name: "Trailblazer IPA",
        abv: "6.5% ABV",
        ibu: "65 IBU",
        style: "West Coast IPA",
        description: "Bold citrus and pine notes with a crisp bitter finish that celebrates Pacific Northwest hops. Aggressive dry hopping creates intense aromatics.",
        image: "https://images.unsplash.com/photo-1554692918-e3dc3b9ec9f7?auto=format&fit=crop&w=600&q=80",
        malt: "Pale malt, Crystal 20L",
        hops: "Simcoe, Citra, Amarillo (dry hopped)",
        yeast: "American Ale Yeast",
        fermentation: "Cool fermentation at 66°F"
      },
      stout: {
        name: "Midnight Stout",
        abv: "7.2% ABV",
        ibu: "40 IBU",
        style: "Irish Stout",
        description: "Rich coffee and chocolate notes with a velvety texture and smooth finish. Roasted barley creates the deep color and roasted flavor profile.",
        image: "https://images.unsplash.com/photo-1559205015-9e3ef3a5d0c4?auto=format&fit=crop&w=600&q=80",
        malt: "Pale malt, Roasted barley, Flaked oats, Chocolate malt",
        hops: "East Kent Goldings",
        yeast: "Irish Stout Yeast",
        fermentation: "Fermented at 65°F with nitrogen conditioning"
      },
      wheat: {
        name: "Summer Wheat",
        abv: "4.9% ABV",
        ibu: "18 IBU",
        style: "Hefeweizen",
        description: "A light, refreshing wheat beer with hints of banana and clove, perfect for warm days. Traditional German wheat beer yeast creates the characteristic flavors.",
        image: "https://images.unsplash.com/photo-1517278322228-3fe7a86cf6f0?auto=format&fit=crop&w=600&q=80",
        malt: "Wheat malt (50%), Pale malt",
        hops: "Hallertau",
        yeast: "Bavarian Wheat Yeast",
        fermentation: "Warmer fermentation at 68°F to enhance esters"
      },
      pilsner: {
        name: "Cascade Pilsner",
        abv: "5.2% ABV",
        ibu: "35 IBU",
        style: "German Pilsner",
        description: "A crisp, clean pilsner with noble hop character and a delicate malt backbone. Traditional decoction mashing creates the rich malt complexity.",
        image: "https://images.unsplash.com/photo-1554692918-e3dc3b9ec9f7?auto=format&fit=crop&w=600&q=80",
        malt: "Pilsner malt",
        hops: "Cascade, Saaz",
        yeast: "German Lager Yeast",
        fermentation: "Cold fermentation at 50°F followed by lagering"
      },
      red: {
        name: "Mountain Red",
        abv: "6.1% ABV",
        ibu: "45 IBU",
        style: "Irish Red Ale",
        description: "Malty sweetness with a hint of roast and a satisfying nutty finish. Balanced bitterness complements the rich malt character.",
        image: "https://images.unsplash.com/photo-1514924953505-723a1d5f2e6d?auto=format&fit=crop&w=600&q=80",
        malt: "Maris Otter, Crystal 60L, Black malt",
        hops: "Goldings, Fuggle",
        yeast: "Irish Ale Yeast",
        fermentation: "Fermented at 67°F"
      },
      hazy: {
        name: "Cloud Nine Hazy",
        abv: "7.0% ABV",
        ibu: "25 IBU",
        style: "New England IPA",
        description: "Tropical fruit flavors with a soft, juicy finish and minimal bitterness. Late hopping and wheat additions create the hazy appearance.",
        image: "https://images.unsplash.com/photo-1559205015-9e3ef3a5d0c4?auto=format&fit=crop&w=600&q=80",
        malt: "Pale malt, Wheat malt, Oats",
        hops: "Mosaic, Galaxy, Citra (heavily dry hopped)",
        yeast: "New England IPA Yeast",
        fermentation: "Low temperature fermentation with extensive dry hopping"
      },
      brown: {
        name: "Nut Brown Ale",
        abv: "5.5% ABV",
        ibu: "28 IBU",
        style: "English Brown Ale",
        description: "Toasted nuts and caramel with a smooth, satisfying finish. Balanced malt sweetness with subtle roast character.",
        image: "https://images.unsplash.com/photo-1517278322228-3fe7a86cf6f0?auto=format&fit=crop&w=600&q=80",
        malt: "Pale malt, Crystal 60L, Chocolate malt, Roasted barley",
        hops: "Kent Goldings",
        yeast: "English Ale Yeast",
        fermentation: "Traditional English fermentation at 68°F"
      }
    };

    document.querySelectorAll('.beer-detail-btn').forEach(button => {
      button.addEventListener('click', () => {
        const beerType = button.getAttribute('data-beer');
        const beer = beerData[beerType];
        
        if (beer) {
          beerDetailImage.src = beer.image;
          beerDetailImage.alt = `Photo of ${beer.name}`;
          beerDetailTitle.textContent = beer.name;
          beerDetailAbv.textContent = beer.abv;
          beerDetailIbu.textContent = beer.ibu;
          beerDetailStyle.textContent = beer.style;
          beerDetailDescription.textContent = beer.description;
          beerDetailMalt.textContent = beer.malt;
          beerDetailHops.textContent = beer.hops;
          beerDetailYeast.textContent = beer.yeast;
          beerDetailFermentation.textContent = beer.fermentation;
          
          beerDetailModal.classList.add('active');
          document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
      });
    });

    closeBeerModal.addEventListener('click', () => {
      beerDetailModal.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    });

    // Close modal when clicking on overlay
    beerDetailModal.addEventListener('click', (e) => {
      if (e.target === beerDetailModal) {
        beerDetailModal.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
      }
    });
  }

  // Beer filtering
  if (document.querySelector('.filter-btn')) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const beerCards = document.querySelectorAll('.beer-card');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');

        beerCards.forEach(card => {
          if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });
  }

  // Magnetic button effect
  const magneticButtons = document.querySelectorAll('.btn-primary:not(.btn-large)');
  
  magneticButtons.forEach(button => {
    let xTo = 0;
    let yTo = 0;
    let xFrom = 0;
    let yFrom = 0;
    let requestID = null;
    
    const lerp = (start, end, factor) => {
      return start * (1 - factor) + end * factor;
    };
    
    const animate = () => {
      xFrom = lerp(xFrom, xTo, 0.2);
      yFrom = lerp(yFrom, yTo, 0.2);
      
      button.style.transform = `translate(${xFrom}px, ${yFrom}px)`;
      
      if(Math.abs(xFrom) > 0.1 || Math.abs(yFrom) > 0.1) {
        requestID = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(requestID);
      }
    };
    
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;
      
      xTo = (relativeX - rect.width / 2) / 8;
      yTo = (relativeY - rect.height / 2) / 8;
      
      if(!requestID) {
        requestID = requestAnimationFrame(animate);
      }
    });
    
    button.addEventListener('mouseleave', () => {
      xTo = 0;
      yTo = 0;
    });
  });
});