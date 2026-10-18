import re, pathlib
root = pathlib.Path(__file__).parent
body = (root / 'src/body.html').read_text()
js = (root / 'src/app.js').read_text()
logo = 'data:image/webp;base64,' + (root / 'logo.b64').read_text().strip()
assert body.count('{') == body.count('}'), 'unbalanced braces in body.html'
body = body.replace('{{LOGO}}', logo)
deploy_js = js.replace('{{IMGBASE}}', 'images/')
art_js = js.replace('{{IMGBASE}}', 'https://universalmarinefl.com/images/')
import base64, shutil
def imgs(html, inline):
    def sub(m):
        k = m.group(1)
        if inline: return 'data:image/webp;base64,' + base64.b64encode((root / f'photos/{k}.webp').read_bytes()).decode()
        return f'images/{k}.jpg'
    return re.sub(r'\{\{IMG:([\w-]+)\}\}', sub, html)
deploy_body = imgs(body.replace('{{SCRIPT}}', deploy_js), False)
body = imgs(body.replace('{{SCRIPT}}', art_js), True)
(root / 'deliver/images').mkdir(parents=True, exist_ok=True)
for jp in (root / 'photos').glob('*.jpg'): shutil.copy(jp, root / 'deliver/images' / jp.name)
shutil.copy(root / 'favicon.png', root / 'deliver/images/favicon.png')

(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/artifact.html').write_text(body)

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
<meta property="og:description" content="Build your helm online, then let a family shop with 20+ years on South Florida water rig it right.">
<meta property="og:url" content="https://universalmarinefl.com/">
<meta property="og:image" content="https://universalmarinefl.com/images/hero-garmin-triple.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="images/favicon.png">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"LocalBusiness","name":"Universal Marine Electronics Inc.","alternateName":"UME",
"description":"Marine electronics installation: Garmin and Simrad helms, radar, sonar, audio, lighting, thermal, security and wiring. Family-owned since 2004.",
"telephone":"+1-786-325-5690","email":"umeinstall@gmail.com","url":"https://universalmarinefl.com",
"image":"https://universalmarinefl.com/images/hero-garmin-triple.jpg",
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
