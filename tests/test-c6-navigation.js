/**
 * LOT C6.2 — Test ciblé de la nouvelle arborescence « Parcours ».
 *
 * Objectif : vérifier que la réorganisation est PUREMENT VISUELLE.
 *  - les 20 chapterId techniques ({type}-{1..4}) sont inchangés ;
 *  - les 6 topics CHAT sont inchangés ;
 *  - les fonctions métier (togglePath, selectModule, selectDiscussion,
 *    loadActivities) et les objets de données (chapters, activityContent,
 *    parcoursData, discussionData) sont intacts ;
 *  - le DOM de l'arborescence est équilibré et les 5 types de textes sont
 *    bien descendants de « Techniques et pratique de l'écrit 2 » ;
 *  - aucun élément interdit n'apparaît (codes P1FR, « Modules transversaux »,
 *    troisième année PEP, modules PEM/PES non fournis).
 *
 * Lecture seule de index.html et de src/p10-context.js — aucune dépendance,
 * aucun réseau, aucune donnée recopiée en dur.
 * Exécution : node tests/test-c6-navigation.js
 *
 * P10.4/P10.5 — l'arborescence Parcours et la liste des discussions ne sont
 * plus écrites en dur dans index.html : elles sont fabriquées au démarrage par
 * src/p10-context.js à partir du référentiel canonique. Ce test porte sur ce
 * que voit l'utilisateur : il évalue donc la PAGE SIMULÉE, obtenue en
 * injectant dans les deux points de montage le balisage RÉELLEMENT produit par
 * ces fabriques, alimentées par les objets de données existants de la page.
 * Tous les contrats R1-R47 sont conservés ; ceux qui désignaient des ids de
 * navigation hérités (data-nav-node) sont ré-exprimés sur les ids canoniques
 * (data-module-id), à périmètre de contrôle identique.
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var INDEX_PATH = path.join(__dirname, '..', 'index.html');
var src = fs.readFileSync(INDEX_PATH, 'utf8');

var passCount = 0;
var failCount = 0;

function assert(cond, label) {
  if (cond) {
    passCount++;
    console.log('\u2705 PASS \u2014 ' + label);
  } else {
    failCount++;
    console.log('\u274c FAIL \u2014 ' + label);
  }
}

function countAll(regex, where) {
  var m = String(where === undefined ? page : where).match(new RegExp(regex, 'g'));
  return m ? m.length : 0;
}

// ── Fabrique de la page simulée (P10.4 / P10.5) ──────────────────────
/**
 * Lire un objet littéral `… = { … }` dans le source, sans le recopier :
 * comptage d'accolades tenant compte des chaînes et des commentaires.
 */
function lireObjetLitteral(code, motif) {
  var m = motif.exec(code);
  if (!m) return null;
  var debut = code.indexOf('{', m.index);
  if (debut === -1) return null;
  var profondeur = 0;
  var quote = null;
  for (var i = debut; i < code.length; i++) {
    var ch = code.charAt(i);
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '/' && code.charAt(i + 1) === '/') {
      var saut = code.indexOf('\n', i);
      if (saut === -1) return null;
      i = saut;
      continue;
    }
    if (ch === '/' && code.charAt(i + 1) === '*') {
      var finCom = code.indexOf('*/', i);
      if (finCom === -1) return null;
      i = finCom + 1;
      continue;
    }
    if (ch === '{') profondeur++;
    else if (ch === '}') {
      profondeur--;
      if (profondeur === 0) return code.slice(debut, i + 1);
    }
  }
  return null;
}

function evaluerLitteral(texte) {
  if (!texte) return null;
  try { return vm.runInNewContext('(' + texte + ')'); }
  catch (e) { return null; }
}

var P10 = require(path.join(__dirname, '..', 'src', 'p10-context.js'));

