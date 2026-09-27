# -*- coding: utf-8 -*-
"""
viz.py — moteur graphique « Les actualisateurs du substantif ».
Primitives PIL + scènes déclaratives (tracks pré-rendues collées par frame).
1920x1080 @ 25 fps. Charte : crème ; sarcelle (I), corail (II), violet (III) ;
DejaVu Serif Bold / Sans / Sans Mono.
"""
from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(BASE, "assets")

W, H = 1920, 1080
FPS = 25

CREAM   = (245, 239, 226)
CREAM_D = (236, 228, 210)
INK     = (43, 40, 36)
INK_SOFT = (94, 88, 80)
WHITE   = (255, 253, 248)
TEAL    = (40, 118, 116)
TEAL_D  = (26, 84, 83)
TEAL_L  = (214, 232, 231)
CORAL   = (190, 84, 52)
CORAL_D = (146, 60, 36)
CORAL_L = (243, 224, 216)
VIOLET  = (101, 72, 138)
VIOLET_D = (74, 51, 104)
VIOLET_L = (228, 220, 238)
GOLD    = (196, 150, 46)
GREEN   = (58, 138, 82)
GREEN_L = (219, 236, 224)
RED     = (178, 60, 52)
GREY    = (150, 144, 134)
GREY_L  = (224, 218, 205)

