"""Shared image helpers for the build and the photo-inbox Action.
Every gallery photo lives in site/images/g as three sizes:
  g/<id>.webp    1600px  (viewer)
  g/t/<id>.webp   720px  (grid, tablets/desktop)
  g/s/<id>.webp   480px  (grid, phones)
Photos are re-encoded with no EXIF, so no GPS/location data is ever published."""
from PIL import Image, ImageOps, ImageStat

SIZES = (('', 1600, 80), ('t/', 720, 72), ('s/', 480, 70))

def load(path):
    try:
        import pillow_heif  # iPhone HEIC support (installed in the Action)
        pillow_heif.register_heif_opener()
    except ImportError:
        pass
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')

def write_sizes(im, gdir, pid, only_missing=False):
    out = {}
    for sub, px, q in SIZES:
        p = gdir / sub / (pid + '.webp')
        p.parent.mkdir(parents=True, exist_ok=True)
        if only_missing and p.exists():
            continue
        c = im.copy(); c.thumbnail((px, px), Image.LANCZOS); c.save(p, 'WEBP', quality=q, method=5)
        out[sub] = c.size
    return out

def avg_color(path):
    im = Image.open(path).convert('RGB'); im.thumbnail((64, 64))
    r, g, b = [int(v * 0.55) for v in ImageStat.Stat(im).mean]   # darkened, so the placeholder sits quietly on navy
    return '#%02x%02x%02x' % (r, g, b)
