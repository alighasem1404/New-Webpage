const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../library/library.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function normalizeLibraryText('), source.indexOf('function validateBooks(')), context);
const matches = context.matchesLibrarySearch;
const books = JSON.parse(fs.readFileSync(path.join(__dirname, '../library/data/books.json'), 'utf8')).books;
const title = (slug) => books.find((book) => book.slug === slug).title;

test('straight, curly, and omitted apostrophes find the published title', () => {
  const text = title('buccaneers-back-alley');
  for (const query of ["Buccaneer's", 'Buccaneer’s', 'Buccaneer‘s', 'Buccaneers']) {
    assert.equal(matches(text, query), true, query);
  }
});

test('title words can appear in any order with extra whitespace', () => {
  const text = title('into-the-dwarf-fortress');
  assert.equal(matches(text, 'fortress dwarf'), true);
  assert.equal(matches(text, '  FORTRESS   dwarf  '), true);
  assert.equal(matches(text, 'fortress missingword'), false);
});

test('hyphens and punctuation do not require exact typing', () => {
  const text = title('buccaneers-back-alley');
  assert.equal(matches(text, 'alley back'), true);
  assert.equal(matches(text, 'back—alley'), true);
  assert.equal(matches(text, 'back-alley'), true);
});

test('accent-insensitive and partial-word matching still work', () => {
  assert.equal(matches('Café Adventures', 'cafe'), true);
  assert.equal(matches(title('the-arcane-bookshelf'), 'bookshel arc'), true);
});

test('empty searches show all books and unrelated words match none', () => {
  for (const book of books) {
    assert.equal(matches(book.title, '   '), true);
    assert.equal(matches(book.title, 'zzznomatchingtitle'), false);
  }
});
