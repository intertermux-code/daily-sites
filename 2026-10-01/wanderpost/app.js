// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navList = document.querySelector('.nav-list');

if (mobileMenuToggle && navList) {
  mobileMenuToggle.addEventListener('click', () => {
    navList.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
  });
}

// Spring Accordion functionality
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', function() {
    const accordionItem = this.parentElement;
    const isOpen = this.getAttribute('aria-expanded') === 'true';
    
    // Close all other panels in the same container
    const accordionContainer = this.closest('.itinerary-accordion, .section-accordion');
    accordionContainer.querySelectorAll('.accordion-header').forEach(otherHeader => {
      if (otherHeader !== this) {
        otherHeader.setAttribute('aria-expanded', 'false');
      }
    });
    
    accordionContainer.querySelectorAll('.accordion-panel').forEach(panel => {
      if (panel.previousElementSibling !== this) {
        panel.style.gridTemplateRows = '0fr';
      }
    });
    
    // Toggle current panel
    if (isOpen) {
      this.setAttribute('aria-expanded', 'false');
      header.nextElementSibling.style.gridTemplateRows = '0fr';
    } else {
      this.setAttribute('aria-expanded', 'true');
      header.nextElementSibling.style.gridTemplateRows = '1fr';
    }
  });
});

// Animated Counters
const animateValue = (element, start, end, duration) => {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Ease out expo function
    const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentValue = Math.floor(easeOutExpo * (end - start) + start);
    
    // Format the number with commas
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

// Intersection Observer for animated counters
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.5
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const targetElement = entry.target;
      const targetValue = parseInt(targetElement.dataset.target);
      
      // Only animate if the value hasn't been animated yet
      if (parseInt(targetElement.textContent) === 0) {
        animateValue(targetElement, 0, targetValue, 1200);
      }
      
      // Stop observing this element after animating
      counterObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all stat-number elements
document.querySelectorAll('.stat-number').forEach(stat => {
  counterObserver.observe(stat);
});

// Journey Detail Modals
const journeyDetailButtons = document.querySelectorAll('.journey-details-btn');
const modalOverlay = document.getElementById('journey-modal');
const modalCloseBtn = document.querySelector('.modal-close');

// Journey data
const journeyData = {
  kyoto: {
    title: 'Kyoto Heritage Walks',
    location: 'Japan',
    duration: '14 Days • Cultural Immersion',
    image: 'https://images.unsplash.com/photo-1545251142-f32ccc7efea5?auto=format&fit=crop&w=1600&q=80',
    itinerary: `
      <h4>Day 1-3: Arrival & Traditional Accommodations</h4>
      <p>Settle into a ryokan in Gion, attend a traditional tea ceremony, and explore the neighborhood.</p>
      
      <h4>Day 4-6: Temples & Gardens</h4>
      <p>Visit Kinkaku-ji (Golden Pavilion), Ryoan-ji Zen garden, and participate in morning meditation at a temple.</p>
      
      <h4>Day 7-9: Cultural Immersion</h4>
      <p>Take part in a kimono experience, learn traditional crafts, and enjoy kaiseki dining.</p>
      
      <h4>Day 10-14: Deeper Exploration</h4>
      <p>Explore Arashiyama bamboo groves, Fushimi Inari Shrine, and engage with local artisans.</p>
    `,
    included: [
      'Luxury ryokan accommodations for 13 nights',
      'Daily breakfast and 7 special dining experiences',
      'All entrance fees to temples and cultural sites',
      'English-speaking cultural guide',
      'Traditional activities (tea ceremony, crafts)',
      'Airport transfers',
      'Detailed cultural guidebook'
    ],
    expectations: `
      <p>This journey is designed for travelers seeking authentic cultural immersion at a leisurely pace. You'll spend multiple days in each neighborhood, allowing for spontaneous discoveries and meaningful interactions with locals.</p>
      
      <p>Physical requirements are minimal but involve walking on uneven surfaces and stairs. Comfortable walking shoes are essential. Weather varies by season, so packing layers is recommended.</p>
      
      <p>Expect to slow down and appreciate the details - from the arrangement of flowers in your accommodation to the changing light in temple gardens throughout the day.</p>
    `
  },
  patagonia: {
    title: 'Patagonia Trekking',
    location: 'Argentina & Chile',
    duration: '12 Days • Adventure',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    itinerary: `
      <h4>Day 1-2: El Calafate & Glaciers</h4>
      <p>Arrival in El Calafate, acclimatization walk, and visit to Perito Moreno Glacier.</p>
      
      <h4>Day 3-5: Torres del Paine National Park</h4>
      <p>Enter Chile, begin trekking in the iconic national park with views of the granite towers.</p>
      
      <h4>Day 6-8: Fitz Roy Region</h4>
      <p>Travel to El Chaltén, trek to Laguna de los Tres and Laguna Torre.</p>
      
      <h4>Day 9-11: Lago Argentino & Return</h4>
      <p>Scenic boat ride, wildlife spotting, and preparation for departure.</p>
      
      <h4>Day 12: Departure</h4>
      <p>Transfer to airport with scenic stops.</p>
    `,
    included: [
      'Professional mountain guides',
      'All park entrance fees',
      'Internal flights and transfers',
      'Accommodation in eco-lodges and refugios',
      'All meals during trekking',
      'Technical equipment for trails',
      'Emergency communication devices'
    ],
    expectations: `
      <p>This adventure is suited for moderately fit travelers comfortable with multi-day hiking. Daily treks range from 4-8 hours with elevation gains up to 1,000m.</p>
      
      <p>Packing should prioritize lightweight, weather-resistant gear. Temperatures can vary dramatically from 20°C (68°F) to -5°C (23°F) in a single day.</p>
      
      <p>Weather in Patagonia is unpredictable and can change rapidly. Flexibility in the itinerary is essential as conditions may require route adjustments.</p>
    `
  },
  marrakech: {
    title: 'Marrakech Cultural Immersion',
    location: 'Morocco',
    duration: '10 Days • Cultural',
    image: 'https://images.unsplash.com/photo-1517651469890-506eee1bdd39?auto=format&fit=crop&w=1600&q=80',
    itinerary: `
      <h4>Day 1-3: Riad Stay & Medersa Exploration</h4>
      <p>Arrival, settle into traditional riad, explore the medina and visit historical madrasas.</p>
      
      <h4>Day 4-5: Cooking & Craft Workshops</h4>
      <p>Morning market tour, traditional cooking class, and visits to artisan cooperatives.</p>
      
      <h4>Day 6-7: Atlas Mountain Excursion</h4>
      <p>Day trip to Berber villages in the High Atlas Mountains.</p>
      
      <h4>Day 8-10: Extended Cultural Experiences</h4>
      <p>Visit to Majorelle Garden, Hammam experience, storytelling evenings, and souk navigation workshop.</p>
    `,
    included: [
      'Luxury riad accommodations for 9 nights',
      'Daily breakfast and 6 cultural dining experiences',
      'Cooking class with local chef',
      'Private driver for excursions',
      'Entrance fees to museums and gardens',
      'Traditional hammam treatment',
      'Comprehensive Morocco guidebook'
    ],
    expectations: `
      <p>This cultural journey prioritizes authentic interactions over tourist experiences. You'll engage with local families, artisans, and cultural practitioners in their own environments.</p>
      
      <p>Dress modestly out of respect for local customs, especially when visiting religious sites. Comfortable shoes are necessary for navigating the medina's narrow, uneven streets.</p>
      
      <p>The pace alternates between activity-rich days and rest periods to accommodate the heat and sensory richness of Marrakech.</p>
    `
  },
  lofoten: {
    title: 'Lofoten Islands Retreat',
    location: 'Norway',
    duration: '8 Days • Wellness',
    image: 'https://images.unsplash.com/photo-1519677101349-e03828ae0e19?auto=format&fit=crop&w=1600&q=80',
    itinerary: `
      <h4>Day 1-2: Arrival & Coastal Settlements</h4>
      <p>Arrival in Svolvær, check into eco-friendly accommodation, and gentle coastal walks.</p>
      
      <h4>Day 3-4: Northern Lights & Photography</h4>
      <p>Evening aurora hunting, photography workshops, and traditional fishing experience.</p>
      
      <h4>Day 5-6: Mountain Wellness</h4>
      <p>Gentle hikes to viewpoints, mindfulness sessions, and visit to local artisans.</p>
      
      <h4>Day 7-8: Reflection & Departure</h4>
      <p>Final wellness activities, reflection circle, and departure.</p>
    `,
    included: [
      'Eco-friendly cabin accommodations for 7 nights',
      'All meals featuring local ingredients',
      'Northern lights guiding and photography tips',
      'Wellness activities and meditation sessions',
      'Kayaking or boat excursion',
      'Local artisan workshop',
      'Northern lights wake-up service'
    ],
    expectations: `
      <p>This retreat focuses on connection with nature and personal reflection. Activities are intentionally low-intensity to promote relaxation and mindfulness.</p>
      
      <p>Winter months bring extended darkness and potential for northern lights, while summer offers midnight sun. Pack accordingly for the season of travel.</p>
      
      <p>Accommodations feature traditional Norwegian design with modern comfort. Some may have limited connectivity to encourage digital detox.</p>
    `
  }
};

// Open modal with journey details
journeyDetailButtons.forEach(button => {
  button.addEventListener('click', () => {
    const journeyId = button.getAttribute('data-journey');
    const journey = journeyData[journeyId];
    
    if (journey) {
      document.getElementById('modal-image').style.backgroundImage = `url('${journey.image}')`;
      document.getElementById('modal-title').textContent = journey.title;
      document.getElementById('modal-location').textContent = journey.location;
      document.getElementById('modal-duration').textContent = journey.duration;
      document.getElementById('modal-itinerary').innerHTML = journey.itinerary;
      document.getElementById('modal-expectations').innerHTML = journey.expectations;
      
      // Populate included list
      const includedList = document.getElementById('modal-included');
      includedList.innerHTML = '';
      journey.included.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        includedList.appendChild(listItem);
      });
      
      // Show modal
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
});

// Close modal
modalCloseBtn?.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = 'auto';
});

