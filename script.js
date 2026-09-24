document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.main-nav a').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

const pdfPath = 'assets/- merc demo - The Homebrewery.pdf';
const bookElement = document.querySelector('#pdf-book');
const loadingMessage = document.querySelector('#pdf-loading');
const loadingStatus = document.querySelector('#pdf-loading-message');
const flipControls = document.querySelector('#flip-controls');
const flipHint = document.querySelector('#flip-hint');
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
let modalRenderedPages = [];
const pageRenderPromises = [];
let pageCount = 0;
let pdfPreviewPromise;
let pageFlipLibraryPromise;

function createDot(index) {
  const dot = document.createElement('button');
  dot.className = 'page-dot';
  dot.type = 'button';
  dot.setAttribute('aria-label', `Go to page ${index + 1}`);
  dot.addEventListener('click', () => flipToPage(pageFlip, index).catch(showPdfError));
  pageDots.append(dot);
}

function createPdfPageShell(pageNumber) {
  const pageElement = document.createElement('div');
  pageElement.className = 'pdf-book-page';
  pageElement.dataset.density = pageNumber === 1 || pageNumber === pageCount ? 'hard' : 'soft';
  pageElement.dataset.pageNumber = String(pageNumber);
  return pageElement;
}

function copyRenderedCanvas(sourcePage, targetPage) {
  const sourceCanvas = sourcePage.querySelector('canvas');
  if (!sourceCanvas || targetPage.querySelector('canvas')) return;

  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  canvas.style.cssText = sourceCanvas.style.cssText;
  canvas.getContext('2d').drawImage(sourceCanvas, 0, 0);
  targetPage.append(canvas);
}

function renderPdfPage(pageIndex) {
  if (pageRenderPromises[pageIndex]) return pageRenderPromises[pageIndex];
  pageRenderPromises[pageIndex] = (async () => {
    const page = await pdfDocument.getPage(pageIndex + 1);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 2.1 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    renderedPages[pageIndex].append(canvas);
    if (modalRenderedPages[pageIndex]) {
      copyRenderedCanvas(renderedPages[pageIndex], modalRenderedPages[pageIndex]);
    }
  })().catch((error) => {
    pageRenderPromises[pageIndex] = undefined;
    throw error;
  });
  return pageRenderPromises[pageIndex];
}

async function ensureSpreadRendered(pageIndex) {
  const firstPage = Math.max(0, Math.min(pageIndex, pageCount - 1));
  const pages = [firstPage, firstPage + 1].filter((index) => index < pageCount);
  await Promise.all(pages.map(renderPdfPage));
}

async function flipToPage(flipInstance, pageIndex) {
  if (!flipInstance) return;
  const targetPage = Math.max(0, Math.min(pageIndex, pageCount - 1));
  await ensureSpreadRendered(targetPage);
  flipInstance.flip(targetPage);
}

function showPdfError() {
  loadingMessage.hidden = false;
  loadingStatus.textContent = 'The sample could not be loaded. Please try again.';
}

function updateControls(pageIndex) {
  const leftPage = pageIndex + 1;
  const rightPage = Math.min(pageIndex + 2, pageCount);
  currentPage.textContent = `${String(leftPage).padStart(2, '0')}â€“${String(rightPage).padStart(2, '0')}`;
  document.querySelectorAll('.page-dot').forEach((dot, index) => dot.classList.toggle('active', index === pageIndex));
}

function cloneRenderedPages() {
  modalRenderedPages = renderedPages.map((page) => {
    const clonedPage = page.cloneNode(false);
    copyRenderedCanvas(page, clonedPage);
    return clonedPage;
  });
  return modalRenderedPages;
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
      modalPageFlip.on('flip', (event) => {
        updateControls(event.data);
        ensureSpreadRendered(event.data).catch(showPdfError);
      });
      modalBook.addEventListener('pointerdown', (event) => prefetchTurn(event, modalPageFlip));
    }
    modalPageFlip.turnToPage(pageFlip.getCurrentPageIndex());
  });
}

function closeFullPreview() {
  if (modalPageFlip && pageFlip) {
    pageFlip.turnToPage(modalPageFlip.getCurrentPageIndex());
  }
  pdfModal.classList.remove('is-open');
  pdfModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function loadPageFlipLibrary() {
  if (window.St?.PageFlip) return Promise.resolve();
  if (!pageFlipLibraryPromise) {
    pageFlipLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './assets/page-flip.browser.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load the page-flip library.'));
      document.head.append(script);
    }).catch((error) => {
      pageFlipLibraryPromise = undefined;
      throw error;
    });
  }
  return pageFlipLibraryPromise;
}

