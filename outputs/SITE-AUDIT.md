# Verseluft website audit — 24 October 2026

The public site has several broken user journeys, although its main pages and assets load successfully. The highest priorities are the disabled contact form, placeholder social links, and the project-updates link that leads to the disabled form. The hidden Library also has a reproducible full-screen exit bug and four purchase buttons without product destinations.

This was an inspection. No website source, production content, or deployment was changed.

## Coverage and method

- Reviewed all 10 page types in this project: Home, About, Projects, Contact, Journal listing, article, Library listing, book detail, dashboard, and animation study.
- Loaded each at widths of 1440, 768, and 375 pixels in Microsoft Edge: 30 page/viewport combinations. These are browser viewport checks, not tests on physical phones or Safari.
- Checked 305 local references in HTML, stylesheets, and the book/project data: no missing local file targets.
- Ran 23 interaction checks: 17 passed and 6 reproduced failures. The contact configuration and other source/configuration findings are additional to those checks.
- Checked all 13 book-detail destinations and their title, cover, and configured purchase URL. Correctly reproducing a configured URL does not establish that the external product is the correct one.
- Directly checked the live Home, About, Projects, and Contact pages at phone width. They had no uncaught JavaScript errors; the contact/form and footer findings also exist there.
- Inspected redirect and dashboard configuration. Production PHP writes and authenticated dashboard access were not exercised.

The Library and Journal are intentionally redirected to the homepage by the root `.htaccess`; they were tested locally without those Apache redirects. Their findings are preparation work before reopening them. The public dashboard currently returns 403, consistent with its fail-closed setup.

## Issues affecting the current public site

### 1. The contact form cannot prepare or send a message — high priority

**Where:** [Contact form](C:/Projects/New-Webpage/contact/index.html:93), [contact behavior](C:/Projects/New-Webpage/contact/contact.js:4).

`data-contact-email` is empty, so the submit button stays disabled. Filling in every field cannot complete the form. The visible note describes unfinished studio configuration instead of giving visitors a working contact action. The Projects page's “Start a conversation” button leads here.

**Recommended fix:** configure the real contact email or provide a working contact channel in the form panel. The current implementation prepares a draft in the visitor's email app; it does not send messages through a server.

### 2. Kickstarter and Instagram footer links go nowhere — high priority

**Where:** [Homepage footer](C:/Projects/New-Webpage/index.html:244), with the same placeholders in the About, Projects, Contact, Journal, article, Library, and book templates.

Both links use `href="#"`. They move the visitor to the top of the current page instead of opening the named service. There are 16 such footer links across eight templates. The separate hidden “Our Creators” placeholder is intentionally hidden and is excluded from this count.

**Recommended fix:** supply verified official profile URLs, or remove these links until their destinations are ready.

### 3. “Get project updates” leads to the disabled contact form — medium priority

**Where:** [Projects page](C:/Projects/New-Webpage/projects/index.html:54).

The action leads to `/contact/`. Visitors are offered project updates but land on a form that cannot be submitted. The homepage already has a working newsletter interface at `/#updates`.

**Recommended fix:** point the updates action to the newsletter section or another working project-follow destination.

### 4. Contact-topic links do not take visitors to the form — medium priority

**Where:** [Topic click handler](C:/Projects/New-Webpage/contact/contact.js:33).

Choosing a topic correctly changes the subject, but `preventDefault()` cancels the `#message-form` link and nothing replaces its scrolling or focus behavior. At 375 × 812, the form remained approximately 1,102 pixels below the top of the viewport after activating the topic from the top of the page.

**Recommended fix:** retain the anchor navigation or scroll to the form and focus its first useful field after setting the subject.

### 5. Homepage PDF dialog leaves keyboard focus behind the overlay — medium priority

**Where:** [Open/close modal behavior](C:/Projects/New-Webpage/script.js:129).

Opening the full-screen preview leaves focus on `#open-pdf`, outside the dialog. There is no focus trap or background inertness. Keyboard navigation can continue through the obscured page instead of moving into the preview. The close button and Escape do close the modal successfully.

**Recommended fix:** focus the dialog's close control on opening, contain keyboard focus while it is open, and restore focus to the opener on closing.

### 6. Homepage project descriptions have weak contrast — medium priority

**Where:** [Shared project styles](C:/Projects/New-Webpage/styles.css), `.project-card-body p`.