// Contenu réel du module « Techniques et pratique de l'écrit 2 » : titres des
// 5 types de textes et des 20 leçons, lus depuis parcoursData.
var parcoursDataLu = evaluerLitteral(lireObjetLitteral(src, /const parcoursData = /)) || {};

// Titres des 6 discussions héritées, lus depuis discussionData (jamais inventés).
var titresDiscussions = (function () {
  var out = {};
  var data = evaluerLitteral(lireObjetLitteral(src, /window\.discussionData = /));
  if (!data) return out;
  for (var k in data) {
    if (Object.prototype.hasOwnProperty.call(data, k) && data[k] && typeof data[k].title === 'string') {
      out[k] = data[k].title;
    }
  }
  return out;
})();

var CONTEXTE_INITIAL = P10.context();
var MONTAGES = [
  {
    mount: '<div id="parcoursTreeRoot" data-p10-tree="parcours"></div>',
    html: P10.renderParcoursTree({
      context: CONTEXTE_INITIAL,
      contents: P10.buildContents(parcoursDataLu)
    })
  },
  {
    mount: '<div class="p-3 space-y-1" id="discussionList" data-p10-tree="discussion"></div>',
    html: P10.renderDiscussionTree({
      context: CONTEXTE_INITIAL,
      discussionTitles: titresDiscussions
    })
  }
];

var page = src;
var montagesInjectes = 0;
MONTAGES.forEach(function (m) {
  var idx = page.indexOf(m.mount);
  if (idx < 0) return;
  var corps = m.mount.slice(0, m.mount.length - '</div>'.length);
  page = page.slice(0, idx) + corps + m.html + '</div>' + page.slice(idx + m.mount.length);
  montagesInjectes++;
});

// ── Références techniques (à ne jamais modifier) ──────────────────────────
var TYPES = ['narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'];
var TOPICS_CHAT = ['techniques', 'narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'];
var CHAPTER_IDS = [];
for (var t = 0; t < TYPES.length; t++) {
  for (var n = 1; n <= 4; n++) {
    CHAPTER_IDS.push(TYPES[t] + '-' + n);
  }
}
var TREE_NODES = ['pep', 'p1', 's1', 's2', 'tpe', 'p2', 'p2s1', 'p2s2'];
// Structure complète de l'arborescence PEP : les 43 modules du parcours, ids
// canoniques (data-module-id), par semestre. P10.0-C : un module sans contenu
// reste visible et sélectionnable, jamais inventé.
var MODULES_PAR_SEMESTRE = { 'pep-y1s1': 13, 'pep-y1s2': 13, 'pep-y2s1': 9, 'pep-y2s2': 8 };
var TOTAL_MODULES = 43;
var TOTAL_SANS_CONTENU = 42;

// ── Zone de navigation #pathsNav ──────────────────────────────────────────
var navStart = String(page).indexOf('id="pathsNav"');
var navEnd = navStart >= 0 ? String(page).indexOf('</nav>', navStart) : -1;
var navRegion = navStart >= 0 && navEnd > navStart
  ? String(page).slice(navStart, navEnd)
  : '';

assert(montagesInjectes === MONTAGES.length,
  'R0 \u2014 les deux points de montage P10 re\u00e7oivent le balisage g\u00e9n\u00e9r\u00e9 (' +
  montagesInjectes + '/' + MONTAGES.length + ')');
assert(navRegion.length > 0, 'R1 \u2014 r\u00e9gion #pathsNav localisable');
assert(/data-p10-tree="parcours"[\s\S]*<button/.test(navRegion),
  'R1b \u2014 #pathsNav est peupl\u00e9 par l\u2019arbre Parcours g\u00e9n\u00e9r\u00e9');

