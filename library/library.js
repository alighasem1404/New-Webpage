const librarySearch = document.querySelector('#library-search');
const libraryFilters = [...document.querySelectorAll('[data-library-filter]')];
const catalogResult = document.querySelector('#catalog-result');
const catalogEmpty = document.querySelector('#catalog-empty');
const catalogGrid = document.querySelector('#catalog-grid');
const libraryHeroArt = document.querySelector('#library-hero-art');
const allFeaturedCount = document.querySelector('#all-featured-count');

let catalogBooks = [];
let libraryCards = [];
let activeLibraryFilter = 'all';
const libraryViewStorageKey = 'verseluft.library.view';
let libraryLoaded = false;
let restoringLibraryScroll = false;
let libraryRestoreVersion = 0;
let libraryScrollSaveTimer;

function readLibraryView() {
  const params = new URLSearchParams(window.location.search);
  const historyView = history.state?.libraryView;
  const matchingHistory = historyView?.url === window.location.pathname + window.location.search;
  let savedView = matchingHistory ? historyView : null;

  // Return links from a book open a fresh listing entry, rather than browser Back.
  if (!savedView && !params.has('q') && !params.has('category')) {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin && referrer.pathname === '/library/book.html') {
        savedView = JSON.parse(sessionStorage.getItem(libraryViewStorageKey));
      }
    } catch { /* Browsing still works when storage is unavailable. */ }
  }

  const query = params.has('q') ? params.get('q') : savedView?.query;
  const category = params.has('category') ? params.get('category') : savedView?.category;
  return {
    query: typeof query === 'string' ? query : '',
    category: libraryFilters.some((button) => button.dataset.libraryFilter === category) ? category : 'all',
    scrollY: Number.isFinite(savedView?.scrollY) ? Math.max(0, savedView.scrollY) : null,
  };
}

function saveLibraryView() {
  if (!libraryLoaded) return;
  const url = new URL(window.location.href);
  const query = librarySearch.value;
  if (query.trim()) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  if (activeLibraryFilter !== 'all') url.searchParams.set('category', activeLibraryFilter);
  else url.searchParams.delete('category');

  const view = { query, category: activeLibraryFilter, scrollY: window.scrollY, url: url.pathname + url.search };
  history.replaceState({ ...history.state, libraryView: view }, '', url);
  try { sessionStorage.setItem(libraryViewStorageKey, JSON.stringify(view)); }
  catch { /* URL and history restoration do not depend on storage. */ }
}

function applyLibraryView(view) {
  librarySearch.value = view.query;
  activeLibraryFilter = view.category;
  libraryFilters.forEach((button) => {
    const isActive = button.dataset.libraryFilter === activeLibraryFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function cancelLibraryScrollRestore() {
  libraryRestoreVersion += 1;
  restoringLibraryScroll = false;
}

async function restoreLibraryScroll(view) {
  const version = ++libraryRestoreVersion;
  restoringLibraryScroll = true;
  // Wait briefly for heading fonts to settle, without blocking the catalog.
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 500))]);
  await new Promise(requestAnimationFrame);
  if (version !== libraryRestoreVersion) return;
  const catalogTop = document.querySelector('#catalog').getBoundingClientRect().top + window.scrollY;
  const top = view.scrollY ?? ((view.query || view.category !== 'all' || window.location.hash === '#catalog') ? catalogTop : 0);
  window.scrollTo({ top, behavior: 'instant' });
  restoringLibraryScroll = false;
  saveLibraryView();
}

const initialLibraryView = readLibraryView();
applyLibraryView(initialLibraryView);
history.scrollRestoration = 'manual';

