"""Builds the avatar textures from the clay portrait.

Inputs : portrait PNG, depth PNG (Depth Anything V2 small, ONNX)
Outputs: public/avatar/portrait.webp (RGBA, eyes cleaned, background cut)
         public/avatar/depth.png    (smoothed grayscale relief)
Eye geometry (in source pixels, 1254px image) is shared with src/scene/eyes.ts.
"""
import sys, json
import numpy as np
from PIL import Image, ImageFilter

SRC, DEPTH, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
N = 1254
EYES = [  # inner/outer corner, top/bottom lid peaks, iris center, iris radius
    dict(l=(530, 579), r=(611, 577), top=561, bot=587, c=(574, 574), ir=19.5),
    dict(l=(676, 578), r=(753, 577), top=561, bot=587, c=(711, 575), ir=19.5),
]

img = Image.open(SRC).convert('RGB')
a = np.asarray(img).astype(np.float32)
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)

def almond(e):
    (x0, y0), (x1, y1) = e['l'], e['r']
    t = np.clip((xx - x0) / (x1 - x0), 0, 1)
    base = y0 + (y1 - y0) * t
    bump = 4 * t * (1 - t)
    top = base - (base.mean() * 0 + (((y0 + y1) / 2) - e['top'])) * bump ** 0.8
    bot = base + (e['bot'] - (y0 + y1) / 2) * bump ** 0.9
    inside = (xx > x0) & (xx < x1) & (yy > top) & (yy < bot)
    return inside, top, bot

mask = np.zeros((N, N), bool)
for e in EYES:
    m, top, bot = almond(e)
    # sclera: warm off-white, shaded under the upper lid and toward the corners
    v = np.clip((yy - top) / np.maximum(bot - top, 1), 0, 1)
    t = np.clip((xx - e['l'][0]) / (e['r'][0] - e['l'][0]), 0, 1)
    corner = 1 - (4 * t * (1 - t)) ** 0.5
    shade = 0.62 + 0.38 * np.clip(v * 1.6, 0, 1) - 0.22 * corner
    col = np.stack([200 * shade, 184 * shade, 168 * shade], -1)
    a[m] = col[m]
    # lash line along the upper lid, soft shadow on the lower lid
    dt = yy - top
    lash = m & (dt < 2.6)
    k = np.clip(dt / 2.6, 0, 1)[..., None]
    a[lash] = (np.array([42, 32, 28]) * (1 - k) + a * k)[lash]
    db = bot - yy
    low = m & (db < 2.0)
    a[low] *= 0.82
    mask |= m & (dt >= 2.2)

clean = Image.fromarray(a.clip(0, 255).astype(np.uint8))

# background cut from depth (+ a little colour distance from the sage backdrop)
d = Image.open(DEPTH).convert('L').resize((N, N), Image.BICUBIC)
dn = np.asarray(d).astype(np.float32) / 255
sage = np.array([156, 156, 124], np.float32)
dist = np.linalg.norm(np.asarray(img).astype(np.float32) - sage, axis=-1) / 80
alpha = np.clip((dn - 0.16) / 0.08, 0, 1)
alpha = np.maximum(alpha * np.clip((dist - 0.25) * 1.6, 0, 1), np.clip((dn - 0.28) / 0.05, 0, 1))
# erode ~3px so the portrait's own drop shadow does not leave a dark outline
al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(1.4))
rgba = clean.copy(); rgba.putalpha(al)
S = 1024
rgba.resize((S, S), Image.LANCZOS).save(f'{OUT}/portrait.webp', quality=92, method=6, exact=True)

# relief: smooth, flatten background, add a gentle head roundness
dd = np.asarray(d.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
dd = np.where(alpha > 0.02, dd, 0.12)
Image.fromarray((dd.clip(0, 1) * 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS).save(f'{OUT}/depth.png')

json.dump({'size': N, 'eyes': [{'c': e['c'], 'r': e['ir'], 'l': e['l'], 'rr': e['r'], 'top': e['top'], 'bot': e['bot']} for e in EYES]}, open(sys.argv[4] if len(sys.argv) > 4 else f'{OUT}/eyes.json', 'w'))
print('ok')
