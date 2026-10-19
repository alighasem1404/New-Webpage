(() => {
  const button = document.createElement('button');
  button.className = 'scroll-to-top';
  button.type = 'button';
  button.setAttribute('aria-label', 'Scroll to top');
  button.title = 'Scroll to top';
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>';
  document.body.append(button);

  const updateVisibility = () => {
    button.classList.toggle('is-visible', window.scrollY > 320);
  };

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility, { passive: true });
  updateVisibility();

  button.addEventListener('click', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
})();
