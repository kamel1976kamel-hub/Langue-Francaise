# -*- coding: utf-8 -*-
"""scenes_ch1.py — peintres du chapitre I (seg01 → seg14 + quiz)."""
from __future__ import annotations

import math
from PIL import Image, ImageDraw
from viz import (W, H, CREAM, CREAM_D, INK, INK_SOFT, WHITE, TEAL, TEAL_D, TEAL_L,
                 CORAL, CORAL_D, CORAL_L, VIOLET, VIOLET_D, VIOLET_L, GOLD, GREEN,
                 GREEN_L, RED, GREY, GREY_L, font, text_size, wrap, rrect, panel,
                 new_rgba, text_img, quote_card, cat_sprite, professeur, Track,
                 Mover, clamp, lerp, ease_io, ease_out, pulse, Scene)
from scenes_common import (face_img, tree_img, ghost_cats, tableau_img, quiz_scene,
                           TAB_BOX)


def chip_img(label, fg, bg, size=34, kind="serif", outline=None, pad=(24, 12)):
    f = font(kind, size)
    tmp = ImageDraw.Draw(new_rgba(8, 8))
    w, _ = text_size(tmp, label, f)
    asc, desc = f.getmetrics()
    h = asc + desc
    img = new_rgba(int(w) + pad[0] * 2, h + pad[1] * 2)
    d = ImageDraw.Draw(img)
    rrect(d, [0, 0, img.width - 1, img.height - 1], 14, fill=bg + (255,),
          outline=(outline or fg) + (255,), width=2)
    d.text((pad[0], pad[1]), label, font=f, fill=fg + (255,))
    return img


