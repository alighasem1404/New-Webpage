import * as pdfjsLib from './assets/pdfjs/pdf.mjs';

const searchInput = document.querySelector('#site-search');
searchInput.addEventListener('search', () => {
  if (searchInput.value.trim()) {
    searchInput.setCustomValidity('Library search will be available soon.');
    searchInput.reportValidity();
    searchInput.setCustomValidity('');
    searchInput.value = '';
  }
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.main-nav a').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

const pdfPath = 'assets/- merc demo - The Homebrewery.pdf';
const bookElement = document.querySelector('#pdf-book');
const loadingMessage = document.querySelector('#pdf-loading');
const pageDots = document.querySelector('#page-dots');
const currentPage = document.querySelector('#current-page');
const totalPages = document.querySelector('#total-pages');
const previousButton = document.querySelector('#flip-prev');
const nextButton = document.querySelector('#flip-next');
const openPdfButton = document.querySelector('#open-pdf');
const closePdfButton = document.querySelector('#close-pdf');
const pdfModal = document.querySelector('#pdf-modal');
const modalBook = document.querySelector('#modal-book');
let pdfDocument;
let pageFlip;
let modalPageFlip;
let renderedPages = [];
let pageCount = 0;

pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdfjs/pdf.worker.mjs';

function createDot(index) {
  const dot = document.createElement('button');
  dot.className = 'page-dot';
  dot.type = 'button';
  dot.setAttribute('aria-label', `Go to page ${index + 1}`);
  dot.addEventListener('click', () => pageFlip.flip(index));
  pageDots.append(dot);
}

async function createPdfPage(pageNumber) {
  const page = await pdfDocument.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const pageElement = document.createElement('div');
  pageElement.className = 'pdf-book-page';
  pageElement.dataset.density = pageNumber === 1 || pageNumber === pageCount ? 'hard' : 'soft';
  const canvas = document.createElement('canvas');
  const scale = 2.1;
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;
  pageElement.append(canvas);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return pageElement;
}

function updateControls(pageIndex) {
  const leftPage = pageIndex + 1;
  const rightPage = Math.min(pageIndex + 2, pageCount);
  currentPage.textContent = `${String(leftPage).padStart(2, '0')}–${String(rightPage).padStart(2, '0')}`;
  document.querySelectorAll('.page-dot').forEach((dot, index) => dot.classList.toggle('active', index === pageIndex));
}

function cloneRenderedPages() {
  return renderedPages.map((page) => {
    const clonedPage = page.cloneNode(true);
    const sourceCanvas = page.querySelector('canvas');
    const clonedCanvas = clonedPage.querySelector('canvas');
    clonedCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0);
    return clonedPage;
  });
}

function openFullPreview() {
  pdfModal.classList.add('is-open');
  pdfModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    if (!modalPageFlip) {
      modalPageFlip = new window.St.PageFlip(modalBook, {
        width: 620,
        height: 827,
        size: 'stretch',
        minWidth: 300,
        maxWidth: 720,
        minHeight: 400,
        maxHeight: 960,
        showCover: false,
        autoSize: false,
        drawShadow: true,
        flippingTime: 900,
        maxShadowOpacity: 0.3,
        mobileScrollSupport: true,
        usePortrait: false,
      });
      modalPageFlip.loadFromHTML(cloneRenderedPages());
    }
    modalPageFlip.turnToPage(pageFlip.getCurrentPageIndex());
  });
}

function closeFullPreview() {
  pdfModal.classList.remove('is-open');
  pdfModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

pdfjsLib.getDocument(pdfPath).promise.then(async (document) => {
  pdfDocument = document;
  pageCount = document.numPages;
  totalPages.textContent = String(pageCount).padStart(2, '0');
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pages.push(await createPdfPage(pageNumber));
    createDot(pageNumber - 1);
  }
  renderedPages = pages;
  pageFlip = new window.St.PageFlip(bookElement, {
    width: 420,
    height: 560,
    size: 'stretch',
    minWidth: 260,
    maxWidth: 520,
    minHeight: 347,
    maxHeight: 693,
    showCover: false,
    autoSize: false,
    drawShadow: true,
    flippingTime: 900,
    maxShadowOpacity: 0.28,
    mobileScrollSupport: false,
    usePortrait: false,
  });
  pageFlip.loadFromHTML(pages);
  pageFlip.on('flip', (event) => updateControls(event.data));
  pageFlip.on('changeState', () => {
    previousButton.disabled = pageFlip.getCurrentPageIndex() === 0;
    nextButton.disabled = pageFlip.getCurrentPageIndex() >= pageCount - 2;
  });
  updateControls(0);
  loadingMessage.hidden = true;
}).catch(() => {
  loadingMessage.textContent = 'PDF preview could not be loaded.';
});