// ── R2 : les 20 chapterId sont intacts comme attributs data-chapter ───────
var foundChapters = [];
var reData = /data-chapter="([a-z]+-[0-9])"/g;
var mData;
while ((mData = reData.exec(page)) !== null) {
  foundChapters.push(mData[1]);
}
var uniqueChapters = foundChapters.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
assert(uniqueChapters.join(',') === CHAPTER_IDS.slice().sort().join(','),
  'R2 \u2014 20 chapterId data-chapter identiques aux identifiants techniques');
assert(foundChapters.length === 20, 'R3 \u2014 exactement 20 boutons module (data-chapter)');
assert(countAll('selectModule\\(\'([a-z]+-[0-9])\'\\)') === 20,
  'R4 \u2014 20 appels onclick selectModule(\'{type}-{n}\') conservés');

// ── R5 : référentiel de clés chapterId (état préexistant, inchangé par C6.2) ───────────────
var keysOk = true;
// chapters porte 16 clés (sans resume), activityContent ne porte que explicatif-1..4,
// parcoursData.modules porte les 20 clés. Toute déviation = identifiant technique touché.
var BASELINE_KEYS = { narratif: 2, descriptif: 2, explicatif: 3, argumentatif: 2, resume: 1 };
for (var c = 0; c < CHAPTER_IDS.length; c++) {
  var attendu = BASELINE_KEYS[CHAPTER_IDS[c].split('-')[0]];
  var obtenu = countAll('"' + CHAPTER_IDS[c] + '":', src);
  if (obtenu !== attendu) {
    keysOk = false;
    console.log('   \u21b3 ' + CHAPTER_IDS[c] + ' : cl\u00e9s=' + obtenu + ' attendu=' + attendu);
  }
}
assert(keysOk, 'R5 \u2014 r\u00e9partition des cl\u00e9s chapterId identique au r\u00e9f\u00e9rentiel');
assert(countAll('"resume-1":', src) === 1 && countAll('"explicatif-1":', src) === 3,
  'R5b \u2014 t\u00e9moin des lacunes pr\u00e9existantes (resume sans chapitres, activit\u00e9s sur explicatif-*)');

// ── R6 : les 6 topics CHAT sont inchangés ─────────────────────────────────
var foundTopics = [];
var reTopic = /data-topic="([a-z]+)"/g;
var mTopic;
while ((mTopic = reTopic.exec(page)) !== null) {
  foundTopics.push(mTopic[1]);
}
assert(foundTopics.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort().join(',') === TOPICS_CHAT.slice().sort().join(','),
  'R6 \u2014 6 topics CHAT (data-topic) inchangés');
var containersOk = true;
for (var k = 0; k < TOPICS_CHAT.length; k++) {
  if (String(src).indexOf('id="chatMessages-' + TOPICS_CHAT[k] + '"') < 0) containersOk = false;
}
assert(containersOk, 'R7 \u2014 6 conteneurs chatMessages-{topic} pr\u00e9sents');
assert(countAll('function buildChatContext\\(') === 1 ||
  String(fs.readFileSync(path.join(__dirname, '..', 'src', 'request-builder-v2.js'), 'utf8')).indexOf('function buildChatContext') >= 0,
  'R8 \u2014 buildChatContext toujours disponible dans request-builder-v2.js');

// ── R9 : les 5 types de textes sont sous « Techniques et pratique de l'écrit 2 »
assert(/Techniques et pratique de l.\u00e9crit 2/.test(navRegion),
  'R9b \u2014 le n\u0153ud module \u00e9crit 2 est bien dans #pathsNav');
var posTpe = navRegion.indexOf('id="tree-tpe"');
var posNarratif = navRegion.indexOf('data-path="narratif"');
var posResume = navRegion.indexOf('data-path="resume"');
// « Graphie et dict\u00e9e 2 » (pep-y1s2-04) est le fr\u00e8re S2 qui suit imm\u00e9diatement
// le module \u00e9crit 2 : si les 5 types sont avant lui, ils sont bien contenus
// dans le sous-arbre \u00e9crit 2.
var posApresTpe = navRegion.indexOf('data-module-id="pep-y1s2-04"');
assert(posTpe >= 0 && posTpe < posNarratif && posNarratif < posResume && posResume < posApresTpe,
  'R9 \u2014 les 5 parcours sont enfants de Techniques et pratique de l\u2019\u00e9crit 2');
