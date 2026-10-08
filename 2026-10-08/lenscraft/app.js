// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components based on page content
  initWordStaggerAnimation();
  initScrollProgress();
  initGalleryFilter();
  initLightbox();
  initFormHandling();
});

// Word Stagger Animation for Hero Titles
function initWordStaggerAnimation() {
  const wordElements = document.querySelectorAll('.word');
  
  if (wordElements.length > 0) {
    // Calculate delay for each word to create stagger effect
    wordElements.forEach((word, index) => {
      // Set initial state for reduced motion users
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        word.style.animation = 'none';
        word.style.opacity = '1';
        word.style.transform = 'translateY(0) rotate(0)';
      }
    });
  }
}

// Scroll Progress Bar
function initScrollProgress() {
  const progressBar = document.querySelector('.progress-bar');
  
  if (!progressBar) return;
  
  const updateProgressBar = () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = Math.max(0, Math.min(100, (scrollTop / docHeight) * 100));
    
    progressBar.style.width = `${scrollPercent}%`;
  };
  
  window.addEventListener('scroll', updateProgressBar);
  updateProgressBar(); // Initial call
}

// Gallery Filtering
function initGalleryFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (filterButtons.length === 0 || galleryItems.length === 0) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
      // Show/hide items based on filter
      galleryItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Lightbox Functionality
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-nav.prev');
  const nextBtn = document.querySelector('.lightbox-nav.next');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (!lightbox || !galleryItems.length) return;
  
  let currentIndex = 0;
  let currentImages = [];
  
  // Open lightbox
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      currentIndex = index;
      updateCurrentImages();
      const imgSrc = item.querySelector('img').src;
      const imgAlt = item.querySelector('img').alt;
      
      lightboxImg.src = imgSrc;
      lightboxImg.alt = imgAlt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    });
  });
  
  // Close lightbox
  closeBtn.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  });
  
  // Click outside image to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // Navigation buttons
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateImage(-1);
  });
  
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateImage(1);
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft') {
      navigateImage(-1);
    } else if (e.key === 'ArrowRight') {
      navigateImage(1);
    }
  });
  
  // Update current images array based on active filter
  function updateCurrentImages() {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    if (activeFilter === 'all') {
      currentImages = Array.from(galleryItems);
    } else {
      currentImages = Array.from(galleryItems).filter(item => 
        item.dataset.category === activeFilter
      );
    }
  }
  
  // Navigate between images
  function navigateImage(direction) {
    updateCurrentImages();
    currentIndex += direction;
    
    // Handle circular navigation
    if (currentIndex < 0) {
      currentIndex = currentImages.length - 1;
    } else if (currentIndex >= currentImages.length) {
      currentIndex = 0;
    }
    
    const currentImageItem = currentImages[currentIndex];
    const imgSrc = currentImageItem.querySelector('img').src;
    const imgAlt = currentImageItem.querySelector('img').alt;
    
    lightboxImg.src = imgSrc;
    lightboxImg.alt = imgAlt;
  }
}

// Form Handling
function initFormHandling() {
  const bookingForm = document.getElementById('bookingForm');
  
  if (!bookingForm) return;
  
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(bookingForm);
    const formObject = Object.fromEntries(formData);
    
    // Basic validation
    if (!formObject.fullName || !formObject.email || !formObject.location) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real application, you would send the data to a server here
    console.log('Form submitted:', formObject);
    
    // Show success message
    alert('Thank you for your inquiry! I will contact you shortly to discuss your special day.');
    
    // Reset form
    bookingForm.reset();
  });
}