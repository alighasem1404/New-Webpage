const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Noura/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const routes = ['/', '/about/', '/projects/', '/contact/', '/blog/', '/blog/article.html?slug=quiet-scenes', '/library/', '/library/book.html?slug=the-arcane-bookshelf', '/dashboard/', '/animation-test/'];
async function main() {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  if (process.argv.includes('--followup')) {
    const page=await browser.newPage({viewport:{width:375,height:812}, reducedMotion:'reduce'});
    const details=[];
    for (const route of (process.argv.includes('--dashboard') ? [] : ['/', '/about/', '/projects/', '/contact/'])) {
      const errors=[];
      page.removeAllListeners('pageerror');
      page.on('pageerror', e=>errors.push(e.message));
      await page.goto('https://verseluft.com'+route,{waitUntil:'load'});
      await page.evaluate(()=>document.fonts.ready);
      details.push({route,live:true,errors,...await page.evaluate(()=>{
        const p=document.querySelector('.project-card-body p');
        return {placeholders:[...document.querySelectorAll('footer a[href="#"]')].map(e=>e.textContent),contactDisabled:document.querySelector('#message-form button[type=submit]')?.disabled,updatesHref:[...document.querySelectorAll('a')].find(e=>e.textContent.includes('Get project updates'))?.getAttribute('href'),projectDescription:p?{color:getComputedStyle(p).color,background:getComputedStyle(p.closest('.project-card')).backgroundColor,fontSize:getComputedStyle(p).fontSize}:null};
      })});
      console.log(JSON.stringify(details.at(-1)));
    }
    fs.writeFileSync(path.join(__dirname,'followup-audit-results.json'),JSON.stringify(details,null,2));
    await page.setViewportSize({width:1440,height:900});
    await page.goto(base+'/dashboard/',{waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('#count-all').textContent!=='0');
    await page.locator('[data-view="analytics"]').first().click();
    const before=await page.locator('.report-metric strong').allTextContents();
    await page.locator('#analytics-range').selectOption('7');
    const after=await page.locator('.report-metric strong').allTextContents();
    const dates=await page.locator('#analytics-view .chart-x-axis').textContent();
    details.push({dashboardRange:{before,after,dates}});
    console.log(JSON.stringify(details.at(-1)));
    fs.writeFileSync(path.join(__dirname,'followup-audit-results.json'),JSON.stringify(details,null,2));
    await browser.close();return;
  }
  if (process.argv.includes('--external')) {
    const context = await browser.newContext();
    const urls = JSON.parse(fs.readFileSync(path.join(__dirname,'static-audit-results.json'),'utf8')).external.filter(u => /discord.gg|drivethrurpg|kickstarter|kit.com/.test(u));
    urls.push('https://discord.com/api/v10/invites/ByZrKpwUwh?with_counts=true', 'https://verseluft.com/', 'https://verseluft.com/projects/', 'https://verseluft.com/contact/', 'https://verseluft.com/library/', 'https://verseluft.com/dashboard/');
    const checked = [];
    for (let i=0; i<urls.length; i+=4) {
      await Promise.all(urls.slice(i,i+4).map(async url=>{
        let entry;
        try {
          const response=await context.request.get(url,{timeout:20000,failOnStatusCode:false});
          const body=await response.text();
          const title=(body.match(/<title[^>]*>([^<]+)/i)||[])[1];
          entry={url,status:response.status(),finalUrl:response.url(),title, ...(url.includes('/invites/')?{body:body.slice(0,600)}:{}), ...(url==='https://verseluft.com/'?{hasLocalHero:body.includes('Everything a DM Could Ever Need'),hasOldHero:body.includes('Empowering RPG Creators')}: {})};
        } catch(e) {entry={url,error:e.message.split('\n')[0]};}
        checked.push(entry); console.log(JSON.stringify(entry));
      }));
    }
    fs.writeFileSync(path.join(__dirname,'external-audit-results.json'),JSON.stringify(checked,null,2));
    await browser.close(); return;
  }
  if (process.argv.includes('--visual')) {
    const context=await browser.newContext({viewport:{width:375,height:812}});
    const page=await context.newPage();
    for (const route of ['/', '/about/', '/contact/', '/projects/', '/library/book.html?slug=the-arcane-bookshelf', '/library/book.html?slug=invalid-audit-slug']) {
      await page.goto(base+route,{waitUntil:'load'});
      await page.evaluate(async()=>{
        [...document.images].forEach(i=>i.loading='eager');
        await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
        await document.fonts.ready;
      });
      const elements= route==='/'?['.about-art','.live-projects']:route.includes('book.html')?['.book-detail-hero','.book-description-copy']:['main'];
      for (let i=0;i<elements.length;i++) {
        const element=page.locator(elements[i]).first();
        if (!await element.isVisible()) continue;
        await element.scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(__dirname,`visual-${route.replace(/[^a-z0-9]/gi,'_')}-${i}.png`)});
      }
      console.log(JSON.stringify({route, state:await page.evaluate(()=>({images:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src), bookStore:document.querySelector('#book-store-link')?.outerHTML, bookStoreDisplay:document.querySelector('#book-store-link')?getComputedStyle(document.querySelector('#book-store-link')).display:null, widths:[...document.querySelectorAll('.book-description-copy')].map(e=>({width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,80)}))}))}));
    }
    await browser.close(); return;
  }
  const results = [];
  const context = await browser.newContext();
  for (const width of [1440, 768, 375]) {
    for (const route of routes) {
      const page = await context.newPage({viewport: {width, height: 900}});
      await page.setViewportSize({width, height: 900});
      const errors = [], failed = [], badResponses = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => failed.push({url: request.url(), error: request.failure()?.errorText}));
      page.on('response', response => {if (response.status() >= 400) badResponses.push({url: response.url(), status: response.status()});});
      await page.goto(base + route, {waitUntil: 'load', timeout: 30000}).catch(error => errors.push(error.message));
      await page.evaluate(async () => { for (const image of document.images) { image.loading = 'eager'; } });
      await page.waitForTimeout(1000);
      const state = await page.evaluate(() => {
        const visible = element => !!(element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        const links = [...document.querySelectorAll('a')].filter(visible).map(a => ({text: a.textContent.trim(), href: a.getAttribute('href'), url: a.href}));
        return {
          title: document.title,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          overflowing: [...document.querySelectorAll('main *, header *, footer *')].filter(visible).filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < -2 || r.right > innerWidth + 2); }).slice(0, 15).map(e => ({tag: e.tagName, class: e.className, text: e.textContent.trim().slice(0,80)})),
          links,
          brokenImages: [...document.images].filter(visible).filter(i => i.complete && !i.naturalWidth).map(i => i.src),
          disabledButtons: [...document.querySelectorAll('button:disabled')].filter(visible).map(b => ({id: b.id, text: b.textContent.trim()})),
          missingLabels: [...document.querySelectorAll('button,input,select,textarea')].filter(visible).filter(e => !e.textContent.trim() && !e.getAttribute('aria-label') && !e.labels?.length && !e.getAttribute('aria-labelledby')).map(e => e.outerHTML.slice(0,180)),
          duplicateIds: [...new Set([...document.querySelectorAll('[id]')].map(e => e.id))].filter(id => document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length > 1),
          invalidFragments: links.filter(a => { const u = new URL(a.url); return u.pathname === location.pathname && u.hash && !document.getElementById(decodeURIComponent(u.hash.slice(1))); }),
          projectCount: document.querySelectorAll('#live-projects .project-card, #live-projects-grid .project-card').length,
          catalogCount: document.querySelectorAll('#catalog-grid .book-card').length,
          previewLoaded: !!document.querySelector('#pdf-book canvas, #book-pdf-book canvas'),
          newsletter: !!document.querySelector('#kit-newsletter-form form')
        };
      });
      const result = {route, width, errors, failed, badResponses, ...state};
      results.push(result);
      if (width !== 768 && ['/', '/about/', '/projects/', '/contact/'].includes(route)) await page.screenshot({path: path.join(__dirname, `audit-${width}-${route.replaceAll('/', '') || 'home'}.png`), fullPage: true});
      console.log(JSON.stringify({...result, links: undefined, overflowing: result.overflowing.slice(0,3)}));
      await page.close();
    }
  }
  fs.writeFileSync(path.join(__dirname, 'site-audit-results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
main().catch(e => {console.error(e); process.exitCode = 1;});