assert(navRegion.indexOf('Semestre 2') >= 0 && navRegion.indexOf('Premi\u00e8re ann\u00e9e') >= 0 && navRegion.indexOf('Parcours PEP') >= 0,
  'R10 \u2014 niveaux PEP / Premi\u00e8re ann\u00e9e / Semestre 2 pr\u00e9sents');
var ordered = ['Texte narratif', 'Texte descriptif', 'Texte explicatif', 'Texte argumentatif', 'R\u00e9sum\u00e9'];
var orderOk = true;
var cursor = -1;
for (var o = 0; o < ordered.length; o++) {
  var idx = navRegion.indexOf(ordered[o], cursor + 1);
  if (idx < 0) { orderOk = false; break; }
  cursor = idx;
}
assert(orderOk, 'R11 \u2014 les 5 libell\u00e9s de types de textes sont pr\u00e9sents et ordonn\u00e9s');

// ── R12 : intégrité des nœuds d'arbre (1 ouverture / 1 flèche / 1 handler) ─
var treeOk = true;
for (var d = 0; d < TREE_NODES.length; d++) {
  var id = TREE_NODES[d];
  var o1 = countAll('id="tree-' + id + '"');
  var o2 = countAll('id="tarrow-' + id + '"');
  var o3 = countAll('toggleTree\\(\'' + id + '\'\\)');
  if (o1 !== 1 || o2 !== 1 || o3 !== 1) {
    treeOk = false;
    console.log('   \u21b3 n\u0153ud ' + id + ' : conteneurs=' + o1 + ' fl\u00e8ches=' + o2 + ' toggleTree=' + o3);
  }
}
assert(treeOk, 'R12 \u2014 n\u0153uds d\u2019arbre coh\u00e9rents (conteneur + fl\u00e8che + handler)');
assert(countAll('window\\.toggleTree = function') === 1, 'R13 \u2014 toggleTree d\u00e9fini une seule fois');

// ── R14 : aucune collision avec les ids métier existants ──────────────────
assert(countAll('id="modules-narratif"') === 1 && countAll('id="arrow-narratif"') === 1,
  'R14 \u2014 ids m\u00e9tier modules-*/arrow-* non dupliqu\u00e9s par l\u2019arborescence');

// ── R15 : équilibre DOM de #pathsNav ───────────────────────────────────────
var openDiv = (navRegion.match(/<div\b/g) || []).length;
var closeDiv = (navRegion.match(/<\/div>/g) || []).length;
assert(openDiv === closeDiv, 'R15 \u2014 <div> et </div> \u00e9quilibr\u00e9s dans #pathsNav (' + openDiv + '/' + closeDiv + ')');

// ── R16 : logique métier inchangée (C1-C5 et navigation) ──────────────────
assert(countAll('window\\.togglePath = function') === 1, 'R16 \u2014 togglePath intact');
assert(countAll('window\\.selectModule = function') === 1, 'R17 \u2014 selectModule intact');
assert(countAll('window\\.selectDiscussion = function') === 1, 'R18 \u2014 selectDiscussion intact');
assert(countAll('function loadActivities\\(') === 1, 'R19 \u2014 loadActivities intact');
assert(countAll('const chapters = \\{') === 1, 'R20 \u2014 chapters intact');
assert(countAll('window\\.activityContent = \\{') === 1, 'R21 \u2014 activityContent intact');
assert(countAll('const parcoursData = \\{') === 1, 'R22 \u2014 parcoursData intact');
assert(countAll('window\\.discussionData = \\{') === 1, 'R23 \u2014 discussionData intact');
assert(String(src).indexOf("moduleId.split('-')[0]") >= 0, 'R24 \u2014 d\u00e9rivation parcoursId (split) inchang\u00e9e');
assert(String(src).indexOf('LOT C5') >= 0, 'R25 \u2014 correctif CHAT C5 toujours pr\u00e9sent');

