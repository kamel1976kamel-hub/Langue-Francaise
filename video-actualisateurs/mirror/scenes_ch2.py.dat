# -*- coding: utf-8 -*-
"""scenes_ch2.py — peintres du chapitre II (seg15 → seg26 + quiz)."""
from __future__ import annotations

import math
from PIL import Image, ImageDraw
from viz import (W, H, CREAM, CREAM_D, INK, INK_SOFT, WHITE, TEAL, TEAL_D, TEAL_L,
                 CORAL, CORAL_D, CORAL_L, VIOLET, VIOLET_D, VIOLET_L, GOLD, GREEN,
                 GREEN_L, RED, GREY, GREY_L, font, text_size, wrap, rrect, panel,
                 new_rgba, text_img, quote_card, cat_sprite, Track, Mover,
                 clamp, lerp, ease_io, ease_out, pulse, Scene)
from scenes_common import (face_img, heart_img, tree_img, ghost_cats, tableau_img,
                           quiz_scene, TAB_BOX)
from scenes_ch1 import chip_img


# ------------------------------------------------------------------ s15 ------
def s15(spec, sc):
    sc.add(Track(chip_img("valeur de base : NOTORIÉTÉ", CORAL_D, CORAL_L, size=36,
                          kind="monob"), (150, 190), 0.5, appear="slide_up"))
    sc.add(Track(quote_card("Le soleil est un fameux quinquet.", "Cendrars", "[1] connu = unique",
                            CORAL, width=740, size=34), (150, 290), 1.5, appear="slide_up"))
    sc.add(Track(quote_card("Le monde est rétréci par notre expérience et l'équateur n'est plus qu'un anneau trop étroit.",
                            "Vigny", "[2] connu = unique", CORAL, width=740, size=30),
                 (930, 290), 2.4, appear="slide_up"))
    sc.add(Track(chip_img("connu / supposé connu du locuteur et du destinataire", INK,
                          CREAM_D, size=28, kind="sans"), (150, 560), 4.0, appear="fade"))
    sc.add(Track(quote_card("Tiens ! le chien poursuit les chats. — Ferme donc la fenêtre.",
                            "", "[3] [4]", CORAL, width=1560, size=34), (150, 650), 5.0,
                 appear="slide_up"))
    lab, _ = text_img("origine : un démonstratif qui désigne ce dont on vient de parler → l'article défini est le degré minimum du démonstratif",
                      kind="sans", size=28, color=INK_SOFT, maxw=900)
    sc.add(Track(lab, (150, 850), 7.0, appear="fade"))
    sc.add(Track(chip_img("Molière : « Ah ! le pendard de Turc, m'assassiner de la façon ! »",
                          CORAL_D, CORAL_L, size=26, kind="serif"), (1080, 860), 8.5,
                 appear="slide_up"))
    return sc


