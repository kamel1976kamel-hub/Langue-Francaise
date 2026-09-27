# -*- coding: utf-8 -*-
"""fiche_pdf.py — fiche de synthèse A4 (2 pages) : tableau des actualisateurs +
schéma de synthèse + à retenir.  python3 fiche_pdf.py → out/fiche-synthese.pdf"""
from __future__ import annotations

import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
OUT = os.path.join(BASE, "out", "fiche-synthese.pdf")

CREAM = colors.HexColor("#F5EFE2")
INK = colors.HexColor("#2B2824")
TEAL = colors.HexColor("#287674")
TEAL_L = colors.HexColor("#D6E8E7")
CORAL = colors.HexColor("#BE5434")
CORAL_L = colors.HexColor("#F3E0D8")
VIOLET = colors.HexColor("#65488A")
VIOLET_L = colors.HexColor("#E4DCEE")
RED = colors.HexColor("#B23C34")
GREY_L = colors.HexColor("#E0DACD")

ss = getSampleStyleSheet()
TITLE = ParagraphStyle("t", parent=ss["Title"], fontName="Helvetica-Bold",
                       fontSize=19, textColor=INK, spaceAfter=2)
SUB = ParagraphStyle("s", parent=ss["Normal"], fontName="Helvetica-Oblique",
                     fontSize=10, textColor=colors.HexColor("#5E5850"),
                     alignment=TA_CENTER, spaceAfter=8)
H2 = ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                    fontSize=13, textColor=TEAL, spaceBefore=8, spaceAfter=4)
CELL = ParagraphStyle("c", parent=ss["Normal"], fontName="Helvetica", fontSize=7.6,
                      leading=9.2, textColor=INK)
CELLB = ParagraphStyle("cb", parent=CELL, fontName="Helvetica-Bold")
HEAD = ParagraphStyle("hd", parent=CELL, fontName="Helvetica-Bold", fontSize=8.6,
                      textColor=colors.white, alignment=TA_CENTER)
BUL = ParagraphStyle("b", parent=ss["Normal"], fontName="Helvetica", fontSize=10,
                     leading=14, textColor=INK, leftIndent=10, bulletIndent=0,
                     spaceAfter=3)


def det(txt, d):
    """Exemple avec le déterminant mis en rouge gras."""
    if txt.startswith(d):
        return f'<font color="#B23C34"><b>{d}</b></font>{txt[len(d):]}'
    return txt


