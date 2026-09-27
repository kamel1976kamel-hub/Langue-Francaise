# -*- coding: utf-8 -*-
"""render.py — rendu découpé par scène, rejouable, parallélisable.

Usage :
    python3 render.py                      # rend les chunks manquants (resume implicite)
    python3 render.py --worker 0 2         # chunks idx ≡ 0 [2] (parallélisme)
    python3 render.py --concat             # assemble out/parts → out/video_silent.mp4
    python3 render.py --png s05 8.0        # image de contrôle
    python3 render.py --only s05           # encode une scène seule (test)
Un chunk tué en cours = perdu seul ; relancer la même commande reprend au trou.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from viz import W, H, FPS, Scene                      # noqa: E402
import scenes_ch1                                     # noqa: E402

PAINTERS = dict(scenes_ch1.PAINTERS_CH1)
QUIZ = {}
for mod, ch in (("scenes_ch1", 1), ("scenes_ch2", 2), ("scenes_ch3", 3)):
    try:
        m = __import__(mod)
        if ch > 1:
            PAINTERS.update(getattr(m, "PAINTERS"))
        QUIZ[ch] = getattr(m, f"QUIZ_CH{ch}")
    except ImportError:
        pass
from scenes_common import quiz_scene                 # noqa: E402

FF = os.path.expanduser("~/.local/bin/ffmpeg")
if not os.path.exists(FF):
    try:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FF = "ffmpeg"

PARTS = os.path.join(BASE, "out", "parts")


def probe_dur(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", r.stderr)
    if not m:
        return None
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def load_timeline():
    with open(os.path.join(HERE, "timeline.json")) as f:
        return json.load(f)


def make_scene(spec):
    sid = spec["sid"]
    if sid.startswith("q"):
        ch = int(sid[1])
        q = dict(QUIZ[ch][int(sid[2]) - 1])
        return quiz_scene(spec, q, ch, spec["prog"])
    sc = Scene(sid, spec["dur"], chap=spec["chap"], section=spec["section"],
               titre=spec["titre"], prog=spec["prog"],
               foot=f"{spec['start'] / 60:.0f} min", chat=spec["chat"])
    PAINTERS[sid](spec, sc)
    sc.commit()
    return sc


def encode_cmd(path):
    return [FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
            "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium",
            "-crf", "20", "-pix_fmt", "yuv420p", path]


def part_path(i, sid):
    return os.path.join(PARTS, f"part_{i:02d}_{sid}.mp4")


def render_part(spec, i):
    path = part_path(i, spec["sid"])
    proc = subprocess.Popen(encode_cmd(path), stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    sc = make_scene(spec)
    nf = int(round(spec["dur"] * FPS))
    for f in range(nf):
        proc.stdin.write(sc.frame(f / FPS).tobytes())
    proc.stdin.close()
    proc.wait()
    return path, nf


def main():
    tl = load_timeline()
    os.makedirs(PARTS, exist_ok=True)
    os.makedirs(os.path.join(BASE, "frames"), exist_ok=True)
    args = sys.argv[1:]
    if args and args[0] == "--png":
        spec = next(s for s in tl["scenes"] if s["sid"] == args[1])
        img = make_scene(spec).frame(float(args[2]))
        p = os.path.join(BASE, "frames", f"preview_{spec['sid']}_{args[2]}.png")
        img.save(p)
        print("[render] preview →", p)
        return
    if args and args[0] == "--concat":
        specs = tl["scenes"]
        lst = os.path.join(PARTS, "concat.txt")
        with open(lst, "w") as f:
            for i, s in enumerate(specs):
                f.write(f"file '{part_path(i, s['sid'])}'\n")
        out = os.path.join(BASE, "out", "video_silent.mp4")
        subprocess.run([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0",
                        "-i", lst, "-c", "copy", "-movflags", "+faststart", out],
                       check=True)
        print("[render] concat →", out, f"({probe_dur(out):.1f} s)")
        return
    wk, wn = 0, 1
    if args and args[0] == "--worker":
        wk, wn = int(args[1]), int(args[2])
    done = skipped = 0
    for i, spec in enumerate(tl["scenes"]):
        if i % wn != wk:
            continue
        path = part_path(i, spec["sid"])
        d = probe_dur(path) if os.path.exists(path) else None
        if d is not None and abs(d - spec["dur"]) < 0.25:
            skipped += 1
            continue
        p, nf = render_part(spec, i)
        done += 1
        print(f"[render] {spec['sid']} → {os.path.basename(p)} ({nf} f)", flush=True)
    print(f"[render] worker {wk}/{wn} : {done} rendus, {skipped} repris")


if __name__ == "__main__":
    main()
