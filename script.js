document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.main-nav a').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

const pdfPath = 'assets/Order of Mercenary - The Homebrewery 247-262.pdf';
const bookElement = document.querySelector('#pdf-book');
const loadingMessage = document.querySelector('#pdf-loading');
const loadingStatus = document.querySelector('#pdf-loading-message');
const flipControls = document.querySelector('#flip-controls');
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

function getFlipStep(flipInstance) {
  return flipInstance?.getOrientation() === 'portrait' ? 1 : 2;
}

function updateControls(pageIndex, flipInstance = pageFlip) {
  const step = getFlipStep(flipInstance);
  const leftPage = pageIndex + 1;
  const rightPage = Math.min(pageIndex + step, pageCount);
  currentPage.textContent = step === 1
    ? String(leftPage).padStart(2, '0')
    : `${String(leftPage).padStart(2, '0')}–${String(rightPage).padStart(2, '0')}`;
  document.querySelectorAll('.page-dot').forEach((dot, index) => {
    const isCurrent = index === pageIndex;
    dot.classList.toggle('active', isCurrent);
    if (isCurrent) dot.setAttribute('aria-current', 'page');
    else dot.removeAttribute('aria-current');
  });
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
        usePortrait: true,
      });
      modalPageFlip.loadFromHTML(cloneRenderedPages());
      modalPageFlip.on('flip', (event) => {
        updateControls(event.data, modalPageFlip);
        ensureSpreadRendered(event.data).catch(showPdfError);
      });
      modalPageFlip.on('changeOrientation', () => {
        updateControls(modalPageFlip.getCurrentPageIndex(), modalPageFlip);
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
      const pdfjsLib = await import('./assets/pdfjs/pdf.js');
      await loadPageFlipLibrary();
      pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdfjs/pdf.worker.js';

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
        usePortrait: true,
      });
      pageFlip.loadFromHTML(renderedPages);
      pageFlip.on('flip', (event) => {
        updateControls(event.data, pageFlip);
        ensureSpreadRendered(event.data).catch(showPdfError);
      });
      pageFlip.on('changeState', () => {
        previousButton.disabled = pageFlip.getCurrentPageIndex() === 0;
        nextButton.disabled = pageFlip.getCurrentPageIndex() >= pageCount - getFlipStep(pageFlip);
      });
      pageFlip.on('changeOrientation', () => {
        updateControls(pageFlip.getCurrentPageIndex(), pageFlip);
        previousButton.disabled = pageFlip.getCurrentPageIndex() === 0;
        nextButton.disabled = pageFlip.getCurrentPageIndex() >= pageCount - getFlipStep(pageFlip);
      });
      updateControls(0);
      previousButton.disabled = true;
      nextButton.disabled = pageCount < 3;
      flipControls.hidden = false;
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
  const step = getFlipStep(flipInstance);
  const nextIndex = flipInstance.getCurrentPageIndex() + (movingForward ? step : -step);
  if (nextIndex >= 0 && nextIndex < pageCount) {
    ensureSpreadRendered(nextIndex).catch(showPdfError);
  }
}

