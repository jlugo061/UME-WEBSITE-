"""Moves new photos from photos-inbox/<category>/ into the gallery.

Drop photos into a category folder (helm, blackout, fab, wiring, radar, av, boats, shop) and push.
For each photo this makes the 1600 / 720 / 480 px WebP sizes, strips all EXIF (no GPS), adds it to
source/gallery/manifest.json (newest first in its category) and removes it from the inbox.
Videos (.mov/.mp4) can go in any category folder or in photos-inbox/videos/: each is trimmed to 20 s,
sound and location data removed, saved to site/media/v and listed in source/gallery/videos.json.
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

# ---- videos
import subprocess
VID = ROOT / 'source/gallery/videos.json'; VD = ROOT / 'site/media/v'; VD.mkdir(parents=True, exist_ok=True)
vids = json.loads(VID.read_text()) if VID.exists() else []
for folder in sorted(INBOX.iterdir()):
    if not folder.is_dir(): continue
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() not in ('.mov', '.mp4', '.m4v'): continue
        n = max([int(v['id'].split('-')[1]) for v in vids], default=0) + 1; vid = 'vid-%02d' % n
        fit = "scale='if(gt(iw,ih),960,-2)':'if(gt(iw,ih),-2,960)',fps=30"   # long side 960, after the phone's rotation is applied
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-t', '20', '-an', '-map_metadata', '-1', '-vf', fit,
                        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', str(VD / (vid + '.mp4'))], check=True)
        st = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', str(VD / (vid + '.mp4'))], capture_output=True, text=True).stdout)['streams'][0]
        w, h = st['width'], st['height']; land = w > h
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', str(VD / (vid + '.mp4')), '-frames:v', '1', '-vf', 'scale=720:-2' if land else 'scale=-2:720', str(VD / (vid + '.jpg'))], check=True)
        from PIL import Image
        Image.open(VD / (vid + '.jpg')).convert('RGB').save(VD / (vid + '.webp'), 'WEBP', quality=78); (VD / (vid + '.jpg')).unlink()
        e = dict(id=vid, c=folder.name if folder.name in CATS else 'helm', w=w, h=h, added=today)
        cap = f.with_suffix('.txt')
        if cap.exists(): e['cap'] = cap.read_text().strip()[:120]; cap.unlink()
        vids.append(e); added.append(vid); f.unlink()
VID.write_text(json.dumps(vids, indent=1))
print('added', len(added), ' '.join(added))
