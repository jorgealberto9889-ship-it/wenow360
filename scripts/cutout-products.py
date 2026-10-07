"""Recorta el fondo blanco liso de los empaques y los guarda como webp con transparencia.
Uso: python3 scripts/cutout-products.py "<carpeta con PNG>" public/assets/products
Nombres esperados (cualquier mayúscula): ver MAP. Productos nuevos: añadir su archivo y su id aquí."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

MAP = {
    "nk+ sin fondo": "nk-plus", "nutriday brown sin fondo": "nutriday-brown", "regenerex sin fonndo": "regenerex",
    "active burn sin fondo": "active-burn", "antiox sin fondo": "antiox", "collagen hombre mora azul sin fondo": "collagen-man",
    "collagen mujer mora azul sin fondo": "collagen-woman", "endo cbd oil sin fondo": "endo", "green plus sin fondo": "green-plus",
    "neuro chai sin fondo": "neuro-chai", "nutriday red sin fondo": "nutriday-red", "purebody sin fondo": "purebody",
    "resnad sin fondo": "resnad", "synergy sin fondo": "synergy", "transfactor sin fondo": "transfactor",
}

def cutout(src: Path, dst: Path, thr=238, size=900):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(int)
    near_white = (a.min(axis=2) >= thr) & ((a.max(axis=2) - a.min(axis=2)) < 14)
    m = Image.fromarray((near_white * 255).astype("uint8"), "L").copy()
    w, h = m.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if m.getpixel(seed) == 255:
            ImageDraw.floodfill(m, seed, 128)
    background = np.asarray(m) == 128
    alpha = Image.fromarray(((~background) * 255).astype("uint8"), "L").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
    out = im.convert("RGBA"); out.putalpha(alpha)
    bb = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
    out = out.crop(bb); out.thumbnail((size, size))
    out.save(dst, "WEBP", quality=88)
    return out.size

if __name__ == "__main__":
    src_dir, dst_dir = Path(sys.argv[1]), Path(sys.argv[2])
    for f in sorted(src_dir.glob("*.png")):
        key = f.stem.lower().strip()
        pid = MAP.get(key) or MAP.get(key.replace("  ", " "))
        if not pid:
            print("sin id:", f.name); continue
        print(pid, cutout(f, dst_dir / f"{pid}.webp"))
