"""Moves new photos from photos-inbox/<category>/ into the gallery.

Drop photos into a category folder (helm, blackout, fab, wiring, radar, av, boats, shop) and push.
For each photo this makes the 1600 / 720 / 480 px WebP sizes, strips all EXIF (no GPS), adds it to
source/gallery/manifest.json (newest first in its category) and removes it from the inbox.
Optional caption: a .txt file with the same name ("IMG_123.txt") holding one short line."""
import json, pathlib, sys, datetime
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from imgtools import load, write_sizes, avg_color

INBOX, G, MAN = ROOT / 'photos-inbox', ROOT / 'site/images/g', ROOT / 'source/gallery/manifest.json'
CATS = ['helm', 'blackout', 'fab', 'wiring', 'radar', 'av', 'boats', 'shop']
EXT = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}
man = json.loads(MAN.read_text())
today = datetime.date.today().isoformat()
added = []
for c in CATS:
    folder = INBOX / c
    if not folder.is_dir():
        continue
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() not in EXT:
            continue
        nums = [int(m['id'].rsplit('-', 1)[1]) for m in man if m['c'] == c]
        pid = '%s-%02d' % (c, max(nums, default=0) + 1)
        im = load(f)
        write_sizes(im, G, pid)
        entry = dict(id=pid, c=c, n=None, w=min(im.width, 1600) if im.width >= im.height else round(im.width * 1600 / im.height),
                     h=min(im.height, 1600) if im.height >= im.width else round(im.height * 1600 / im.width), added=today)
        entry['col'] = avg_color(G / 't' / (pid + '.webp'))
        cap = f.with_suffix('.txt')
        if cap.exists():
            entry['cap'] = cap.read_text().strip()[:120]; cap.unlink()
        man.append(entry); added.append(pid); f.unlink()
MAN.write_text(json.dumps(man, indent=1))
print('added', len(added), ' '.join(added))
