# Library page audit — 28 October 2026

The library loads its books and its main filters work, but browsing state is lost, every book-link click throws an error, and the linked purchase/help journeys contain unfinished or broken behavior. The strongest visual problems are undersized controls and text, excessive space before the catalog on small screens, and low-resolution covers.

This is an inspection report. No website source or deployment was changed.

## Coverage and limits

- Inspected the local `/library/` page at browser widths of 320, 375, 768, 1024, and 1440 pixels.
- Exercised all four category filters, eight search cases, combined category/search, empty results, book navigation, browser Back, refresh, a `?q=` search URL, catalog anchors, and scroll-to-top.
- Checked 39 distinct local page/asset references, including all 13 book destinations. All returned HTTP 200; checked anchor targets and cover/detail-image files existed.
- Opened linked book and contact pages, exercised sample PDF next/previous and full-screen controls, and reviewed the shared book template and all 13 data records.
- Findings marked **observed** were reproduced or measured in the browser. **Source** findings follow directly from the files. **Design** findings are recommendations, not broken-code claims.
- This is not a guarantee that no other bugs exist. No physical devices, Safari/Firefox, screen reader, production Apache behavior, or external product identity/availability were tested. The local static server does not apply `.htaccess`.

## Confirmed functional problems on the listing and its help journey

### 1. Every “View book” click throws a JavaScript error — medium; observed

`library/library.js:93` calls `openBookDetails(book)`, but that function is not defined. The browser reports `ReferenceError: openBookDetails is not defined`.

The normal link still navigates to the book page. These links are **not completely dead**; they contain a broken extra click handler. Remove the obsolete handler or implement the intended behavior.

### 2. Returning from a book loses the visitor’s search and category — medium; observed

Search for `arcane`, open its book, then use browser Back: the input is empty and all 13 books return. Choose Settings, open Tal Doluth, then go Back: All featured is selected again.

Save the search/category in the URL or history state and restore it on return. Preserve the catalog scroll position as part of the same journey. Source: `library/library.js:143–198`.

### 3. Search URLs become inconsistent with the visible results — medium; observed

Open `/library/?q=arcane`, change the search to `tal doluth`: results change, but the URL still says `q=arcane`. Refresh restores Arcane instead of the current search. New searches from `/library/` are never written to the URL.

Update the URL as the search/category changes so refresh, sharing, and Back behave consistently. Source: `library/library.js:167–172,198`.

### 4. “Get in touch” leads to a disabled message form — high; observed

The library’s lower help action opens `/contact/`, where “Prepare your message” is disabled. The form has an empty `data-contact-email`, and the visible note exposes studio setup work. Header/footer Contact links instead open Discord, so the page offers inconsistent contact routes.

Configure the form or route this CTA to a working contact channel. Source: `library/index.html:102`, `contact/index.html:93–108`, `contact/contact.js:4–11`.

## Listing usability, accessibility, and visual design

### 5. Essential text is much too small — high; observed/design

At 1440px: category labels are 8px, View book is 9px, result/filter labels are 10px, and search text is 11px. On phones, category labels remain 8px and View book is only 10px. These sizes are especially difficult with the serif body font.

Use roughly 14–16px for normal controls/body text and readable supporting labels. Keep the decorative face for prominent headings, rather than relying on tiny typography for the interface.

### 6. Covers and titles look selectable but are not links — high; observed/design

Every cover and title is non-interactive. Hovering a card zooms the image, suggesting it can be opened, but only the small View book link works. That link is about 25px high on both desktop and phone.

Make the cover/title links and enlarge the action target. A 44px target is a useful comfort goal and corresponds to the [W3C enhanced target-size criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html); this is not a claim that every existing control fails the separate minimum-target criterion.

### 7. The catalog starts too far down on phones and tablets — high; observed/design

At 375×812, the hero is 765px tall, the catalog begins around page y=895, and the first book begins around y=1377. At 320px, the first book starts around y=1474; at 768px, around y=1386.

The large decorative cover stack, introduction, section heading, and toolbar delay the primary task. Compact the small-screen hero and bring search/books closer to the top. The Browse books and Find a book anchors do work.

### 8. The phone filter row breaks awkwardly — medium; observed/design

At 375px and 320px, DM resources wraps onto its own second line, leaving an unbalanced toolbar. Search, category buttons, rules guidance, and result count consume a large amount of vertical space together.

