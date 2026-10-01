"""Gera os ícones da marca Fio (geometria idêntica a src/components/logo.tsx).
Uso: python3 scripts/generate-icons.py  (requer Pillow)"""
from PIL import Image, ImageDraw

TEAL = (15, 107, 98, 255)
AMBER = (242, 165, 58, 255)
WHITE = (255, 255, 255, 255)
SS = 4  # supersampling


def bezier(p0, p1, p2, p3, n=60):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        ))
    return pts


STRAND = (bezier((23, 50), (23, 36), (41, 38), (41, 26))
          + bezier((41, 26), (41, 20), (38, 17), (34, 15))[1:])


def bezier_dense():
    return (bezier((23, 50), (23, 36), (41, 38), (41, 26), 400)
            + bezier((41, 26), (41, 20), (38, 17), (34, 15), 400)[1:])


def mark(size, bg=None, radius=None, scale=1.0, strand=WHITE, dot=AMBER):
    """Desenha a marca num canvas size x size. scale<1 encolhe o glifo (zona segura)."""
    big = size * SS
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg is not None:
        if radius:
            d.rounded_rectangle([0, 0, big - 1, big - 1], radius=radius * big / 64, fill=bg)
        else:
            d.rectangle([0, 0, big, big], fill=bg)
    k = big / 64 * scale
    off = (big - 64 * k) / 2
    tr = lambda p: (off + p[0] * k, off + p[1] * k)
    w = 5.5 * k
    pts = [tr(p) for p in bezier_dense()]
    for x, y in pts:
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=strand)
    cx, cy = tr((43, 14))
    r = 4.5 * k
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=dot)
    return img.resize((size, size), Image.LANCZOS)


out = 'assets/images/'
mark(1024, bg=TEAL, scale=0.92).convert('RGB').save(out + 'icon.png')
mark(640, bg=TEAL, radius=18).save(out + 'splash-icon.png')
mark(512, scale=0.62).save(out + 'android-icon-foreground.png')
Image.new('RGBA', (512, 512), TEAL).save(out + 'android-icon-background.png')
mark(432, scale=0.6, strand=(0, 0, 0, 255), dot=(0, 0, 0, 255)).save(out + 'android-icon-monochrome.png')
mark(48, bg=TEAL, radius=18).save(out + 'favicon.png')
print('ok')