previousButton.addEventListener('click', () => {
  if (pageFlip) flipToPage(pageFlip, pageFlip.getCurrentPageIndex() - getFlipStep(pageFlip)).catch(showPdfError);
});
nextButton.addEventListener('click', () => {
  if (pageFlip) flipToPage(pageFlip, pageFlip.getCurrentPageIndex() + getFlipStep(pageFlip)).catch(showPdfError);
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

const testimonialCarousel = document.querySelector('#testimonial-carousel');
if (testimonialCarousel) {
  const testimonialQuote = document.querySelector('#testimonial-quote');
  const testimonialName = document.querySelector('#testimonial-name');
  const testimonialAvatar = document.querySelector('#testimonial-avatar');
  const testimonialRole = document.querySelector('#testimonial-role');
  const testimonialPrev = document.querySelector('#testimonial-prev');
  const testimonialNext = document.querySelector('#testimonial-next');
  const testimonialProgressFill = document.querySelector('#testimonial-progress-fill');
  const testimonials = [
    {
      name: 'Sqoody7Kick',
      initials: 'SK',
      role: 'Order of Criminals',
      quote: 'Just started looking at this, its soooo good. This is great work.\n\nWe need a part 2 with stat blocks for the members of gangs, this is great content.',
    },
    {
      name: 'Jeff Sorenson',
      initials: 'JS',
      role: 'Arcane Bookshelf',
      quote: "I am excited for this. What a great way to add some extra feeling of depth to a world, with options for how deep to go with it.\n\nAs an aside, this is the 100th project I've backed on Kickstarter! Amazing it's been so many. Maybe I've got a problem...but it's not my fault people like you keep creating awesome things like this that I want to hoard for my world-building!",
    },
    {
      name: 'DrivingMeBonkas',
      initials: 'DB',
      role: "Brothel's Tales",
      quote: "I am so hyped for this project, it looks amazing. I've always thought this was an underutilised setting and it looks like you'll do a great job of doing so respectfully 😊. I am very much looking forward to seeing where you take this.",
    },
    {
      name: 'Yoshi',
      initials: 'Y',
      role: 'Mystic Grounds',
      quote: "I'd also like to sincerely thank the team. I just read my Mystic Ground and was genuinely giddy seeing a homebrew location come to life in flesh and blood, and especially with balancing done by professionals.\n\nThank you so much for breathing so much life into my location!",
    },
    {
      name: 'Christopher Richards',
      initials: 'CR',
      role: 'Order and Guilt',
      quote: "I have spent most of today looking at the final PDFs, they are great. I wasn't sure about ordering the print versions but I'm definitely going to.",
    },
    {
      name: 'Rodney Bell',
      initials: 'RB',
      role: 'Order and Guild 2',
      quote: "I was a late Backer but this is the kind of thing that can transform an adventure /campaign into an in depth experience that makes more than memories around the table; it makes LEGENDS! Bravo for the effort and brilliant ideas! Rock on and keep CREATING!!!!",
    },
  ];
  let testimonialIndex = 0;
  const rotationDuration = 5000;
  let rotateTimer;
  let transitionTimer;
  let remainingTime = rotationDuration;
  let deadline = 0;
  let isHovered = false;
  let isFocused = false;

  const isPaused = () => isHovered || isFocused || document.hidden;

  const resetProgress = () => {
    testimonialProgressFill.style.animation = 'none';
    testimonialProgressFill.offsetHeight;
    testimonialProgressFill.style.animationDuration = `${remainingTime}ms`;
    testimonialProgressFill.style.animationPlayState = isPaused() ? 'paused' : 'running';
    testimonialProgressFill.style.animationName = 'testimonial-countdown';
  };

  const clearRotation = () => {
    window.clearTimeout(rotateTimer);
    rotateTimer = undefined;
  };

  const scheduleRotation = () => {
    if (isPaused() || rotateTimer) return;
    deadline = Date.now() + remainingTime;
    rotateTimer = window.setTimeout(() => {
      rotateTimer = undefined;
      remainingTime = rotationDuration;
      stepTestimonial(1);
    }, remainingTime);
  };

  const pauseRotation = () => {
    if (!rotateTimer) return;
    remainingTime = Math.max(0, deadline - Date.now());
    clearRotation();
    testimonialProgressFill.style.animationPlayState = 'paused';
  };

  const updatePauseState = () => {
    if (isPaused()) pauseRotation();
    else scheduleRotation();
    testimonialProgressFill.style.animationPlayState = isPaused() ? 'paused' : 'running';
  };

  const stepTestimonial = (direction) => {
    clearRotation();
    remainingTime = rotationDuration;
    testimonialIndex = (testimonialIndex + direction + testimonials.length) % testimonials.length;
    window.clearTimeout(transitionTimer);
    testimonialCarousel.classList.add('is-changing');
    transitionTimer = window.setTimeout(() => {
      const testimonial = testimonials[testimonialIndex];
      testimonialQuote.textContent = testimonial.quote;
      testimonialQuote.classList.toggle('is-long', testimonial.quote.length > 220);
      testimonialName.textContent = testimonial.name;
      testimonialAvatar.textContent = testimonial.initials;
      testimonialRole.textContent = testimonial.role;
      testimonialRole.hidden = !testimonial.role;
      testimonialCarousel.classList.remove('is-changing');
      resetProgress();
      scheduleRotation();
    }, 180);
  };

  testimonialPrev.addEventListener('click', () => stepTestimonial(-1));
  testimonialNext.addEventListener('click', () => stepTestimonial(1));
  testimonialCarousel.addEventListener('pointerenter', () => {
    isHovered = true;
    updatePauseState();
  });
  testimonialCarousel.addEventListener('pointerleave', () => {
    isHovered = false;
    updatePauseState();
  });
  testimonialCarousel.addEventListener('focusin', () => {
    isFocused = true;
    updatePauseState();
  });
  testimonialCarousel.addEventListener('focusout', (event) => {
    if (!testimonialCarousel.contains(event.relatedTarget)) {
      isFocused = false;
      updatePauseState();
    }
  });
  document.addEventListener('visibilitychange', () => {
    updatePauseState();
  });
  resetProgress();
  scheduleRotation();
}
