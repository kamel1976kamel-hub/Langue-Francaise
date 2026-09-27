# -*- coding: utf-8 -*-
"""
verify.py — vérification AVANT toute annonce de livrable.
Le build statique d'ffmpeg ne fournit pas de binaire ffprobe séparé : on extrait
les mêmes informations (durée, taille, codecs, streams) avec `ffmpeg -i`
(libavformat identique). Pour PNG/PDF : taille + métadonnées PIL / compteur de
pages. Sortie lisible + code retour non nul si un fichier est absent/corrompu.

Usage : python3 verify.py fichier [fichier …]
"""
from __future__ import annotations

import os
import re
import subprocess
import sys

FF = os.path.expanduser("~/.local/bin/ffmpeg")
if not os.path.exists(FF):
    try:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FF = "ffmpeg"


def media_info(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True)
    err = r.stderr
    dur = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err)
    if not dur:
        return None
    h, mi, s = dur.groups()
    secs = int(h) * 3600 + int(mi) * 60 + float(s)
    streams = re.findall(
        r"Stream #\d+:\d+(?:\[0x[\da-fA-F]+\])?(?:\([^)]*\))?: (\w+): ([\w./-]+)", err)
    return secs, streams


def png_info(path):
    from PIL import Image
    with Image.open(path) as im:
        return im.size, im.format


def pdf_pages(path):
    data = open(path, "rb").read()
    return len(re.findall(rb"/Type\s*/Page[^s]", data))


def main(paths):
    ok = True
    for p in paths:
        if not os.path.exists(p):
            print(f"ABSENT   {p}")
            ok = False
            continue
        size = os.path.getsize(p)
        line = f"OK       {p}  ·  {size / 1024:.0f} Kio"
        try:
            if size == 0:
                raise ValueError("vide")
            if p.lower().endswith((".mp4", ".m4a", ".mp3", ".wav", ".aac")):
                info = media_info(p)
                if not info:
                    raise ValueError("illisible par ffmpeg")
                secs, streams = info
                sc = ", ".join(f"{k}:{v}" for k, v in streams) or "aucun stream"
                line += f"  ·  {secs:.2f} s  ·  {sc}"
            elif p.lower().endswith(".png"):
                (w, h), fmt = png_info(p)
                line += f"  ·  image {fmt} {w}x{h}"
            elif p.lower().endswith(".pdf"):
                line += f"  ·  PDF {pdf_pages(p)} page(s)"
            else:
                line += "  ·  (binaire non média)"
        except Exception as e:
            line = f"CORROMPU {p}  ·  {e}"
            ok = False
        print(line)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