Use an intentional two-by-two layout, a comfortable horizontally scrolling row, or a compact category selector at narrow widths.

### 9. Search requires an exact ordered phrase — medium; observed

`dwarf fortress` finds a book; `fortress dwarf` finds none. The implementation checks one contiguous substring, rather than matching independent words. Case-insensitive search and trimming surrounding spaces work.

Tokenize ordinary multiword searches so word order is less important. Source: `library/library.js:123–129`.

### 10. Empty results offer no direct recovery action — medium; observed/design

Choose Settings and search `arcane`: zero results is correct, but the message only says to try another title/category. There is no Reset filters/Show all action or explanation naming the active category and query.

Offer a visible reset that clears both the query and category, and include the current constraints in the result summary.

### 11. Cover counters become confusing after filtering — low; source/design

The labels are permanent catalog positions such as `03 / 13`, while the nearby result summary may say six titles. They do not represent a position within the filtered set and add visual noise over the cover artwork.

Remove these counters unless they serve a defined purpose; otherwise explain their meaning. Source: `library/library.js:69`.

### 12. There is no route from the featured selection to the wider catalog — medium; source/design

The copy explicitly describes these 13 books as a glimpse of more than 90 published books, but offers no full-catalog link. This is not a false count: it is an incomplete discovery journey.

Add a verified full-catalog destination or expand the catalog data.

### 13. Cards do not provide enough information to choose a book — medium; source/design

Readers are told to check 2014/2024 rules compatibility, but the data has no dedicated rules-version field or filter. Cards also lack consistent page count, character level, format, and price information. Some categories say 5e while others do not; `5e` search only returns three matches.

Add verified metadata and show the few facts most useful for comparing titles. Do not infer compatibility from the existing generic tags.

### 14. Cover images are enlarged beyond their source resolution — medium; observed

Most catalog images are only 247×320 pixels; Into the Dwarf Fortress is 232×320. At 1440px, displayed covers are approximately 277×359 CSS pixels, so they are already enlarged before accounting for high-density screens. The fine cover text looks soft.

Supply larger optimized covers and responsive image variants. Preserve the existing lightweight versions for smaller displays.

### 15. The styling makes scanning harder than necessary — medium; design judgment

The blackletter headings fit the fantasy brand, but long multi-line titles, very small serif labels, heavy cover bevels, dark gradient overlays, and repeated ornamental rules compete with the information. At phone width, title blocks vary between one and two lines, so category and description baselines become uneven.

Keep the warm dark/gold palette and selective display typography. Simplify cover framing, strengthen the body/control typography, and give title/category/action blocks a consistent rhythm. This is a design recommendation, not an objective rendering failure.

### 16. Two muted text treatments narrowly miss normal-text contrast — medium; measured

