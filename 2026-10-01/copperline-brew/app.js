// Copperline Brewing Co. - JavaScript functionality

// Magnetic button effect
class MagneticButton {
  constructor(element) {
    this.element = element;
    this.moveable = true;
    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpAmount = 0.1;
    
    this.init();
  }
  
  init() {
    this.element.addEventListener('mousemove', (e) => {
      if (!this.moveable) return;
      
      const rect = this.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      
      // Only move if within 120px radius
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      if (distance <= 120) {
        this.targetX = distanceX * 0.1;
        this.targetY = distanceY * 0.1;
        
        // Add slight scale when closest
        if (distance < 60) {
          this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(1.04)`;
        } else {
          this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
        }
      } else {
        this.resetPosition();
      }
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.resetPosition();
    });
    
    // Start animation loop
    this.animate();
  }
  
  resetPosition() {
    this.targetX = 0;
    this.targetY = 0;
    this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
  }
  
  animate() {
    // Linear interpolation (lerp) to smoothly move towards target
    this.currentX += (this.targetX - this.currentX) * this.lerpAmount;
    this.currentY += (this.targetY - this.currentY) * this.lerpAmount;
    
    // Apply transformation
    this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize magnetic buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize age gate modal
  const ageGateModal = document.getElementById('age-gate-modal');
  const enterBtn = document.getElementById('enter-btn');
  const exitBtn = document.getElementById('exit-btn');
  
  // Show age gate modal on index.html
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    setTimeout(() => {
      ageGateModal.classList.add('active');
    }, 500);
  }
  
  // Handle age gate confirmation
  enterBtn?.addEventListener('click', () => {
    ageGateModal.classList.remove('active');
  });
  
  exitBtn?.addEventListener('click', () => {
    // Redirect to an external page if under 21
    window.location.href = 'https://www.google.com';
  });
  
  // Initialize magnetic buttons
  const magneticButtons = document.querySelectorAll('.magnetic-btn');
  magneticButtons.forEach(button => {
    new MagneticButton(button);
  });
  
  // Additional magnetic buttons on other pages
  const allPrimaryButtons = document.querySelectorAll('.btn-primary:not(.magnetic-btn)');
  allPrimaryButtons.forEach(button => {
    new MagneticButton(button);
  });
  
  // Initialize scroll progress bar
  const scrollProgressBar = document.createElement('div');
  scrollProgressBar.className = 'scroll-progress';
  scrollProgressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
  document.body.appendChild(scrollProgressBar);
  
  const progressBar = scrollProgressBar.querySelector('.scroll-progress-bar');
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.offsetHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = scrollTop / (docHeight - winHeight);
    const scrollPercentRounded = Math.round(scrollPercent * 100);
    
    if (progressBar) {
      progressBar.style.width = `${scrollPercentRounded}%`;
    }
  });
  
  // Beer detail modals
  const beerDetailModal = document.getElementById('beer-detail-modal');
  const closeBeerModal = document.getElementById('close-beer-modal');
  const beerDetailContent = document.getElementById('beer-detail-content');
  const beerDetailButtons = document.querySelectorAll('.beer-detail-btn');
  
  // Sample beer data for modal content
  const beerData = {
    'rustic-ipa': {
      name: 'Rustic IPA',
      abv: '6.8%',
      ibu: '65',
      style: 'American IPA',
      description: 'A bold and hoppy ale with citrus and pine notes, balanced by a firm malt backbone. Perfect for those who enjoy intense flavors.',
      image: 'https://images.unsplash.com/photo-1514933651103-0025806ea3f0?auto=format&fit=crop&w=800&q=80',
      origin: 'Portland, Oregon',
      ingredients: 'Cascade, Centennial, and Columbus hops; Pale and crystal malts',
      tastingNotes: 'Bold citrus and pine aromas with a strong hop bitterness balanced by a firm malt backbone.'
    },
    'copper-lager': {
      name: 'Copper Lager',
      abv: '4.9%',
      ibu: '18',
      style: 'Vienna Lager',
      description: 'A smooth and refreshing lager with a rich amber color and malty sweetness. Brewed with German hops for a clean finish.',
      image: 'https://images.unsplash.com/photo-1554627383-85ba6d0b5d5e?auto=format&fit=crop&w=800&q=80',
      origin: 'Portland, Oregon',
      ingredients: 'German noble hops; Vienna and Munich malts',
      tastingNotes: 'Smooth and malty with a clean, crisp finish and subtle hop presence.'
    },
    'mountain-stout': {
      name: 'Mountain Stout',
      abv: '7.2%',
      ibu: '45',
      style: 'Irish Stout',
      description: 'A rich and creamy stout with notes of coffee, chocolate, and roasted barley. Smooth and full-bodied with a velvety texture.',
      image: 'https://images.unsplash.com/photo-1559922444-9a39086e7ee0?auto=format&fit=crop&w=800&q=80',
      origin: 'Portland, Oregon',
      ingredients: 'Roasted barley, chocolate malt, flaked oats',
      tastingNotes: 'Rich coffee and chocolate flavors with a smooth, creamy texture and dry finish.'
    },
    'trail-pale': {
      name: 'Trail Pale',
      abv: '5.4%',
      ibu: '35',
      style: 'American Pale Ale',
      description: 'A well-balanced pale ale with moderate hop bitterness and hints of caramel malt. Easy-drinking with a crisp finish.',
      image: 'https://images.unsplash.com/photo-1514933651103-0025806ea3f0?auto=format&fit=crop&w=800&q=80',
      origin: 'Portland, Oregon',
      ingredients: 'Centennial and Amarillo hops; Pale and caramel malts',
      tastingNotes: 'Balanced malt sweetness with moderate hop bitterness and citrus notes.'
    },
    'amber-ale': {
      name: 'Amber Ale',
      abv: '5.8%',
      ibu: '40',
      style: 'American Amber Ale',
      description: 'A medium-bodied ale with a rich amber color and balanced malt sweetness. Features notes of toasted nuts and caramel.',
      image: 'https://images.unsplash.com/photo-1554627383-85ba6d0b5d5e?auto=format&fit=crop&w=800&q=80',
      origin: 'Portland, Oregon',
      ingredients: 'Crystal and cara malts; Cascade hops',
      tastingNotes: 'Toasted nut and caramel flavors with a balanced hop presence.'
    },
    'wheat-beer': {
      name: 'Hazy Wheat',
      abv: '4.7%',
      ibu: '12',
      style: 'Hefeweizen',
      description: 'A cloudy wheat beer with banana and clove notes from German yeast. Light and refreshing with a smooth mouthfeel.',
      image: 'https://images.unsplash.com/photo-1604999565946-aa500afb0e6a?auto=format&fit=crop&w=800&q=80',
      origin: 'Portland, Oregon',
      ingredients: 'Wheat malt, German ale yeast, Saaz hops',
      tastingNotes: 'Banana and clove esters with a smooth, creamy texture and light hop presence.'
    }
  };
  
  // Open beer detail modal
  beerDetailButtons.forEach(button => {
    button.addEventListener('click', () => {
      const beerId = button.getAttribute('data-beer-id');
      const beer = beerData[beerId];
      
      if (beer) {
        beerDetailContent.innerHTML = `
          <div class="beer-detail-modal-content">
            <div class="beer-detail-image">
              <img src="${beer.image}" alt="${beer.name}" width="400" height="300">
            </div>
            <div class="beer-detail-info">
              <h2>${beer.name}</h2>
              <div class="beer-tags">
                <span class="tag abv">ABV: ${beer.abv}</span>
                <span class="tag ibu">IBU: ${beer.ibu}</span>
                <span class="tag style">Style: ${beer.style}</span>
              </div>
              <p>${beer.description}</p>
              <h3>Origin</h3>
              <p>${beer.origin}</p>
              <h3>Ingredients</h3>
              <p>${beer.ingredients}</p>
              <h3>Tasting Notes</h3>
              <p>${beer.tastingNotes}</p>
            </div>
          </div>
        `;
        
        beerDetailModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
      }
    });
  });
  
  // Close beer detail modal
  closeBeerModal?.addEventListener('click', () => {
    beerDetailModal.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
  });
  
  // Close modal when clicking outside content
  beerDetailModal?.addEventListener('click', (e) => {
    if (e.target === beerDetailModal) {
      beerDetailModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (beerDetailModal.classList.contains('active')) {
        beerDetailModal.classList.remove('active');
        document.body.style.overflow = '';
      }
      if (ageGateModal.classList.contains('active')) {
        ageGateModal.classList.remove('active');
      }
    }
  });
});