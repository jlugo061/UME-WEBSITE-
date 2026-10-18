import re, pathlib
root = pathlib.Path(__file__).parent
body = (root / 'src/body.html').read_text()
js = (root / 'src/app.js').read_text()
logo = 'data:image/webp;base64,' + (root / 'logo.b64').read_text().strip()
assert body.count('{') == body.count('}'), 'unbalanced braces in body.html'
body = body.replace('{{LOGO}}', logo)
import json, shutil
# ---- gallery data: interleave categories so "All work" reads varied ----
man = json.load(open(root / 'gallery/manifest.json'))
order = ['helm', 'blackout', 'radar', 'wiring', 'boats', 'fab', 'av', 'shop']
by = {c: [m for m in man if m['c'] == c] for c in order}
old = [dict(f='images/' + k + '.jpg', t='images/' + k + '.jpg', c='blackout', w=1200, h=900) for k in ['blackpanel-intrepid', 'blackpanel-cobia', 'blackpanel-cut', 'blackpanel-intrepid-angle']]
by['blackout'] = [dict(f='images/g/%s.webp' % m['id'], t='images/g/t/%s.webp' % m['id'], c=m['c'], w=m['w'], h=m['h']) for m in by['blackout']]
by['blackout'] = [by['blackout'][4], old[0]] + by['blackout'][:4] + old[1:] + by['blackout'][5:]
data = []
while any(by.values()):
    for c in order:
        if by[c]:
            m = by[c].pop(0)
            data.append(m if 'f' in m else dict(f='images/g/%s.webp' % m['id'], t='images/g/t/%s.webp' % m['id'], c=m['c'], w=m['w'], h=m['h']))
# strongest shots lead the "All work" view
FEAT = [214, 80, 49, 167, 238, 269, 161, 193, 258, 150, 204, 54, 244, 145, 163, 101, 77, 110, 262, 128, 83, 237, 240, 274]
nid = {m['n']: 'images/g/%s.webp' % m['id'] for m in man}
feat = [d for n in FEAT for d in data if d['f'] == nid[n]]
data = feat + [d for d in data if d not in feat]
js = js.replace('{{GALLERY}}', json.dumps(data, separators=(',', ':')))
body = body.replace('{{SCRIPT}}', js)
assert '{{' not in body, re.findall(r'\{\{\w+', body)
out = root / 'deliver/images'
G = root / 'gallery'
SITE = root.parent / 'site/images'   # in the GitHub repo the web images live only in site/images (no duplicate copy)
def gp(rel):
    if (G / rel).exists(): return G / rel
    m = {'t/': 'g/t/', 'ba/': 'ba/'}
    for k, v in m.items():
        if rel.startswith(k): return SITE / (v + rel[len(k):])
    return SITE / ('g/' + rel) if not rel.startswith('hero') else SITE / rel
import tempfile
stash = pathlib.Path(tempfile.mkdtemp())   # copy sources first, in case they live inside the output folder
for m in man:
    shutil.copy(gp(m['id'] + '.webp'), stash / (m['id'] + '.webp')); shutil.copy(gp('t/' + m['id'] + '.webp'), stash / ('t-' + m['id'] + '.webp'))
for k in ['P1', 'P2', 'P4', 'P6', 'P7', 'P8', 'S1', 'S2', 'S3']:
    for x in ['before', 'after']: shutil.copy(gp('ba/%s-%s.webp' % (k, x)), stash / ('ba-%s-%s.webp' % (k, x)))
for f in ['hero.webp', 'hero-m.webp']: shutil.copy(gp(f), stash / f)
if out.exists(): shutil.rmtree(out)
(out / 'g/t').mkdir(parents=True); (out / 'ba').mkdir()
for jp in (root / 'photos').glob('*.jpg'): shutil.copy(jp, out / jp.name)
shutil.copy(root / 'favicon.png', out / 'favicon.png')
for f in stash.iterdir():
    n = f.name
    dst = out / 'g/t' / n[2:] if n.startswith('t-') else out / 'ba' / n[3:] if n.startswith('ba-') else out / n if n.startswith('hero') else out / 'g' / n
    shutil.copy(f, dst)
shutil.rmtree(stash)
deploy_body = body
print('photos', len(data))

(root / 'dist').mkdir(exist_ok=True)
# preview artifact: thumbnails only (keeps the upload small); the live site gets full size
art = body.replace('images/g/', 'images/g/t/').replace('images/g/t/t/', 'images/g/t/').replace("IMG + 'g/' + id", "IMG + 'g/t/' + id")
(root / 'dist/artifact.html').write_text(art)
import os
lst = ['images/' + q for q in ['hero.webp', 'hero-m.webp', 'favicon.png'] + [f.name for f in (out).glob('*.jpg')] + ['g/t/' + f.name for f in (out / 'g/t').glob('*.webp')] + ['ba/' + f.name for f in (out / 'ba').glob('*.webp')]]
json.dump(lst, open(root / 'dist/artfiles.json', 'w'))

head = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Universal Marine Electronics: family-owned marine electronics installer in Davie, FL since 2004. Garmin and Simrad helms, radar, audio, lighting, thermal and wiring on center consoles from Stuart to Key West.">
<meta name="theme-color" content="#071320">
<link rel="canonical" href="https://universalmarinefl.com/">
<meta property="og:type" content="website">
<meta property="og:title" content="Universal Marine Electronics · Davie, FL">
<meta property="og:description" content="150 photos of real helm builds, black panels and before-and-afters from a family shop with 20+ years on South Florida water.">
<meta property="og:url" content="https://universalmarinefl.com/">
<meta property="og:image" content="https://universalmarinefl.com/images/hero.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="images/favicon.png">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"LocalBusiness","name":"Universal Marine Electronics Inc.","alternateName":"UME",
"description":"Marine electronics installation: Garmin and Simrad helms, radar, sonar, audio, lighting, thermal, security and wiring. Family-owned since 2004.",
"telephone":"+1-786-325-5690","email":"umeinstall@gmail.com","url":"https://universalmarinefl.com",
"image":"https://universalmarinefl.com/images/hero.webp",
"address":{"@type":"PostalAddress","addressLocality":"Davie","addressRegion":"FL","addressCountry":"US"},
"geo":{"@type":"GeoCoordinates","latitude":26.06,"longitude":-80.23},
"areaServed":["Davie, FL","Fort Lauderdale, FL","Miami, FL","West Palm Beach, FL","Jupiter, FL","Stuart, FL","Florida Keys, FL"],
"openingHours":"Mo-Fr 08:00-17:00","foundingDate":"2004",
"sameAs":["https://www.instagram.com/universalmarineelectronics"]}
</script>
'''
# move <title>, font links and <style> into <head>; the rest is body
m = re.search(r'</style>\n', deploy_body)
head_part, rest = deploy_body[:m.end()], deploy_body[m.end():]
doc = head + head_part + '</head>\n<body>\n' + rest + '\n</body>\n</html>\n'
(root / 'dist/index.html').write_text(doc)
(root / 'deliver/index.html').write_text(doc)
print(len(body), len(doc))
