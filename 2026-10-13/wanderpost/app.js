document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('active');
    });
  }

  // Header Scroll Effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Signature Motion 1: Blur-Fade Ascend via IntersectionObserver
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-me').forEach((el, idx) => {
      // Stagger siblings slightly
      el.style.transitionDelay = `${(idx % 4) * 80}ms`;
      revealObserver.observe(el);
    });

    // Signature Motion 2: Parallax Layers via rAF
    const parallaxLayers = document.querySelectorAll('[data-speed]');
    if (parallaxLayers.length > 0) {
      let latestKnownScrollY = 0;
      let ticking = false;

      function updateParallax() {
        parallaxLayers.forEach((layer) => {
          const speed = parseFloat(layer.getAttribute('data-speed')) || 0.2;
          const yPos = -(latestKnownScrollY * speed);
          layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        ticking = false;
      }

      window.addEventListener('scroll', () => {
        latestKnownScrollY = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      });
    }
  } else {
    // Instantly reveal all elements if motion is reduced
    document.querySelectorAll('.reveal-me').forEach(el => el.classList.add('in'));
  }

  // Journeys Page: Detail Modals
  const modal = document.getElementById('journey-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.modal-close');
    const modalTitle = modal.querySelector('#modal-title');
    const modalBody = modal.querySelector('#modal-body');

    const journeyDetails = {
      kyoto: {
        title: "Kyoto: The Art of Silence & Cedar",
        content: "<p>Stay 10 days in an authentic wooden machiya in the Higashiyama district. Wake to morning chanting at Kodai-ji, learn traditional bamboo craft from a 4th-generation artisan, and take silent twilight strolls through tea groves untouched by modern noise.</p><br><p><strong>Includes:</strong> Private tea ceremonies, bullet train transfers, traditional kaiseki meals, and expert local cultural guide.</p>"
      },
      patagonia: {
        title: "Patagonia: Wind, Granite & Silence",
        content: "<p>A 12-day slow trek across private reserves near Torres del Paine. Experience remote estancias, slow-cooked lamb, and days spent watching condors sweep across dramatic granite peaks without rushing through crowded checkpoints.</p><br><p><strong>Includes:</strong> Private wooden cabin stays, professional mountain guide, all regional meals, and internal charter flights.</p>"
      },
      marrakech: {
        title: "Marrakech & High Atlas: Shadow & Light",
        content: "<p>Spend 8 days discovering the slow rhythms of Morocco. From quiet courtyards in secluded riads to traditional Berber villages tucked deep into the Atlas mountain range, enjoy slow artisan workshops and sunset dinners.</p><br><p><strong>Includes:</strong> Boutique riad accommodations, private desert transfers, culinary workshops, and heritage walking tours.</p>"
      },
      lofoten: {
        title: "Lofoten: Arctic Light & Fjords",
        content: "<p>A 9-day deep dive into the winter realm of northern Norway. Sleep in converted fishing cabins (rorbuer), sail slow through quiet fjords, and witness the dance of the Aurora Borealis from secluded coastal saunas.</p><br><p><strong>Includes:</strong> Rorbu stays, private boat expeditions, sauna & arctic plunge experiences, and night sky photography guidance.</p>"
      }
    };

    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const key = trigger.getAttribute('data-modal-target');
        if (journeyDetails[key]) {
          modalTitle.textContent = journeyDetails[key].title;
          modalBody.innerHTML = journeyDetails[key].content;
          modal.classList.add('open');
          modal.setAttribute('aria-hidden', 'false');
        }
      });
    });

    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  // Destination Page: Best Time to Visit Month Picker
  const monthPicker = document.querySelector('.month-picker-grid');
  if (monthPicker) {
    const detailBox = document.getElementById('month-detail-info');
    const monthBtns = monthPicker.querySelectorAll('.month-btn');

    const monthData = {
      jan: "January brings crisp winter skies, peaceful temple visits, and fewer travelers. Perfect for quiet reflection.",
      feb: "February offers plum blossoms starting to bloom and clear snowy views over the northern hills.",
      mar: "March marks the early cherry blossom season. Energetic ambiance with mild daytime temperatures.",
      apr: "April is peak Cherry Blossom season. Vibrant pink canopies across the city, though requiring early booking.",
      may: "May brings lush fresh greenery (Shinryoku), warm pleasant breeze, and ideal hiking weather.",
      jun: "June is the moss garden season. Soft rains bring out deep vibrant emerald colors in zen gardens.",
      jul: "July brings traditional Gion Matsuri summer festivals with warm evenings and vibrant street life.",
      aug: "August features mountain retreats, cool river dining (Kawadoko), and night temple illuminations.",
      sep: "September offers pleasant early autumn breezes, ideal conditions for long rural village walks.",
      oct: "October brings comfortable temperate days and crystal clear autumn skies.",
      nov: "November brings striking brilliant crimson maple leaves (Koyo) across ancient temple grounds.",
      dec: "December offers serene winter atmosphere, crisp air, and tranquil hot spring retreats."
    };

    monthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        monthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mKey = btn.getAttribute('data-month');
        if (detailBox && monthData[mKey]) {
          detailBox.textContent = monthData[mKey];
        }
      });
    });
  }

  // Stories Page: Traveler Stories Slider
  const sliderTrack = document.querySelector('.slider-track');
  if (sliderTrack) {
    const slides = sliderTrack.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let currentIndex = 0;

    const updateSlider = () => {
      sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlider();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlider();
      });
    }
  }

  // Form Handling (Enquiry Page)
  const enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) {
    const feedbackMsg = document.getElementById('form-feedback');
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = enquiryForm.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Transmitting...';

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = origText;
        enquiryForm.reset();
        if (feedbackMsg) {
          feedbackMsg.style.display = 'block';
          feedbackMsg.className = 'form-feedback success';
          feedbackMsg.textContent = 'Thank you. Your bespoke journey enquiry has been received. A travel curator will contact you within 24 hours.';
        }
      }, 1200);
    });
  }
});