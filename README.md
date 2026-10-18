# Universal Marine Electronics website

- `site/` is what goes live. Netlify publishes this folder (see `netlify.toml`).
- `source/` is what the site is built from: page markup and styles (`src/body.html`), script (`src/app.js`), logo and photos.

Your existing photos (`images/hero-garmin-triple.jpg` and the rest) still need to be copied into `site/images/` from the current live site so the gallery shows them.

## V6 photo gallery (Oct 2026)
- `site/images/g/` full-size gallery photos (1600px webp), `site/images/g/t/` thumbnails (720px), `site/images/ba/` before/after pairs, `site/images/hero.webp` top photo.
- `source/gallery/manifest.json` lists every gallery photo and its category. Photos are stripped of location data.
- To rebuild: `cd source && python3 build.py`, then copy `source/deliver/index.html` and `source/deliver/images/` into `site/`.
