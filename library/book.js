const bookParams = new URLSearchParams(window.location.search);
const requestedSlug = bookParams.get('slug');
const bookPageContent = document.querySelector('#book-page-content');

function setBookMeta(book) {
  const title = `${book.title} | Verseluft Library`;
  const description = book.description || book.shortDescription;
  const canonicalUrl = window.location.href;
  const imageUrl = new URL(book.detailImage || book.coverImage, window.location.origin).href;

  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('link[rel="canonical"]').href = canonicalUrl;
  document.querySelector('meta[property="og:title"]').content = title;
  document.querySelector('meta[property="og:description"]').content = description;
  document.querySelector('meta[property="og:url"]').content = canonicalUrl;
  document.querySelector('meta[property="og:image"]').content = imageUrl;
}

function showBookNotFound(message = 'We could not find that title in the library.') {
  document.title = 'Book Not Found | Verseluft Library';
  document.querySelector('#book-breadcrumb-title').textContent = 'Not found';
  document.querySelector('#book-title').textContent = 'This book is not in the library.';
  document.querySelector('#book-short-description').textContent = message;
  document.querySelector('#book-description').hidden = true;
  document.querySelector('.book-facts').hidden = true;
  document.querySelector('#book-tags').hidden = true;
  document.querySelector('#book-cover').hidden = true;
  document.querySelector('.book-detail-art-rule').hidden = true;
  document.querySelector('.book-detail-art figcaption').hidden = true;
  document.querySelector('.book-detail-note').hidden = true;
  document.querySelector('.book-description-section').hidden = true;
  document.querySelector('#related-books-section').hidden = true;
  document.querySelector('#motion-test-tool').hidden = true;
  document.querySelector('#motion-test-reopen').hidden = true;
  document.querySelector('.book-price').hidden = true;
  document.querySelector('#book-store-link').hidden = true;
  document.querySelector('.book-back-link').textContent = 'Return to the library';
  bookPageContent.classList.add('book-not-found');
}

function createRelatedCard(book) {
  const card = document.createElement('article');
  card.className = 'related-book-card';

  const coverLink = document.createElement('a');
  coverLink.className = 'related-book-cover';
  coverLink.href = `/library/book.html?slug=${encodeURIComponent(book.slug)}`;
  coverLink.setAttribute('aria-label', `View ${book.title}`);

  const cover = document.createElement('img');
  cover.src = book.coverImage;
  cover.alt = book.coverAlt;
  cover.width = 247;
  cover.height = 320;
  cover.loading = 'lazy';
  cover.decoding = 'async';
  coverLink.append(cover);

  const copy = document.createElement('div');
  copy.className = 'related-book-copy';
  const category = document.createElement('p');
  category.className = 'related-book-type';
  category.textContent = book.categoryLabel;
  const title = document.createElement('h3');
  title.textContent = book.title;
  const link = document.createElement('a');
  link.className = 'related-book-link';
  link.href = coverLink.href;
  link.append(document.createTextNode('View title '));
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  link.append(arrow);
  copy.append(category, title, link);
  card.append(coverLink, copy);
  return card;
}

function renderRelatedBooks(book, books) {
  const section = document.querySelector('#related-books-section');
  const relatedBooks = books.filter((item) => item.status === 'published' && item.id !== book.id);
  const seriesMatches = book.series
    ? relatedBooks
      .filter((item) => item.series?.name === book.series.name)
      .sort((first, second) => Math.abs((first.series.number || 0) - (book.series.number || 0)) - Math.abs((second.series.number || 0) - (book.series.number || 0)))
    : [];
  const categoryMatches = relatedBooks
    .filter((item) => item.category === book.category)
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const remaining = relatedBooks.sort((first, second) => first.sortOrder - second.sortOrder);
  const selected = [...new Map([...seriesMatches, ...categoryMatches, ...remaining].map((item) => [item.id, item])).values()].slice(0, 4);

  if (!selected.length) {
    section.hidden = true;
    return;
  }

  document.querySelector('#related-books-copy').textContent = book.series
    ? `More from the ${book.series.name} series.`
    : `More ${book.categoryLabel.toLowerCase()} titles.`;
  document.querySelector('#related-books-grid').replaceChildren(...selected.map(createRelatedCard));
}

function initializeMotionTestTool() {
  const tool = document.querySelector('#motion-test-tool');
  tool.hidden = false;
  const hero = document.querySelector('.book-detail-hero');
  const options = [...tool.querySelectorAll('[data-motion-option]')];
  const status = document.querySelector('#motion-test-status');
  const labels = { aura: 'Aura', float: 'Float', sweep: 'Light sweep', stars: 'Star drift', tilt: 'Cover tilt' };

  options.forEach((button) => {
    button.addEventListener('click', () => {
      const motion = button.dataset.motionOption;
      hero.dataset.motion = motion;
      options.forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      status.textContent = `Previewing: ${labels[motion]}`;
    });
  });
  const reopen = document.querySelector('#motion-test-reopen');
  document.querySelector('#motion-test-close').addEventListener('click', () => { tool.hidden = true; reopen.hidden = false; });
  reopen.addEventListener('click', () => { tool.hidden = false; reopen.hidden = true; });
}