previousButton.addEventListener('click', () => pageFlip?.flipPrev());
nextButton.addEventListener('click', () => pageFlip?.flipNext());
openPdfButton.addEventListener('click', openFullPreview);
closePdfButton.addEventListener('click', closeFullPreview);
pdfModal.addEventListener('click', (event) => {
  if (event.target === pdfModal) closeFullPreview();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && pdfModal.classList.contains('is-open')) closeFullPreview();
});

// Replace these draft entries with the live campaign data when it is ready.
const projectData = {
  live: [
    { code: 'LIVE NOW / G&G 014', title: 'The Wilds Beyond', type: 'Adventure guide · 5e compatible', description: 'A field guide to strange horizons, hidden roads, and the stories waiting beyond the lantern light.', funded: '412%', days: '18 days', backers: '1.8k', progress: 82, image: 'assets/test images/banner (4).png', link: '#' },
    { code: 'LIVE NOW / G&G 022', title: 'City of Embers', type: 'Campaign setting · 5e compatible', description: 'A setting of rooftops, old magic, and a city that refuses to go quietly into the dark.', funded: '238%', days: '9 days', backers: '940', progress: 58, image: 'assets/test images/banner 2.jpg', link: '#' },
    { code: 'LIVE NOW / G&G 027', title: 'The Lantern Moth', type: 'Creature compendium · system agnostic', description: 'Strange creatures, memorable encounters, and useful tools for making every road feel alive.', funded: '176%', days: '24 days', backers: '620', progress: 46, image: 'assets/test images/banner.png', link: '#' },
    { code: 'LIVE NOW / G&G 029', title: 'Ash & Oath', type: 'Short campaign · 5e compatible', description: 'A compact campaign of old promises, dangerous ruins, and choices that leave a mark.', funded: '109%', days: '6 days', backers: '310', progress: 31, image: 'assets/test images/bbeg banner 1.png', link: '#' },
  ],
  upcoming: [
    { code: 'COMING SOON / G&G 031', title: 'The Glass Isles', type: 'A nautical hexcrawl for curious crews', description: 'Island maps, impossible tides, and a sea that remembers everyone who crosses it.', image: 'assets/test images/banner (4).png' },
    { code: 'COMING SOON / G&G 032', title: 'Mercenary Organizations', type: 'Faction guide · 5e compatible', description: 'Every war has a price. Build rival companies, hard choices, and campaigns shaped by the cost of victory.', image: 'assets/test images/banner 2.jpg' },
    { code: 'COMING SOON / G&G 033', title: 'The Entertainers', type: 'NPC vault · system agnostic', description: 'Thirty-two performers, sixteen traditions, and a story behind every stage.', image: 'assets/test images/banner.png' },
    { code: 'COMING SOON / G&G 034', title: 'Villain Story Engine', type: 'GM toolkit · 5e compatible', description: 'Fully realized villains with secrets, plans, and lairs that drive the story forward.', image: 'assets/test images/bbeg banner 1.png' },
  ],
};

function projectTitleMarkup(title) {
  const words = title.split(' ');
  const lastWord = words.pop();
  return `${words.join(' ')}<br /><i>${lastWord}</i>`;
}

function renderLiveProjects() {
  const grid = document.querySelector('#live-projects-grid');
  const emptyState = document.querySelector('#live-projects-empty');
  const projects = projectData.live;
  grid.innerHTML = projects.slice(0, 4).map((project, index) => `<article class="project-card${index === 0 ? ' project-card-large' : ''}">
    <div class="project-art"><img class="project-banner" src="${project.image}" alt="${project.title} banner"></div>
    <div class="project-card-body"><div><h3>${project.title}</h3><p>${project.description}</p></div><div class="project-meta"><span><strong>${project.funded}</strong> funded</span><span><strong>${project.days}</strong> to go</span><span><strong>${project.backers}</strong> backers</span></div><div class="live-bottom-row"><div class="funding-bar"><span style="width: ${project.progress}%"></span></div><a class="project-arrow" href="${project.link}" aria-label="View ${project.title} Kickstarter campaign">↗</a></div></div>
  </article>`).join('');
  emptyState.hidden = projects.length !== 0;
  grid.hidden = projects.length === 0;
}

let upcomingIndex = 0;
let upcomingTimerProgress = 0;
let upcomingTimerPaused = false;
let previousTimerTick = performance.now();
const upcomingTimerDuration = 7000;

function renderUpcomingProjects() {
  const deck = document.querySelector('#upcoming-deck');
  deck.innerHTML = projectData.upcoming.map((project) => `<article class="project-card upcoming-card"><div class="project-art"><img class="project-banner" src="${project.image}" alt="${project.title} banner"></div><div class="project-card-body"><div><span class="project-status upcoming">◌ Coming soon</span><h3>${project.title}</h3><p>${project.description}</p></div><span class="notify-label">Get notified <b>↗</b></span></div></article>`).join('');
  document.querySelector('#upcoming-total').textContent = String(projectData.upcoming.length).padStart(2, '0');
  updateUpcomingDeck();
}

