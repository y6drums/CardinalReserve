# The Cardinal Reserve

Marketing site for The Cardinal Reserve — a boutique short-term residence at
No. 1 First Street, Owensboro, Kentucky.

## Running locally

The site is static. A small Node server is included:

```bash
node .claude/serve.js
```

Then open <http://localhost:8766>. The server resolves extensionless routes,
so `/listings` and `/listings.html` both work.

In Claude Code, `.claude/launch.json` starts the same server as a named
preview configuration (`cardinal-reserve`).

## Pages

| File | Route | Contents |
|---|---|---|
| `index.html` | `/` | Hero, featured rooms, gallery, downtown preview |
| `listings.html` | `/listings` | All 16 bookable listings, filterable by floor |
| `explore.html` | `/explore` | Restaurants, bars, mornings, attractions |
| `faq.html` | `/faq` | Guest FAQ |
| `contact.html` | `/contact` | Inquiry form and host contact |

## How these files are built

Each page is a **self-contained bundle**, not hand-written HTML. The visible
markup does not live in the file's `<body>` — it is stored as a JSON string
inside `<script type="__bundler/template">` on line 384, and assets (fonts,
logos, most images) are base64-encoded in `<script type="__bundler/manifest">`
on line 372. On load, an inline script decodes the manifest into blob URLs,
substitutes them into the template, and swaps the whole document.

Editing therefore means decoding line 384, changing the string, and
re-encoding it. Two details matter:

- **Slash escaping is per-file.** `listings.html` and `contact.html` encode
  `</` as `<\/`; `index.html`, `explore.html`, and `faq.html` use `</`.
  Using the wrong one produces a file that still parses as JSON but breaks the
  page, because a stray `</script>` closes the tag early.
- **The manifest uses compact separators** (`,` and `:` with no spaces) and
  `ensure_ascii=False`; the template uses default separators.

Round-trip a file through decode/encode and compare against the original
before writing — if it isn't byte-identical, the encoder settings are wrong.

## Images

`Assets/` holds the originals, untouched:

- `Assets/HomeHero.png` — building exterior, homepage hero
- `Assets/DowntownOwensboro.png` — downtown at sunset, Explore preview
- `Assets/Grandview Cover.jpg` — Room No. 03 card
- `Assets/Gallery/` — 12 interiors, homepage gallery
- `Assets/Explore/` — 19 place photos

`Assets/Explore/web/` holds derived 16:9 JPEGs (1440x810) that
`explore.html` loads from disk at runtime. These are generated from the
originals and are required for the Explore page to render.

Homepage and listings imagery is inlined into the HTML bundles instead, which
is why `index.html` is ~4 MB. Moving that imagery to disk alongside the
Explore photos would cut it to roughly 400 KB.

## Notes

- Room No. 03 ("The Grandview") links to its live Airbnb listing; the other
  15 listings have no URL yet and link to `#`.
- Interior photography is watermarked "AP Imagery" — proof copies, not
  licensed exports.