function renderBook(book, books) {
  const publishedBooks = books
    .filter((item) => item.status === 'published')
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const index = publishedBooks.findIndex((item) => item.slug === book.slug) + 1;

  document.querySelector('#book-breadcrumb-title').textContent = book.title;
  document.querySelector('#book-category').textContent = book.categoryLabel;
  document.querySelector('#book-title').textContent = book.title;
  document.querySelector('#book-short-description').textContent = book.shortDescription;
  document.querySelector('#book-description').textContent = book.description;
  document.querySelector('#book-story-book-title').textContent = `${book.title}.`;
  document.querySelector('#book-cover').src = book.detailImage || book.coverImage;
  document.querySelector('#book-cover').alt = book.coverAlt;
  document.querySelector('#book-number').textContent = `${String(index).padStart(2, '0')} / ${String(publishedBooks.length).padStart(2, '0')}`;
  document.querySelector('#book-type').textContent = book.categoryLabel;
  document.querySelector('#book-series').textContent = book.series ? book.series.name : 'Standalone title';

  const price = document.querySelector('#book-price');
  price.textContent = book.price?.display || 'Price coming soon';
  const storeLink = document.querySelector('#book-store-link');
  if (book.storeUrl) {
    storeLink.href = book.storeUrl;
    storeLink.target = '_blank';
    storeLink.rel = 'noopener noreferrer';
    storeLink.hidden = false;
  } else {
    storeLink.hidden = true;
  }

  const tagList = document.querySelector('#book-tags');
  tagList.replaceChildren(...book.tags.map((tag) => {
    const chip = document.createElement('span');
    chip.textContent = tag;
    return chip;
  }));
  renderRelatedBooks(book, books);
  initializeMotionTestTool();
  setBookMeta(book);
}

function initializeFireflies() {
  const field = document.querySelector('#book-fireflies');
  if (!field) return;
  const points = [
    [-37, -29, 18, 24, 42, -8, -18, 38], [24, -38, -26, -4, 39, 28, -43, -19], [-8, 32, 43, -24, -34, -11, 21, 41], [42, 13, -31, 33, 12, -42, -40, 6], [-44, 6, 28, -34, 35, 21, -17, -42], [8, -46, 44, 7, -25, 38, 31, -17], [-29, 40, 5, -27, 43, 16, -38, -21], [35, -18, -42, 25, 9, 44, 27, -39], [-4, -13, 33, 42, -44, 18, 18, -40], [46, 35, -18, -36, 26, -5, -39, 29], [-22, -41, 37, 22, -35, 2, 15, 45], [17, 24, -39, -13, 41, -32, -9, 39], [-41, -17, 14, 42, 36, -27, -25, 9], [29, 44, -34, -22, 6, 31, 43, -7], [-12, 7, 45, -41, -43, -28, 22, 35]
  ];
  const style = document.createElement('style');
  style.dataset.fireflies = 'book';
  points.forEach((path, index) => {
    const firefly = document.createElement('span');
    firefly.className = 'firefly';
    firefly.style.animationDelay = `${(index * 0.43).toFixed(2)}s`;
    firefly.style.animationDuration = `${12 + (index % 6) * 2}s`;
    const [x1, y1, x2, y2, x3, y3, x4, y4] = path;
    style.textContent += `@keyframes bookFireflyMove${index}{0%{transform:translate(${x1}vw,${y1}vh) scale(.65)}33%{transform:translate(${x2}vw,${y2}vh) scale(1.1)}66%{transform:translate(${x3}vw,${y3}vh) scale(.8)}100%{transform:translate(${x4}vw,${y4}vh) scale(1.25)}}`;
    firefly.style.animationName = `bookFireflyMove${index}`;
    field.append(firefly);
  });
  document.head.append(style);
}

async function loadBookPage() {
  if (!requestedSlug) {
    showBookNotFound('Choose a title from the library to view its book page.');
    return;
  }

  try {
    const response = await fetch('/library/data/books.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Could not load the book data (${response.status}).`);
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.books)) throw new Error('The book data has an unsupported format.');

    const book = data.books.find((item) => item.slug === requestedSlug && item.status === 'published');
    if (!book) {
      showBookNotFound();
      return;
    }
    renderBook(book, data.books);
  } catch (error) {
    console.error('Unable to load this book page:', error);
    showBookNotFound('The book details could not be loaded. Please return to the library and try again.');
  }
}

initializeFireflies();
loadBookPage();

