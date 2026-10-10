/**
 * LENSCRAFT — SHARED ARCHITECTURAL JAVASCRIPT
 * Handles Mobile Menu, Motion Parallax, Scroll Progress, Gallery Lightbox & Filtering, and Form Handling.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll Progress Bar Update
  initScrollProgress();

  // 2. Mobile Menu Controller
  initMobileMenu();

  // 3. Parallax Layers Motion (Honors prefers-reduced-motion)
  initParallaxLayers();

  // 4. Page Specific Handlers (Guarded by DOM Presence)
  initGalleryFeatures();
  initContactForm();
});

/**
 * Secondary Motion: 2px Scroll Progress Bar at Viewport Top
 */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = height > 0