CHAP_COLORS = {1: (TEAL, TEAL_D, TEAL_L), 2: (CORAL, CORAL_D, CORAL_L),
               3: (VIOLET, VIOLET_D, VIOLET_L), 0: (INK, INK, GREY_L)}

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
_FONTS = {
    "serif":  os.path.join(FONT_DIR, "DejaVuSerif-Bold.ttf"),
    "sans":   os.path.join(FONT_DIR, "DejaVuSans.ttf"),
    "sansb":  os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf"),
    "mono":   os.path.join(FONT_DIR, "DejaVuSansMono.ttf"),
    "monob":  os.path.join(FONT_DIR, "DejaVuSansMono-Bold.ttf"),
}
_font_cache: dict = {}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    key = (kind, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(_FONTS[kind], size)
    return _font_cache[key]


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def lerp(a, b, t):
    return a + (b - a) * t


def ease_io(t):
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def pulse(t, hz=1.1):
    return 0.5 - 0.5 * math.cos(2 * math.pi * hz * t)


def new_img(w=W, h=H, color=CREAM):
    return Image.new("RGB", (w, h), color)


def new_rgba(w=W, h=H):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def text_size(draw, s, f):
    l, t, r, b = draw.textbbox((0, 0), s, font=f)
    return r - l, b - t


def wrap(draw, s, f, maxw):
    out = []
    for para in str(s).split("\n"):
        line = ""
        for word in para.split(" "):
            trial = word if not line else line + " " + word
            if text_size(draw, trial, f)[0] <= maxw or not line:
                line = trial
            else:
                out.append(line)
                line = word
        out.append(line)
    return out


def rrect(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def panel(img, box, fill=WHITE, outline=None, width=3, r=26, shadow=True):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    if shadow:
        s = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(s)
        sd.rounded_rectangle([x0 + 6, y0 + 8, x1 + 6, y1 + 8], radius=r, fill=(60, 50, 40, 60))
        s = s.filter(ImageFilter.GaussianBlur(7))
        img.paste(Image.alpha_composite(img.convert("RGBA"), s).convert("RGB"), (0, 0))
        d = ImageDraw.Draw(img)
    rrect(d, box, r, fill=fill, outline=outline, width=width)


_prof_sprite = None


def professeur(height=330):
    global _prof_sprite
    if _prof_sprite is None or _prof_sprite.height != height:
        src = Image.open(os.path.join(ASSETS, "professeur.png")).convert("RGBA")
        bg = src.getpixel((4, 4))[:3]
        px = src.load()
        w, h = src.size
        for j in range(h):
            for i in range(w):
                r, g, b, a = px[i, j]
                if abs(r - bg[0]) < 26 and abs(g - bg[1]) < 26 and abs(b - bg[2]) < 26:
                    px[i, j] = (r, g, b, 0)
        ratio = height / h
        _prof_sprite = src.resize((int(w * ratio), height), Image.LANCZOS)
    return _prof_sprite


def cat_sprite(height=150):
    key = ("cat", height)
    if key in _font_cache:
        return _font_cache[key]
    s = height
    img = new_rgba(int(s * 1.25), s)
    d = ImageDraw.Draw(img)
    body = INK
    d.ellipse([int(s * .18), int(s * .45), int(s * 1.05), int(s * .98)], fill=body)
    d.ellipse([int(s * .62), int(s * .12), int(s * 1.22), int(s * .68)], fill=body)
    d.polygon([(int(s * .68), int(s * .22)), (int(s * .72), int(s * .02)), (int(s * .84), int(s * .16))], fill=body)
    d.polygon([(int(s * .98), int(s * .16)), (int(s * 1.08), int(s * .00)), (int(s * 1.14), int(s * .20))], fill=body)
    d.line([int(s * .22), int(s * .62), int(s * .06), int(s * .38), int(s * .14), int(s * .26)],
           fill=body, width=max(4, s // 14), joint="curve")
    d.ellipse([int(s * .80), int(s * .34), int(s * .87), int(s * .42)], fill=CREAM)
    d.ellipse([int(s * .99), int(s * .34), int(s * 1.06), int(s * .42)], fill=CREAM)
    _font_cache[key] = img
    return img


def header(img, chap, section, titre, prog=None):
    acc, acc_d, acc_l = CHAP_COLORS.get(chap, CHAP_COLORS[0])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 118], fill=CREAM)
    d.rectangle([0, 116, W, 120], fill=acc)
    if chap:
        d.ellipse([56, 30, 116, 90], fill=acc)
        d.text((86, 60), str(chap), font=font("sansb", 34), fill=WHITE, anchor="mm")
        d.text((136, 34), f"CHAPITRE {'I' * chap if chap < 4 else chap}  ·  {section}",
               font=font("monob", 26), fill=acc_d)
    else:
        d.text((60, 34), section, font=font("monob", 26), fill=acc_d)
    d.text((136 if chap else 60, 66), titre, font=font("serif", 40), fill=INK)
    if prog is not None:
        bw = 300
        x0 = W - 60 - bw
        d.rounded_rectangle([x0, 52, x0 + bw, 66], 7, fill=GREY_L)
        d.rounded_rectangle([x0, 52, x0 + int(bw * clamp(prog)), 66], 7, fill=acc)
    return img


def footer(img, texte):
    d = ImageDraw.Draw(img)
    f = font("mono", 22)
    d.text((60, H - 52), texte, font=f, fill=INK_SOFT)
    d.text((W - 60, H - 52), "LES ACTUALISATEURS DU SUBSTANTIF", font=f, fill=INK_SOFT, anchor="ra")
    return img


def base_scene(chap, section, titre, prog=None, foot=""):
    img = new_img()
    header(img, chap, section, titre, prog)
    footer(img, foot)
    return img


def paste_prof(img, height=330, x=None, y=None):
    sp = professeur(height)
    x = W - 70 - sp.width if x is None else x
    y = H - 60 - sp.height if y is None else y
    img.paste(sp, (x, y), sp)
    return img


def chat_tag(img, on=True):
    if not on:
        return img
    d = ImageDraw.Draw(img)
    f = font("serif", 30)
    w, h = text_size(d, "chat", f)
    x, y = W - 120 - w, 150
    rrect(d, [x - 18, y - 10, x + w + 18, y + h + 14], 14, fill=TEAL_L, outline=TEAL, width=2)
    d.text((x, y), "chat", font=f, fill=TEAL_D)
    d.text((x - 30, y + 6), "◉", font=font("sans", 22), fill=TEAL)
    return img


class Track:
    def __init__(self, img, pos, t0, t1=None, appear="fade", dur_appear=0.6,
                 slide=(0, 40), alpha=1.0, pulse_box=None, pulse_color=None,
                 stay=True, vanish=None):
        self.img = img
        self.pos = pos
        self.t0 = t0
        self.t1 = t1
        self.appear = appear
        self.dur_appear = dur_appear
        self.slide = slide
        self.alpha = alpha
        self.stay = stay
        self.vanish = vanish
        self.pulse_box = pulse_box
        self.pulse_color = pulse_color

    def draw(self, canvas, t):
        if t < self.t0:
            return
        if self.t1 is not None and t > self.t1:
            return
        p = ease_out(clamp((t - self.t0) / max(self.dur_appear, 1e-6)))
        img = self.img
        dx, dy = 0, 0
        a = self.alpha
        if self.appear == "fade":
            a *= p
        elif self.appear == "slide_up":
            a *= p
            dy = int((1 - p) * self.slide[1])
        elif self.appear == "slide_left":
            a *= p
            dx = int((1 - p) * self.slide[0])
        elif self.appear == "slide_right":
            a *= p
            dx = -int((1 - p) * self.slide[0])
        elif self.appear == "wipe":
            w = int(img.width * p)
            if w <= 0:
                return
            img = img.crop((0, 0, w, img.height))
        if self.vanish is not None and t > self.vanish:
            q = ease_io(clamp((t - self.vanish) / 0.5))
            a *= (1 - q)
        if self.pulse_box and self.pulse_color:
            lay = img.copy()
            dd = ImageDraw.Draw(lay)
            x0, y0, x1, y1 = self.pulse_box
            k = 0.35 + 0.4 * pulse(t - self.t0)
            dd.rounded_rectangle([x0, y0, x1, y1], 10,
                                 fill=self.pulse_color + (int(255 * k),))
            lay.alpha_composite(img)
            img = lay
        if a < 0.999:
            img = img.copy()
            img.putalpha(img.getchannel("A").point(lambda v: int(v * a)))
        canvas.paste(img, (int(self.pos[0] + dx), int(self.pos[1] + dy)), img)


class Mover:
    def __init__(self, img, p0, p1, t0, t1, fade=0.4, ease=ease_io, alpha=1.0,
                 scale=None):
        self.img = img
        self.p0 = p0
        self.p1 = p1
        self.t0 = t0
        self.t1 = t1
        self.fade = fade
        self.ease = ease
        self.alpha = alpha
        self.scale = scale

    def draw(self, canvas, t):
        if t < self.t0 or t > self.t1 + self.fade:
            return
        p = self.ease(clamp((t - self.t0) / max(self.t1 - self.t0, 1e-6)))
        x = int(lerp(self.p0[0], self.p1[0], p))
        y = int(lerp(self.p0[1], self.p1[1], p))
        img = self.img
        if self.scale:
            s = lerp(self.scale[0], self.scale[1], p)
            img = img.resize((max(2, int(img.width * s)), max(2, int(img.height * s))),
                             Image.LANCZOS)
        a = self.alpha
        if t > self.t1:
            a *= 1 - clamp((t - self.t1) / self.fade)
        if a < 0.999:
            img = img.copy()
            img.putalpha(img.getchannel("A").point(lambda v: int(v * a)))
        canvas.paste(img, (int(x), int(y)), img)


class Scene:
    def __init__(self, sid, dur, chap=0, section="", titre="", prog=None, foot="",
                 prof=True, chat=False):
        self.sid = sid
        self.dur = dur
        self.tracks = []
        self.dyn = []
        self.base = base_scene(chap, section, titre, prog, foot)
        if chat:
            chat_tag(self.base)
        if prof:
            paste_prof(self.base)
        self.base_rgba = self.base.convert("RGBA")

    def add(self, track):
        self.tracks.append(track)
        return track

    def dyn_fn(self, fn):
        self.dyn.append(fn)
        return fn

    def commit(self):
        self.base_rgba = self.base.convert("RGBA")

    def frame(self, t):
        img = self.base_rgba.copy()
        for tr in sorted(self.tracks, key=lambda z: z.t0):
            tr.draw(img, t)
        for fn in self.dyn:
            fn(img, t)
        return img.convert("RGB")


def text_img(s, kind="sans", size=34, color=INK, maxw=None, lh=1.35,
             align="left", hl=None, hl_color=None):
    f = font(kind, size)
    tmp = ImageDraw.Draw(new_rgba(8, 8))
    lines = wrap(tmp, s, f, maxw) if maxw else str(s).split("\n")
    lhpx = int(size * lh)
    widths = [tmp.textlength(l, font=f) for l in lines]
    w = int(max(widths)) + 8 if widths else 8
    h = lhpx * len(lines) + 8
    img = new_rgba(w, h)
    d = ImageDraw.Draw(img)
    pulse_box = None
    for i, l in enumerate(lines):
        x = 4
        if align == "center":
            x = (w - widths[i]) / 2
        elif align == "right":
            x = w - widths[i] - 4
        d.text((x, 4 + i * lhpx), l, font=f, fill=color)
        if hl and hl in l:
            ix = l.index(hl)
            pre = d.textlength(l[:ix], font=f)
            hw = d.textlength(hl, font=f)
            pulse_box = [x + pre - 6, 4 + i * lhpx - 4, x + pre + hw + 6, 4 + i * lhpx + size + 6]
    return img, pulse_box


def quote_card(text, author, work, acc, width=1180, size=40):
    f = font("serif", size)
    fa = font("sansb", 28)
    fw = font("sans", 24)
    tmp = ImageDraw.Draw(new_rgba(8, 8))
    lines = wrap(tmp, text, f, width - 160)
    lh = int(size * 1.4)
    htxt = lh * len(lines)
    h = htxt + 130
    img = new_rgba(width, h)
    d = ImageDraw.Draw(img)
    rrect(d, [0, 0, width - 1, h - 1], 22, fill=(250, 244, 229, 255), outline=acc + (255,), width=3)
    d.rectangle([0, 0, 14, h - 1], fill=acc + (255,))
    d.text((56, 34), "«", font=font("serif", 74), fill=acc + (160,))
    for i, l in enumerate(lines):
        d.text((64, 56 + i * lh), l, font=f, fill=INK + (255,))
    y = 56 + htxt + 18
    d.text((64, y), author, font=fa, fill=acc + (255,))
    aw = d.textlength(author, font=fa)
    if work:
        d.text((64 + aw + 18, y + 3), work, font=fw, fill=INK_SOFT + (255,))
    return img
