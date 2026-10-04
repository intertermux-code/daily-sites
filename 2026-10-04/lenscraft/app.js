// Magnetic button functionality
document.addEventListener('DOMContentLoaded', () => {
  const magneticButtons = document.querySelectorAll('.magnetic-btn');
  
  magneticButtons.forEach(button => {
    const moveFactor = 0.1;
    const maxMove = 12;
    
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + 
        Math.pow(e.clientY - centerY, 2)
      );
      
      if (distance < 120) {
        const moveX = (e.clientX - centerX) * moveFactor;
        const moveY = (e.clientY - centerY) * moveFactor;
        
        // Limit the movement to maxMove pixels
        const limitedMoveX = Math.max(Math.min(moveX, maxMove), -maxMove);
        const limitedMoveY = Math.max(Math.min(moveY, maxMove), -maxMove);
        
        button.style.transform = `translate(${limitedMoveX}px, ${limitedMoveY}px)`;
      }
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0, 0)';
    });
  });

  // Gallery filtering functionality
  if (document.querySelector('.gallery-grid')) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
          if (filterValue === 'all' || item.classList.contains(filterValue)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // Lightbox functionality
  if (document.getElementById('lightbox')) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-image');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentIndex = 0;

    // Open lightbox when gallery image is clicked
    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        currentIndex = index;
        document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
      });
    });

    // Close lightbox
    closeBtn.addEventListener('click', () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
    });

    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      }
    });

    // Navigation buttons
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showPrevImage();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showNextImage();
    });

    function showPrevImage() {
      const visibleItems = Array.from(galleryItems).filter(item => 
        item.style.display !== 'none'
      );
      currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
      const img = visibleItems[currentIndex].querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
    }

    function showNextImage() {
      const visibleItems = Array.from(galleryItems).filter(item => 
        item.style.display !== 'none'
      );
      currentIndex = (currentIndex + 1) % visibleItems.length;
      const img = visibleItems[currentIndex].querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
    }
  }

  // Form submission handling
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form values
      const formData = new FormData(bookingForm);
      const formObject = Object.fromEntries(formData.entries());
      
      // Basic validation
      if (!formObject.fullName || !formObject.email) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // In a real application, you would send the form data to a server here
      console.log('Form submitted:', formObject);
      
      // Show success message
      alert('Thank you for your inquiry! We will contact you shortly to discuss your special day.');
      
      // Reset form
      bookingForm.reset();
    });
  }
});