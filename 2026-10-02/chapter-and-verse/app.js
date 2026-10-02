// Decode Text Animation
function initDecodeText() {
  const decodeElements = document.querySelectorAll('.decode-text');
  
  decodeElements.forEach(element => {
    const originalText = element.getAttribute('data-text');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let iteration = 0;
    const originalLength = originalText.length;
    
    const interval = setInterval(() => {
      element.textContent = originalText
        .split('')
        .map((char, index) => {
          if (index < iteration) {
            return char;
          }
          
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      
      if (iteration >= originalLength) {
        clearInterval(interval);
      }
      
      iteration += 1 / 3; // Slower iteration for better effect
    }, 60);
  });
}

// Spring Accordion for Events
function initAccordion() {
  const accordionItems = document.querySelectorAll('.event-item');
  
  accordionItems.forEach(item => {
    const button = item.querySelector('.event-header');
    const content = item.querySelector('.event-content');
    const contentId = button.getAttribute('aria-controls');
    const contentElement = document.getElementById(contentId);
    
    // Set initial state
    content.style.gridTemplateRows = '0fr';
    
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      // Close all other panels
      accordionItems.forEach(otherItem => {
        if (otherItem !== item) {
          const otherButton = otherItem.querySelector('.event-header');
          const otherContent = otherItem.querySelector('.event-content');
          const otherContentId = otherButton.getAttribute('aria-controls');
          const otherContentElement = document.getElementById(otherContentId);
          
          otherButton.setAttribute('aria-expanded', 'false');
          otherContent.style.gridTemplateRows = '0fr';
          otherContentElement.setAttribute('aria-hidden', 'true');
        }
      });
      
      // Toggle current panel
      if (isExpanded) {
        button.setAttribute('aria-expanded', 'false');
        content.style.gridTemplateRows = '0fr';
        contentElement.setAttribute('aria-hidden', 'true');
      } else {
        button.setAttribute('aria-expanded', 'true');
        content.style.gridTemplateRows = '1fr';
        contentElement.setAttribute('aria-hidden', 'false');
      }
    });
  });
}

// Book Filter for Books Page
function initBookFilter() {
  if (!document.querySelector('.genre-filter')) return;
  
  const filterButtons = document.querySelectorAll('.filter-btn');
  const bookItems = document.querySelectorAll('.book-item');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const selectedGenre = button.getAttribute('data-genre');
      
      // Filter books
      bookItems.forEach(book => {
        const bookGenre = book.getAttribute('data-genre');
        
        if (selectedGenre === 'all' || bookGenre === selectedGenre) {
          book.style.display = 'block';
        } else {
          book.style.display = 'none';
        }
      });
    });
  });
}

// Form Submission for Book Club
function initBookClubForm() {
  const form = document.getElementById('bookClubForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Simple validation
    if (!data.name || !data.email) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real application, you would send this data to a server
    console.log('Form submitted:', data);
    alert('Thank you for joining our book club! We will contact you shortly.');
    form.reset();
  });
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initDecodeText();
  initAccordion();
  initBookFilter();
  initBookClubForm();
});