function initializePdfPreview() {
  if (!pdfPreviewPromise) {
    pdfPreviewPromise = (async () => {
      const pdfjsLib = await import('./assets/pdfjs/pdf.mjs');
      await loadPageFlipLibrary();
      pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdfjs/pdf.worker.mjs';

      pdfDocument = await pdfjsLib.getDocument(pdfPath).promise;
      pageCount = pdfDocument.numPages;
      totalPages.textContent = String(pageCount).padStart(2, '0');
      pageDots.replaceChildren();
      renderedPages = Array.from({ length: pageCount }, (_, index) => createPdfPageShell(index + 1));
      renderedPages.forEach((_, index) => createDot(index));
      await ensureSpreadRendered(0);
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
      pageFlip.loadFromHTML(renderedPages);
      pageFlip.on('flip', (event) => {
        updateControls(event.data);
        ensureSpreadRendered(event.data).catch(showPdfError);
      });
      pageFlip.on('changeState', () => {
        previousButton.disabled = pageFlip.getCurrentPageIndex() === 0;
        nextButton.disabled = pageFlip.getCurrentPageIndex() >= pageCount - 2;
      });
      updateControls(0);
      previousButton.disabled = true;
      nextButton.disabled = pageCount < 3;
      flipControls.hidden = false;
      flipHint.hidden = false;
      loadingMessage.hidden = true;
      bookElement.addEventListener('pointerdown', (event) => prefetchTurn(event, pageFlip));
    })().catch((error) => {
      pdfPreviewPromise = undefined;
      throw error;
    });
  }
  return pdfPreviewPromise;
}

function prefetchTurn(event, flipInstance) {
  if (!flipInstance) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const movingForward = event.clientX >= bounds.left + bounds.width / 2;
  const nextIndex = flipInstance.getCurrentPageIndex() + (movingForward ? 2 : -2);
  if (nextIndex >= 0 && nextIndex < pageCount) {
    ensureSpreadRendered(nextIndex).catch(showPdfError);
  }
}

previousButton.addEventListener('click', () => {
  if (pageFlip) flipToPage(pageFlip, pageFlip.getCurrentPageIndex() - 2).catch(showPdfError);
});
nextButton.addEventListener('click', () => {
  if (pageFlip) flipToPage(pageFlip, pageFlip.getCurrentPageIndex() + 2).catch(showPdfError);
});
openPdfButton.addEventListener('click', async () => {
  openPdfButton.disabled = true;
  try {
    await initializePdfPreview();
    openFullPreview();
  } catch {
    showPdfError();
  } finally {
    openPdfButton.disabled = false;
  }
});
closePdfButton.addEventListener('click', closeFullPreview);
pdfModal.addEventListener('click', (event) => {
  if (event.target === pdfModal) closeFullPreview();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && pdfModal.classList.contains('is-open')) closeFullPreview();
});

initializePdfPreview().catch(showPdfError);

const upcomingGroup = document.querySelector('.upcoming-group');
if (upcomingGroup) upcomingGroup.classList.add('is-enhanced');

document.querySelectorAll('.alt-lead-form').forEach((form) => form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  form.querySelector('button[type="submit"]').disabled = true;
  form.querySelector('.alt-success').hidden = false;
  form.reset();
}));

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

const heroCarouselImageDimensions = {
  'assets/covers/city 6 cover.webp': [232, 320],
  'assets/covers/Into the Dwarf Fortress Book Cover.webp': [232, 320],
  'assets/covers/dbb517_250-3-3-.webp': [241, 320],
};

function buildHeroCarousel() {
  document.querySelectorAll('.hero-carousel-row').forEach((row, rowIndex) => {
    const fragment = document.createDocumentFragment();
    for (let repeat = 0; repeat < 2; repeat += 1) {
      for (let tileIndex = 0; tileIndex < 9; tileIndex += 1) {
        if (rowIndex === 0 && repeat === 0 && tileIndex === 0) continue;
        const image = document.createElement('img');
        const imageIndex = (rowIndex * 3 + tileIndex + repeat * 9) % heroCarouselImagePool.length;
        const imageSource = heroCarouselImagePool[imageIndex];
        const [width, height] = heroCarouselImageDimensions[imageSource] || [247, 320];
        image.src = imageSource;
        image.width = width;
        image.height = height;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.draggable = false;
        fragment.append(image);
      }
    }
    row.append(fragment);
  });
}

buildHeroCarousel();
