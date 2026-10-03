/* ========================================
   MINTWISE — App JavaScript
   ======================================== */

(function() {
  'use strict';

  // Navigation toggle for mobile
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  
  if (navToggle && navList) {
    navToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      navList.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navToggle.contains(e.target) && !navList.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        navList.classList.remove('active');
      }
    });
  }

  // Clip-path reveal animation
  const revealElements = document.querySelectorAll('.reveal');
  
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function(el) {
      revealObserver.observe(el);
    });
  }

  // Animated counters on hero stats
  const statValues = document.querySelectorAll('[data-count]');
  
  if (statValues.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-count'));
          const isDecimal = target % 1 !== 0;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          let step = 0;

          const timer = setInterval(function() {
            step++;
            current += increment;
            
            if (step >= steps) {
              current = target;
              clearInterval(timer);
            }
            
            if (isDecimal) {
              el.textContent = current.toFixed(1);
            } else {
              el.textContent = Math.floor(current).toLocaleString();
            }
          }, duration / steps);

          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statValues.forEach(function(el) {
      counterObserver.observe(el);
    });
  }

  // Budget Calculator
  const budgetForm = document.getElementById('budget-form');
  
  if (budgetForm) {
    const calculateBudget = function() {
      // Get income values
      const incomePrimary = parseFloat(document.getElementById('income-primary').value) || 0;
      const incomeSecondary = parseFloat(document.getElementById('income-secondary').value) || 0;
      const incomeOther = parseFloat(document.getElementById('income-other').value) || 0;
      
      // Get expense values
      const expenseRent = parseFloat(document.getElementById('expense-rent').value) || 0;
      const expenseUtilities = parseFloat(document.getElementById('expense-utilities').value) || 0;
      const expenseInsurance = parseFloat(document.getElementById('expense-insurance').value) || 0;
      const expenseSubscriptions = parseFloat(document.getElementById('expense-subscriptions').value) || 0;
      const expenseFood = parseFloat(document.getElementById('expense-food').value) || 0;
      const expenseTransport = parseFloat(document.getElementById('expense-transport').value) || 0;
      const expensePersonal = parseFloat(document.getElementById('expense-personal').value) || 0;
      const expenseOther = parseFloat(document.getElementById('expense-other').value) || 0;
      
      // Calculate totals
      const totalIncome = incomePrimary + incomeSecondary + incomeOther;
      const totalExpenses = expenseRent + expenseUtilities + expenseInsurance + 
                           expenseSubscriptions + expenseFood + expenseTransport + 
                           expensePersonal + expenseOther;
      const monthlySavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;
      
      // Update summary
      document.getElementById('total-income').textContent = '$' + totalIncome.toLocaleString();
      document.getElementById('total-expenses').textContent = '$' + totalExpenses.toLocaleString();
      document.getElementById('monthly-savings').textContent = '$' + monthlySavings.toLocaleString();
      
      // Update donut chart
      const donutExpenses = document.getElementById('donut-expenses');
      const donutSavings = document.getElementById('donut-savings');
      const circumference = 2 * Math.PI * 80; // r=80
      
      if (totalIncome > 0) {
        const expensePercent = (totalExpenses / totalIncome) * 100;
        const savingsPercent = (monthlySavings / totalIncome) * 100;
        
        const expenseOffset = circumference - (expensePercent / 100) * circumference;
        const savingsOffset = circumference - (savingsPercent / 100) * circumference;
        
        donutExpenses.style.strokeDashoffset = expenseOffset;
        donutSavings.style.strokeDashoffset = circumference - (savingsPercent / 100) * circumference;
        donutSavings.style.transform = 'rotate(' + (expensePercent * 3.6 - 90) + 'deg)';
      } else {
        donutExpenses.style.strokeDashoffset = circumference;
        donutSavings.style.strokeDashoffset = circumference;
      }
      
      // Update donut labels
      document.getElementById('savings-percent').textContent = Math.round(savingsRate) + '%';
      document.getElementById('legend-expenses').textContent = Math.round(100 - savingsRate) + '%';
      document.getElementById('legend-savings').textContent = Math.round(savingsRate) + '%';
      
      // Update projections
      const annualSavings = monthlySavings * 12;
      document.getElementById('annual-savings').textContent = '$' + annualSavings.toLocaleString();
      document.getElementById('five-year').textContent = '$' + (annualSavings * 5).toLocaleString();
      
      const sixMonthExpenses = totalExpenses * 6;
      document.getElementById('emergency-fund').textContent = '$' + sixMonthExpenses.toLocaleString();
      
      if (monthlySavings > 0) {
        const monthsToEF = Math.ceil(sixMonthExpenses / monthlySavings);
        document.getElementById('time-to-ef').textContent = monthsToEF + ' months';
      } else {
        document.getElementById('time-to-ef').textContent = 'N/A';
      }
      
      // Update insights
      const insightContent = document.getElementById('insight-content');
      let insightHTML = '';
      
      if (savingsRate >= 35) {
        insightHTML = '<p><strong>Exceptional discipline.</strong> At ' + Math.round(savingsRate) + '%, you\'re in the top 1% of savers. You\'re on track for financial independence in 15-20 years. Consider consulting a financial advisor to optimize tax strategy.</p>';
      } else if (savingsRate >= 20) {
        insightHTML = '<p><strong>Your savings rate is strong.</strong> At ' + Math.round(savingsRate) + '%, you\'re saving well above the national average of 4.3%. Keep this pace and you\'ll build a 6-month emergency fund in ' + Math.ceil(sixMonthExpenses / monthlySavings) + ' months.</p>';
      } else if (savingsRate >= 10) {
        insightHTML = '<p><strong>You\'re on track.</strong> At ' + Math.round(savingsRate) + '%, you\'re saving at a healthy pace. Consider increasing by 1% each quarter to accelerate your financial goals.</p>';
      } else if (savingsRate > 0) {
        insightHTML = '<p><strong>Room for improvement.</strong> At ' + Math.round(savingsRate) + '%, you\'re saving less than most Americans. Focus on one expense category to cut—subscriptions are often the easiest win.</p>';
      } else {
        insightHTML = '<p><strong>Critical alert.</strong> You\'re spending more than you earn. Review your expenses immediately and identify areas to cut. Consider increasing income through side work.</p>';
      }
      
      insightContent.innerHTML = insightHTML;
    };
    
    // Attach event listeners to all inputs
    const inputs = budgetForm.querySelectorAll('input[type="number"]');
    inputs.forEach(function(input) {
      input.addEventListener('input', calculateBudget);
    });
    
    // Initial calculation
    calculateBudget();
    
    // Sample data button
    const sampleButton = document.getElementById('btn-sample');
    if (sampleButton) {
      sampleButton.addEventListener('click', function() {
        document.getElementById('income-primary').value = '6000';
        document.getElementById('income-secondary').value = '800';
        document.getElementById('income-other').value = '200';
        document.getElementById('expense-rent').value = '2000';
        document.getElementById('expense-utilities').value = '300';
        document.getElementById('expense-insurance').value = '250';
        document.getElementById('expense-subscriptions').value = '100';
        document.getElementById('expense-food').value = '700';
        document.getElementById('expense-transport').value = '350';
        document.getElementById('expense-personal').value = '300';
        document.getElementById('expense-other').value = '200';
        calculateBudget();
      });
    }
    
    // Reset button
    budgetForm.addEventListener('reset', function() {
      setTimeout(calculateBudget, 10);
    });
  }

  // Pricing billing toggle
  const billingRadios = document.querySelectorAll('input[name="billing"]');
  
  if (billingRadios.length > 0) {
    const priceAmounts = document.querySelectorAll('.price-amount');
    
    billingRadios.forEach(function(radio) {
      radio.addEventListener('change', function() {
        const billingType = this.value;
        priceAmounts.forEach(function(amount) {
          const price = amount.getAttribute('data-' + billingType);
          amount.textContent = price;
        });
      });
    });
  }

  // Contact form handling
  const supportForm = document.getElementById('support-form');
  
  if (supportForm) {
    supportForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const submitButton = this.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      // Simulate form submission
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;
      
      setTimeout(function() {
        submitButton.textContent = 'Message sent!';
        submitButton.style.background = '#10b981';
        
        setTimeout(function() {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
          supportForm.reset();
        }, 3000);
      }, 1500);
    });
  }

  // FAQ accordion (native details/summary, no JS needed)
  // But we can add keyboard support for better UX
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(function(item) {
    const summary = item.querySelector('.faq-question');
    
    summary.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.open = !item.open;
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      if (href !== '#' && href.length > 1) {
        const target = document.querySelector(href);
        
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Marquee pause on hover (CSS handles this, but adding for touch devices)
  const marquees = document.querySelectorAll('.marquee');
  
  marquees.forEach(function(marquee) {
    marquee.addEventListener('mouseenter', function() {
      this.style.animationPlayState = 'paused';
    });
    
    marquee.addEventListener('mouseleave', function() {
      this.style.animationPlayState = 'running';
    });
    
    // Touch support
    marquee.addEventListener('touchstart', function() {
      this.style.animationPlayState = 'paused';
    });
    
    marquee.addEventListener('touchend', function() {
      const self = this;
      setTimeout(function() {
        self.style.animationPlayState = 'running';
      }, 2000);
    });
  });

})();
```