function updateUpcomingDeck() {
  const cards = [...document.querySelectorAll('.upcoming-deck .upcoming-card')];
  if (!cards.length) return;
  upcomingIndex = (upcomingIndex + cards.length) % cards.length;
  cards.forEach((card, index) => {
    const offset = (index - upcomingIndex + cards.length) % cards.length;
    card.className = `project-card upcoming-card deck-${offset}`;
  });
  document.querySelector('#upcoming-current').textContent = String(upcomingIndex + 1).padStart(2, '0');
  document.querySelector('#upcoming-progress-bar').style.width = `${((upcomingIndex + 1) / cards.length) * 100}%`;
}

function moveUpcoming(direction) {
  upcomingIndex += direction;
  upcomingTimerProgress = 0;
  previousTimerTick = performance.now();
  document.querySelector('#upcoming-timer-bar').style.width = '0%';
  updateUpcomingDeck();
}

renderLiveProjects();
renderUpcomingProjects();

document.querySelector('#upcoming-prev').addEventListener('click', () => moveUpcoming(-1));
document.querySelector('#upcoming-next').addEventListener('click', () => moveUpcoming(1));
const upcomingDeckWrap = document.querySelector('.upcoming-deck-wrap');
upcomingDeckWrap.addEventListener('mouseenter', () => { upcomingTimerPaused = true; });
upcomingDeckWrap.addEventListener('mouseleave', () => { upcomingTimerPaused = false; previousTimerTick = performance.now(); });

function animateUpcomingTimer(timestamp) {
  const elapsed = timestamp - previousTimerTick;
  previousTimerTick = timestamp;
  if (!upcomingTimerPaused && projectData.upcoming.length > 1) {
    upcomingTimerProgress += elapsed / upcomingTimerDuration;
    document.querySelector('#upcoming-timer-bar').style.width = `${Math.min(upcomingTimerProgress, 1) * 100}%`;
    if (upcomingTimerProgress >= 1) moveUpcoming(1);
  }
  requestAnimationFrame(animateUpcomingTimer);
}
requestAnimationFrame(animateUpcomingTimer);

const allLiveProjects = [...projectData.live];
document.querySelectorAll('[data-live-count]').forEach((button) => {
  button.addEventListener('click', () => {
    const count = Number(button.dataset.liveCount);
    projectData.live = allLiveProjects.slice(0, count);
    document.querySelectorAll('[data-live-count]').forEach((item) => item.classList.toggle('active', item === button));
    renderLiveProjects();
  });
});

document.querySelectorAll('.lead-form, .alt-lead-form').forEach((form) => form.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  form.querySelector('button[type="submit"]').disabled = true;
  form.querySelector('.lead-success, .alt-success').hidden = false;
  form.reset();
}));

document.querySelectorAll('[data-lead-variant]').forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.leadVariant;
    document.querySelectorAll('[data-lead-variant]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-lead-section]').forEach((section) => {
      section.hidden = section.dataset.leadSection !== selected;
    });
  });
});

const blogCards = [...document.querySelectorAll('.blog-card')];
document.querySelectorAll('[data-blog-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.blogFilter;
    document.querySelectorAll('[data-blog-filter]').forEach((item) => item.classList.toggle('active', item === button));
    blogCards.forEach((card) => { card.hidden = filter !== 'all' && card.dataset.blogCategory !== filter; });
  });
});

const palettePresets = {
  'oak-gold': { ink: '#fce6cf', cream: '#100d0a', paper: '#1c1712', orange: '#d2a846', plum: '#1c1712', line: 'rgba(252,230,207,.2)', 'hero-text': '#fce6cf' },
  'midnight-gold': { ink: '#fce6cf', cream: '#14141f', paper: '#0c0c13', orange: '#d2a846', plum: '#0c0c13', line: 'rgba(252,230,207,.2)', 'hero-text': '#fce6cf' },
};

const paletteRoot = document.documentElement;
const customColorFields = [
  { key: 'orange', text: document.querySelector('#custom-color-orange-text'), picker: document.querySelector('#custom-color-orange-picker') },
  { key: 'ink', text: document.querySelector('#custom-color-ink-text'), picker: document.querySelector('#custom-color-ink-picker') },
  { key: 'paper', text: document.querySelector('#custom-color-paper-text'), picker: document.querySelector('#custom-color-paper-picker') },
  { key: 'cream', text: document.querySelector('#custom-color-cream-text'), picker: document.querySelector('#custom-color-cream-picker') },
];

function setPaletteVariables(palette) {
  Object.entries(palette).forEach(([name, value]) => paletteRoot.style.setProperty(`--${name}`, value));
}

