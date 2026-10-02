// Scroll Progress Bar
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.appendChild(scrollProgress);

function updateScrollProgress() {
  const scrollTop = window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  scrollProgress.style.transform = `scaleX(${scrollPercent / 100})`;
}

window.addEventListener('scroll', updateScrollProgress);

// Image Reveal with Intersection Observer
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.clipPath = 'inset(0)';
      imageObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.work-item img, .gallery-item img').forEach(img => {
  img.style.clipPath = 'inset(12% 8% round 12px)';
  img.style.transition = 'clip-path 0.9s ease-out';
  imageObserver.observe(img);
});

// Gallery Filtering
if (document.querySelector('.gallery-page')) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const category = btn.dataset.category;
      
      galleryItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
          item.style.display = 'block';
          // Re-observe for image reveal
          imageObserver.observe(item.querySelector('img'));
        } else {
          item.style.display = 'none';
          // Stop observing hidden items
          imageObserver.unobserve(item.querySelector('img'));
        }
      });
    });
  });
}

// Lightbox functionality
if (document.querySelector('.gallery-grid')) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <span class="close-lightbox">&times;</span>
    <div class="lightbox-content">
      <img src="" alt="">
    </div>
  `;
  document.body.appendChild(lightbox);

  const closeLightbox = lightbox.querySelector('.close-lightbox');
  const lightboxImg = lightbox.querySelector('img');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.querySelector('img').src.replace('w=800', 'w=1200');
      lightboxImg.alt = item.querySelector('img').alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  closeLightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Form handling
if (document.querySelector('.contact-form')) {
  const form = document.querySelector('.contact-form');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simple validation
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = '#e74c3c';
      } else {
        field.style.borderColor = '';
      }
    });
    
    if (isValid) {
      // In a real implementation, you would submit the form
      alert('Thank you for your inquiry! We will contact you shortly.');
      form.reset();
    }
  });
}