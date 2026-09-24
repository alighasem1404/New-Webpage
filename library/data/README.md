# Library book data

`books.json` is the source of truth for the Library cards and quick-view details. The page displays records whose `status` is `published` and `featured` is `true`; draft and non-featured records remain available in the data for later use.

Each record has these fields:

- `id`: permanent unique identifier. Keep it unchanged when editing a record.
- `slug`: unique lowercase identifier used in the book page URL, such as `/library/book.html?slug=tal-doluth`.
- `title`, `category`, and `categoryLabel`: title and catalog classification. Categories are `adventure`, `setting`, and `resource`.
- `tags`: searchable labels.
- `shortDescription`: catalog card copy.
- `description`: quick-view copy and a starting point for the book page.
- `coverImage` and `coverAlt`: lightweight catalog cover path and accessible description.
- `detailImage`: optional full-resolution cover used on the book detail page; if omitted, the page uses `coverImage`.
- `storeUrl`: external selling-page URL for the title. The current records use a temporary DriveThruRPG placeholder until each product URL is confirmed.
- `price`: object containing `amount`, `currency`, and the display label shown on the detail page. Use `null` for an unpriced title.
- `heroPosition`: optional `back`, `left`, `right`, or `front` assignment for the cover collage.
- `series`: `null` or an object with a `name` and optional `number`.
- `status`, `featured`, and `sortOrder`: publication state, catalog visibility, and display order.

To add a title, copy a record, assign a new unique `id` and `slug`, add the cover under `/assets/covers/`, then fill in its text, category, tags, and series details. The catalog validates required fields and duplicate IDs or slugs when it loads.

The Library and all book detail pages read this JSON file; they do not write to it. The shared book detail template uses the slug query parameter to find a record, so each book has its own link without duplicating page files. An admin dashboard will need an authorized server-side save endpoint so edits can be validated and persisted safely.