function normalizeHex(value) {
  const candidate = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`;
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : null;
}

function setCustomColor(key, value, field) {
  const hex = normalizeHex(value);
  if (!hex) return;
  paletteRoot.style.setProperty(`--${key}`, hex);
  paletteRoot.dataset.palette = 'custom';
  paletteRoot.classList.remove('is-dark-palette');
  field.text.value = hex.toUpperCase();
  field.picker.value = hex;
  document.querySelectorAll('[data-palette]').forEach((item) => item.classList.remove('active'));
}

function syncCustomColors(palette) {
  customColorFields.forEach((field) => {
    const value = palette[field.key];
    field.text.value = value.toUpperCase();
    field.picker.value = value;
  });
}

function selectPalette(name) {
  const palette = palettePresets[name];
  if (!palette) return;
  setPaletteVariables(palette);
  paletteRoot.dataset.palette = name;
  paletteRoot.classList.toggle('is-dark-palette', name === 'oak-gold' || name === 'midnight-gold');
  syncCustomColors(palette);
  document.querySelectorAll('[data-palette]').forEach((item) => item.classList.toggle('active', item.dataset.palette === name));
}

document.querySelectorAll('[data-palette]').forEach((button) => {
  button.addEventListener('click', () => selectPalette(button.dataset.palette));
});

customColorFields.forEach((field) => {
  field.text.addEventListener('input', () => setCustomColor(field.key, field.text.value, field));
  field.picker.addEventListener('input', () => setCustomColor(field.key, field.picker.value, field));
});
selectPalette('oak-gold');

const newsletterArtChoices = {
  dispatch: { src: 'assets/newsletter-dispatch.png', alt: 'Gold-sealed dispatch on a dark oak desk' },
  lantern: { src: 'assets/newsletter-lantern.png', alt: 'Brass signal lantern casting gold light over fantasy maps' },
  seat: { src: 'assets/newsletter-seat.png', alt: 'Empty chair waiting at a welcoming tabletop' },
};
const newsletterArtImage = document.querySelector('#newsletter-art-image');

function selectNewsletterArt(name) {
  const choice = newsletterArtChoices[name];
  if (!choice) return;
  newsletterArtImage.src = choice.src;
  newsletterArtImage.alt = choice.alt;
  document.querySelectorAll('[data-newsletter-art]').forEach((item) => item.classList.toggle('active', item.dataset.newsletterArt === name));
}

document.querySelectorAll('[data-newsletter-art]').forEach((button) => {
  button.addEventListener('click', () => selectNewsletterArt(button.dataset.newsletterArt));
});
selectNewsletterArt('dispatch');

const heroCarouselImagePool = [
  'assets/test images/banner (4).png',
  'assets/test images/banner 2.jpg',
  'assets/test images/banner.png',
  'assets/test images/bbeg banner 1.png',
  'assets/test images/article PH1.png',
  'assets/test images/article PH2.png',
  'assets/test images/article PH3.png',
  'assets/test images/article PH4.png',
  'assets/hero-verseluft-01.png',
  'assets/hero-verseluft-02.png',
  'assets/about-verseluft-01.png',
  'assets/newsletter-dispatch.png',
  'assets/newsletter-lantern.png',
  'assets/newsletter-seat.png',
];

function buildHeroCarousel() {
  document.querySelectorAll('.hero-carousel-row').forEach((row, rowIndex) => {
    const fragment = document.createDocumentFragment();
    for (let repeat = 0; repeat < 2; repeat += 1) {
      for (let tileIndex = 0; tileIndex < 9; tileIndex += 1) {
        const image = document.createElement('img');
        const imageIndex = (rowIndex * 3 + tileIndex + repeat * 9) % heroCarouselImagePool.length;
        image.src = heroCarouselImagePool[imageIndex];
        image.alt = '';
        image.loading = 'lazy';
        image.draggable = false;
        fragment.append(image);
      }
    }
    row.append(fragment);
  });
}

const heroBaseElements = [...document.querySelectorAll('[data-hero-base]')];
const heroCarouselTemplate = document.querySelector('[data-hero-section="2"]');

function selectHeroTemplate(name) {
  const isCarousel = name === '2';
  heroBaseElements.forEach((element) => { element.hidden = isCarousel; });
  heroCarouselTemplate.hidden = !isCarousel;
  document.querySelector('.hero').dataset.heroTemplate = name;
  document.querySelectorAll('[data-hero-template]').forEach((button) => {
    button.classList.toggle('active', button.dataset.heroTemplate === name);
  });
}

document.querySelectorAll('[data-hero-template]').forEach((button) => {
  button.addEventListener('click', () => selectHeroTemplate(button.dataset.heroTemplate));
});

buildHeroCarousel();
selectHeroTemplate('1');