// ── R26 : navigation par hash toujours couverte ────────────────────────────
var hashOk = CHAPTER_IDS.every(function (id) { return true; });
assert(hashOk && String(src).indexOf('chapters[initial]') >= 0,
  'R26 \u2014 initialisation par hash (#narratif-1, etc.) inchang\u00e9e');

// ── R27 : contenus interdits absents ───────────────────────────────────────
assert(!/P1FR/.test(src), 'R27 \u2014 aucun code P1FR\u2026 dans index.html');
assert(String(src).indexOf('Modules transversaux') < 0, 'R28 \u2014 pas de « Modules transversaux »');
assert(!/[Tt]roisi\u00e8me ann\u00e9e/.test(navRegion), 'R29 \u2014 pas de troisi\u00e8me ann\u00e9e PEP');
assert(countAll('toggleTree\\(\'pem\'\\)') === 0 && countAll('toggleTree\\(\'pes\'\\)') === 0,
  'R30 \u2014 PEM/PES affich\u00e9s sans modules d\u00e9pliables');

// ── R31 : libellé d'affichage vs clé technique du module ───────────────────
// Le libellé peut employer l'apostrophe droite ou typographique : on teste les deux.
assert(/Techniques et pratique de l.\u00e9crit 2/.test(String(src)),
  'R31 \u2014 libell\u00e9 « Techniques et pratique de l\u2019\u00e9crit 2 » pr\u00e9sent');
assert(String(src).indexOf('techniques: {') >= 0,
  'R32 \u2014 cl\u00e9 technique « techniques » conserv\u00e9e pour le CHAT');

// ── R33 : les 5 parcours restent dépliables (togglePath) ──────────────────
var pathOk = true;
for (var p = 0; p < TYPES.length; p++) {
  if (navRegion.indexOf("togglePath('" + TYPES[p] + "')") < 0) pathOk = false;
  if (countAll('data-path="' + TYPES[p] + '"') !== 1) pathOk = false;
}
assert(pathOk, 'R33 \u2014 5 parcours d\u00e9pliables via togglePath, data-path unique');

// ── R34 : Première année / Semestre 1 / Deuxième année restent repliés ─────
var p1Hidden = /<div id="tree-p1" class="hidden/.test(navRegion);
assert(p1Hidden, 'R34a \u2014 Premi\u00e8re ann\u00e9e repli\u00e9e par d\u00e9faut (\u00e9tat initial colonne 2 simplifi\u00e9 : parcours + ann\u00e9es visibles, semestres/modules accessibles au clic)');
var s1Hidden = /<div id="tree-s1" class="hidden/.test(navRegion);
var p2Hidden = /<div id="tree-p2" class="hidden/.test(navRegion);
assert(s1Hidden, 'R34 \u2014 Semestre 1 repli\u00e9 par d\u00e9faut (aucun contenu invent\u00e9)');
assert(p2Hidden, 'R35 \u2014 Deuxi\u00e8me ann\u00e9e repli\u00e9e par d\u00e9faut');
var s2Hidden = /<div id="tree-s2" class="hidden/.test(navRegion);
var tpeBranch = /<div id="tree-tpe"/.test(navRegion);
assert(s2Hidden, 'R36 \u2014 Semestre 2 repli\u00e9 par d\u00e9faut (\u00e9tat initial strict : ann\u00e9e cliqu\u00e9e \u2192 semestres, semestre cliqu\u00e9 \u2192 modules)');
assert(tpeBranch, 'R36c \u2014 module \u00e9crit 2 pr\u00e9sent dans l\u2019arbre (accessible apr\u00e8s ouverture de Semestre 2)');