The live homepage renders 12px project descriptions in `rgb(108, 106, 99)` against the card's `rgb(28, 23, 18)` background. Their contrast is approximately 3.3:1, below the usual 4.5:1 accessibility target for text this size. The descriptions are visibly difficult to read in the phone screenshots.

**Recommended fix:** lighten the description text and check funding labels and other muted card text at the same time. The footer's latest text colors are considerably clearer and were not the contrast problem reproduced here.

### 7. “Privacy · Terms” is plain text — lower priority

**Where:** Shared footer templates.

This footer label has no links or corresponding policy pages in the project. Visitors cannot open either document.

**Recommended fix:** add the intended documents and individual links when the content is available, or remove the inactive label.

## Hidden Library and Journal: fix before reopening

### 8. Library PDF “Exit full screen” does not exit browser full screen — high priority

**Where:** [Library PDF exit handler](C:/Projects/New-Webpage/library/book.js:306).

Reproduction: open a book, enter full screen, then click “Exit full screen.” The handler changes CSS state but never calls `document.exitFullscreen()`. The exit button becomes hidden while `document.fullscreenElement` remains set. The visitor loses the in-page exit control and must use a browser-level exit mechanism.

**Recommended fix:** exit the browser Fullscreen API when it is active, retain the CSS fallback, and synchronize the controls from `fullscreenchange`.

### 9. Four “Buy this book” buttons lead to the store homepage — high priority

**Where:** [Book catalog data](C:/Projects/New-Webpage/library/data/books.json).

| Book | Configured destination |
| --- | --- |
| Merchant Organization Guide | `https://www.drivethrurpg.com/` |
| Witchy Grounds | `https://www.drivethrurpg.com/` |
| Beyond the Gates | `https://www.drivethrurpg.com/` |
| Buccaneer's Back-Alley | `https://www.drivethrurpg.com/` |

These are definite missing product destinations, independent of whether the store permits an automated visit.

**Recommended fix:** supply confirmed product URLs or hide the purchase action for those records.

### 10. A missing book's “Return to the library” link opens the external store — medium priority

**Where:** [Book not-found rendering](C:/Projects/New-Webpage/library/book.js:19), [button style](C:/Projects/New-Webpage/library/book.css:43).

For `/library/book.html?slug=invalid-audit-slug`, the not-found handler hides the purchase link and changes its label to “Return to the library,” but leaves its URL pointing to DriveThruRPG. The stylesheet's explicit `display` value overrides the native `hidden` styling, so the link remains visible. Some hidden facts and price placeholders remain visible too.

**Recommended fix:** consistently honor `[hidden]`, and use a real `/library/` return link for the not-found state. Verify the empty `src` image and the other default book details are removed from that state.

### 11. Every book shows the same sample PDF and unfinished page content — medium priority

**Where:** [Shared PDF path](C:/Projects/New-Webpage/library/book.js:215), [detail template](C:/Projects/New-Webpage/library/book.html:85).

Every title uses `Order of Mercenary - The Homebrewery 247-262.pdf`. For example, The Arcane Bookshelf is presented with sample pages from a different book. The template also displays explicit placeholder descriptions/images and automatically opens the “Hero animation” preview tool, which covers content on a phone.

**Recommended fix:** associate the correct sample with each book, hide absent samples, complete the content, and remove the design-preview controls from the public template before restoring the Library.

### 12. Invalid article URLs silently show a different article — medium priority

**Where:** [Article selection](C:/Projects/New-Webpage/blog/article.js:90).

An unknown slug such as `invalid-audit-slug` renders “D&D worldbuilding: what makes a setting playable?” rather than a not-found state. A broken article link therefore looks successful while showing unrelated content.

**Recommended fix:** distinguish an unknown slug from a deliberately selected default article and display an honest not-found view for unknown values.

## Dashboard issues

### 13. The Library redirect also intercepts the dashboard's catalog data — high priority when enabling the dashboard

**Where:** [Redirect rule](C:/Projects/New-Webpage/.htaccess:4), [dashboard book-data request](C:/Projects/New-Webpage/dashboard/dashboard.js:47).

The root rule matches every path below `/library/`, including `/library/data/books.json`. The dashboard fetches that URL and expects JSON. Under this Apache configuration it instead follows the redirect to homepage HTML, so it cannot populate its book catalog. This is a configuration/source finding; authenticated production dashboard behavior was not tested. The local static server does not apply `.htaccess`, which is why local dashboard loading passes.

