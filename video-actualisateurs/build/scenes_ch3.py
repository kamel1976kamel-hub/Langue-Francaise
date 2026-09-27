# -*- coding: utf-8 -*-
"""scenes_ch3.py — peintres du chapitre III (seg27 → seg32 + quiz) et clôture
(s33 synthèse, s34 à retenir)."""
from __future__ import annotations

import math
from PIL import Image, ImageDraw
from viz import (W, H, CREAM, CREAM_D, INK, INK_SOFT, WHITE, TEAL, TEAL_D, TEAL_L,
                 CORAL, CORAL_D, CORAL_L, VIOLET, VIOLET_D, VIOLET_L, GOLD, GREEN,
                 GREEN_L, RED, GREY, GREY_L, font, text_size, wrap, rrect, panel,
                 new_rgba, text_img, quote_card, cat_sprite, professeur, Track,
                 Mover, clamp, lerp, ease_io, ease_out, pulse, Scene)
from scenes_common import face_img, heart_img, quiz_scene, TAB_BOX
from scenes_ch1 import chip_img


# ------------------------------------------------------------------ s27 ------
def s27(spec, sc):
    lab, _ = text_img("adjectif RELATIF = « quel » + article défini", kind="monob",
                      size=32, color=VIOLET_D)
    sc.add(Track(lab, (150, 190), 0.5, appear="fade"))
    forms = ["lequel", "laquelle", "lesquels", "lesquelles"]
    for i, fo in enumerate(forms):
        sc.add(Track(chip_img(fo, VIOLET_D, VIOLET_L, size=34, kind="monob"),
                     (150 + i * 300, 270), 1.0 + i * 0.4, appear="slide_up"))
    prep = ["auquel", "duquel", "auxquels", "desquels", "à laquelle", "de laquelle",
            "auxquelles", "desquelles"]
    for i, fo in enumerate(prep):
        sc.add(Track(chip_img(fo, INK_SOFT, GREY_L, size=24, kind="monob", outline=GREY),
                     (150 + (i % 4) * 300, 370 + (i // 4) * 70), 2.8 + i * 0.2,
                     appear="fade"))
    sc.add(Track(quote_card("J'ai parfaitement reconnu cet homme, lequel homme est un individu déjà célèbre par ses méfaits.",
                            "", "[1] le relatif rattache la proposition au substantif déjà exprimé",
                            VIOLET, width=1500, size=34), (150, 540), 5.0,
                 appear="slide_up"))
    sc.add(Track(chip_img("réalise le substantif comme un démonstratif", VIOLET_D,
                          VIOLET_L, size=30, kind="monob"), (150, 760), 7.0,
                 appear="slide_up"))
    sc.add(Track(chip_img("emploi : langue administrative · « auquel cas » · ailleurs archaïsant",
                          INK, CREAM_D, size=26, kind="sans"), (700, 760), 8.0,
                 appear="fade"))
    return sc


# ------------------------------------------------------------------ s28 ------
def s28(spec, sc):
    lab, _ = text_img("adjectif INTERROGATIF = les mêmes formes, MOINS l'article",
                      kind="monob", size=32, color=VIOLET_D)
    sc.add(Track(lab, (150, 190), 0.5, appear="fade"))
    for i, fo in enumerate(["quel", "quelle", "quels", "quelles"]):
        sc.add(Track(chip_img(fo, VIOLET_D, VIOLET_L, size=34, kind="monob"),
                     (150 + i * 260, 260), 1.0 + i * 0.3, appear="slide_up"))
    cartes = [("Quelle maison voyez-vous ?", "[2] rattaché au nom", 3.0, (150, 380)),
              ("Quel est cet homme ?", "[3] attribut", 4.0, (930, 380)),
              ("Quel homme !", "[4] exclamatif : réalisation forte", 5.0, (150, 620)),
              ("Dans l'Orient désert quel devint mon ennui !", "Racine · [5] attribut exclamatif", 6.2, (930, 620))]
    for txt, work, t0, pos in cartes:
        sc.add(Track(quote_card(txt, "", work, VIOLET, width=740, size=32), pos, t0,
                     appear="slide_up"))
    lab2, _ = text_img("on questionne sur l'existence ou l'identité → pas de réalisation achevée",
                       kind="sans", size=28, color=INK_SOFT)
    sc.add(Track(lab2, (150, 880), 8.0, appear="fade"))
    return sc


# ------------------------------------------------------------------ s29 ------
def s29(spec, sc):
    panel(sc.base, (140, 190, 1780, 700), fill=WHITE, outline=VIOLET, width=3)
    d = ImageDraw.Draw(sc.base)
    cols = [("une seule forme", ["chaque (sing.)", "plusieurs (plur.)"]),
            ("genre, pas de nombre", ["divers / diverses", "pas un / pas une"]),
            ("nombre, pas de genre", ["autre / autres", "même / mêmes",
                                      "quelconque / -ques", "quelque / quelques"]),
            ("genre ET nombre", ["aucun · certain · maint", "nul · quel · tel · tout"])]
    for c, (titre, items) in enumerate(cols):
        x = 180 + c * 400
        d.text((x, 230), titre, font=font("monob", 24), fill=VIOLET_D)
        for i, it in enumerate(items):
            sc.add(Track(chip_img(it, INK, GREY_L if c < 3 else VIOLET_L, size=24,
                                  kind="monob", outline=GREY if c < 3 else VIOLET),
                         (x, 280 + i * 76), 0.8 + c * 0.8 + i * 0.25, appear="fade"))
    lab, _ = text_img("catégorie peu homogène : les nuances les plus floues de la détermination (Grammaire Larousse, § 409)",
                      kind="sans", size=26, color=INK_SOFT, maxw=1560)
    sc.add(Track(lab, (180, 620), 4.5, appear="fade"))
    autres = ["assez de, beaucoup de, trop de", "quantité de, nombre de, force",
              "je ne sais quel, n'importe quel", "je ne sais trop combien de [6]"]
    for i, a in enumerate(autres):
        sc.add(Track(chip_img(a, INK_SOFT, CREAM_D, size=24, kind="serif", outline=GREY),
                     (150 + (i % 2) * 800, 740 + (i // 2) * 80), 6.0 + i * 0.5,
                     appear="slide_up"))
    return sc


# ------------------------------------------------------------------ s30 ------
def s30(spec, sc):
    g = [("individualité indéterminée", "certain"), ("quantité", "nul, maint"),
         ("identité / ressemblance / différence", "même, tel, autre")]
    for i, (grp, ex) in enumerate(g):
        sc.add(Track(chip_img(f"{grp}  →  {ex}", VIOLET_D, VIOLET_L, size=26,
                              kind="monob"), (150 + i * 540, 190), 0.6 + i * 0.6,
                     appear="slide_up"))
    lab, _ = text_img("classement sémantique de Grevisse (Le Bon Usage, § 445) : commode, mais fragile",
                      kind="sans", size=28, color=INK_SOFT)
    sc.add(Track(lab, (150, 280), 2.6, appear="fade"))
    sc.add(Track(quote_card("Je vois toute la maison  (= entièrement).", "",
                            "[7] tout + article = qualificatif", CORAL, width=740, size=34),
                 (150, 380), 4.0, appear="slide_up"))
    sc.add(Track(quote_card("Je vois toutes les maisons  (pas nécessairement entièrement).",
                            "", "[8]", CORAL, width=740, size=34), (930, 380), 5.0,
                 appear="slide_up"))
    sc.add(Track(chip_img("sans article : tout homme = faible réalisation", TEAL_D,
                          TEAL_L, size=26, kind="monob"), (150, 640), 6.5, appear="fade"))
    sc.add(Track(chip_img("toutes taxes comprises = toutes les taxes", TEAL_D, TEAL_L,
                          size=26, kind="monob"), (700, 640), 7.1, appear="fade"))
    lab2, _ = text_img("un classement sémantique devrait les séparer : morcellement… indéfini",
                       kind="serif", size=34, color=VIOLET_D)
    sc.add(Track(lab2, (150, 780), 8.5, appear="slide_up"))
    return sc


# ------------------------------------------------------------------ s31 ------
def s31(spec, sc):
    panel(sc.base, (140, 190, 900, 620), fill=WHITE, outline=GREY, width=3)
    panel(sc.base, (960, 190, 1780, 620), fill=WHITE, outline=VIOLET, width=3)
    d = ImageDraw.Draw(sc.base)
    d.text((520, 230), "ORDINAUX = qualificatifs", font=font("monob", 26),
           fill=INK_SOFT, anchor="mm")
    d.text((1370, 230), "CARDINAUX = accompagnateurs", font=font("monob", 26),
           fill=VIOLET_D, anchor="mm")
    for i, t in enumerate(["premier, second, troisième…", "mêmes caractères morphologiques",
                           "idée d'ordre, de classement"]):
        sc.add(Track(chip_img(t, INK_SOFT, GREY_L, size=26, kind="sans", outline=GREY),
                     (180, 280 + i * 90), 0.8 + i * 0.5, appear="fade"))
    for i, t in enumerate(["un, deux, trois… (genre : sauf « un »)",
                           "nombre infini = fait de lexique",
                           "valeur de réalisation nulle"]):
        sc.add(Track(chip_img(t, VIOLET_D, VIOLET_L, size=26, kind="sans"),
                     (1000, 280 + i * 90), 2.3 + i * 0.5, appear="fade"))
    sc.add(Track(quote_card("Mettez deux enfants ensemble, vous avez une petite guerre.",
                            "", "[9] virtuel", TEAL, width=740, size=30), (140, 660), 4.5,
                 appear="slide_up"))
    sc.add(Track(quote_card("Je vois deux enfants dans le parc.", "", "[10] réel", CORAL,
                            width=740, size=30), (920, 660), 5.5, appear="slide_up"))
    sc.add(Track(chip_img("cardinal pour ordinal → épithète : Louis le quatorzième · nous sommes le huit [11][12]",
                          INK, CREAM_D, size=26, kind="sans"), (140, 900), 7.5,
                 appear="slide_up"))
    return sc


# ------------------------------------------------------------------ s32 ------
def s32(spec, sc):
    ti, _ = text_img("Travaux pratiques — chapitre III", kind="serif", size=52,
                     color=VIOLET_D)
    sc.add(Track(ti, (150, 200), 0.4, appear="fade"))
    qs = ["Chaque chose à sa place.",
          "Est-il aucun sentier qui conduise au village ?",
          "Nous sommes le huit."]
    for i, q in enumerate(qs):
        panel(sc.base, (150, 320 + i * 170, 1650, 320 + i * 170 + 140), fill=WHITE,
              outline=VIOLET, width=2)
        d = ImageDraw.Draw(sc.base)
        d.ellipse([180, 350 + i * 170, 250, 420 + i * 170], fill=VIOLET)
        d.text((215, 385 + i * 170), str(i + 1), font=font("sansb", 36), fill=WHITE, anchor="mm")
        qi, _ = text_img(q, kind="serif", size=36, color=INK, maxw=1250)
        sc.add(Track(qi, (290, 355 + i * 170), 1.0 + i * 2.6, appear="slide_left"))
    return sc


# ------------------------------------------------------------------ s33 ------
def s33(spec, sc):
    sc.base = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(sc.base)
    d.rectangle([0, 0, W, 118], fill=CREAM)
    d.rectangle([0, 116, W, 120], fill=INK)
    d.text((60, 34), "SYNTHÈSE", font=font("monob", 26), fill=INK_SOFT)
    d.text((60, 66), "Le système complet en un schéma", font=font("serif", 40), fill=INK)
    # zone virtuel / barrière / réel
    d.rectangle([100, 200, 560, 780], fill=TEAL_L)
    d.rectangle([560, 200, 1820, 780], fill=(250, 246, 236))
    rrect(d, [100, 200, 1820, 780], 20, outline=INK, width=3)
    d.line([560, 180, 560, 800], fill=RED, width=10)
    d.text((330, 240), "VIRTUEL", font=font("monob", 36), fill=TEAL_D, anchor="mm")
    d.text((1190, 240), "RÉEL", font=font("monob", 36), fill=CORAL_D, anchor="mm")
    d.text((560, 830), "BARRIÈRE DU NOMBRE", font=font("monob", 28), fill=RED, anchor="mm")
    virt = ["degré zéro (proverbes)", "généralités neutralisées"]
    for i, t in enumerate(virt):
        sc.add(Track(chip_img(t, TEAL_D, WHITE, size=26, kind="sans"), (140, 300 + i * 90),
                     0.8 + i * 0.5, appear="fade"))
    reel = [("un, des", "présente"), ("le, les", "notoire"), ("du, des", "partitif"),
            ("mon, ma", "possesseur"), ("ce, cet", "geste"),
            ("lequel", "reprend"), ("quel ?", "questionne"),
            ("chaque", "mesure"), ("deux, trois", "compte")]
    for i, (fo, val) in enumerate(reel):
        x = 610 + (i % 3) * 400
        y = 290 + (i // 3) * 160
        ci = chip_img(f"{fo}  →  {val}", CORAL_D if i < 5 else VIOLET_D,
                      CORAL_L if i < 5 else VIOLET_L, size=28, kind="monob")
        sc.add(Track(ci, (x, y), 2.0 + i * 0.55, appear="slide_up"))
    sc.add(Mover(cat_sprite(120), (200, 620), (620, 640), 8.0, 10.0))
    lab, _ = text_img("Un même substantif, dix manières d'exister dans le discours.",
                      kind="serif", size=40, color=INK)
    sc.add(Track(lab, ((W - lab.width) // 2, 900), 10.5, appear="fade"))
    sc.commit()
    return sc


# ------------------------------------------------------------------ s34 ------
def s34(spec, sc):
    ti, _ = text_img("À RETENIR", kind="monob", size=56, color=TEAL_D)
    sc.add(Track(ti, (150, 170), 0.3, appear="fade"))
    puces = [
        "1 · L'actualisation : du lexique à la chaîne parlée.",
        "2 · La réalisation : du virtuel au réel — le nombre en est la condition.",
        "3 · Chaque actualisateur a sa valeur de base : présentation, notoriété, possession, localisation.",
        "4 · Le ton et le contexte peuvent renverser ces valeurs.",
        "5 · Le tableau des actualisateurs résume tout le système.",
    ]
    for i, p in enumerate(puces):
        pi, _ = text_img(p, kind="sansb" if i < 2 else "sans", size=34, color=INK)
        sc.add(Track(pi, (190, 280 + i * 92), 0.8 + i * 1.4, appear="slide_left"))
        d = ImageDraw.Draw(sc.base)
    for i in range(5):
        d = ImageDraw.Draw(sc.base)
        d.ellipse([150, 292 + i * 92, 168, 310 + i * 92], fill=TEAL)
    sc.commit()
    merci, _ = text_img("Merci de votre attention.\nÀ bientôt : le chapitre des pronoms.",
                        kind="serif", size=40, color=TEAL_D, lh=1.3)
    sc.add(Track(merci, (190, 780), spec["dur"] - 6.0, appear="slide_up"))
    pr = professeur(360)
    sc.add(Mover(pr, (W - 120 - pr.width, H - 40 - pr.height),
                 (W - 500 - pr.width, H - 60 - pr.height), spec["dur"] - 7.0,
                 spec["dur"] - 5.0))
    return sc


QUIZ_CH3 = [
    dict(n=1, sentence="Chaque chose à sa place.",
         options=["adjectif indéfini, valeur distributive", "adjectif relatif",
                  "numéral cardinal", "possessif"],
         good=0, explain="« chaque » distribue un par un au singulier : adjectif indéfini à valeur distributive."),
    dict(n=2, sentence="Est-il aucun sentier qui conduise au village ?",
         options=["aucun négatif", "aucun = « quelque » (indéfini)", "pronom personnel",
                  "adverbe de quantité"],
         good=1, explain="En contexte interrogatif, « aucun » prend le sens de « quelque » : indéfini, non négatif."),
    dict(n=3, sentence="Nous sommes le huit.",
         options=["cardinal accompagnateur", "cardinal remplaçant l'ordinal",
                  "défini distributif", "numéral virtuel"],
         good=1, explain="le huit = le huitième jour : cardinal employé pour l'ordinal, véritable épithète."),
]

PAINTERS = {"s27": s27, "s28": s28, "s29": s29, "s30": s30, "s31": s31, "s32": s32,
            "s33": s33, "s34": s34}