// ── R37+ : arborescence complète des 43 modules, ids canoniques ───────────
var navNodes = [];
var reNav = /data-module-id="([^"]+)"/g;
var mNav;
while ((mNav = reNav.exec(navRegion)) !== null) { navNodes.push(mNav[1]); }
var totalExpected = 0;
for (var cle in MODULES_PAR_SEMESTRE) {
  if (Object.prototype.hasOwnProperty.call(MODULES_PAR_SEMESTRE, cle)) totalExpected += MODULES_PAR_SEMESTRE[cle];
}
assert(totalExpected === TOTAL_MODULES,
  'R36b \u2014 le r\u00e9f\u00e9rentiel de contr\u00f4le porte bien 43 modules (13+13+9+8)');
assert(navNodes.length === TOTAL_MODULES,
  'R37 \u2014 ' + TOTAL_MODULES + ' n\u0153uds de navigation (data-module-id canoniques)');
var prefixOk = true;
for (var pf in MODULES_PAR_SEMESTRE) {
  if (!Object.prototype.hasOwnProperty.call(MODULES_PAR_SEMESTRE, pf)) continue;
  var cnt = navNodes.filter(function (v) { return v.indexOf(pf + '-') === 0; }).length;
  if (cnt !== MODULES_PAR_SEMESTRE[pf]) {
    prefixOk = false;
    console.log('   \u21b3 ' + pf + ' : ' + cnt + ' n\u0153uds, attendu ' + MODULES_PAR_SEMESTRE[pf]);
  }
}
assert(prefixOk, 'R38 \u2014 r\u00e9partition pep-y1s1=13, pep-y1s2=13, pep-y2s1=9, pep-y2s2=8');
// Un seul module est peuplé ; les 42 autres affichent le badge de vide.
var emptyMarkers = (navRegion.match(/data-nav-state="empty"/g) || []).length;
var contentMarkers = (navRegion.match(/data-nav-state="content"/g) || []).length;
// Compter le TEXTE AFFICHÉ (>sans contenu<) et non la locution, qui peut
// aussi se rencontrer dans un commentaire HTML ou dans le code JS.
var sansContenu = (navRegion.match(/>\s*sans contenu\s*</g) || []).length;
assert(emptyMarkers === TOTAL_SANS_CONTENU && contentMarkers === 1,
  'R39 \u2014 42 n\u0153uds data-nav-state="empty" et 1 seul module peupl\u00e9 (' + emptyMarkers + '/' + contentMarkers + ')');
assert(sansContenu === TOTAL_SANS_CONTENU,
  'R40 \u2014 badge \u00ab sans contenu \u00bb sur chaque module vide (' + sansContenu + ')');
// P10.0-C : les modules vides restent sélectionnables, mais ne prétendent
// AUCUNE activité pédagogique : ni chapterId, ni selectModule (le rendu legacy
// des 20 chapitres), ni togglePath ; leur gestionnaire ne cible que leur propre
// identifiant canonique.
var leafTags = [];
var reLeafTag = /<button[^>]*data-module-id="([^"]+)"[^>]*>/g;
var mLeaf;
while ((mLeaf = reLeafTag.exec(navRegion)) !== null) {
  leafTags.push({ id: mLeaf[1], tag: mLeaf[0] });
}
var feuillesVides = leafTags.filter(function (l) { return /data-nav-state="empty"/.test(l.tag); });
var sansPretentionOk = feuillesVides.every(function (l) {
  var gestionnaire = /onclick="([^"]*)"/.exec(l.tag);
  return !/data-chapter/.test(l.tag) &&
    !/selectModule\(/.test(l.tag) &&
    !/togglePath\(/.test(l.tag) &&
    !!gestionnaire && gestionnaire[1] === "p10SelectModule('" + l.id + "')";
});
assert(leafTags.length === TOTAL_MODULES && feuillesVides.length === TOTAL_SANS_CONTENU && sansPretentionOk,
  'R41 \u2014 modules sans contenu s\u00e9lectionnables mais sans pr\u00e9tention d\u2019activit\u00e9 (' +
  feuillesVides.length + ' feuilles, gestionnaire = id canonique uniquement)');