**Recommended fix:** restrict the temporary redirect to Library pages, or move/exempt the data endpoint while continuing to hide the unfinished pages.

### 14. Analytics range changes leave summary numbers and date labels unchanged — medium priority

**Where:** [Chart updates](C:/Projects/New-Webpage/dashboard/dashboard.js:224), [analytics template](C:/Projects/New-Webpage/dashboard/index.html).

Changing the Analytics report from 30 to 7 days changes the chart data, but its summary remains `24,860`, `38,420`, `3m 42s`, and `4.86%`. The chart's dates remain Aug 24 through Sep 21. `updateCharts()` updates the overview's metric elements while the report's own metric values and dates are hard-coded. The dashboard correctly labels these figures as illustrative; this finding concerns the inconsistent controls within the demo.

**Recommended fix:** update the visible report metrics and date labels consistently for the selected range, or disable the selector until it is supported.

## Items needing confirmation, rather than being declared broken

- **Possible wrong product mapping:** “Into the Dwarf Fortress” points to a URL ending in `15-ways-to-die-underground` ([data](C:/Projects/New-Webpage/library/data/books.json:49)). This might be a bundle or alternate title. Confirm the intended product before changing it.
- **Campaign statistics:** funding, days remaining, and backer counts are static JSON values. They do not count down or refresh automatically. Their accuracy needs an owner check against the campaigns; this audit could not establish whether the current values are correct.
- **Card behavior:** campaign arrow links work and match their configured projects. The card title and image themselves are not links. Making the full card clickable would improve the interaction if that is the intended design.
- **Dashboard markup:** the two generated chart SVGs reuse the ID `visitor-fill`. No visible chart failure was reproduced, but unique IDs would avoid ambiguous references.
- **Intentional unfinished features:** Library/Journal redirects, the hidden homepage Upcoming section, the hidden Our Creators action, and sample analytics were not counted as unexpected failures.

## What worked

- Public page loading and all 305 checked local file targets.
- No uncaught JavaScript exceptions in the 30 initial page/viewport combinations or the four live public-page checks.
- Homepage PDF next/previous controls, page dots, opening/closing, Escape, and page synchronization.
- Testimonial previous/next, scroll-to-top, and project campaign arrow destinations.
- Upcoming carousel next/previous and wrapping.
- Newsletter embed loading and browser email-field validation. No subscription was submitted.
- Library search, empty results, category filters, all 13 detail links, and book title/cover mapping.
- Library PDF next/previous controls.
- Journal carousel and category filters.
- Dashboard search, type filtering, and project editing in an isolated browser preview. The test's browser storage was cleared; no production project data was saved.
- Motion-study scene selection.
- The Discord invite returned 200 and identified the Verseluft Tavern server; the newsletter script returned 200.

## External-link limits

DriveThruRPG and all three Kickstarter destinations returned a 403 “Just a moment...” challenge to automated requests. That is an anti-bot response, not sufficient evidence of a broken public link. Product identity, campaign dates, and those destinations' ordinary visitor experience remain unverified. The confirmed store-homepage purchase placeholders above do not depend on those external checks.

An initial web-index snapshot showed an older homepage. Fresh direct HTTP and browser requests subsequently confirmed the current design, so this report uses the direct checks rather than that stale snapshot.

No email, newsletter subscription, purchase, public edit, or authenticated production save was submitted. PHP/Apache behavior beyond the public reachability checks was reviewed from source and configuration.

## Evidence

- [Page and viewport results](C:/Projects/New-Webpage/outputs/site-audit-results.json)
- [23 interaction checks](C:/Projects/New-Webpage/outputs/interaction-audit-results.json)
- [Static reference scan](C:/Projects/New-Webpage/outputs/static-audit-results.json)
- [External HTTP checks](C:/Projects/New-Webpage/outputs/external-audit-results.json)
- [Dashboard range check](C:/Projects/New-Webpage/outputs/followup-audit-results.json)
- [Phone project cards](C:/Projects/New-Webpage/outputs/visual-_-1.png)
- [Phone Contact page](C:/Projects/New-Webpage/outputs/visual-_contact_-0.png)
- [Book placeholder content and preview controls](C:/Projects/New-Webpage/outputs/visual-_library_book_html_slug_the_arcane_bookshelf-1.png)
- [Book not-found state](C:/Projects/New-Webpage/outputs/visual-_library_book_html_slug_invalid_audit_slug-0.png)