// Close modal when clicking outside content
modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

// Stories Slider
const storiesSlider = document.querySelector('.stories-slider');
if (storiesSlider) {
  const slides = document.querySelectorAll('.story-slide');
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');
  const indicatorDots = document.querySelectorAll('.indicator-dot');
  
  let currentSlide = 0;
  
  function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    indicatorDots.forEach(dot => dot.classList.remove('active'));
    
    // Show current slide
    slides[index].classList.add('active');
    indicatorDots[index].classList.add('active');
  }
  
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }
  
  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  }
  
  // Button event listeners
  nextBtn?.addEventListener('click', nextSlide);
  prevBtn?.addEventListener('click', prevSlide);
  
  // Indicator dots
  indicatorDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentSlide = index;
      showSlide(currentSlide);
    });
  });
  
  // Auto-advance slides
  setInterval(nextSlide, 8000);
}

// Best Time to Visit Selector for Destination Page
const monthPicker = document.getElementById('month-picker');
if (monthPicker) {
  const monthDescriptions = {
    0: "January in Kyoto brings crisp air and fewer crowds. The temples take on a serene quality in winter, though some gardens may be dormant. Perfect for experiencing authentic Japanese winter traditions.",
    1: "February continues winter's grip but often brings clear skies. The month marks the beginning of spring preparations, with early blooms possible in sheltered areas. Ideal for contemplative temple visits.",
    2: "March signals the start of cherry blossom anticipation. Plum blossoms appear first, offering a preview of spring. The weather becomes more pleasant for extended outdoor walks.",
    3: "April is prime cherry blossom season in Kyoto. The famous sakura create stunning pink canopies throughout the city. Crowds increase significantly but the spectacle is unforgettable.",
    4: "May brings warm weather and the beautiful azalea displays. The famous Golden Pavilion reflects beautifully in the pond during this season. Comfortable temperatures make for ideal sightseeing.",
    5: "June is the rainy season, but this brings luscious green colors to Kyoto's gardens. The humidity can be challenging, but fewer tourists mean more peaceful temple experiences.",
    6: "July is hot and humid, but the Gion Matsuri festival provides a cultural highlight. Traditional summer activities and firefly viewing offer unique experiences despite the weather.",
    7: "August remains hot but features numerous Obon festivals. Many temples and gardens have special evening illuminations. Early morning visits become essential for comfort.",
    8: "September begins autumn's approach with cooler mornings. The season brings the beautiful Momiji foliage season preparation. Fewer crowds return compared to summer.",
    9: "October is one of the best months to visit Kyoto. The autumn foliage is spectacular, weather is comfortable, and the crowds are thinner than spring. A perfect balance.",
    10: "November is peak autumn season with stunning red and gold leaves. The weather is crisp and comfortable for walking. Popular months mean advance booking is essential.",
    11: "December brings cool temperatures and fewer crowds. Winter illuminations at temples create magical evening experiences. The season offers a more contemplative side of Kyoto."
  };

  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'month-description';
  descriptionElement.style.marginTop = '1.5rem';
  descriptionElement.style.paddingTop = '1rem';
  descriptionElement.style.borderTop = '1px solid var(--border)';
  descriptionElement.textContent = monthDescriptions[0]; // Initial description
  
  // Insert after the month picker
  monthPicker.parentNode.insertBefore(descriptionElement, monthPicker.nextSibling);

  monthPicker.addEventListener('change', () => {
    const selectedMonth = monthPicker.value;
    descriptionElement.textContent = monthDescriptions[selectedMonth];
  });
}

// Form submission handling
const enquiryForm = document.getElementById('trip-enquiry');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(enquiryForm);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.fullName || !data.email || !data.destination) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Simulate form submission
    const submitBtn = enquiryForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      alert(`Thank you, ${data.fullName}! Your enquiry has been received. We'll contact you shortly to plan your journey.`);
      enquiryForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });
}

// Initialize accordion panels with proper heights
document.querySelectorAll('.accordion-panel').forEach(panel => {
  // Set initial state to collapsed
  panel.style.gridTemplateRows = '0fr';
});