The desktop rules footnote is 9px with `#817768` on `#100d0a`, approximately 4.40:1. The search placeholder `#7f776a` on the same background is also around 4.4:1. Both are below the [W3C normal-text contrast threshold of 4.5:1](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Lighten these colors and increase the sizes. Most other measured catalog text had adequate color contrast; its small size remains the bigger visual issue.

### 17. Keyboard users have no skip-to-content link — low; source/design

There is no skip link to bypass the shared navigation and reach the catalog. Add a focus-visible Skip to books link. This observation alone is not a full keyboard or screen-reader conformance assessment.

### 18. Some interface details communicate the wrong thing — low; observed/design

The search field displays `TITLE` like a shortcut hint, although there is no corresponding shortcut and the search also covers descriptions/tags. View book uses `↗`, a common external-link cue, for a same-tab internal destination.

Remove the TITLE ornament or give it a useful label, and use a consistent internal-navigation arrow for book links.

## Problems in the linked book experience

These are adjacent to the requested listing page and affect visitors who use its View book actions.

### 19. Four purchase actions go to the store homepage — high; source

Merchant Organization Guide, Witchy Grounds, Beyond the Gates, and Buccaneer’s Back-Alley have `https://www.drivethrurpg.com/` as their store URL. Their Buy this book action cannot take visitors to the named product.

Supply verified product URLs or hide/relabel unavailable purchase actions. The other nine configured URLs were not checked for product identity or external availability. Source: `library/data/books.json`.

### 20. Every book displays the same unrelated sample PDF — high; source/observed

The shared script hardcodes `Order of Mercenary - The Homebrewery 247-262.pdf` regardless of the requested title. It appears under Step inside the book even on The Arcane Bookshelf.

Use a per-book sample URL, and omit the preview where no appropriate sample exists. Source: `library/book.js:215`.

### 21. “Exit full screen” can leave the native full-screen session active — high; observed/source

The dedicated exit button only removes the CSS full-screen class; it never calls `document.exitFullscreen()`. During inspection, clicking it removed the exit UI while the preview remained in the native full-screen view. Reload restored the page.

Call the native exit API when active and synchronize CSS/control state from fullscreenchange. Next/previous sample-page controls worked in the tested book. The browser inspection surface did not reliably expose native fullscreenElement state, so the source handler and visible stuck-preview behavior are the useful evidence. Source: `library/book.js:291–307`.

### 22. Book pages expose unfinished content and a design-testing panel — high; observed/source

The shared template includes “PLACEHOLDER TEXT · TO BE REPLACED,” generic editorial instructions, six placeholder gallery images, and a visible Hero animation/Live preview selector. These make the customer-facing page look like an editing workspace and do not establish what is in the actual book.

Replace the placeholder material with verified per-book content and remove the animation-testing panel from visitor pages. Source: `library/book.html:82–115,141–152`, `library/book.js:105–123,164`.

### 23. All 13 books have an unfinished price display — medium; source/observed

Every record has a null price amount and displays Price coming soon, even while offering Buy this book.

Provide current prices only if there is a reliable maintenance process; otherwise use clear wording such as See price at store and remove the empty price block. Source: `library/data/books.json`, `library/book.js:144–145`.

### 24. One book’s title does not match its cover — medium; observed/source

The card and data call the book Witchy Grounds, including its alt text, but `/assets/covers/book cover.webp` visibly reads Mystic Grounds. This is also the front cover in the hero collage, so the mismatch appears prominently.

Confirm the intended title and correct either the catalog record or the assigned cover. Do not rename the permanent ID/slug without considering existing links. Source: `library/data/books.json`.

## Release configuration and resilience

### 25. Production configuration still hides the entire library — release constraint; source

The root `.htaccess:3–4` intentionally redirects `/library/` and all its book pages to `/` with HTTP 302. The local preview bypasses that rule. This is an intentional hold, not a dead-button bug in the local page, but it must be resolved when the library is ready for release.

### Additional source-reviewed risks, not reproduced failures

- The catalog depends entirely on JavaScript and fetched JSON; there is no server-rendered or noscript book list. A load failure leaves no browsable books.
- Validation rejects the whole file if any record is malformed, including draft/unfeatured records. One unrelated invalid draft could take down the featured list.
- After a load failure, search/filter controls remain active; updateLibrary can replace the original failure explanation with “There are no featured books to show right now.” Keep explicit loading/error state and provide Retry.

## What passed

- All featured: 13; Adventures: 3; Settings: 6; DM resources: 4. All category filters produced the expected categories.
- Search matched case-insensitively, trimmed surrounding spaces, matched metadata, and displayed the no-results state correctly.
- Local link/asset checks found no missing targets. All 13 cover/detail-image paths exist.
- No horizontal page overflow was measured at the five tested widths; inspected card titles did not overflow their boxes.
- Browse books, Find a book, footer Back to the top, and the floating scroll-to-top control worked.
- The page has meaningful headings, labeled search/filter controls, pressed filter states, live result announcements, cover alt text, and reduced-motion rules for the decorative hero animation.
- Old hidden Kickstarter/Instagram/footer policy placeholders are not visible controls and are not counted as broken buttons here.

## Recommended order

1. Fix purchase/contact destinations, full-screen exit, and the obsolete click handler.
2. Preserve search/category state and correct search URLs.
3. Rebuild the catalog toolbar/cards around readable text, larger actions, and a shorter phone hero.
4. Replace placeholder book content, samples, prices, and low-resolution imagery.
5. Add useful metadata/full-catalog access, improve error recovery, and retest before removing the production redirect.

## Evidence files

- [Desktop full page](library-audit-desktop.png)
- [Phone full page](library-audit-mobile.png)
- [Phone catalog viewport](library-audit-mobile-catalog.png)
- [Linked book page](library-audit-book-page.png)
