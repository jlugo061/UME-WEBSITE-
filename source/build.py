"""Builds the site into ../site from source/src.

    python3 source/build.py            # writes site/index.html, site/assets/*, sitemap, robots
    python3 source/build.py --preview  # also writes source/preview/index.html (single file, for the Claude preview)

Gallery photos live only in site/images/g (full, t/ 720px, s/ 480px). source/gallery/manifest.json lists
them with their category; tools/add_photos.py (run by the photo-inbox GitHub Action) appends new ones."""
import json, hashlib, pathlib, sys, datetime, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, SITE = ROOT / 'source/src', ROOT / 'site'
G = SITE / 'images/g'
MAN = ROOT / 'source/gallery/manifest.json'
REV = ROOT / 'source/gallery/reviews.json'
sys.path.insert(0, str(ROOT / 'tools'))
from imgtools import load, write_sizes, avg_color

man = json.loads(MAN.read_text())
changed = False
for m in man:
    if not (G / 's' / (m['id'] + '.webp')).exists():
        write_sizes(load(G / (m['id'] + '.webp')), G, m['id'], only_missing=True); changed = True
    if 'col' not in m:
        m['col'] = avg_color(G / 't' / (m['id'] + '.webp')); changed = True
if changed:
    MAN.write_text(json.dumps(man, indent=1))

# ---- order: strongest shots first, then categories interleaved so "All work" reads varied; newest first inside a category
FEAT = [214, 80, 49, 167, 238, 269, 161, 193, 258, 150, 204, 54, 244, 145, 163, 101, 77, 110, 262, 128, 83, 237, 240, 274]
by_n = {m.get('n'): m for m in man if m.get('n')}
FEAT_IDS = ['helm-43', 'helm-40', 'boats-17']   # strongest of the newer photos
by_id = {m['id']: m for m in man}
feat = [by_n[n] for n in FEAT[:6] if n in by_n] + [by_id[i] for i in FEAT_IDS if i in by_id] + [by_n[n] for n in FEAT[6:] if n in by_n]
rest = [m for m in man if m not in feat]
order = ['helm', 'blackout', 'radar', 'wiring', 'boats', 'fab', 'av', 'shop']
cats = {c: sorted([m for m in rest if m['c'] == c], key=lambda m: m.get('added', ''), reverse=True) for c in order}
seq = list(feat)
while any(cats.values()):
    for c in order:
        if cats[c]: seq.append(cats[c].pop(0))
seq += [m for m in rest if m['c'] not in order]

def item(m):
    d = {'i': m['id'], 'c': m['c'], 'w': m['w'], 'h': m['h'], 'k': m.get('col', '#0e2033')}
    if m in feat: d['feat'] = 1
    for k in ('cap', 'alt'):
        if m.get(k): d[k] = m[k]
    return d
items = [item(m) for m in seq]
reviews = json.loads(REV.read_text()) if REV.exists() else []

css = (SRC / 'site.css').read_text()
js = (SRC / 'app.js').read_text()
tpl = (SRC / 'index.html').read_text()
h = lambda s: hashlib.sha1(s.encode()).hexdigest()[:8]
SITE_URL = 'https://universalmarinefl.com'
schema = {
    "@context": "https://schema.org", "@type": "LocalBusiness", "name": "Universal Marine Electronics Inc.", "alternateName": "UME",
    "description": "Marine electronics installation: Garmin and Simrad helms, blacked-out helm panels, radar, sonar, thermal, audio, lighting, security and wiring. Family-owned since 2004.",
    "telephone": "+1-786-325-5690", "email": "umeinstall@gmail.com", "url": SITE_URL,
    "image": SITE_URL + "/images/og.jpg", "logo": SITE_URL + "/images/ume-seal.webp",
    "address": {"@type": "PostalAddress", "addressLocality": "Davie", "addressRegion": "FL", "addressCountry": "US"},
    "areaServed": ["Davie, FL", "Fort Lauderdale, FL", "Miami, FL", "West Palm Beach, FL", "Jupiter, FL", "Stuart, FL", "Florida Keys, FL"],
    "openingHours": "Mo-Fr 08:00-17:00", "foundingDate": "2004",
    "sameAs": ["https://www.instagram.com/universalmarineelectronics"]}

def page(preview=False):
    gd = json.dumps({'items': items, 'reviews': reviews, **({'preview': 1} if preview else {})}, separators=(',', ':')).replace('</', '<\\/')
    out = (tpl.replace('{{GDATA}}', gd).replace('{{SCHEMA}}', json.dumps(schema, separators=(',', ':')))
              .replace('{{CSS}}', 'assets/site.css?v=' + h(css)).replace('{{JS}}', 'assets/app.js?v=' + h(js)))
    if preview:   # one self-contained page body: inline css + js, fonts from assets/
        title = re.search(r'<title>.*?</title>', out).group(0)
        body = out[out.index('<body>') + 6:out.index('</body>')]
        body = body.replace('<script src="assets/app.js?v=' + h(js) + '" defer></script>', '<script>\n' + js + '\n</script>')
        out = (title + '\n<style>\n' + css.replace('url(fonts/', 'url(assets/fonts/') + '\n</style>\n'
               '<script>document.documentElement.classList.add(\'js\');</script>\n' + body)
    return out

(SITE / 'assets').mkdir(exist_ok=True)
(SITE / 'assets/site.css').write_text(css)
(SITE / 'assets/app.js').write_text(js)
(SITE / 'index.html').write_text(page())

# ---- sitemap (with every gallery photo, so Google Images can index the work) + robots
today = datetime.date.today().isoformat()
imgs = ''.join('<image:image><image:loc>%s/images/g/%s.webp</image:loc></image:image>' % (SITE_URL, d['i']) for d in items)
(SITE / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
                                  '<url><loc>%s/</loc><lastmod>%s</lastmod>%s</url></urlset>\n' % (SITE_URL, today, imgs))
(SITE / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n' % SITE_URL)

if '--preview' in sys.argv:
    (ROOT / 'source/preview').mkdir(exist_ok=True)
    (ROOT / 'source/preview/index.html').write_text(page(preview=True))
print('built', len(items), 'photos ·', len(reviews), 'reviews')
