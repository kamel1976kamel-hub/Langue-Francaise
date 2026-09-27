# -*- coding: utf-8 -*-
"""scenes_common.py — tableau des actualisateurs, quiz chronométrés, visages,
arbres, fantômes de chat."""
from __future__ import annotations

import math
from PIL import Image, ImageDraw
from viz import (W, H, FPS, CREAM, CREAM_D, INK, INK_SOFT, WHITE, TEAL, TEAL_D, TEAL_L,
                 CORAL, CORAL_D, CORAL_L, VIOLET, VIOLET_D, VIOLET_L, GOLD, GREEN,
                 GREEN_L, RED, GREY, GREY_L, CHAP_COLORS, font, text_size, wrap,
                 rrect, panel, new_rgba, text_img, quote_card, cat_sprite,
                 Track, Mover, clamp, lerp, ease_io, ease_out, pulse)


def face_img(kind, size=110, color=INK):
    s = size
    img = new_rgba(s, s)
    d = ImageDraw.Draw(img)
    lw = max(4, s // 22)
    d.ellipse([4, 4, s - 4, s - 4], outline=color + (255,), width=lw)
    ex, ey = s * .34, s * .40
    ex2 = s * .66
    if kind == "admiration":
        d.ellipse([ex - 7, ey - 7, ex + 7, ey + 7], fill=color + (255,))
        d.ellipse([ex2 - 7, ey - 7, ex2 + 7, ey + 7], fill=color + (255,))
        d.arc([ex - 12, ey - 22, ex + 12, ey - 6], 180, 360, fill=color + (255,), width=lw)
        d.arc([ex2 - 12, ey - 22, ex2 + 12, ey - 6], 180, 360, fill=color + (255,), width=lw)
        d.ellipse([s * .40, s * .60, s * .60, s * .80], outline=color + (255,), width=lw)
    elif kind == "ironie":
        d.line([ex - 8, ey, ex + 8, ey], fill=color + (255,), width=lw)
        d.line([ex2 - 8, ey, ex2 + 8, ey], fill=color + (255,), width=lw)
        d.line([ex2 - 12, ey - 14, ex2 + 10, ey - 18], fill=color + (255,), width=lw)
        d.arc([s * .36, s * .58, s * .66, s * .78], 200, 340, fill=color + (255,), width=lw)
    else:
        d.arc([ex - 9, ey - 8, ex + 9, ey + 8], 0, 180, fill=color + (255,), width=lw)
        d.arc([ex2 - 9, ey - 8, ex2 + 9, ey + 8], 0, 180, fill=color + (255,), width=lw)
        d.arc([s * .30, s * .52, s * .70, s * .86], 0, 180, fill=color + (255,), width=lw)
    return img


def heart_img(size=90, color=CORAL):
    s = size
    img = new_rgba(s, s)
    d = ImageDraw.Draw(img)
    d.ellipse([s * .08, s * .12, s * .55, s * .58], fill=color + (255,))
    d.ellipse([s * .45, s * .12, s * .92, s * .58], fill=color + (255,))
    d.polygon([(s * .10, s * .45), (s * .90, s * .45), (s * .50, s * .95)], fill=color + (255,))
    return img


def tree_img(h=300, mode="virtuel"):
    img = new_rgba(int(h * .95), h)
    d = ImageDraw.Draw(img)
    w = img.width
    if mode == "virtuel":
        canopy, trunk, outline = (176, 172, 162, 255), (140, 134, 124, 255), None
    else:
        canopy, trunk, outline = (86, 146, 96, 255), (122, 88, 58, 255), (46, 92, 58, 255)
    tw = max(10, h // 14)
    d.rectangle([w / 2 - tw / 2, h * .52, w / 2 + tw / 2, h * .96], fill=trunk)
    for cx, cy, r in ((.5, .34, .30), (.30, .44, .22), (.70, .44, .22), (.5, .52, .24)):
        box = [w * cx - h * r, h * cy - h * r, w * cx + h * r, h * cy + h * r]
        d.ellipse(box, fill=canopy, outline=outline, width=3 if outline else 0)
    if mode == "reel":
        d.ellipse([w * .12, h * .95, w * .88, h * 1.0], fill=(120, 110, 96, 120))
    return img


def ghost_cats(n=3, size=150):
    cat = cat_sprite(size)
    img = new_rgba(cat.width + 70, cat.height + 30)
    for i in range(n):
        c = cat.copy()
        c.putalpha(c.getchannel("A").point(lambda v: int(v * (0.28 + 0.10 * i))))
        img.alpha_composite(c, (i * 26, i * 8))
    return img


TAB_ROWS = ["Article indéfini", "Article défini", "Adjectif possessif", "Adjectif démonstratif"]
TAB_COLS = ["TRANSITOIRE", "NOTOIRE", "POSSESSEUR", "GESTE"]
TAB_EX = [
    ["J'aperçois dans le jardin un chien et des chats.",
     "Tiens ! le chien poursuit les chats.",
     "Mais c'est mon chien !",
     "Ce chien est bien méchant !"],
    ["Un homme averti en vaut deux.",
     "Le soleil est un fameux quinquet.",
     "le boulanger (= notre)",
     "Ah ! le beau tableau !"],
    ["Un bon chat, bon rat.",
     "Qui veut noyer son chien l'accuse de la rage.",
     "Je ménage ma monture.",
     "Cet homme a une démarche curieuse."],
    ["Les petits ruisseaux font les grandes rivières.",
     "La calomnie est un vilain défaut.",
     "C'était mon bon chienchien !",
     "Et ce bras du royaume est le plus ferme appui."],
]
TAB_HL = [["un", "le", "mon", "Ce"], ["Un", "Le", "le", "le"],
          ["Un", "son", "ma", "Cet"], ["Les", "La", "mon", "ce"]]

TAB_BOX = (110, 210, 1500, 780)


def draw_tableau(img, act=1, col=-1, row=-1, examples=False, hl_col=-1, t=0.0):
    x0, y0, x1, y1 = TAB_BOX
    d = ImageDraw.Draw(img)
    lw, virt_w, n = 260, 230, 4
    cx0 = x0 + lw + virt_w
    cw = (x1 - cx0) / n
    rrect(d, [x0, y0, x1, y1], 18, fill=WHITE, outline=INK, width=3)
    d.rectangle([x0 + lw, y0 + 64, x0 + lw + virt_w, y1 - 3], fill=TEAL_L)
    d.rectangle([cx0, y0 + 64, x1 - 3, y1 - 3], fill=(250, 246, 236))
    if col >= 0:
        d.rectangle([cx0 + cw * col, y0 + 64, cx0 + cw * (col + 1), y1 - 3], fill=(246, 236, 214))
    bx = cx0
    d.line([bx, y0 + 40, bx, y1 + 26], fill=RED, width=7)
    for i, s in enumerate(("VIRTUEL", "RÉEL")):
        xx = x0 + lw + virt_w / 2 if i == 0 else (cx0 + x1) / 2
        d.text((xx, y0 + 26), s, font=font("monob", 30),
               fill=TEAL_D if i == 0 else CORAL_D, anchor="mm")
    d.text((bx + 10, y0 + 46), "barrière du nombre", font=font("monob", 18), fill=RED)
    if act >= 2:
        for i, name in enumerate(TAB_COLS):
            if (col < 0) or (i <= col):
                d.text((cx0 + cw * (i + .5), y0 + 92), name, font=font("monob", 24),
                       fill=CORAL_D if i != hl_col else RED, anchor="mm")
        d.line([x0 + 3, y0 + 114, x1 - 3, y0 + 114], fill=INK, width=2)
    rh = (y1 - y0 - 114) / 4
    for r, name in enumerate(TAB_ROWS):
        on = (row < 0) or (r <= row)
        yy = y0 + 114 + rh * r
        if r:
            d.line([x0 + 3, yy, x1 - 3, yy], fill=GREY_L, width=2)
        if not on:
            continue
        d.text((x0 + 18, yy + rh / 2), name, font=font("sansb", 22), fill=INK, anchor="lm")
        if act >= 3 and examples:
            for c in range(4):
                fe = font("serif", 21)
                lines = wrap(d, TAB_EX[r][c], fe, cw - 26)
                for li, l in enumerate(lines[:4]):
                    hl = TAB_HL[r][c]
                    if hl and l.startswith(hl):
                        xx = cx0 + cw * c + 13
                        for txt, fo, co in ((hl, fe, RED), (l[len(hl):], fe, INK)):
                            d.text((xx, yy + 12 + li * 27), txt, font=fo, fill=co)
                            xx += d.textlength(txt, font=fo)
                    else:
                        d.text((cx0 + cw * c + 13, yy + 12 + li * 27), l, font=fe, fill=INK)
            fv = font("serif", 20)
            virt = ["Un bon chat, bon rat.", "Un homme averti en vaut deux.",
                    "Les petits ruisseaux…", "Qui veut noyer son chien…"][r]
            lines = wrap(d, virt, fv, virt_w - 24)
            for li, l in enumerate(lines[:3]):
                d.text((x0 + lw + 12, yy + 16 + li * 26), l, font=fv, fill=TEAL_D)
    d.line([x0 + lw, y0 + 3, x0 + lw, y1 - 3], fill=INK, width=2)
    d.line([x0 + lw + virt_w, y0 + 3, x0 + lw + virt_w, y1 - 3], fill=INK, width=2)
    return img


def tableau_img(act=1, col=-1, row=-1, examples=False, hl_col=-1):
    local = new_rgba(W, H)
    draw_tableau(local, act, col, row, examples, hl_col)
    return local.crop((TAB_BOX[0] - 20, TAB_BOX[1] - 34, TAB_BOX[2] + 20, TAB_BOX[3] + 36))


def quiz_scene(spec, q, chap, prog):
    from viz import Scene
    acc, acc_d, acc_l = CHAP_COLORS[chap]
    sc = Scene(spec["sid"], spec["dur"], chap=chap,
               section=f"TRAVAUX PRATIQUES · Q{q['n']}/3",
               titre="Quiz — quelle valeur ?", prog=prog, foot="auto-évaluation",
               prof=False)
    d = ImageDraw.Draw(sc.base)
    panel(sc.base, (150, 190, 1500, 380), fill=WHITE, outline=acc, width=3)
    f = font("serif", 44)
    lines = wrap(d, q["sentence"], f, 1240)
    for i, l in enumerate(lines[:3]):
        d.text((210, 235 + i * 58), l, font=f, fill=INK)
    opt_imgs = []
    y = 430
    for i, opt in enumerate(q["options"]):
        oi = new_rgba(1240, 86)
        od = ImageDraw.Draw(oi)
        rrect(od, [0, 0, 1239, 85], 16, fill=WHITE, outline=GREY, width=2)
        od.ellipse([16, 18, 68, 70], fill=acc_l, outline=acc, width=2)
        od.text((42, 44), "ABCD"[i], font=font("sansb", 30), fill=acc_d, anchor="mm")
        fo = font("sans", 30)
        for li, l in enumerate(wrap(od, opt, fo, 1120)[:2]):
            od.text((90, 16 + li * 34), l, font=fo, fill=INK)
        opt_imgs.append(oi)
    good = q["good"]
    reveal_t = spec["dur"] - 6.0
    count_t = reveal_t - 3.0
    for i, oi in enumerate(opt_imgs):
        sc.add(Track(oi, (200, y + i * 104), 0.6 + i * 0.35, appear="slide_left", slide=(60, 0)))
    sc.commit()

    def dyn(img, t):
        dd = ImageDraw.Draw(img)
        if count_t <= t < reveal_t:
            rem = 3 - (t - count_t)
            dd.text((1620, 470), str(max(1, math.ceil(rem))), font=font("monob", 120), fill=GREY)
            dd.arc([1560, 430, 1740, 610], -90, -90 + 360 * (rem / 3.0), fill=acc, width=8)
            dd.text((1650, 640), "réfléchissez…", font=font("mono", 24), fill=INK_SOFT, anchor="mm")
        if t >= reveal_t:
            yy = y + good * 104
            ov = new_rgba(1240, 86)
            od = ImageDraw.Draw(ov)
            rrect(od, [0, 0, 1239, 85], 16, fill=(GREEN_L + (255,)), outline=GREEN, width=5)
            od.ellipse([16, 18, 68, 70], fill=GREEN)
            od.text((42, 44), "ABCD"[good], font=font("sansb", 30), fill=WHITE, anchor="mm")
            fo = font("sansb", 30)
            for li, l in enumerate(wrap(od, q["options"][good], fo, 1080)[:2]):
                od.text((90, 16 + li * 34), l, font=fo, fill=(30, 80, 46, 255))
            od.text((1190, 43), "✓", font=font("sansb", 44), fill=GREEN, anchor="mm")
            img.alpha_composite(ov, (200, yy))
            ei, _ = text_img(q["explain"], kind="sans", size=30, color=INK, maxw=1240)
            a = clamp((t - reveal_t - 0.5) / 0.5)
            ei = ei.copy()
            ei.putalpha(ei.getchannel("A").point(lambda v: int(v * a)))
            img.alpha_composite(ei, (200, y + 4 * 104 + 30))
    sc.dyn_fn(dyn)
    return sc