# ------------------------------------------------------------------ s16 ------
def s16(spec, sc):
    cartes = [("Ah ! le beau tableau !", "joie", "laudation", 0.6),
              ("Le méchant bonhomme que voilà !", "ironie", "nuance selon le ton", 1.4),
              ("Oh ! le beau tableau !", "ironie", "antiphrase (= une croûte)", 2.2)]
    for i, (txt, face, lab, t0) in enumerate(cartes):
        x = 150 + i * 540
        panel(sc.base, (x, 210, x + 500, 560), fill=WHITE, outline=CORAL, width=3)
        sc.add(Track(face_img(face, 110, INK), (x + 195, 240), t0, appear="slide_up"))
        ti, _ = text_img(txt, kind="serif", size=34, color=INK, maxw=440, align="center")
        sc.add(Track(ti, (x + (500 - ti.width) // 2, 380), t0 + 0.3, appear="fade"))
        sc.add(Track(chip_img(lab, CORAL_D, CORAL_L, size=24, kind="monob"),
                     (x + 130, 480), t0 + 0.6, appear="fade"))
    sc.add(Track(quote_card("Bravo ! L'admirable réponse !", "", "[8] ironie ou laudation",
                            CORAL, width=1000, size=36), (150, 620), 5.5, appear="slide_up"))
    lab, _ = text_img("valeur démonstrative + emphase : la localisation précise dans l'espace",
                      kind="sans", size=30, color=INK)
    sc.add(Track(lab, (150, 860), 7.0, appear="fade"))
    return sc


# ------------------------------------------------------------------ s17 ------
def s17(spec, sc):
    sc.add(Track(quote_card("Je descends à grands pas vers le bas de la ville, le dos voûté, le cœur vidé, l'esprit fébrile.",
                            "Cendrars", "[10] le défini remplace le possessif", CORAL,
                            width=1560, size=38), (150, 210), 0.6, appear="slide_up"))
    eq = [("le dos  =  mon dos", 3.0), ("le cœur  =  mon cœur", 3.6),
          ("l'esprit  =  mon esprit", 4.2)]
    for i, (t, t0) in enumerate(eq):
        sc.add(Track(chip_img(t, CORAL_D, CORAL_L, size=34, kind="monob"),
                     (150 + i * 480, 560), t0, appear="slide_up"))
    sc.add(Track(chip_img("la voiture = ma voiture ; la femme, la bourgeoise = ma femme",
                          INK, CREAM_D, size=28, kind="sans"), (150, 680), 6.0, appear="fade"))
    lab, _ = text_img("valeur possessive née de l'habitude, entre notoire et localisation",
                      kind="sans", size=30, color=INK_SOFT)
    sc.add(Track(lab, (150, 800), 7.5, appear="fade"))
    return sc


# ------------------------------------------------------------------ s18 ------
def s18(spec, sc):
    sc.add(Track(chip_img("valeur GÉNÉRALISANTE : le défini accompagne le virtuel",
                          TEAL_D, TEAL_L, size=32, kind="monob"), (150, 190), 0.5,
                 appear="slide_up"))
    sc.add(Track(quote_card("La calomnie est un vilain défaut.", "", "[11] catégorie, concept",
                            TEAL, width=700, size=34), (150, 280), 1.5, appear="slide_up"))
    sc.add(Track(quote_card("L'homme, les hommes = le genre humain.", "", "[12]",
                            TEAL, width=700, size=34), (150, 480), 2.5, appear="slide_up"))
    sc.add(Track(chip_img("approximation : jusqu'à la centaine", INK, CREAM_D, size=26,
                          kind="serif"), (150, 690), 4.0, appear="fade"))
    sc.add(Track(chip_img("distributif : Fermé le lundi = chaque lundi", INK, CREAM_D,
                          size=26, kind="serif"), (150, 770), 4.6, appear="fade"))
    sc.add(Track(chip_img("Cent francs la douzaine", INK, CREAM_D, size=26, kind="serif"),
                 (620, 770), 5.2, appear="fade"))
    panel(sc.base, (1000, 190, 1780, 700), fill=WHITE, outline=GOLD, width=3)
    d = ImageDraw.Draw(sc.base)
    d.text((1390, 225), "JEUX STYLISTIQUES", font=font("monob", 28), fill=(140, 104, 26),
           anchor="mm")
    sc.add(Track(chip_img("emphase : la terrine du chef (menu)", (140, 104, 26),
                          (246, 236, 214), size=26, kind="serif"), (1040, 260), 6.0,
                 appear="slide_up"))
    sc.add(Track(quote_card("Son beau corps a roulé sous la vague marine.", "Chénier",
                            "[17] refus du nombre", GOLD, width=700, size=30),
                 (1040, 350), 7.0, appear="slide_up"))

    def arrow(img, t):
        p = ease_io(clamp((t - 9.0) / 1.2))
        if p <= 0:
            return
        dd = ImageDraw.Draw(img)
        x0 = 1600
        x1 = x0 - int(320 * p)
        dd.line([x0, 620, x1, 620], fill=RED, width=8)
        if p > 0.9:
            dd.polygon([(x1 - 22, 620), (x1 + 4, 606), (x1 + 4, 634)], fill=RED)
            dd.text((1440, 585), "« la » neutralisé retraverse la barrière",
                    font=font("mono", 22), fill=RED, anchor="mm")
            dd.line([1440, 560, 1440, 660], fill=RED, width=5)
    sc.dyn_fn(arrow)
    lab, _ = text_img("du réel au virtuel, du concret à l'abstrait", kind="sans", size=28,
                      color=INK_SOFT)
    sc.add(Track(lab, (150, 880), 10.0, appear="fade"))
    return sc


# ------------------------------------------------------------------ s19 ------
def s19(spec, sc):
    lignes = [("Je mange de la soupe.", "[18]", 0.6), ("Je mange de cette soupe.", "[19]", 1.2),
              ("Je mange de ma soupe.", "[20]", 1.8), ("Je mange de quelle soupe ?", "[21]", 2.4)]
    for i, (txt, num, t0) in enumerate(lignes):
        ti, pb = text_img(txt, kind="serif", size=44, color=INK, hl=" de ", hl_color=CORAL)
        tr = Track(ti, (250, 210 + i * 95), t0, appear="slide_left",
                   pulse_box=pb if i == 0 else None, pulse_color=CORAL)
        sc.add(tr)
        ni, _ = text_img(num, kind="mono", size=26, color=GREY)
        sc.add(Track(ni, (180, 220 + i * 95), t0, appear="fade"))
    lab, _ = text_img("c'est « de » qui apporte la nuance partitive → existence contestée",
                      kind="sans", size=30, color=INK_SOFT)
    sc.add(Track(lab, (250, 610), 4.5, appear="fade"))
    sc.add(Track(chip_img("du beurre = partie d'une substance continue", INK, CREAM_D,
                          size=28, kind="serif"), (250, 700), 6.0, appear="slide_up"))
    sc.add(Track(chip_img("des beurres = parties d'un ensemble discontinu", INK, CREAM_D,
                          size=28, kind="serif"), (250, 780), 6.6, appear="slide_up"))
    big, _ = text_img("LE PARTITIF = LE REFUS DU NOMBRABLE", kind="monob", size=46,
                      color=CORAL_D)
    tr = Track(big, ((W - big.width) // 2, 880), 8.5, appear="slide_up")
    sc.add(tr)
    return sc


# ------------------------------------------------------------------ s20 ------
def s20(spec, sc):
    sc.add(Track(chip_img("participation à un ensemble concret, réel, non nombrable : du pain",
                          CORAL_D, CORAL_L, size=30, kind="sans"), (150, 200), 0.5,
                 appear="slide_up"))
    sc.add(Track(quote_card("Tous les enfants ont du génie, sauf Minou Drouet.",
                            "Sartre citant Cocteau, 1955", "[22] participation à une notion",
                            CORAL, width=1200, size=36), (150, 300), 2.0, appear="slide_up"))
    sc.add(Track(quote_card("Il y a en lui du professeur myope et du médecin de province.",
                            "Malraux", "[23] passage vers l'abstrait", CORAL, width=1200,
                            size=36), (150, 520), 5.0, appear="slide_up"))
    sc.add(Track(chip_img("réduction à « de » : Je ne mange pas de pain.", INK, CREAM_D,
                          size=28, kind="serif"), (150, 760), 8.0, appear="slide_up"))
    sc.add(Track(chip_img("On boit d'excellent vin dans cette auberge. [25]", INK, CREAM_D,
                          size=28, kind="serif"), (760, 760), 8.6, appear="slide_up"))
    return sc


# ------------------------------------------------------------------ s21 ------
def s21(spec, sc):
    panel(sc.base, (140, 190, 1780, 620), fill=WHITE, outline=CORAL, width=3)
    d = ImageDraw.Draw(sc.base)
    d.text((180, 240), "série ATONE", font=font("monob", 30), fill=CORAL_D)
    d.text((180, 440), "série TONIQUE", font=font("monob", 30), fill=CORAL_D)
    atone = ["mon, ton, son", "ma, ta, sa", "notre, votre, leur", "mes, tes, ses", "nos, vos, leurs"]
    for i, g in enumerate(atone):
        sc.add(Track(chip_img(g, INK, GREY_L, size=30, kind="monob", outline=GREY),
                     (480 + (i % 3) * 420, 230 + (i // 3) * 90), 0.6 + i * 0.35,
                     appear="fade"))
    ton = ["mien, tien, sien (+ fém.)", "miens, tiens, siens", "nôtre, vôtre (-s)"]
    for i, g in enumerate(ton):
        sc.add(Track(chip_img(g, CORAL_D, CORAL_L, size=30, kind="monob"),
                     (480 + i * 420, 430), 2.6 + i * 0.35, appear="fade"))
    lab, _ = text_img("la tonique : attribut surtout (langue soutenue) ; épithète = usage ancien ou figé",
                      kind="sans", size=28, color=INK_SOFT)
    sc.add(Track(lab, (180, 540), 4.2, appear="fade"))
    sc.add(Track(quote_card("Croyez que je suis entièrement vôtre.", "", "[26] attribut",
                            CORAL, width=700, size=32), (140, 660), 5.5, appear="slide_up"))
    sc.add(Track(quote_card("Au travers d'un mien pré, certain ânon passa.", "Racine",
                            "[27] épithète ancienne", CORAL, width=700, size=32),
                 (880, 660), 6.5, appear="slide_up"))
    sc.add(Track(chip_img("un mien cousin (locution figée)", INK, CREAM_D, size=26,
                          kind="serif"), (140, 900), 7.5, appear="fade"))
    return sc


# ------------------------------------------------------------------ s22 ------
def s22(spec, sc):
    panel(sc.base, (140, 200, 900, 760), fill=WHITE, outline=CORAL, width=3)
    panel(sc.base, (960, 200, 1780, 760), fill=WHITE, outline=GREY, width=3)
    d = ImageDraw.Draw(sc.base)
    d.text((520, 240), "mon, ton → personne SPÉCIFIQUE", font=font("monob", 26),
           fill=CORAL_D, anchor="mm")
    d.text((1370, 240), "son → personne NON spécifique", font=font("monob", 26),
           fill=INK_SOFT, anchor="mm")
    sc.add(Track(quote_card("Je veux voyager loin et je ménage ma monture.", "",
                            "[28] substantif réel", CORAL, width=700, size=32),
                 (170, 300), 1.0, appear="slide_up"))
    sc.add(Track(quote_card("Jean veut noyer son chien et l'accuse de la rage.", "",
                            "[29] un chien précis", GREY, width=760, size=30),
                 (990, 300), 2.5, appear="slide_up"))
    sc.add(Track(quote_card("Qui veut noyer son chien l'accuse de la rage.", "",
                            "[30] tous les chiens → virtuel", TEAL, width=760, size=30),
                 (990, 520), 4.5, appear="slide_up"))
    sc.add(Track(chip_img("le chapeau de moi → mon chapeau", INK, CREAM_D, size=26,
                          kind="monob"), (170, 560), 6.0, appear="fade"))
    sc.add(Track(chip_img("le chapeau de Jean et sa canne", INK, CREAM_D, size=26,
                          kind="monob"), (170, 640), 6.6, appear="fade"))

    def arrow(img, t):
        p = ease_io(clamp((t - 8.0) / 1.2))
        if p <= 0:
            return
        dd = ImageDraw.Draw(img)
        x0 = 1370
        x1 = x0 + int(240 * p)
        dd.line([x0, 700, x1, 700], fill=TEAL, width=8)
        if p > 0.9:
            dd.polygon([(x1 + 22, 700), (x1 - 4, 686), (x1 - 4, 714)], fill=TEAL)
            dd.text((1500, 660), "vers le virtuel", font=font("mono", 24), fill=TEAL_D,
                    anchor="mm")
    sc.dyn_fn(arrow)
    return sc


# ------------------------------------------------------------------ s23 ------
def s23(spec, sc):
    lab, _ = text_img("valeur de base : appropriation (= complément du substantif en « de ») · Brunot proposait « personnel »",
                      kind="sans", size=28, color=INK_SOFT, maxw=1500)
    sc.add(Track(lab, (150, 200), 0.5, appear="fade"))
    sc.add(Track(chip_img("TENDRESSE (+ imparfait hypocoristique)", CORAL_D, CORAL_L,
                          size=30, kind="monob"), (150, 300), 1.5, appear="slide_up"))
    sc.add(Track(quote_card("C'était mon bon chienchien !", "", "[31]", CORAL, width=700,
                            size=36), (150, 380), 2.0, appear="slide_up"))
    sc.add(Track(heart_img(110, CORAL), (900, 390), 2.5, appear="slide_up", slide=(0, 30)))
    sc.add(Track(chip_img("DÉDAIN", INK_SOFT, GREY_L, size=30, kind="monob"),
                 (150, 620), 4.5, appear="slide_up"))
    sc.add(Track(quote_card("C'est ça ton grand champion ?", "", "[32]", GREY, width=700,
                            size=36), (150, 700), 5.0, appear="slide_up"))
    sc.add(Track(face_img("ironie", 110, INK_SOFT), (900, 700), 5.5, appear="slide_up",
                 slide=(0, 30)))
    lab2, _ = text_img("même déterminant, deux cœurs opposés", kind="serif", size=34,
                       color=INK)
    sc.add(Track(lab2, (1150, 500), 7.0, appear="fade"))
    return sc


# ------------------------------------------------------------------ s24 ------
def s24(spec, sc):
    sc.add(Track(chip_img("POINT LE PLUS ACHEVÉ DE LA RÉALISATION : localiser dans l'espace",
                          CORAL_D, CORAL_L, size=32, kind="monob"), (150, 200), 0.5,
                 appear="slide_up"))
    cartes = [("Cet homme a une démarche curieuse.", "[33]"),
              ("Cette veste te va fort bien.", "[34]"),
              ("Laissez cet air pincé que rien ne justifie.", "[35]")]
    for i, (txt, num) in enumerate(cartes):
        x = 150 + i * 540
        sc.add(Track(quote_card(txt, "", num, CORAL, width=500, size=32),
                     (x, 320), 1.5 + i * 0.8, appear="slide_up"))
    lab, _ = text_img("formes en -ci / -là : « elles fournissent à elles seules la détermination nécessaire » (Grammaire Larousse, § 372)",
                      kind="sans", size=28, color=INK_SOFT, maxw=1500)
    sc.add(Track(lab, (150, 700), 5.5, appear="fade"))
    lab2, _ = text_img("en latin, les démonstratifs étaient liés à la personne, comme nos possessifs",
                       kind="sans", size=28, color=GREY)
    sc.add(Track(lab2, (150, 800), 7.0, appear="fade"))
    return sc


# ------------------------------------------------------------------ s25 ------
def s25(spec, sc):
    big, _ = text_img("ce monde !", kind="serif", size=72, color=INK)
    sc.add(Track(big, ((W - big.width) // 2, 210), 0.5, appear="fade"))
    sc.add(Track(face_img("ironie", 130, INK_SOFT), (520, 360), 1.5, appear="slide_up"))
    sc.add(Track(face_img("joie", 130, INK), (1250, 360), 1.5, appear="slide_up"))
    sc.add(Track(chip_img("PÉJORATIF (mépris)", INK_SOFT, GREY_L, size=30, kind="monob"),
                 (480, 520), 2.2, appear="fade"))
    sc.add(Track(chip_img("LAUDATIF", CORAL_D, CORAL_L, size=30, kind="monob"),
                 (1270, 520), 2.2, appear="fade"))
    lab, _ = text_img("localisation transposée dans l'univers notionnel (Pottier) → nuances de mépris ou de laudation, selon le ton et le contexte",
                      kind="sans", size=28, color=INK_SOFT, maxw=1500)
    sc.add(Track(lab, (150, 620), 4.0, appear="fade"))
    sc.add(Track(quote_card("Et ce bras du royaume est le plus ferme appui.", "Corneille",
                            "[36] désigner la personne (usage classique)", CORAL,
                            width=1200, size=36), (150, 740), 6.0, appear="slide_up"))
    return sc


# ------------------------------------------------------------------ s26 ------
def s26(spec, sc):
    ti, _ = text_img("Travaux pratiques — chapitre II", kind="serif", size=52, color=CORAL_D)
    sc.add(Track(ti, (150, 200), 0.4, appear="fade"))
    qs = ["Le travail, c'est la santé.",
          "Dis bonjour au cousin.",
          "Au menu, la truite du chef."]
    for i, q in enumerate(qs):
        panel(sc.base, (150, 320 + i * 170, 1650, 320 + i * 170 + 140), fill=WHITE,
              outline=CORAL, width=2)
        d = ImageDraw.Draw(sc.base)
        d.ellipse([180, 350 + i * 170, 250, 420 + i * 170], fill=CORAL)
        d.text((215, 385 + i * 170), str(i + 1), font=font("sansb", 36), fill=WHITE, anchor="mm")
        qi, _ = text_img(q, kind="serif", size=36, color=INK, maxw=1250)
        sc.add(Track(qi, (290, 355 + i * 170), 1.0 + i * 2.6, appear="slide_left"))
    return sc


QUIZ_CH2 = [
    dict(n=1, sentence="Le travail, c'est la santé.",
         options=["notoriété", "généralisation (substantif virtuel)", "valeur possessive",
                  "valeur démonstrative"],
         good=1, explain="Le défini accompagne une notion, une catégorie : le travail en général — valeur généralisante."),
    dict(n=2, sentence="Dis bonjour au cousin.",
         options=["notoire simple", "valeur possessive (habitude)", "localisation dans l'espace",
                  "emphase"],
         good=1, explain="le = notre : la valeur possessive née de l'habitude, entre notoire et possession."),
    dict(n=3, sentence="Au menu, la truite du chef.",
         options=["distributif", "partitif", "emphase : rendre unique ce qui ne l'est pas",
                  "approximation"],
         good=2, explain="Accent d'emphase : le défini présente comme unique et célèbre un plat parmi d'autres."),
]

PAINTERS = {"s15": s15, "s16": s16, "s17": s17, "s18": s18, "s19": s19, "s20": s20,
            "s21": s21, "s22": s22, "s23": s23, "s24": s24, "s25": s25, "s26": s26}
