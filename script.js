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
    { code: 'LIVE NOW / G&G 014', title: 'The Wilds Beyond', type: 'Adventure guide · D&D supplement', description: 'An adventure guide for D&D campaigns. Follow hidden roads, explore strange horizons, and discover stories beyond the lantern light.', funded: '412%', days: '18 days', backers: '1.8k', progress: 82, image: 'assets/test images/banner (4).png', link: '#' },
    { code: 'LIVE NOW / G&G 022', title: 'City of Embers', type: 'Campaign setting · D&D supplement', description: 'A D&D campaign setting of rooftops and old magic. Explore a city that refuses to go quietly into the dark.', funded: '238%', days: '9 days', backers: '940', progress: 58, image: 'assets/test images/banner 2.jpg', link: '#' },
    { code: 'LIVE NOW / G&G 027', title: 'The Lantern Moth', type: 'Creature compendium · D&D supplement', description: 'A creature compendium for your D&D campaign. Discover strange monsters and encounter ideas that make every road feel alive.', funded: '176%', days: '24 days', backers: '620', progress: 46, image: 'assets/test images/banner.png', link: '#' },
    { code: 'LIVE NOW / G&G 029', title: 'Ash & Oath', type: 'Short campaign · D&D supplement', description: 'A short D&D campaign of old promises and dangerous ruins. Give your players choices that shape the story and leave a mark.', funded: '109%', days: '6 days', backers: '310', progress: 31, image: 'assets/test images/bbeg banner 1.png', link: '#' },
  ],
  upcoming: [
    { code: 'COMING SOON / G&G 031', title: 'The Glass Isles', type: 'A nautical hexcrawl for curious crews', description: 'A nautical hexcrawl for D&D, with island maps and impossible tides. Chart a course through a sea that remembers everyone who crosses it.', image: 'assets/test images/banner (4).png' },
    { code: 'COMING SOON / G&G 032', title: 'Mercenary Organizations', type: 'Faction guide · D&D supplement', description: 'A faction guide for Dungeon Masters. Build rival mercenary companies and put the cost of victory at the heart of your D&D campaign.', image: 'assets/test images/banner 2.jpg' },
    { code: 'COMING SOON / G&G 033', title: 'The Entertainers', type: 'NPC vault · D&D supplement', description: 'Performer NPCs and entertainment traditions for D&D. Bring memorable characters and new stories to the stages and taverns of your world.', image: 'assets/test images/banner.png' },
    { code: 'COMING SOON / G&G 034', title: 'Villain Story Engine', type: 'GM toolkit · D&D supplement', description: 'A Dungeon Master toolkit for memorable D&D villains. Use their secrets, plans, and lairs to drive your campaign forward.', image: 'assets/test images/bbeg banner 1.png' },
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

const heroCarouselImagePool = [
  'assets/covers/Tal Doluth cover.webp',
  'assets/covers/Order of Tavern Sample cover.webp',
  'assets/covers/Merchant book cover new.webp',
  'assets/covers/Into the Dwarf Fortress Book Cover.webp',
  'assets/covers/dbb517_250-3-3-.webp',
  'assets/covers/criminal cover.webp',
  'assets/covers/cover2536.webp',
  'assets/covers/cover.webp',
  'assets/covers/cover-3.webp',
  'assets/covers/cover-2.webp',
  'assets/covers/cover variations.webp',
  'assets/covers/COVER TOWN 3.webp',
  'assets/covers/cover drivethru.webp',
  'assets/covers/cover Civil Registry.webp',
  'assets/covers/cover (1).webp',
  'assets/covers/city 6 cover.webp',
  'assets/covers/brothel tales.webp',
  'assets/covers/book cover.webp',
  'assets/covers/book cover (1).webp',
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
  const showCarousel = name === '2' || name === '3';
  heroBaseElements.forEach((element) => { element.hidden = showCarousel; });
  heroCarouselTemplate.hidden = !showCarousel;
  heroCarouselTemplate.classList.toggle('is-expanded', name === '3');
  document.querySelector('.hero').dataset.heroTemplate = name;
  document.querySelector('.hero').setAttribute('aria-labelledby', showCarousel ? 'hero-carousel-title' : 'hero-title');
}

buildHeroCarousel();
selectHeroTemplate('2');

const fontCatalog = {
  normal: [
    { id: 'elvaro', label: 'Elvaro Grotesque', family: 'VerseluftNormalElvaro', src: 'assets/fonts/normal/elvaro-grotesque-sans-family-2026-04-07-06-22-32-utc/WOFF/TBJElvaro-Regular.woff2', format: 'woff2' },
    { id: 'sentino', label: 'Sentino', family: 'VerseluftNormalSentino', src: 'assets/fonts/normal/modern-minimalist-sans-serif-family-sentino-2026-04-07-06-25-02-utc/RCLSentino/Web-PS/RCLSentino-Regular.woff2', format: 'woff2' },
    { id: 'gothic', label: 'Gothic', family: 'VerseluftNormalGothic', src: 'assets/fonts/normal/gothic-2026-04-07-06-21-46-utc/Gothic.woff', format: 'woff' },
    { id: 'she-dance', label: 'She Dance (decorative)', family: 'VerseluftNormalSheDance', src: 'assets/fonts/normal/she-dance-celtyic-typeface-2026-04-07-06-23-11-utc/She Dance/She Dance.woff2', format: 'woff2' },
    { id: 'ibm-plex-serif', label: 'IBM Plex Serif', family: 'IBM Plex Serif' },
  ],
  alternative: [
    { id: 'serifon', label: 'The Serifon Editorial', family: 'VerseluftAlternativeSerifon', src: 'assets/fonts/alternative/the-serifon-editorial-2026-04-07-06-22-44-utc/Web-TT/The Serifon Editoral.woff2', format: 'woff2' },
    { id: 'agondav', label: 'Agondav', family: 'VerseluftAlternativeAgondav', src: 'assets/fonts/alternative/agondav-old-vintage-font-2026-04-07-06-02-48-utc/Agondav/Agondav.ttf', format: 'truetype' },
    { id: 'basefigh', label: 'NCL Basefigh', family: 'VerseluftAlternativeBasefigh', src: 'assets/fonts/alternative/basefigh-medieval-rounded-blackletter-font-2026-04-07-06-14-34-utc/WOFF/Web-PS/NCL Basefigh.woff2', format: 'woff2' },
    { id: 'black-deamond', label: 'Black Deamond', family: 'VerseluftAlternativeBlackDeamond', src: 'assets/fonts/alternative/black-deamond-typeface-2026-04-07-06-17-19-utc/BlackDeamond-Regular.woff', format: 'woff' },
    { id: 'catelyn', label: 'Catelyn Rough', family: 'VerseluftAlternativeCatelyn', src: 'assets/fonts/alternative/catelyn-rough-2026-04-07-06-11-23-utc/Catelyn Rough/CatelynRough-Regular.ttf', format: 'truetype' },
    { id: 'eisenkraft', label: 'Eisenkraft', family: 'VerseluftAlternativeEisenkraft', src: 'assets/fonts/alternative/eisenkraft-medieval-blackletter-typeface-2026-04-07-06-20-40-utc/Eisenkraft.woff2', format: 'woff2' },
    { id: 'heraldic-shadows', label: 'Heraldic Shadows', family: 'VerseluftAlternativeHeraldicShadows', src: 'assets/fonts/alternative/heraldic-shadows-blackletter-display-font-2026-04-07-06-10-12-utc/OpenType-TT/Heraldic Shadows.ttf', format: 'truetype' },
    { id: 'hortens', label: 'Hortens', family: 'VerseluftAlternativeHortens', src: 'assets/fonts/alternative/hortens-medieval-display-typeface-2026-04-07-05-56-04-utc/Hortens/HORTENS.woff2', format: 'woff2' },
    { id: 'she-dance', label: 'She Dance', family: 'VerseluftAlternativeSheDance', src: 'assets/fonts/alternative/she-dance-celtyic-typeface-2026-04-07-06-23-11-utc/She Dance/She Dance.woff2', format: 'woff2' },
    { id: 'snavirus', label: 'Snavirus', family: 'VerseluftAlternativeSnavirus', src: 'assets/fonts/alternative/snavirus-medieval-blackletter-font-2026-04-07-06-17-58-utc/Snavirus - Medieval Blackletter Font/3. WOFF/Snavirus.woff', format: 'woff' },
    { id: 'tooth-and-nail', label: 'Tooth & Nail', family: 'VerseluftAlternativeToothAndNail', src: 'assets/fonts/alternative/tooth-and-nail-2026-04-07-06-17-48-utc/Tooth And Nail/TTF/Tooth & Nail.ttf', format: 'truetype' },
    { id: 'wolther', label: 'Wolther', family: 'VerseluftAlternativeWolther', src: 'assets/fonts/alternative/wolther-blackletter-font-2026-08-12-00-28-54-utc/CS Wolther/CSWolther-Regular.woff2', format: 'woff2' },
  ],
};

const fontRoot = document.documentElement;
const fontFaceStyle = document.createElement('style');
const fontUrl = (src) => src.split('/').map((part) => encodeURIComponent(part)).join('/');
fontFaceStyle.textContent = [...fontCatalog.normal, ...fontCatalog.alternative].filter((font) => font.src).map((font) => `@font-face { font-family: '${font.family}'; src: url('${fontUrl(font.src)}') format('${font.format}'); font-style: normal; font-weight: 400; font-display: swap; }`).join('\n');
document.head.append(fontFaceStyle);

function fillFontSelect(select, fonts) {
  fonts.forEach((font) => {
    const option = document.createElement('option');
    option.value = font.id;
    option.textContent = font.label;
    select.append(option);
  });
}

const normalFontSelect = document.querySelector('#font-normal-select');
const alternativeFontSelect = document.querySelector('#font-alternative-select');
fillFontSelect(normalFontSelect, fontCatalog.normal);
fillFontSelect(alternativeFontSelect, fontCatalog.alternative);

function getFont(type, id) {
  return fontCatalog[type].find((font) => font.id === id) || fontCatalog[type][0];
}

function applyFontChoice(type, id) {
  const font = getFont(type, id);
  fontRoot.style.setProperty(`--font-${type}`, `'${font.family}', sans-serif`);
  fontRoot.dataset[`font${type[0].toUpperCase()}${type.slice(1)}`] = font.id;
}

normalFontSelect.addEventListener('change', () => applyFontChoice('normal', normalFontSelect.value));
alternativeFontSelect.addEventListener('change', () => applyFontChoice('alternative', alternativeFontSelect.value));
normalFontSelect.value = 'ibm-plex-serif';
alternativeFontSelect.value = 'black-deamond';
applyFontChoice('normal', normalFontSelect.value);
applyFontChoice('alternative', alternativeFontSelect.value);
