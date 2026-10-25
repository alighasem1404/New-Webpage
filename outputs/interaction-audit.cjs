const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/Noura/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const results = [];
const base = 'http://127.0.0.1:8765';
async function main() {
 const browser = await chromium.launch({headless:true, channel:'msedge'});
 const context = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
 const page = await context.newPage();
 async function test(name, fn) {try {const detail = await fn(); results.push({name, status:'passed', detail});} catch(e) {results.push({name,status:'failed',detail:e.message});} console.log(JSON.stringify(results.at(-1)));}
 const visit = route => page.goto(base + route, {waitUntil:'load'});
 const until = async fn => page.waitForFunction(fn, null, {timeout:15000});
 await visit('/');
 await until(() => !!document.querySelector('#pdf-book canvas'));
 await test('Home PDF next and previous', async () => {
  await page.locator('#flip-next').click();
  await until(() => document.querySelector('#current-page').textContent.startsWith('03'));
  await page.locator('#flip-prev').click();
  await until(() => document.querySelector('#current-page').textContent.startsWith('01'));
 });
 await test('Home PDF dots', async () => {
  await page.locator('.page-dot').nth(6).click();
  await until(() => document.querySelector('#current-page').textContent.startsWith('07'));
 });
 await test('Home PDF modal close and page synchronization', async () => {
  await page.locator('#open-pdf').click();
  await until(() => document.querySelector('#pdf-modal').classList.contains('is-open'));
  await page.locator('#close-pdf').click();
  assert.equal(await page.locator('#pdf-modal').getAttribute('aria-hidden'), 'true');
  await page.locator('#open-pdf').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#pdf-modal').getAttribute('aria-hidden'), 'true');
 });
 await test('Home PDF modal keyboard focus enters dialog', async () => {
  await page.locator('#open-pdf').click();
  const focus = await page.evaluate(() => ({id:document.activeElement.id, inDialog:!!document.activeElement.closest('[role="dialog"]')}));
  await page.keyboard.press('Escape');
  assert.ok(focus.inDialog, JSON.stringify(focus));
 });
 await test('Testimonial controls', async () => {
  const before = await page.locator('#testimonial-name').textContent();
  await page.locator('#testimonial-next').click();
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator('#testimonial-name').textContent(), before);
  await page.locator('#testimonial-prev').click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#testimonial-name').textContent(), before);
 });
 await test('Newsletter loads with a working email field (no submission)', async () => {
  await until(() => !!document.querySelector('#kit-newsletter-form input[type=email]'));
  const email = page.locator('#kit-newsletter-form input[type=email]');
  await email.fill('invalid');
  assert.equal(await email.evaluate(e => e.checkValidity()),false);
  await email.fill('');
 });
 await test('Scroll to top button', async () => {
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.locator('.scroll-to-top').click();
  await until(() => scrollY < 3);
 });
 await visit('/projects/');
 await until(() => document.querySelectorAll('.upcoming-card').length === 4);
 await test('Project campaign arrows map to source data', async () => {
  const data = require('../projects/data/projects.json').projects.filter(p => p.section==='live');
  const links = await page.locator('#live-projects .project-arrow').evaluateAll(es=>es.map(e=>e.href));
  assert.deepEqual(links,data.map(p=>p.link));
 });
 await test('Upcoming carousel next, previous and wrap', async () => {
  await page.locator('#upcoming-next').click(); assert.equal(await page.locator('#upcoming-current').textContent(),'2');
  await page.locator('#upcoming-prev').click(); assert.equal(await page.locator('#upcoming-current').textContent(),'1');
  await page.locator('#upcoming-prev').click(); assert.equal(await page.locator('#upcoming-current').textContent(),'4');
 });
 await test('Get project updates leads to newsletter', async () => {
  const link=page.getByRole('link',{name:'Get project updates'});
  const href=await link.getAttribute('href');
  assert.ok(href.includes('#updates'),`Actual destination: ${href}`);
 });
 await visit('/contact/');
 await page.setViewportSize({width:375,height:812});
 await test('Contact topics choose the corresponding subject', async () => {
  await page.locator('[data-inquiry="publishing"]').click();
  assert.equal(await page.locator('[name="subject"]').inputValue(),'Publishing and partnerships');
 });
 await test('Contact topics navigate to the message form', async () => {
  await page.evaluate(() => {scrollTo(0,0); document.querySelector('[data-inquiry="general"]').click();});
  const state=await page.evaluate(() => ({hash:location.hash, top:document.querySelector('#message-form').getBoundingClientRect().top, height:innerHeight}));
  assert.ok(state.hash==='#message-form' || state.top < state.height,JSON.stringify(state));
 });
 await page.setViewportSize({width:1440,height:900});
 await visit('/library/');
 await until(() => document.querySelectorAll('.book-card').length===13);
 await test('Library search, no-results and category filters', async () => {
  await page.locator('#library-search').fill('Arcane'); assert.equal(await page.locator('.book-card:visible').count(),1);
  await page.locator('#library-search').fill('zzzz-audit-no-result'); assert.equal(await page.locator('.book-card:visible').count(),0); assert.ok(await page.locator('#catalog-empty').isVisible());
  await page.locator('#library-search').fill('');
  for (const category of ['adventure','setting','resource']) {
   await page.locator(`[data-library-filter="${category}"]`).click();
   const categories=await page.locator('.book-card:visible').evaluateAll(es=>es.map(e=>e.dataset.category));
   assert.ok(categories.length && categories.every(c=>c===category));
  }
 });
 await test('All 13 View book links identify the correct book', async () => {
  const links=await page.locator('.book-details-button').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
  const data=require('../library/data/books.json').books.filter(b=>b.featured&&b.status==='published').sort((a,b)=>a.sortOrder-b.sortOrder);
  assert.deepEqual(links,data.map(b=>`/library/book.html?slug=${b.slug}`));
 });
 await test('All 13 book pages load their own title, cover, and purchase link', async () => {
  for (const book of require('../library/data/books.json').books) {
   await visit(`/library/book.html?slug=${book.slug}`);
   await until(()=>document.querySelector('#book-title').textContent!=='Loading book details…');
   assert.equal(await page.locator('#book-title').textContent(),book.title);
   assert.equal(await page.locator('#book-cover').getAttribute('src'),book.detailImage||book.coverImage);
   assert.equal(await page.locator('#book-store-link').getAttribute('href'),book.storeUrl);
  }
 });
 await visit('/library/book.html?slug=the-arcane-bookshelf');
 await until(()=>!!document.querySelector('#book-pdf-book canvas'));
 await test('Library PDF next/previous', async()=>{
  await page.locator('#motion-test-close').click();
  await page.locator('#book-pdf-next').click();
  await until(()=>document.querySelector('#book-pdf-current').textContent.startsWith('03'));
  await page.locator('#book-pdf-prev').click();
  await until(()=>document.querySelector('#book-pdf-current').textContent.startsWith('01'));
 });
 await test('Library PDF Exit full screen leaves browser fullscreen', async()=>{
  await page.locator('#book-pdf-fullscreen').click();
  await until(()=>!!document.fullscreenElement);
  await page.locator('#book-pdf-exit').click();
  const state=await page.evaluate(()=>({fullscreen:!!document.fullscreenElement, exitHidden:document.querySelector('#book-pdf-exit').hidden, overflow:document.body.style.overflow}));
  await page.evaluate(()=>document.fullscreenElement && document.exitFullscreen());
  assert.equal(state.fullscreen,false,JSON.stringify(state));
 });
 await test('Unknown book slug shows not-found state', async()=>{
  await visit('/library/book.html?slug=invalid-audit-slug');
  await until(()=>document.querySelector('#book-title').textContent!=='Loading book details…');
  assert.ok(await page.locator('#book-title').textContent().then(t=>t.includes('not in the library')));
  assert.equal(await page.locator('#book-store-link').isVisible(),false);
 });
 await visit('/blog/');
 await test('Journal carousel and filters', async()=>{
  await page.locator('[data-blog-next]').click(); assert.equal(await page.locator('#blog-slide-current').textContent(),'02');
  await page.locator('[data-blog-prev]').click(); assert.equal(await page.locator('#blog-slide-current').textContent(),'01');
  await page.locator('[data-blog-filter="advice"]').click();
  assert.equal(await page.locator('.blog-card:visible').count(),2);
 });
 await test('Unknown article slug shows not-found state', async()=>{
  await visit('/blog/article.html?slug=invalid-audit-slug');
  const title=await page.locator('#article-title').textContent();
  assert.ok(/not found|could not find|unavailable/i.test(title),`Actual article: ${title}`);
 });
 await visit('/dashboard/');
 await until(()=>document.querySelector('#count-all').textContent!=='0');
 await test('Dashboard search and content filters', async()=>{
  await page.locator('[data-view="content"]').first().click();
  await page.locator('#content-search').fill('zzzz-no-match'); assert.equal(await page.locator('#table-result-count').textContent(),'0 items');
  await page.locator('#content-search').fill('');
  await page.locator('[data-filter="project"]').click(); assert.equal(await page.locator('#content-table-body tr').count(),7);
 });
 await test('Dashboard local project save updates public preview only', async()=>{
  await page.locator('#content-table-body [data-action="edit"]').first().click();
  await page.locator('#entry-title').fill('AUDIT isolated preview project');
  await page.locator('#save-entry').click();
  await page.waitForTimeout(200);
  await visit('/');
  await until(()=>!!document.querySelector('#live-projects-grid .project-card'));
  assert.equal(await page.locator('#live-projects-grid h3').first().textContent(),'AUDIT isolated preview project');
  await page.evaluate(()=>localStorage.clear());
 });
 await visit('/animation-test/');
 await test('Motion study scene controls',async()=>{
  await page.locator('[data-scene="moonlit"]').click();
  assert.equal(await page.locator('#backdrop-demo').getAttribute('data-scene'),'moonlit');
 });
 fs.writeFileSync(path.join(__dirname,'interaction-audit-results.json'),JSON.stringify(results,null,2));
 await browser.close();
 console.log(JSON.stringify({total:results.length, passed:results.filter(t=>t.status==='passed').length, failed:results.filter(t=>t.status==='failed')}));
}
main().catch(e=>{console.error(e);fs.writeFileSync(path.join(__dirname,'interaction-audit-results.json'),JSON.stringify(results,null,2));process.exitCode=1;});