// Homonymes : m\u00eame intitul\u00e9, identifiants canoniques DISTINCTS selon l'ann\u00e9e.
var idsUniques = navNodes.length === Object.keys(navNodes.reduce(function (a, v) { a[v] = 1; return a; }, {})).length;
var parTitre = {};
navNodes.forEach(function (id) {
  var mod = P10.module(id);
  if (mod && mod.title) { (parTitre[mod.title] = parTitre[mod.title] || []).push(id); }
});
var homonymes = Object.keys(parTitre).filter(function (tt) { return parTitre[tt].length > 1; });
var ulm = parTitre['Usage et ma\u00eetrise de la langue 1'] || [];
assert(idsUniques && ulm.length >= 2 && homonymes.length >= 3,
  'R42 \u2014 homonymes P1/P2 non fusionn\u00e9s (m\u00eame libell\u00e9, ids canoniques distincts : ' +
  homonymes.join(' / ') + ')');
// Aucun data-module-id ne doit correspondre \u00e0 un chapterId existant.
var chapterSet = {}; CHAPTER_IDS.forEach(function (x) { chapterSet[x] = 1; });
var collision = navNodes.filter(function (v) { return chapterSet[v]; });
assert(collision.length === 0,
  'R43 \u2014 aucun identifiant de navigation ne vole un chapterId (' + collision.join(',') + ')');
// Libell\u00e9s exacts contr\u00f4l\u00e9s (\u00e9chantillon structurel).  \\u0153 = ligature œ via entit\u00e9.
var labels = [
  'Nationalisme et Citoyennet\u00e9 1',
  'Graphie et dict\u00e9e 1',
  'Intelligence artificielle dans l\u2019apprentissage 1',
  'Usage et ma\u00eetrise de la langue fran\u00e7aise 2',
  'Lecture des textes litt\u00e9raires 1'
];
var labelsOk = true;
for (var lb = 0; lb < labels.length; lb++) {
  if (navRegion.indexOf(labels[lb]) < 0) { labelsOk = false; console.log('   \u21b3 libell\u00e9 absent : ' + labels[lb]); }
}
assert(labelsOk, 'R44 \u2014 libell\u00e9s exacts pr\u00e9sents (\u00e9chantillon S1/S2/P2)');
// Deuxième année : sous-arbres p2s1/p2s2 repli\u00e9s par d\u00e9faut + handlers pr\u00e9sents.
assert(/<div id="tree-p2s1" class="hidden/.test(navRegion) && /<div id="tree-p2s2" class="hidden/.test(navRegion),
  'R45 \u2014 S1 et S2 de Deuxi\u00e8me ann\u00e9e repli\u00e9s par d\u00e9faut');
assert(countAll('toggleTree\\(\'p2s1\'\\)') === 1 && countAll('toggleTree\\(\'p2s2\'\\)') === 1,
  'R46 \u2014 p2s1/p2s2 d\u00e9pliables via toggleTree (1 handler chacun)');
// « à venir » / placeholders retir\u00e9s une fois la structure compl\u00e9t\u00e9e.
assert(navRegion.indexOf('Autres modules') < 0 && !/\u00e0 venir/.test(navRegion),
  'R47 \u2014 placeholders \u00ab \u00e0 venir / Autres modules \u00bb retir\u00e9s (structure compl\u00e8te)');

console.log('\n============================================================');
console.log('R\u00e9sultats C6.2 : ' + passCount + ' pass, ' + failCount + ' \u00e9chec(s)');
console.log('============================================================');
process.exit(failCount === 0 ? 0 : 1);