def s01(spec, sc):
    sc.base = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(sc.base)
    d.rectangle([0, 0, W, 10], fill=TEAL)
    d.rectangle([0, H - 10, W, H], fill=TEAL)
    ti, _ = text_img("LES ACTUALISATEURS\nDU SUBSTANTIF", kind="serif", size=96,
                     color=INK, align="center", lh=1.2)
    sc.add(Track(ti, ((W - ti.width) // 2, 150), 0.4, appear="fade", dur_appear=1.0))
    st, _ = text_img("Le passage du virtuel au réel", kind="serif", size=44, color=TEAL_D)
    sc.add(Track(st, ((W - st.width) // 2, 400), 1.4, appear="slide_up"))
    cartes = [("I", "Actualisation, nombre,\ntableau, indéfini", TEAL),
              ("II", "Défini, partitif,\npossessifs, démonstratifs", CORAL),
              ("III", "Relatifs, interrogatifs,\nindéfinis, numéraux", VIOLET)]
    for i, (num, txt, acc) in enumerate(cartes):
        ci = new_rgba(430, 250)
        cd = ImageDraw.Draw(ci)
        rrect(cd, [0, 0, 429, 249], 22, fill=WHITE + (255,), outline=acc + (255,), width=4)
        cd.ellipse([26, 26, 106, 106], fill=acc + (255,))
        cd.text((66, 66), num, font=font("serif", 44), fill=WHITE + (255,), anchor="mm")
        for li, l in enumerate(txt.split("\n")):
            cd.text((30, 130 + li * 42), l, font=font("sans", 30), fill=INK + (255,))
        sc.add(Track(ci, (215 + i * 480, 520), 2.6 + i * 0.5, appear="slide_up", slide=(0, 60)))
    sc.add(Mover(cat_sprite(150), (-200, 830), (500, 830), 4.6, 7.4))
    lab, _ = text_img("… notre fil rouge", kind="sans", size=30, color=TEAL_D)
    sc.add(Track(lab, (520, 880), 7.4, appear="fade"))
    pr = professeur(430)
    sc.base.alpha_composite(pr, (W - 120 - pr.width, H - 60 - pr.height))
    sc.commit()
    return sc


def s02(spec, sc):
    d = ImageDraw.Draw(sc.base)
    panel(sc.base, (120, 190, 760, 830), fill=WHITE, outline=GREY, width=2)
    panel(sc.base, (1040, 190, 1800, 830), fill=WHITE, outline=GREY, width=2)
    d.text((440, 230), "LEXIQUE", font=font("monob", 34), fill=INK_SOFT, anchor="mm")
    d.text((440, 275), "plan paradigmatique", font=font("mono", 24), fill=GREY, anchor="mm")
    d.text((1420, 230), "CHAÎNE PARLÉE", font=font("monob", 34), fill=TEAL_D, anchor="mm")
    d.text((1420, 275), "plan syntagmatique", font=font("mono", 24), fill=GREY, anchor="mm")
    mots = ["table", "chat", "arbre", "mer", "liberté"]
    left_pos = {}
    for i, m in enumerate(mots):
        ci = chip_img(m, INK_SOFT, GREY_L, size=36, kind="serif", outline=GREY)
        left_pos[m] = (200, 330 + i * 96)
        sc.add(Track(ci, left_pos[m], 0.4 + i * 0.3, appear="fade"))

    def fleche(img, t):
        p = ease_io(clamp((t - 2.6) / 1.2))
        if p <= 0:
            return
        dd = ImageDraw.Draw(img)
        x1 = 800 + int(220 * p)
        dd.line([800, 510, x1, 510], fill=TEAL, width=10)
        if p > 0.9:
            dd.polygon([(x1 + 26, 510), (x1 - 6, 492), (x1 - 6, 528)], fill=TEAL)
            dd.text((910, 460), "ACTUALISATION", font=font("monob", 30), fill=TEAL_D, anchor="mm")
    sc.dyn_fn(fleche)
    phrase = [("Le", CORAL_D, CORAL_L, "serif"), ("chat", INK, GREY_L, "serif"),
              ("suit", INK_SOFT, CREAM, "sans"), ("un", CORAL_D, CORAL_L, "serif"),
              ("chemin", INK, GREY_L, "serif"), (".", INK_SOFT, CREAM, "sans")]
    chips = [(w_, chip_img(w_, fg, bg, size=40, kind=k,
                           outline=GREY if bg == CREAM else None))
             for w_, fg, bg, k in phrase]
    x = 1065
    slot = {}
    for w_, ci in chips:
        slot[w_] = (x, 560)
        x += ci.width + 16
    for i, (w_, ci) in enumerate(chips):
        if w_ in left_pos:
            t_arr = 4.4 + 0.5 * (w_ == "chemin")
            sc.add(Mover(ci, left_pos[w_], slot[w_], t_arr, t_arr + 1.8, fade=0.25))
            sc.add(Track(ci, slot[w_], t_arr + 1.7, appear="fade", dur_appear=0.3))
        else:
            sc.add(Track(ci, slot[w_], 5.4 + i * 0.2, appear="fade"))

    def syn(img, t):
        a = clamp((t - 7.2) / 0.8)
        if a <= 0:
            return
        dd = ImageDraw.Draw(img)
        xs = [slot[w_][0] for w_, _ in chips]
        for i in range(len(xs) - 1):
            dd.arc([xs[i] - 10, 470, xs[i + 1] + 60, 640], 200, 340,
                   fill=TEAL + (int(180 * a),), width=4)
        lb, _ = text_img("ordre imposé par la syntaxe", kind="mono", size=26, color=TEAL_D)
        lb.putalpha(lb.getchannel("A").point(lambda v: int(v * a)))
        img.alpha_composite(lb, (1150, 700))
    sc.dyn_fn(syn)
    return sc


def s03(spec, sc):
    panel(sc.base, (130, 200, 900, 860), fill=WHITE, outline=TEAL, width=3)
    panel(sc.base, (1010, 200, 1780, 860), fill=WHITE, outline=CORAL, width=3)
    sc.add(Track(tree_img(300, "virtuel"), (330, 250), 0.5, appear="fade"))
    sc.add(Track(tree_img(300, "reel"), (1300, 250), 0.9, appear="fade"))
    sc.add(Track(quote_card("L'arbre est le plus bel ornement de tout jardin.", "", "[1]",
                            TEAL, width=700, size=32), (200, 600), 1.6, appear="slide_up"))
    sc.add(Track(quote_card("Cet arbre reste vert en toute saison.", "", "[2]",
                            CORAL, width=700, size=32), (1050, 600), 2.2, appear="slide_up"))
    sc.add(Track(chip_img("VIRTUEL  ·  la notion", TEAL_D, TEAL_L, size=30, kind="monob"),
                 (250, 790), 3.0, appear="fade"))
    sc.add(Track(chip_img("RÉEL  ·  l'individu", CORAL_D, CORAL_L, size=30, kind="monob"),
                 (1160, 790), 3.4, appear="fade"))

    def arrow(img, t):
        p = ease_io(clamp((t - 4.4) / 1.0))
        if p <= 0:
            return
        dd = ImageDraw.Draw(img)
        x1 = 915 + int(80 * p)
        dd.line([915, 400, x1, 400], fill=INK, width=8)
        if p > 0.9:
            dd.polygon([(x1 + 20, 400), (x1 - 4, 386), (x1 - 4, 414)], fill=INK)
        dd.text((955, 350), "RÉALISATION", font=font("monob", 26), fill=INK, anchor="mm")
    sc.dyn_fn(arrow)
    return sc


def s04(spec, sc):
    phrases = [("∅", "chat échaudé craint l'eau froide.", TEAL, TEAL_L, "[3]"),
               ("Un", "chat échaudé craint l'eau froide.", CORAL, CORAL_L, "[4]"),
               ("Le", "chat échaudé craint l'eau froide.", GOLD, (246, 236, 214), "[5]")]
    for i, (det, rest, fg, bg, num) in enumerate(phrases):
        y = 230 + i * 130
        ci = chip_img(det, fg if fg != GOLD else (140, 104, 26), bg, size=44, kind="serif")
        sc.add(Track(ci, (240, y), 0.5 + i * 0.7, appear="slide_left", slide=(70, 0)))
        ti, _ = text_img(rest, kind="serif", size=44, color=INK)
        sc.add(Track(ti, (240 + ci.width + 20, y + 6), 0.7 + i * 0.7, appear="fade"))
        ni, _ = text_img(num, kind="mono", size=28, color=GREY)
        sc.add(Track(ni, (170, y + 14), 0.5 + i * 0.7, appear="fade"))
    t0 = spec["dur"] - 9
    sc.add(Track(chip_img("le  =  un  =  ∅", CORAL_D, CORAL_L, size=40, kind="monob"),
                 (300, 660), t0, appear="slide_up"))
    sc.add(Track(chip_img("sing.  =  plur.", TEAL_D, TEAL_L, size=40, kind="monob"),
                 (760, 660), t0 + 0.6, appear="slide_up"))
    lab, _ = text_img("dans le virtuel, l'article et le nombre sont neutralisés",
                      kind="sans", size=32, color=INK_SOFT)
    sc.add(Track(lab, (300, 760), t0 + 1.2, appear="fade"))
    return sc


def s05(spec, sc):
    d = ImageDraw.Draw(sc.base)
    x0, y0, x1, y1 = 140, 220, 1660, 800
    mid = (x0 + x1) // 2
    d.rectangle([x0, y0, mid, y1], fill=TEAL_L)
    d.rectangle([mid, y0, x1, y1], fill=(250, 246, 236))
    rrect(d, [x0, y0, x1, y1], 20, outline=INK, width=3)
    d.text(((x0 + mid) / 2, y0 + 50), "VIRTUEL", font=font("monob", 40), fill=TEAL_D, anchor="mm")
    d.text(((mid + x1) / 2, y0 + 50), "RÉEL", font=font("monob", 40), fill=CORAL_D, anchor="mm")

    def barriere(img, t):
        p = ease_io(clamp((t - 1.0) / 1.0))
        if p <= 0:
            return
        dd = ImageDraw.Draw(img)
        yy2 = y0 - 20 + int((y1 - y0 + 60) * p)
        dd.line([mid, y0 - 20, mid, yy2], fill=RED, width=10)
        if p > 0.95:
            dd.text((mid, y1 + 46), "BARRIÈRE DU NOMBRE", font=font("monob", 30),
                    fill=RED, anchor="mm")
    sc.dyn_fn(barriere)
    sc.add(Track(ghost_cats(3, 170), (250, 380), 2.2, appear="fade", dur_appear=1.2))
    gl, _ = text_img("chat, -s : le nombre\nne signifie rien", kind="mono", size=26, color=TEAL_D)
    sc.add(Track(gl, (250, 610), 3.0, appear="fade"))
    for lab, i in [("un chat", 0), ("des chats", 1), ("le chat", 2), ("les chats", 3)]:
        ci = chip_img(lab, CORAL_D if i < 2 else (140, 104, 26),
                      CORAL_L if i < 2 else (246, 236, 214), size=38, kind="serif")
        sc.add(Track(ci, (mid + 130 + (i % 2) * 330, 330 + (i // 2) * 170),
                     3.6 + i * 0.45, appear="slide_up"))
    sl, _ = text_img("sing. ≠ plur. :\nl'opposition signifie", kind="mono", size=26, color=CORAL_D)
    sc.add(Track(sl, (mid + 430, 660), 5.6, appear="fade"))
    sc.add(Mover(cat_sprite(140), (330, 420), (mid + 20, 590), 7.0, 9.2))

    def caption(img, t):
        a = clamp((t - (spec["dur"] - 8)) / 0.8)
        if a <= 0:
            return
        ci, _ = text_img("Franchir la barrière du nombre, c'est réaliser le substantif.",
                         kind="serif", size=38, color=INK)
        ci.putalpha(ci.getchannel("A").point(lambda v: int(v * a)))
        img.alpha_composite(ci, ((W - ci.width) // 2, 880))
    sc.dyn_fn(caption)
    return sc


def s06(spec, sc):
    panel(sc.base, (130, 200, 880, 620), fill=WHITE, outline=TEAL, width=3)
    panel(sc.base, (1000, 200, 1780, 860), fill=WHITE, outline=CORAL, width=3)
    d = ImageDraw.Draw(sc.base)
    d.text((505, 240), "ANCIEN FRANÇAIS", font=font("monob", 32), fill=TEAL_D, anchor="mm")
    d.text((505, 285), "simple et cohérent", font=font("mono", 24), fill=GREY, anchor="mm")
    sc.add(Track(chip_img("virtuel → ∅\narticle zéro", TEAL_D, TEAL_L, size=30, kind="monob"),
                 (200, 350), 0.8, appear="fade"))
    sc.add(Track(chip_img("réel → article", CORAL_D, CORAL_L, size=30, kind="monob"),
                 (200, 480), 1.3, appear="fade"))
    d.text((1390, 240), "FRANÇAIS MODERNE", font=font("monob", 32), fill=CORAL_D, anchor="mm")
    d.text((1390, 285), "l'article accompagne partout", font=font("mono", 24), fill=GREY, anchor="mm")
    t1, _ = text_img("Le degré zéro ne résiste que là où il assure une opposition\nsémantique pertinente :", kind="sans", size=30, color=INK)
    sc.add(Track(t1, (1050, 330), 2.2, appear="fade"))
    res = ["avoir peur", "demander grâce", "voyager sans billet",
           "Toulouse, ville du Midi", "bonne renommée vaut mieux que ceinture dorée"]
    for i, r in enumerate(res):
        sc.add(Track(chip_img(r, INK, CREAM_D, size=28, kind="serif", outline=GREY),
                     (1050 + (i % 2) * 370, 450 + (i // 2) * 90), 3.2 + i * 0.5,
                     appear="slide_up"))
    return sc


def s07(spec, sc):
    pos = (TAB_BOX[0] - 20, TAB_BOX[1] - 34)
    imgs = [tableau_img(act=1, row=i) for i in range(4)]
    sc.add(Track(imgs[0], pos, 0.5, appear="fade", dur_appear=0.8))
    for i in range(1, 4):
        sc.add(Track(imgs[i], pos, 0.5 + i * (spec["dur"] - 3) / 5, appear="fade",
                     dur_appear=0.5))
    lab, _ = text_img("Quatre familles du côté du réel…", kind="sans", size=34, color=INK_SOFT)
    sc.add(Track(lab, (150, 850), spec["dur"] - 4, appear="fade"))
    return sc


def s08(spec, sc):
    ex = ["J'aperçois dans le jardin un chien et des chats.",
          "Tiens ! le chien poursuit les chats.",
          "Mais c'est mon chien !",
          "Ce chien est bien méchant !"]
    hl = ["un", "le", "mon", "Ce"]
    step = (spec["dur"] - 6) / 4
    for i in range(4):
        sc.add(Track(tableau_img(act=2, col=i), (TAB_BOX[0] - 20, TAB_BOX[1] - 34),
                     0.4 + i * step, appear="fade", dur_appear=0.5))
        ei, pb = text_img(ex[i], kind="serif", size=42, color=INK, hl=hl[i], hl_color=CORAL)
        sc.add(Track(ei, (150, 828), 0.9 + i * step, appear="slide_up",
                     t1=0.9 + (i + 1) * step + 0.2, pulse_box=pb, pulse_color=CORAL))
    return sc


def s09(spec, sc):
    sc.add(Track(tableau_img(act=3, examples=True), (TAB_BOX[0] - 20, TAB_BOX[1] - 34),
                 0.4, appear="fade", dur_appear=1.0))
    t_photo = spec["dur"] - 8

    def photo(img, t):
        if t < t_photo:
            return
        dd = ImageDraw.Draw(img)
        k = 0.5 + 0.5 * pulse(t - t_photo, 0.8)
        ci = chip_img("Photographiez ce tableau !", INK, (246, 236, 214), size=34, kind="sansb")
        img.alpha_composite(ci, (1150, 850))
        dd.rounded_rectangle([1140, 840, 1150 + ci.width + 10, 850 + ci.height + 10],
                             18, outline=RED + (int(120 + 120 * k),), width=5)
    sc.dyn_fn(photo)
    return sc


def s10(spec, sc):
    d1, _ = text_img("Article de l'ABSENCE DE NOTORIÉTÉ :\nun objet réel mais mal défini,\npas encore nettement identifié.",
                     kind="sans", size=34, color=INK)
    sc.add(Track(d1, (150, 220), 0.5, appear="fade"))
    sc.add(Track(chip_img("valeur de PRÉSENTATION", CORAL_D, CORAL_L, size=34, kind="monob"),
                 (150, 420), 1.6, appear="slide_up"))
    sc.add(Track(quote_card("Un jeune homme de dix-huit ans, à longs cheveux et qui tenait un album sous le bras, restait auprès du gouvernail, immobile.",
                            "Flaubert", "L'Éducation sentimentale", CORAL, width=1050, size=36),
                 (760, 230), 2.6, appear="slide_up"))
    d2, _ = text_img("Mais aussi : substantif actualisé, NON réalisé\n→ notion, concept, catégorie.",
                     kind="sans", size=32, color=INK)
    sc.add(Track(d2, (150, 540), spec["dur"] - 12, appear="fade"))
    sc.add(Track(chip_img("valeur GÉNÉRALISANTE", TEAL_D, TEAL_L, size=34, kind="monob"),
                 (150, 700), spec["dur"] - 10, appear="slide_up"))
    sc.add(Track(quote_card("Une femme séduite par des idées !", "Léautaud", "[8]", TEAL,
                            width=700, size=34), (760, 640), spec["dur"] - 9, appear="slide_up"))
    return sc


def s11(spec, sc):
    sc.add(Track(quote_card("… on ne saurait être écrivain sans devenir illustre.",
                            "Sartre", "Les Mots [9] — sans article : qualification", GREY,
                            width=1500, size=34), (180, 210), 0.6, appear="slide_up"))
    sc.add(Track(quote_card("… pour me sentir, front soucieux, regard halluciné, un écrivain.",
                            "Sartre", "Les Mots [10] — article : individualité", CORAL,
                            width=1500, size=34), (180, 420), 4.5, appear="slide_up"))
    sc.add(Track(quote_card("Ils montrent une face humaine, et en effet ils sont des hommes.",
                            "La Bruyère", "[11]", CORAL, width=1500, size=34),
                 (180, 630), 9.0, appear="slide_up"))
    lab, _ = text_img("valeur SPÉCIFIANTE : l'article transforme la qualification en individualité",
                      kind="sansb", size=32, color=CORAL_D)
    sc.add(Track(lab, (180, 850), 12.0, appear="fade"))
    return sc


def s12(spec, sc):
    tons = [("admiration", "ADMIRATION"), ("ironie", "IRONIE"), ("joie", "QUANTITÉ")]
    for i, (k, lab) in enumerate(tons):
        x = 170 + i * 520
        panel(sc.base, (x, 220, x + 470, 560), fill=WHITE, outline=GREY, width=2)
        sc.add(Track(face_img(k, 120, INK), (x + 175, 250), 0.6 + i * 0.8, appear="slide_up"))
        pi, _ = text_img("Un monde !", kind="serif", size=44, color=INK)
        sc.add(Track(pi, (x + 130, 400), 0.9 + i * 0.8, appear="fade"))
        sc.add(Track(chip_img(lab, TEAL_D if i != 1 else CORAL_D,
                              TEAL_L if i != 1 else CORAL_L, size=26, kind="monob"),
                     (x + 140, 480), 1.2 + i * 0.8, appear="fade"))
    lab, _ = text_img("même phrase, trois tons, trois sens", kind="sans", size=30, color=INK_SOFT)
    sc.add(Track(lab, (640, 600), 3.6, appear="fade"))
    sc.add(Track(quote_card("Maître Corbeau sur un arbre perché tenait en son bec un fromage… Il ouvre un large bec…",
                            "La Fontaine", "[12] — le notoire redevient transitoire", GOLD,
                            width=1500, size=34), (180, 700), spec["dur"] - 12,
                 appear="slide_up"))
    return sc


def s13(spec, sc):
    sc.add(Track(quote_card("La ville s'était parée d'un manteau blanc qui ne favorisa pas une intense circulation sur la RN 20.",
                            "F. Bar", "Le Français moderne, 1969 [13]", RED, width=1500, size=38),
                 (180, 260), 0.6, appear="slide_up"))
    sc.add(Track(chip_img("abus : l'indéfini ne paie pas sa place", RED, (243, 224, 216),
                          size=34, kind="monob"), (180, 560), 3.0, appear="slide_up"))
    lab, _ = text_img("Or le contexte marque que la circulation fut intense :\nil fallait « la » (notoire) ou « une » était de trop.",
                      kind="sans", size=32, color=INK)
    sc.add(Track(lab, (180, 680), 5.0, appear="fade"))
    return sc


def s14(spec, sc):
    ti, _ = text_img("Travaux pratiques — chapitre I", kind="serif", size=52, color=TEAL_D)
    sc.add(Track(ti, (150, 200), 0.4, appear="fade"))
    qs = ["Un soldat français ignore la fatigue.",
          "Je suis allé au stade hier : un monde ! un match !",
          "Maître Corbeau sur un arbre perché tenait en son bec un fromage."]
    for i, q in enumerate(qs):
        panel(sc.base, (150, 320 + i * 170, 1650, 320 + i * 170 + 140), fill=WHITE,
              outline=TEAL, width=2)
        d = ImageDraw.Draw(sc.base)
        d.ellipse([180, 350 + i * 170, 250, 420 + i * 170], fill=TEAL)
        d.text((215, 385 + i * 170), str(i + 1), font=font("sansb", 36), fill=WHITE, anchor="mm")
        qi, _ = text_img(q, kind="serif", size=36, color=INK, maxw=1250)
        sc.add(Track(qi, (290, 355 + i * 170), 1.0 + i * 3.2, appear="slide_left"))
    return sc


QUIZ_CH1 = [
    dict(n=1, sentence="Un soldat français ignore la fatigue.",
         options=["valeur de présentation", "valeur généralisante",
                  "valeur spécifiante", "valeur possessive"],
         good=1, explain="Tout soldat, donc tous : du particulier au général — une maxime ; « un » vaut « tout »."),
    dict(n=2, sentence="Je suis allé au stade hier : un monde ! un match !",
         options=["notoriété", "partitif", "emphase de quantité", "article zéro"],
         good=2, explain="L'exclamation et le ton disent la quantité : « un monde ! » = beaucoup de monde."),
    dict(n=3, sentence="Maître Corbeau sur un arbre perché tenait en son bec un fromage.",
         options=["remplacement du notoire par le transitoire", "valeur possessive",
                  "refus du nombre", "interrogatif"],
         good=0, explain="L'arbre et le bec, connus du conte, redeviennent « un » arbre, « un » bec : jeu stylistique."),
]

PAINTERS_CH1 = {"s01": s01, "s02": s02, "s03": s03, "s04": s04, "s05": s05,
                "s06": s06, "s07": s07, "s08": s08, "s09": s09, "s10": s10,
                "s11": s11, "s12": s12, "s13": s13, "s14": s14}
