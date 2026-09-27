# -*- coding: utf-8 -*-
"""mix.py — piste audio complète (voix ×ATEMPO placée sur la timeline) puis
mux vidéo+audio+chapitres.  python3 mix.py"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from timeline import ATEMPO

SR = 44100
FF = os.path.expanduser("~/.local/bin/ffmpeg")
if not os.path.exists(FF):
    try:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FF = "ffmpeg"


def decode_mp3(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-filter:a",
                          f"atempo={ATEMPO}", "-f", "s16le", "-ac", "1",
                          "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def main():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    total = tl["total"]
    n = int(total * SR) + SR
    buf = np.zeros(n, dtype=np.float32)
    for sc in tl["scenes"]:
        if not sc["seg"]:
            continue
        sig = decode_mp3(os.path.join(BASE, "audio", sc["seg"] + ".mp3"))
        f = int(0.04 * SR)
        sig[:f] *= np.linspace(0, 1, f)
        sig[-f:] *= np.linspace(1, 0, f)
        i0 = int(sc["audio_at"] * SR)
        i1 = min(n, i0 + len(sig))
        buf[i0:i1] += sig[: i1 - i0]
    buf[: int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
    wav = os.path.join(BASE, "out", "audio_full.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes())
    m4a = os.path.join(BASE, "out", "audio_full.m4a")
    subprocess.run([FF, "-y", "-v", "error", "-i", wav, "-c:a", "aac", "-b:a", "192k", m4a],
                   check=True)
    print("[mix] audio →", m4a, f"{total / 60:.1f} min")

    lines = [";FFMETADATA1"]
    chaps = [(sc, tl["chapitres"][sc["sid"]]) for sc in tl["scenes"]
             if sc["sid"] in tl["chapitres"]]
    for i, (sc, title) in enumerate(chaps):
        end = chaps[i + 1][0]["start"] if i + 1 < len(chaps) else total
        lines += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={int(sc['start'] * 1000)}",
                  f"END={int(end * 1000)}", f"title={title}"]
    mf = os.path.join(HERE, "chapters.txt")
    open(mf, "w").write("\n".join(lines) + "\n")

    video = os.path.join(BASE, "out", "video_silent.mp4")
    out = os.path.join(BASE, "out", "actualisateurs-complet.mp4")
    subprocess.run([FF, "-y", "-v", "error", "-i", video, "-i", m4a, "-i", mf,
                    "-map", "0:v", "-map", "1:a", "-map_metadata", "2",
                    "-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart", out],
                   check=True)
    print("[mix] MP4 final →", out)


if __name__ == "__main__":
    main()