function normalizeLibraryText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function validateBooks(books) {
  if (!Array.isArray(books)) throw new Error('The books property must be an array.');

  const ids = new Set();
  const slugs = new Set();
  const categories = new Set(['adventure', 'setting', 'resource']);
  const heroPositions = new Set(['back', 'left', 'right', 'front']);
  const requiredText = ['id', 'slug', 'title', 'categoryLabel', 'shortDescription', 'description', 'coverImage', 'coverAlt'];

  books.forEach((book, index) => {
    if (!book || typeof book !== 'object') throw new Error(`Book record ${index + 1} is not an object.`);
    for (const field of requiredText) {
      if (typeof book[field] !== 'string' || !book[field].trim()) {
        throw new Error(`Book record ${index + 1} is missing “${field}”.`);
      }
    }
    if (!categories.has(book.category)) throw new Error(`Book “${book.title}” has an unsupported category.`);
    if (!Array.isArray(book.tags) || book.tags.some((tag) => typeof tag !== 'string')) {
      throw new Error(`Book “${book.title}” must have a tags array of text values.`);
    }
    if (!['published', 'draft'].includes(book.status) || typeof book.featured !== 'boolean') {
      throw new Error(`Book “${book.title}” needs a published/draft status and a featured flag.`);
    }
    if (book.heroPosition != null && !heroPositions.has(book.heroPosition)) {
      throw new Error(`Book “${book.title}” has an unsupported heroPosition.`);
    }
    if (!Number.isFinite(book.sortOrder)) throw new Error(`Book “${book.title}” needs a numeric sortOrder.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(book.slug)) throw new Error(`Book “${book.title}” has an invalid URL slug.`);
    if (ids.has(book.id)) throw new Error(`Duplicate book id: ${book.id}.`);
    if (slugs.has(book.slug)) throw new Error(`Duplicate book slug: ${book.slug}.`);
    ids.add(book.id);
    slugs.add(book.slug);
  });
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createBookCard(book) {
  const bookUrl = `/library/book.html?slug=${encodeURIComponent(book.slug)}`;
  const card = document.createElement('article');
  card.className = 'book-card';
  card.dataset.bookId = book.id;
  card.dataset.slug = book.slug;
  card.dataset.category = book.category;

  const coverWrap = document.createElement('a');
  coverWrap.className = 'book-cover-wrap';
  coverWrap.href = bookUrl;
  coverWrap.setAttribute('aria-label', `View book: ${book.title}`);

  const cover = document.createElement('img');
  cover.src = book.coverImage;
  cover.alt = book.coverAlt;
  cover.width = 247;
  cover.height = 320;
  cover.loading = 'lazy';
  cover.decoding = 'async';
  coverWrap.append(cover);

  const copy = document.createElement('div');
  copy.className = 'book-card-copy';
  const title = document.createElement('h3');
  const titleLink = createTextElement('a', 'book-title-link', book.title);
  titleLink.href = bookUrl;
  title.append(titleLink);
  copy.append(title);
  copy.append(createTextElement('p', 'book-card-type', book.categoryLabel));
  copy.append(createTextElement('p', '', book.shortDescription));

  const detailsButton = document.createElement('a');
  detailsButton.className = 'book-details-button';
  detailsButton.href = bookUrl;
  detailsButton.setAttribute('aria-label', `View book: ${book.title}`);
  detailsButton.append(document.createTextNode('View book '));
  const arrow = createTextElement('span', '', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  detailsButton.append(arrow);
  copy.append(detailsButton);

  card.append(coverWrap, copy);
  card.dataset.search = [book.title, book.categoryLabel, book.shortDescription, book.description, ...book.tags, book.series?.name].filter(Boolean).join(' ');
  return card;
}

function renderHeroCovers(books) {
  const orbitDecorations = [...libraryHeroArt.querySelectorAll('.library-art-orbit')];
  const heroCovers = books
    .filter((book) => book.status === 'published' && book.heroPosition)
    .sort((first, second) => ['back', 'left', 'right', 'front'].indexOf(first.heroPosition) - ['back', 'left', 'right', 'front'].indexOf(second.heroPosition))
    .map((book) => {
      const cover = document.createElement('img');
      cover.className = `library-cover library-cover-${book.heroPosition}`;
      cover.src = book.coverImage;
      cover.alt = '';
      cover.width = 247;
      cover.height = 320;
      cover.fetchPriority = 'high';
      cover.decoding = 'async';
      return cover;
    });
  libraryHeroArt.replaceChildren(...orbitDecorations, ...heroCovers);
}

function updateLibrary() {
  const query = normalizeLibraryText(librarySearch.value.trim());
  let shown = 0;

  libraryCards.forEach((card) => {
    const matchesCategory = activeLibraryFilter === 'all' || card.dataset.category === activeLibraryFilter;
    const matchesSearch = !query || normalizeLibraryText(card.dataset.search).includes(query);
    card.hidden = !(matchesCategory && matchesSearch);
    if (!card.hidden) shown += 1;
  });

  catalogEmpty.hidden = shown > 0;
  catalogEmpty.textContent = catalogBooks.length
    ? 'No featured books match that search. Try a different title or category.'
    : 'There are no featured books to show right now.';
  catalogGrid.classList.toggle('has-single-result', shown === 1);
  catalogResult.textContent = `Showing ${shown} ${shown === 1 ? 'featured title' : 'featured titles'}`;
}

function renderLibrary(books) {
  renderHeroCovers(books);
  catalogBooks = books
    .filter((book) => book.status === 'published' && book.featured)
    .sort((first, second) => first.sortOrder - second.sortOrder);
  libraryCards = catalogBooks.map(createBookCard);
  catalogGrid.replaceChildren(...libraryCards);
  catalogGrid.setAttribute('aria-busy', 'false');
  allFeaturedCount.textContent = String(catalogBooks.length);
  updateLibrary();
}

async function loadLibrary() {
  try {
    const response = await fetch('./data/books.json', { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Could not load the book data (${response.status}).`);

    const data = await response.json();
    if (data.schemaVersion !== 1) throw new Error('The book data uses an unsupported schema version.');
    validateBooks(data.books);
    renderLibrary(data.books);
    libraryLoaded = true;
    if (libraryRestoreVersion === 0) restoreLibraryScroll(initialLibraryView);
    else saveLibraryView();
  } catch (error) {
    console.error('Unable to load the library catalog:', error);
    catalogGrid.setAttribute('aria-busy', 'false');
    catalogResult.textContent = 'The featured book list could not be loaded.';
    catalogEmpty.textContent = 'Please refresh the page or check the book data file.';
    catalogEmpty.hidden = false;
  }
}

libraryFilters.forEach((button) => {
  button.addEventListener('click', () => {
    cancelLibraryScrollRestore();
    applyLibraryView({ query: librarySearch.value, category: button.dataset.libraryFilter });
    updateLibrary();
    saveLibraryView();
  });
});

librarySearch.addEventListener('input', () => {
  cancelLibraryScrollRestore();
  updateLibrary();
  saveLibraryView();
});

['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, cancelLibraryScrollRestore, { passive: true });
});
window.addEventListener('scroll', () => {
  if (!libraryLoaded || restoringLibraryScroll) return;
  clearTimeout(libraryScrollSaveTimer);
  libraryScrollSaveTimer = setTimeout(() => {
    libraryScrollSaveTimer = undefined;
    if (!restoringLibraryScroll) saveLibraryView();
  }, 300);
}, { passive: true });
window.addEventListener('pagehide', () => {
  clearTimeout(libraryScrollSaveTimer);
  libraryScrollSaveTimer = undefined;
  saveLibraryView();
});

function restoreCurrentLibraryView() {
  if (!libraryLoaded) return;
  const view = readLibraryView();
  applyLibraryView(view);
  updateLibrary();
  restoreLibraryScroll(view);
}
window.addEventListener('popstate', restoreCurrentLibraryView);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) restoreCurrentLibraryView();
});

loadLibrary();