const bookPdfPath = '../assets/- merc demo - The Homebrewery.pdf';
const bookPdfElement = document.querySelector('#book-pdf-book');
const bookPdfLoading = document.querySelector('#book-pdf-loading');
const bookPdfCurrent = document.querySelector('#book-pdf-current');
const bookPdfTotal = document.querySelector('#book-pdf-total');
const bookPdfPrevious = document.querySelector('#book-pdf-prev');
const bookPdfNext = document.querySelector('#book-pdf-next');
const bookPdfFullscreen = document.querySelector('#book-pdf-fullscreen');
const bookPdfFrame = document.querySelector('.book-pdf-frame');
const bookPdfExit = document.querySelector('#book-pdf-exit');
let bookPdfDocument;
let bookPdfFlip;
let bookPdfPages = [];
let bookPdfPageCount = 0;
let bookPdfRenders = [];

function createBookPdfShell(pageNumber) {
  const page = document.createElement('div');
  page.className = 'book-pdf-page';
  page.dataset.density = pageNumber === 1 || pageNumber === bookPdfPageCount ? 'hard' : 'soft';
  return page;
}

async function renderBookPdfPage(index) {
  if (bookPdfRenders[index]) return bookPdfRenders[index];
  bookPdfRenders[index] = (async () => {
    const page = await bookPdfDocument.getPage(index + 1);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    bookPdfPages[index].replaceChildren(canvas);
  })().catch((error) => {
    bookPdfRenders[index] = undefined;
    throw error;
  });
  return bookPdfRenders[index];
}

async function renderBookPdfSpread(index) {
  const first = Math.max(0, Math.min(index, bookPdfPageCount - 1));
  await Promise.all([first, first + 1].filter((page) => page < bookPdfPageCount).map(renderBookPdfPage));
}

function updateBookPdfControls(index) {
  const right = Math.min(index + 2, bookPdfPageCount);
  bookPdfCurrent.textContent = `${String(index + 1).padStart(2, '0')}–${String(right).padStart(2, '0')}`;
  bookPdfPrevious.disabled = index <= 0;
  bookPdfNext.disabled = index >= bookPdfPageCount - 2;
}

async function initializeBookPdfPreview() {
  if (!bookPdfElement || !bookPdfLoading) return;
  try {
    const pdfjsLib = await import('../assets/pdfjs/pdf.mjs');
    if (!window.St?.PageFlip) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '../assets/page-flip.browser.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../assets/pdfjs/pdf.worker.mjs';
    bookPdfDocument = await pdfjsLib.getDocument(bookPdfPath).promise;
    bookPdfPageCount = bookPdfDocument.numPages;
    bookPdfTotal.textContent = String(bookPdfPageCount).padStart(2, '0');
    bookPdfPages = Array.from({ length: bookPdfPageCount }, (_, index) => createBookPdfShell(index + 1));
    await renderBookPdfSpread(0);
    bookPdfFlip = new window.St.PageFlip(bookPdfElement, { width: 420, height: 560, size: 'stretch', minWidth: 240, maxWidth: 760, minHeight: 320, maxHeight: 680, showCover: false, autoSize: false, drawShadow: true, flippingTime: 800, maxShadowOpacity: .25, mobileScrollSupport: false, usePortrait: false });
    bookPdfFlip.loadFromHTML(bookPdfPages);
    bookPdfFlip.on('flip', (event) => { updateBookPdfControls(event.data); renderBookPdfSpread(event.data).catch(() => {}); });
    bookPdfPrevious.addEventListener('click', () => { const index = bookPdfFlip.getCurrentPageIndex() - 2; renderBookPdfSpread(index).then(() => bookPdfFlip.flip(index)); });
    bookPdfNext.addEventListener('click', () => { const index = bookPdfFlip.getCurrentPageIndex() + 2; renderBookPdfSpread(index).then(() => bookPdfFlip.flip(index)); });
    const setBookPdfFullscreen = (active) => {
      bookPdfFrame.classList.toggle('is-fullscreen', active);
      bookPdfExit.hidden = !active;
      document.body.style.overflow = active ? 'hidden' : '';
      bookPdfFullscreen.innerHTML = active ? 'Exit full screen <span aria-hidden="true">↙</span>' : 'Full screen <span aria-hidden="true">↗</span>';
    };
    bookPdfFullscreen.addEventListener('click', async () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (bookPdfFrame.requestFullscreen) {
        await bookPdfFrame.requestFullscreen();
      } else {
        setBookPdfFullscreen(!bookPdfFrame.classList.contains('is-fullscreen'));
      }
    });
    bookPdfExit.addEventListener('click', () => setBookPdfFullscreen(false));
    document.addEventListener('fullscreenchange', () => setBookPdfFullscreen(Boolean(document.fullscreenElement)));
    updateBookPdfControls(0);
    bookPdfLoading.hidden = true;
  } catch (error) {
    console.error('Unable to load the sample PDF:', error);
    bookPdfLoading.textContent = 'The sample preview is unavailable right now.';
  }
}

initializeBookPdfPreview();
