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

function createBookCard(book, index, total) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.dataset.bookId = book.id;
  card.dataset.slug = book.slug;
  card.dataset.category = book.category;

  const coverWrap = document.createElement('div');
  coverWrap.className = 'book-cover-wrap';

  const cover = document.createElement('img');
  cover.src = book.coverImage;
  cover.alt = book.coverAlt;
  cover.width = 247;
  cover.height = 320;
  cover.loading = 'lazy';
  cover.decoding = 'async';
  coverWrap.append(cover);
  coverWrap.append(createTextElement('span', 'book-cover-index', `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`));

  const copy = document.createElement('div');
  copy.className = 'book-card-copy';
  copy.append(createTextElement('h3', '', book.title));
  copy.append(createTextElement('p', 'book-card-type', book.categoryLabel));
  copy.append(createTextElement('p', '', book.shortDescription));

  const detailsButton = document.createElement('a');
  detailsButton.className = 'book-details-button';
  detailsButton.href = `/library/book.html?slug=${encodeURIComponent(book.slug)}`;
  detailsButton.setAttribute('aria-label', `View book: ${book.title}`);
  detailsButton.append(document.createTextNode('View book '));
  const arrow = createTextElement('span', '', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  detailsButton.append(arrow);
  detailsButton.addEventListener('click', () => openBookDetails(book));
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
  libraryCards = catalogBooks.map((book, index) => createBookCard(book, index, catalogBooks.length));
  catalogGrid.replaceChildren(...libraryCards);
  catalogGrid.setAttribute('aria-busy', 'false');
  allFeaturedCount.textContent = String(catalogBooks.length);
  updateLibrary();
}

async function loadLibrary() {
  try {
    const response = await fetch('./data/books.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Could not load the book data (${response.status}).`);

    const data = await response.json();
    if (data.schemaVersion !== 1) throw new Error('The book data uses an unsupported schema version.');
    validateBooks(data.books);
    renderLibrary(data.books);

    const initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) {
      librarySearch.value = initialQuery;
      updateLibrary();
      document.querySelector('#catalog').scrollIntoView({ behavior: 'instant', block: 'start' });
    }
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
    activeLibraryFilter = button.dataset.libraryFilter;
    libraryFilters.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('is-active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    updateLibrary();
  });
});

librarySearch.addEventListener('input', updateLibrary);

loadLibrary();
