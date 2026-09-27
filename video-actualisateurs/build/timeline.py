# -*- coding: utf-8 -*-
"""timeline.py — build/timeline.json : scènes, durées réelles (mp3 / ATEMPO),
début, chapitrage."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

FF = os.path.expanduser("~/.local/bin/ffmpeg")
if not os.path.exists(FF):
    try:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FF = "ffmpeg"

ATEMPO = 1.12
LEAD = 0.6
TAIL = 1.0
QUIZ_DUR = 16.0

SPEC = [
    ("s01", 0, "GÉNÉRIQUE", "", "seg01", 1.5, False),
    ("s02", 1, "§ 1.1", "Actualisation : de la langue au discours", "seg02", 0, False),
    ("s03", 1, "§ 1.2", "Réalisation : virtuel / réel", "seg03", 0, False),
    ("s04", 1, "§ 2.1", "Le chat : trois phrases, un seul virtuel", "seg04", 0, True),
    ("s05", 1, "§ 2.1", "La barrière du nombre", "seg05", 1.0, True),
    ("s06", 1, "§ 2.2–2.3", "Histoire du degré zéro", "seg06", 0, False),
    ("s07", 1, "§ 3", "Le tableau des actualisateurs — acte 1", "seg07", 0, False),
    ("s08", 1, "§ 3", "Le tableau — acte 2 : les quatre portes du réel", "seg08", 0, True),
    ("s09", 1, "§ 3", "Le tableau — acte 3 : vue d'ensemble", "seg09", 8.0, True),
    ("s10", 1, "§ 4.1–4.2", "L'indéfini : présenter, généraliser", "seg10", 0, False),
    ("s11", 1, "§ 4.3", "L'indéfini spécifiant", "seg11", 0, False),
    ("s12", 1, "§ 4.4", "L'indéfini emphatique : tout est dans le ton", "seg12", 0, False),
    ("s13", 1, "§ 4.5", "L'abus de l'indéfini", "seg13", 0, False),
    ("s14", 1, "TP", "Quiz — chapitre I", "seg14", 0.5, False),
    ("q11", 1, "TP", "Quiz — chapitre I", None, 0, False),
    ("q12", 1, "TP", "Quiz — chapitre I", None, 0, False),
    ("q13", 1, "TP", "Quiz — chapitre I", None, 0, False),
    ("s15", 2, "§ 1.1", "Le défini : la notoriété", "seg15", 0, False),
    ("s16", 2, "§ 1.2", "Le défini démonstratif et emphatique", "seg16", 0, False),
    ("s17", 2, "§ 1.3", "Le défini possessif", "seg17", 0, False),
    ("s18", 2, "§ 1.4–1.5", "Le défini généralisant ; jeux stylistiques", "seg18", 0, True),
    ("s19", 2, "§ 2.1", "Le partitif : le refus du nombrable", "seg19", 0, False),
    ("s20", 2, "§ 2.2–2.3", "Le partitif : participation et abstraction", "seg20", 0, False),
    ("s21", 2, "§ 3.1", "Possessifs : séries atone et tonique", "seg21", 0, False),
    ("s22", 2, "§ 3.2", "mon, ton / son : spécifique et non spécifique", "seg22", 0, True),
    ("s23", 2, "§ 3.3", "Possessifs : tendresse et dédain", "seg23", 0, False),
    ("s24", 2, "§ 4.1", "Le démonstratif : réalisation achevée", "seg24", 0, False),
    ("s25", 2, "§ 4.2", "Le démonstratif : nuances notionnelles", "seg25", 0, False),
    ("s26", 2, "TP", "Quiz — chapitre II", "seg26", 0.5, False),
    ("q21", 2, "TP", "Quiz — chapitre II", None, 0, False),
    ("q22", 2, "TP", "Quiz — chapitre II", None, 0, False),
    ("q23", 2, "TP", "Quiz — chapitre II", None, 0, False),
    ("s27", 3, "§ 1", "Les adjectifs relatifs", "seg27", 0, False),
    ("s28", 3, "§ 2", "Interrogatifs et exclamatifs", "seg28", 0, False),
    ("s29", 3, "§ 3.1–3.2", "Les indéfinis : formes", "seg29", 0, False),
    ("s30", 3, "§ 3.3", "Le cas « tout »", "seg30", 0, False),
    ("s31", 3, "§ 4", "Numéraux cardinaux", "seg31", 0, False),
    ("s32", 3, "TP", "Quiz — chapitre III", "seg32", 0.5, False),
    ("q31", 3, "TP", "Quiz — chapitre III", None, 0, False),
    ("q32", 3, "TP", "Quiz — chapitre III", None, 0, False),
    ("q33", 3, "TP", "Quiz — chapitre III", None, 0, False),
    ("s33", 0, "SYNTHÈSE", "Le système complet", "seg33", 1.0, True),
    ("s34", 0, "À RETENIR", "Cinq puces pour tout revoir", "seg34", 2.0, False),
]

CHAPITRES = {
    "s01": "Générique & programme",
    "s02": "I · Actualisation",
    "s03": "I · Réalisation (virtuel/réel)",
    "s04": "I · Le nombre et la réalisation",
    "s07": "I · Tableau des actualisateurs",
    "s10": "I · L'article indéfini",
    "s14": "I · Travaux pratiques",
    "s15": "II · L'article défini",
    "s19": "II · L'article partitif",
    "s21": "II · Les possessifs",
    "s24": "II · Les démonstratifs",
    "s26": "II · Travaux pratiques",
    "s27": "III · Les relatifs",
    "s28": "III · Les interrogatifs",
    "s29": "III · Les indéfinis",
    "s31": "III · Les numéraux",
    "s32": "III · Travaux pratiques",
    "s33": "Synthèse finale",
    "s34": "À retenir",
}


def probe(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", r.stderr)
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def narr_chars():
    p = os.path.join(BASE, "NARRATION-complet.md")
    out, cur = {}, None
    for line in open(p, encoding="utf-8"):
        m = re.match(r"^## (seg\d+)", line)
        if m:
            cur = m.group(1)
            out[cur] = 0
        elif cur and line.strip() and not line.startswith("#"):
            out[cur] += len(line.strip()) + 1
    return out


def build():
    scenes, t = [], 0.0
    n = len(SPEC)
    chars = narr_chars()
    for i, (sid, chap, section, titre, seg, extra, chat) in enumerate(SPEC):
        if seg:
            p = os.path.join(AUDIO, seg + ".mp3")
            if os.path.exists(p):
                d = probe(p) / ATEMPO
            else:
                d = chars.get(seg, 400) / 12.0 / ATEMPO
                print(f"[timeline] {seg} absent → durée estimée {d:.1f} s")
            dur = LEAD + d + TAIL + extra
            audio_at = t + LEAD
        else:
            dur, audio_at = QUIZ_DUR, None
        scenes.append(dict(sid=sid, chap=chap, section=section, titre=titre, seg=seg,
                           start=round(t, 3), dur=round(dur, 3), audio_at=audio_at,
                           chat=chat, prog=i / n, quiz=None))
        t += dur
    out = dict(total=round(t, 3), fps=25, atempo=ATEMPO, scenes=scenes,
               chapitres=CHAPITRES)
    with open(os.path.join(BASE, "build", "timeline.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    mm = int(t // 60)
    print(f"[timeline] {len(scenes)} scènes, durée totale {mm} min {t - mm * 60:.1f} s")
    return out


if __name__ == "__main__":
    build()