def build():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = BaseDocTemplate(OUT, pagesize=A4, title="Les actualisateurs du substantif",
                          author="Atelier de français — Biskra")
    fr = Frame(14 * mm, 12 * mm, A4[0] - 28 * mm, A4[1] - 24 * mm, id="f")
    doc.addPageTemplates([PageTemplate(id="p", frames=[fr],
                                       onPage=lambda c, d: c.setFillColor(CREAM) or
                                       c.rect(0, 0, A4[0], A4[1], fill=1, stroke=0))])
    st = []
    st.append(Paragraph("LES ACTUALISATEURS DU SUBSTANTIF", TITLE))
    st.append(Paragraph("Fiche de synthèse — du virtuel au réel, la barrière du nombre",
                        SUB))

    # ---------------- page 1 : le tableau ----------------
    st.append(Paragraph("1 · Le tableau des actualisateurs", H2))
    head1 = ["", "VIRTUEL — neutralisé", "", "RÉEL — après la barrière du nombre →", "", ""]
    head2 = ["Actualisateur", "neutralisé", "TRANSITOIRE<br/>un, des",
             "NOTOIRE<br/>le, les", "POSSESSEUR<br/>mon, ma", "GESTE<br/>ce, cet"]
    rows = [
        ["Article indéfini", "Un bon chat, bon rat.",
         det("J'aperçois dans le jardin un chien et des chats.", "un"),
         det("Tiens ! le chien poursuit les chats.", "le"),
         det("Mais c'est mon chien !", "mon"),
         det("Ce chien est bien méchant !", "Ce")],
        ["Article défini", "Un homme averti en vaut deux.",
         det("Un homme averti en vaut deux.", "Un"),
         det("Le soleil est un fameux quinquet.", "Le"),
         det("le boulanger (= notre)", "le"),
         det("Ah ! le beau tableau !", "le")],
        ["Adjectif possessif", "Les petits ruisseaux font les grandes rivières.",
         det("Un bon chat, bon rat.", "Un"),
         det("Qui veut noyer son chien l'accuse de la rage.", "son"),
         det("Je ménage ma monture.", "ma"),
         det("Cet homme a une démarche curieuse.", "Cet")],
        ["Adjectif démonstratif", "Qui veut noyer son chien l'accuse de la rage.",
         det("Les petits ruisseaux font les grandes rivières.", "Les"),
         det("La calomnie est un vilain défaut.", "La"),
         det("C'était mon bon chienchien !", "mon"),
         det("Et ce bras du royaume est le plus ferme appui.", "ce")],
    ]
    data = [[Paragraph(h, HEAD) for h in head1],
            [Paragraph(h, HEAD) for h in head2]]
    for r in rows:
        data.append([Paragraph(f"<b>{r[0]}</b>", CELLB)] +
                    [Paragraph(x, CELL) for x in r[1:]])
    t = Table(data, colWidths=[26 * mm, 27 * mm, 32 * mm, 32 * mm, 30 * mm, 32 * mm],
              repeatRows=2)
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (0, 1)), ("SPAN", (1, 0), (1, 1)), ("SPAN", (2, 0), (5, 0)),
        ("BACKGROUND", (0, 0), (5, 1), INK),
        ("BACKGROUND", (1, 1), (1, 1), TEAL),
        ("LINEBEFORE", (2, 0), (2, -1), 2.2, RED),
        ("BACKGROUND", (1, 2), (1, -1), TEAL_L),
        ("BACKGROUND", (2, 2), (5, -1), colors.HexColor("#FAF6EC")),
        ("ROWBACKGROUNDS", (0, 2), (0, -1), [colors.white, CREAM]),
        ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#8A8478")),
        ("BOX", (0, 0), (-1, -1), 1.4, INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    st.append(t)
    st.append(Spacer(1, 4))
    st.append(Paragraph(
        "<b>Lecture :</b> à gauche de la barrière du nombre, l'opposition singulier/pluriel "
        "n'est pas signifiante (virtuel : <i>le = un = ∅</i>) ; à droite, elle l'est (réel). "
        "Franchir la barrière, c'est <b>réaliser</b> le substantif. Valeurs du réel : "
        "présentation (transitoire), notoriété, référence à un possesseur, localisation "
        "dans l'espace (geste).", CELL))
    st.append(Paragraph("2 · Valeurs et emplois par actualisateur", H2))
    vals = [
        ("<b>Indéfini (un, une, des)</b> : absence de notoriété ; présentation ; "
         "généralisation ; spécification (attribut/apposition) ; emphase de qualité ou de "
         "quantité selon le ton (<i>un œil !, un monde !</i>) ; abus moderne à éviter.", CORAL),
        ("<b>Défini (le, les)</b> : notoriété (unique ou supposé connu) ; degré minimum du "
         "démonstratif ; possessif d'habitude (<i>le boulanger</i>, parties du corps) ; "
         "généralisant ; approximation et distributif (<i>fermé le lundi</i>) ; emphase et "
         "refus du nombre.", CORAL),
        ("<b>Partitif (du, de la, des)</b> : contesté ; participation à un réel non "
         "nombrable ou à une notion ; passage à l'abstrait ; réduit à <i>de</i>.", CORAL),
        ("<b>Possessifs</b> : séries atone/tonique ; appropriation (= complément en <i>de</i>) ; "
         "<i>mon/ton</i> spécifiques vs <i>son</i> non spécifique (jusqu'au virtuel) ; "
         "tendresse et dédain.", CORAL),
        ("<b>Démonstratifs</b> : point le plus achevé de la réalisation (localisation) ; "
         "nuances notionnelles (mépris/laudation) ; désignation de la personne (usage "
         "classique).", CORAL),
        ("<b>Relatif (lequel…)</b> : quel + article ; reprend le substantif déjà exprimé ; "
         "réalise comme un démonstratif ; langue administrative, archaïsant ailleurs.", VIOLET),
        ("<b>Interrogatif (quel…)</b> : mêmes formes sans article ; questionne l'existence ou "
         "l'identité ; attribut possible ; exclamatif = réalisation forte.", VIOLET),
        ("<b>Indéfinis</b> : catégorie hétérogène (formes à 1, 2, 3 ou 4 variantes ; "
         "périphrases en <i>de</i>) ; classement sémantique de Grevisse ; le cas <i>tout</i> "
         "(faible réalisation sans article, qualificatif avec article au singulier).", VIOLET),
        ("<b>Numéraux cardinaux</b> : seuls vrais accompagnateurs parmi les numéraux ; "
         "invariables en genre (sauf <i>un</i>) ; réalisation nulle (virtuel ou réel selon le "
         "contexte) ; remplaçant les ordinaux (<i>le huit</i>).", VIOLET),
    ]
    for txt, col in vals:
        st.append(Paragraph(txt, ParagraphStyle("v", parent=CELL, fontSize=8.4,
                                                leading=10.6, spaceAfter=2,
                                                borderColor=col, borderWidth=0,
                                                leftIndent=6)))
    # ---------------- page 2 : synthèse ----------------
    st.append(Paragraph("3 · Le système en un schéma", H2))
    syn = Table([[Paragraph("<b>VIRTUEL</b><br/>degré zéro (proverbes, maximes)<br/>"
                            "généralités neutralisées<br/><i>le = un = ∅ ; sing. = plur.</i>",
                            ParagraphStyle("sv", parent=CELL, fontSize=9, leading=12,
                                           textColor=colors.HexColor("#1A5453"))),
                  Paragraph("<b>RÉEL</b><br/>un, des → présente · le, les → notoire · "
                            "du, des → partitif<br/>mon, ma → possesseur · ce, cet → geste · "
                            "lequel → reprend<br/>quel ? → questionne · chaque → mesure · "
                            "deux, trois → compte",
                            ParagraphStyle("sr", parent=CELL, fontSize=9, leading=12,
                                           textColor=colors.HexColor("#923C24")))]],
                colWidths=[55 * mm, 124 * mm])
    syn.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), TEAL_L),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FAF6EC")),
        ("LINEBEFORE", (1, 0), (1, 0), 2.6, RED),
        ("BOX", (0, 0), (-1, -1), 1.2, INK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    st.append(syn)
    st.append(Paragraph("4 · À retenir", H2))
    for b in ["L'actualisation fait entrer le substantif du lexique dans la chaîne parlée "
              "(paradigmatique → syntagmatique).",
              "La réalisation le fait passer du virtuel au réel ; le nombre en est la "
              "condition nécessaire et suffisante.",
              "Chaque actualisateur a sa valeur de base : présentation, notoriété, "
              "possession, localisation.",
              "Le ton et le contexte peuvent renverser ces valeurs (emphase, ironie, "
              "antiphrase).",
              "Le tableau des actualisateurs résume tout le système du français."]:
        st.append(Paragraph("•  " + b, BUL))
    st.append(Spacer(1, 6))
    st.append(Paragraph("Vidéo associée : <i>Les actualisateurs du substantif</i> — format "
                        "complet chapitré (générique, chapitres I–III, travaux pratiques, "
                        "synthèse). Voix masculine, débit mesuré.",
                        ParagraphStyle("f", parent=CELL, fontSize=8, textColor=GREY_L and
                                       colors.HexColor("#5E5850"))))
    doc.build(st)
    print("[pdf] →", OUT)


if __name__ == "__main__":
    build()
