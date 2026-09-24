(() => {
  const filters = [...document.querySelectorAll('[data-blog-filter]')];
  const cards = [...document.querySelectorAll('.blog-card')];
  const count = document.querySelector('#blog-count');

  const applyFilter = (filter) => {
    let visibleCount = 0;

    filters.forEach((button) => {
      const active = button.dataset.blogFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    cards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.blogCategory === filter;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (count) count.textContent = `${visibleCount} ${visibleCount === 1 ? 'note' : 'notes'}`;
  };

  filters.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.blogFilter));
  });
  if (filters.length) applyFilter('all');

  const slides = [...document.querySelectorAll('[data-blog-slide]')];
  const slideButtons = [...document.querySelectorAll('[data-blog-slide-button]')];
  const current = document.querySelector('#blog-slide-current');
  const carousel = document.querySelector('.blog-carousel');
  const previous = document.querySelector('[data-blog-prev]');
  const next = document.querySelector('[data-blog-next]');
  let activeSlide = 0;
  let timer;

  if (!slides.length) return;

  const showSlide = (index) => {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeSlide;
      slide.hidden = !active;
      slide.classList.toggle('active', active);
    });
    slideButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeSlide;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (current) current.textContent = String(activeSlide + 1).padStart(2, '0');
  };

  const restartTimer = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(activeSlide + 1), 7000);
  };

  previous?.addEventListener('click', () => { showSlide(activeSlide - 1); restartTimer(); });
  next?.addEventListener('click', () => { showSlide(activeSlide + 1); restartTimer(); });
  slideButtons.forEach((button) => {
    button.addEventListener('click', () => { showSlide(Number(button.dataset.blogSlideButton)); restartTimer(); });
  });
  carousel?.addEventListener('mouseenter', () => window.clearInterval(timer));
  carousel?.addEventListener('mouseleave', restartTimer);

  showSlide(0);
  restartTimer();
})();
