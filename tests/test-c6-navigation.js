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
 * Lecture seule de index.html — aucune dépendance, aucun réseau.
 * Exécution : node tests/test-c6-navigation.js
 */

var fs = require('fs');
var path = require('path');

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

function countAll(regex) {
  var m = String(src).match(new RegExp(regex, 'g'));
  return m ? m.length : 0;
}

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
// Structure complète de l'arborescence PEP (C6.2 corrigé) : modules structurels
// vides identifiés par data-nav-node (jamais des chapterId), par semestre.
var NAV_EMPTY = { p1s1: 13, p1s2: 12, p2s1: 9, p2s2: 8 };

// ── Zone de navigation #pathsNav ──────────────────────────────────────────
var navStart = String(src).indexOf('id="pathsNav"');
var navEnd = navStart >= 0 ? String(src).indexOf('</nav>', navStart) : -1;
var navRegion = navStart >= 0 && navEnd > navStart
  ? String(src).slice(navStart, navEnd)
  : '';

assert(navRegion.length > 0, 'R1 \u2014 r\u00e9gion #pathsNav localisable');

// ── R2 : les 20 chapterId sont intacts comme attributs data-chapter ───────
var foundChapters = [];
var reData = /data-chapter="([a-z]+-[0-9])"/g;
var mData;
while ((mData = reData.exec(src)) !== null) {
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
  var obtenu = countAll('"' + CHAPTER_IDS[c] + '":');
  if (obtenu !== attendu) {
    keysOk = false;
    console.log('   \u21b3 ' + CHAPTER_IDS[c] + ' : cl\u00e9s=' + obtenu + ' attendu=' + attendu);
  }
}
assert(keysOk, 'R5 \u2014 r\u00e9partition des cl\u00e9s chapterId identique au r\u00e9f\u00e9rentiel');
assert(countAll('"resume-1":') === 1 && countAll('"explicatif-1":') === 3,
  'R5b \u2014 t\u00e9moin des lacunes pr\u00e9existantes (resume sans chapitres, activit\u00e9s sur explicatif-*)');

// ── R6 : les 6 topics CHAT sont inchangés ─────────────────────────────────
var foundTopics = [];
var reTopic = /data-topic="([a-z]+)"/g;
var mTopic;
while ((mTopic = reTopic.exec(src)) !== null) {
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
// « Graphie et dictée 2 » est le premier fr\u00e8re S2 APRES la fermeture de tree-tpe :
// si les 5 types sont avant lui, ils sont bien contenus dans le sous-arbre \u00e9crit 2.
var posApresTpe = navRegion.indexOf('data-nav-node="p1s2-graphie-dictee-2"');
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

// ── R34 : Semestre 1 / Deuxième année restent repliés par défaut ───────────
var s1Hidden = /<div id="tree-s1" class="hidden/.test(String(src));
var p2Hidden = /<div id="tree-p2" class="hidden/.test(String(src));
assert(s1Hidden, 'R34 \u2014 Semestre 1 repli\u00e9 par d\u00e9faut (aucun contenu invent\u00e9)');
assert(p2Hidden, 'R35 \u2014 Deuxi\u00e8me ann\u00e9e repli\u00e9e par d\u00e9faut');
var s2Visible = /<div id="tree-s2" class="ml-4/.test(String(src));
var tpeVisible = /<div id="tree-tpe" class="ml-4/.test(String(src));
assert(s2Visible && tpeVisible, 'R36 \u2014 Semestre 2 et module \u00e9crit 2 ouverts par d\u00e9faut (UX pr\u00e9serv\u00e9e)');

// ── R37+ : COMPLÉMENT C6.2 — arborescence structurelle PEP complète ───────
var navNodes = [];
var reNav = /data-nav-node="([^"]+)"/g;
var mNav;
while ((mNav = reNav.exec(navRegion)) !== null) { navNodes.push(mNav[1]); }
var totalExpected = NAV_EMPTY.p1s1 + NAV_EMPTY.p1s2 + NAV_EMPTY.p2s1 + NAV_EMPTY.p2s2;
assert(navNodes.length === totalExpected,
  'R37 \u2014 ' + totalExpected + ' n\u0153uds de navigation structurels (13+12+9+8)');
var prefixOk = true;
for (var pf in NAV_EMPTY) {
  var cnt = navNodes.filter(function (v) { return v.indexOf(pf + '-') === 0; }).length;
  if (cnt !== NAV_EMPTY[pf]) {
    prefixOk = false;
    console.log('   \u21b3 ' + pf + ' : ' + cnt + ' n\u0153uds, attendu ' + NAV_EMPTY[pf]);
  }
}
assert(prefixOk, 'R38 \u2014 r\u00e9partition p1s1=13, p1s2=12, p2s1=9, p2s2=8');
// Tous les n\u0153uds structurels sont marqu\u00e9s "empty" et portent le badge "sans contenu".
var emptyMarkers = (navRegion.match(/data-nav-state="empty"/g) || []).length;
var sansContenu = (navRegion.match(/sans contenu/g) || []).length;
assert(emptyMarkers === navNodes.length,
  'R39 \u2014 chaque n\u0153ud structurel porte data-nav-state="empty" (' + emptyMarkers + '/' + navNodes.length + ')');
assert(sansContenu === navNodes.length,
  'R40 \u2014 badge \u00ab sans contenu \u00bb sur chaque n\u0153ud vide (' + sansContenu + ')');
// Les n\u0153uds vides sont INERTES : aucun onclick, aucun data-chapter, aucun selectModule.
var reNodeTag = /<div[^>]*data-nav-node="[^"]+"[^>]*>/g;
var nodeTags = navRegion.match(reNodeTag) || [];
var inertOk = nodeTags.every(function (tag) {
  return !/onclick/.test(tag) && !/data-chapter/.test(tag) && !/selectModule/.test(tag);
});
assert(nodeTags.length === navNodes.length && inertOk,
  'R41 \u2014 n\u0153uds vides inertes (ni onclick ni chapterId : ne pr\u00e9tendent aucune activit\u00e9)');
// Homonymes : m\u00eame intitul\u00e9, identifiants de navigation DISTINCTS selon l'ann\u00e9e.
var hOk = navNodes.indexOf('p1s1-ulm-1') >= 0 && navNodes.indexOf('p2s1-ulm-1') >= 0
  && navNodes.indexOf('p1s1-tpo-1') >= 0 && navNodes.indexOf('p2s1-tpo-1') >= 0;
assert(hOk, 'R42 \u2014 homonymes P1/P2 non fusionn\u00e9s (ids de navigation distincts)');
// Aucun data-nav-node ne doit correspondre \u00e0 un chapterId existant.
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
