# Universal Marine Electronics website

The website for Universal Marine Electronics (Davie, FL): **universalmarinefl.com**.

## How it's organized

| Folder | What's in it |
| --- | --- |
| `site/` | The published website. Netlify serves this folder as-is (`netlify.toml`). |
| `site/images/g/` | Gallery photos: full size (1600 px), `t/` (720 px) and `s/` (480 px), all WebP with location data removed. |
| `site/images/ba/` | Before/after pairs, aligned so the slider lines up. |
| `source/src/` | The page template (`index.html`), styles (`site.css`) and script (`app.js`). Edit these, not `site/`. |
| `source/gallery/manifest.json` | Every gallery photo, its category and optional caption. |
| `source/gallery/reviews.json` | Optional. Real customer reviews, e.g. `[{"name": "Mike R.", "text": "…", "stars": 5, "source": "Google"}]`. The reviews row stays hidden until this file has entries. |
| `photos-inbox/` | Drop new photos here (see its README). A GitHub Action adds them to the gallery. |
| `tools/` | Image helpers and the photo-inbox script. |
| `.github/workflows/` | Automation: photo inbox, broken-link check, Lighthouse scores. |

## Making a change

1. Edit files in `source/src/`.
2. Run `python3 source/build.py` (needs Python 3 and Pillow). It writes `site/index.html`, `site/assets/`, `sitemap.xml` and `robots.txt`.
3. Commit on a branch and open a pull request. Netlify posts a Deploy Preview link on the pull request.
4. Merge when it looks right. `main` is what's live.

## Adding photos

Upload them into the right `photos-inbox/<category>/` folder on github.com. Within a few minutes a pull request called **New gallery photos** appears with everything resized and placed. Merge it to publish.

## Versions

- **V7**: branch `v7`. Dark-only redesign, self-hosted fonts, photo-led process, trust section, quote form with photo upload, photo automation.
- **V6**: commit `66caefb` on `main`. First photo-led version with the 153-photo gallery.
- **V5**: commit `0a5b0f9`.

Fonts are licensed under the SIL Open Font License (`site/assets/fonts/LICENSE.txt`).
