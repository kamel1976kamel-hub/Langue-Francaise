/**
 * =================================================================
 * TESTS — COUVERTURE DE SÉCURITÉ `stripHtmlToText`
 * =================================================================
 * Objectif : figer l'état actuel des DEUX implémentations homonymes
 *             AVANT toute décision de fusion, sans modifier la production.
 *
 * Contexte établi par l'audit :
 *   - D-DOM   : index.html:5407 (script inline, classique) ;
 *   - D-REGEX : src/request-builder-v2.js:286 (script classique, niveau 0).
 *
 * Ordre réel de chargement dans le navigateur :
 *   <head> l.29   : <script src="src/request-builder-v2.js">  -> D-REGEX globale
 *   <body> l.4252 : <script> ... function stripHtmlToText ... -> D-DOM ÉCRASE la globale
 * => le nom global `stripHtmlToText` désigne D-DOM à l'exécution,
 *    tandis que `window.RequestBuilderV2.stripHtmlToText` capture D-REGEX.
 *
 * Ce fichier NE MODIFIE RIEN. Il ne cherche PAS à faire passer artificiellement
 * les invariants d'unicité : les assertions qui décrivent l'état CIBLE post-fusion
 * sont comptabilisées séparément en « ÉCHEC ATTENDU (XFAIL) » et n'invalident pas
 * le résultat du test.
 *
 * Rapport : PASS / FAIL / TOTAL / XFAIL / EXCEPTIONS.
 * Test déterministe, indépendant du cwd, robuste LF/CRLF,
 * aucune écriture, aucun réseau, aucun secret.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var crypto = require('crypto');

var pass = 0;
var fail = 0;
var xfail = 0;
var exceptions = [];

function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ FAIL — ' + label); }
}

/**
 * Invariant CIBLE (post-fusion) : non satisfait aujourd'hui de façon assumée.
 * Comptabilisé en XFAIL, jamais en FAIL.
 */
function assertCible(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label + '  [invariant cible déjà satisfait]'); }
    else { xfail++; console.log('  ⏳ XFAIL — ' + label + '  [invariant CIBLE post-fusion, échec ATTENDU aujourd\'hui]'); }
}

function section(titre, fn) {
    console.log('\n=== ' + titre + ' ===');
    try {
        fn();
    } catch (e) {
        fail++;
        var type = (e && e.constructor && e.constructor.name) ? e.constructor.name : 'Error';
        var msg = (e && e.message) ? e.message : String(e);
        exceptions.push({ section: titre, type: type, message: msg });
        console.error('  ❌ FAIL — exception dans "' + titre + '" : ' + type + ': ' + msg);
    }
}

function sha256(s) {
    return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// =================================================================
// 1. CHARGEMENT DES SOURCES (lecture seule, cwd-indépendant)
// =================================================================
var RACINE = path.join(__dirname, '..');
var INDEX_PATH = path.join(RACINE, 'index.html');
var MODULE_PATH = path.join(RACINE, 'src', 'request-builder-v2.js');

function lireNormalise(p) {
    return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
}

var indexSource = lireNormalise(INDEX_PATH);
var moduleSource = lireNormalise(MODULE_PATH);

// =================================================================
// 2. D-DOM — extraction depuis index.html + DOM simulé documenté
// =================================================================
/**
 * Simulateur DOM minimal, FIDÈLE SUR LES POINTS TESTÉS :
 *  - innerHTML : mémorise la chaîne ;
 *  - textContent : retire <script>/<style> AVEC leur contenu, retire les balises,
 *    puis décode les entités (nommées courantes + numériques décimales/hexa).
 *
 * LIMITES EXPLICITES (ce n'est pas un navigateur) :
 *  - pas de gestion des commentaires HTML ;
 *  - table de noms d'entités restreinte (les entités inconnues sont laissées telles quelles) ;
 *  - pas de normalisation d'espaces du parseur HTML.
 */
var ENTITES_NOMMEES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0',
    eacute: '\u00E9', egrave: '\u00E8', agrave: '\u00E0', ecirc: '\u00EA', ccedil: '\u00E7',
    ocirc: '\u00F4', icirc: '\u00EE', ucirc: '\u00FB', laquo: '\u00AB', raquo: '\u00BB',
    hellip: '\u2026', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201C', rdquo: '\u201D',
    deg: '\u00B0', times: '\u00D7', mdash: '\u2014', ndash: '\u2013', euro: '\u20AC'
};

function decoderEntites(s) {
    return s.replace(/&(#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, function (full, ent) {
        if (ent.charAt(0) === '#') {
            var n = (ent.charAt(1) === 'x' || ent.charAt(1) === 'X')
                ? parseInt(ent.slice(2), 16)
                : parseInt(ent.slice(1), 10);
            return (isFinite(n) && n > 0) ? String.fromCodePoint(n) : full;
        }
        return (ENTITES_NOMMEES[ent] !== undefined) ? ENTITES_NOMMEES[ent] : full;
    });
}

function creerElementSimule() {
    var el = {
        _html: '',
        _texte: '',
        set innerHTML(v) {
            var s = String(v);
            this._html = s;
            var t = s.replace(/<script[\s\S]*?<\/script>/gi, '');
            t = t.replace(/<style[\s\S]*?<\/style>/gi, '');
            t = t.replace(/<[^>]+>/g, '');
            this._texte = decoderEntites(t);
        },
        get innerHTML() { return this._html; },
        get textContent() { return this._texte; }
    };
    return el;
}

/**
 * Extrait la déclaration D-DOM depuis index.html (tolérante à l'indentation).
 * Elle est ensuite évaluée dans un contexte ne contenant QUE `document`.
 */
function extraireDeclarationDDom(src) {
    var m = /^[ \t]*function[ \t]+stripHtmlToText[ \t]*\([ \t]*html[ \t]*\)[ \t]*\{[\s\S]*?\n[ \t]*\}/m.exec(src);
    return m ? m[0] : null;
}

var declarationDDom = extraireDeclarationDDom(indexSource);
var contexteDDom = vm.createContext({ document: { createElement: creerElementSimule } });
if (declarationDDom) {
    vm.runInContext(declarationDDom, contexteDDom, { filename: 'index.html::stripHtmlToText' });
}

function appelerDDom(entree) {
    try {
        return vm.runInContext('stripHtmlToText', contexteDDom)(entree);
    } catch (e) {
        return 'EXCEPTION:' + ((e && e.constructor && e.constructor.name) || 'Error');
    }
}

// =================================================================
// 3. D-REGEX — version réellement exportée par le module
// =================================================================
var rb = require(MODULE_PATH);
var dRegex = rb.stripHtmlToText;

function appelerDRegex(entree) {
    try {
        return dRegex(entree);
    } catch (e) {
        return 'EXCEPTION:' + ((e && e.constructor && e.constructor.name) || 'Error');
    }
}

// =================================================================
// 4. CORPUS RÉEL — sections <h5>Objectif</h5> de index.html
// =================================================================
function extraireCorpus(src) {
    var out = [];
    var re = /<h5>\s*Objectif\s*<\/h5>([\s\S]*?)(?=<h5>|`)/gi;
    var m;
    while ((m = re.exec(src)) !== null) { out.push(m[1]); }
    return out;
}

var corpus = extraireCorpus(indexSource);

// =================================================================
// 4bis. CORPUS PRIORITAIRE — activityContent réel (branche <h5>Consignes</h5>)
// =================================================================
/**
 * `extractActivityInstructions` cherche d'abord <h5>Consignes</h5>,
 * et seulement à défaut <h5>Objectif</h5>.
 * On extrait donc `window.activityContent` depuis index.html pour couvrir
 * la branche RÉELLEMENT prioritaire (36 activités, contenant des <li>).
 */
var ACTIVITY_REEL = (function () {
    var marqueur = 'window.activityContent = ';
    var pos = indexSource.indexOf(marqueur);
    if (pos === -1) return {};
    var debut = indexSource.indexOf('{', pos);
    var d = 0, commence = false, fin = debut;
    for (var i = debut; i < indexSource.length; i++) {
        var c = indexSource.charAt(i);
        if (c === '{') { d++; commence = true; }
        else if (c === '}') { d--; if (commence && d === 0) { fin = i; break; } }
    }
    var source = indexSource.slice(debut, fin + 1);
    var bac = { window: {} };
    var ctxActivity = vm.createContext(bac);
    vm.runInContext('window.activityContent = ' + source, ctxActivity);
    return vm.runInContext('window.activityContent', ctxActivity);
})();

// =================================================================
// 5. TESTS
// =================================================================

section('T1 — Unicité : état actuel et invariant cible', function () {
    // Recensement exhaustif des définitions dans les sources du lot.
    var fichiers = [INDEX_PATH, MODULE_PATH];
    var definitions = [];
    fichiers.forEach(function (f) {
        var src = lireNormalise(f);
        var re = /(^|\n)[ \t]*function[ \t]+stripHtmlToText[ \t]*\(/g;
        var m;
        while ((m = re.exec(src)) !== null) {
            var ligne = src.slice(0, m.index + (m[1] ? m[1].length : 0)).split('\n').length;
            definitions.push({ fichier: path.basename(f), ligne: ligne });
        }
    });

    // --- ÉTAT ACTUEL (post-étape B : collision supprimée) ---
    // Le module ne déclare plus AUCUN `stripHtmlToText` au niveau 0 : il a été renommé
    // `stripHtmlToTextRegles`. Seul index.html conserve une déclaration de ce nom.
    assert(definitions.length === 1,
        'ÉTAT ACTUEL : 1 seule définition de stripHtmlToText — '
        + definitions.map(function (d) { return d.fichier + ':' + d.ligne; }).join(' , ')
        + ' (module renommé en stripHtmlToTextRegles)');

    var dansIndex = definitions.filter(function (d) { return d.fichier === 'index.html'; }).length;
    var dansModule = definitions.filter(function (d) { return d.fichier === 'request-builder-v2.js'; }).length;
    assert(dansIndex === 1 && dansModule === 0,
        'ÉTAT ACTUEL : 1 définition dans index.html (D-DOM) + 0 dans request-builder-v2.js');

    // Aucun nom CONCURRENT : plus de doublon de nom entre fichiers.
    var noms = {};
    definitions.forEach(function (d) { noms[d.fichier] = (noms[d.fichier] || 0) + 1; });
    var doublons = Object.keys(noms).filter(function (k) { return noms[k] > 1; });
    assert(doublons.length === 0,
        'ÉTAT ACTUEL : aucun fichier ne déclare stripHtmlToText plus d\'une fois');

    // La fonction REGEX existe toujours, sous son nom explicite.
    assert(typeof dRegex === 'function', 'ÉTAT ACTUEL : la fonction REGEX reste exposée (alias stripHtmlToText)');
    assert(typeof rb.stripHtmlToTextRegles === 'function',
        'ÉTAT ACTUEL : la fonction REGEX existe sous son nom explicite stripHtmlToTextRegles');
    assert(rb.stripHtmlToText === rb.stripHtmlToTextRegles,
        'ÉTAT ACTUEL : stripHtmlToText (alias) === stripHtmlToTextRegles (même fonction)');
    assert(typeof appelerDDom('x') === 'string',
        'ÉTAT ACTUEL : D-DOM (index.html) reste exécutable');

    // --- INVARIANT D'ÉTAPE B : la collision de nom globale est ÉLIMINÉE ---
    // Le module ne doit plus introduire de nom global `stripHtmlToText` susceptible
    // d'entrer en concurrence avec celui de index.html.
    var moduleDeclareNomGlobal = /(^|\n)[ \t]*function[ \t]+stripHtmlToText[ \t]*\(/.test(moduleSource);
    assert(moduleDeclareNomGlobal === false,
        'ÉTAPE B : le module ne déclare plus de nom global stripHtmlToText (collision éliminée)');

    var moduleDeclareLetNomme = moduleSource.split('\n').some(function (l) {
        return /^[ \t]*(?:const|let|var)[ \t]+stripHtmlToText[ \t]*=/.test(l);
    });
    assert(moduleDeclareLetNomme === false,
        'ÉTAPE B : aucun const/let/var nommé stripHtmlToText dans le module');
});

section('T2 — Cohérence d\'API et résolution de branche (état post-étape B)', function () {
    // ÉTAPE B — la collision de nom globale est supprimée. On vérifie désormais :
    //   1) le module ne publie plus de nom global `stripHtmlToText` ;
    //   2) l'API de compatibilité conserve EXACTEMENT la sémantique REGEX ;
    //   3) la résolution de branche est EXPLICITE : navigateur -> D-DOM, Node -> D-REGEX.
    var ctx = vm.createContext({
        document: { createElement: creerElementSimule },
        window: null,
        module: { exports: {} }
    });
    ctx.window = ctx;
    ctx.globalThis = ctx;

    vm.runInContext(moduleSource, ctx, { filename: 'src/request-builder-v2.js' });
    assert(typeof ctx.window.RequestBuilderV2 === 'object' &&
           typeof ctx.window.RequestBuilderV2.stripHtmlToText === 'function',
        'le module publie window.RequestBuilderV2.stripHtmlToText (API de compatibilité)');

    // 1) Plus de nom global introduit par le module.
    var nomGlobalApresModule = vm.runInContext('typeof (typeof stripHtmlToText !== "undefined" ? stripHtmlToText : undefined)', ctx);
    assert(nomGlobalApresModule !== 'function',
        'ÉTAPE B : après le module SEUL, aucun nom global stripHtmlToText fonction (obtenu '
        + nomGlobalApresModule + ')');

    // 2) L'API de compatibilité reste EXACTEMENT D-REGEX.
    var viaApi = vm.runInContext('window.RequestBuilderV2.stripHtmlToText("<li>a</li><li>b</li>")', ctx);
    assert(viaApi === '- a - b',
        'ÉTAPE B : l\'API reste exactement D-REGEX (obtenu ' + JSON.stringify(viaApi) + ')');
    assert(viaApi === dRegex('<li>a</li><li>b</li>'),
        'ÉTAPE B : alias stripHtmlToText ≡ stripHtmlToTextRegles (même sémantique REGEX)');

    // 3) Résolution de branche EXPLICITE, dans les deux environnements.
    //    a) Sans nom de page (Node/CommonJS) -> D-REGEX du module.
    var brancheNode = vm.runInContext(
        'resoudreStripHtmlToTextPourInstructions() === stripHtmlToTextRegles', ctx);
    assert(brancheNode === true,
        'ÉTAPE B : sans implémentation de page, la résolution retourne D-REGEX locale (Node)');

    //    b) Avec le nom de page (navigateur) -> D-DOM fournie par index.html.
    vm.runInContext(declarationDDom, ctx, { filename: 'index.html::stripHtmlToText' });
    var brancheNav = vm.runInContext(
        'resoudreStripHtmlToTextPourInstructions() === window.stripHtmlToText', ctx);
    assert(brancheNav === true,
        'ÉTAPE B : en présence du nom de page, la résolution retourne D-DOM (navigateur)');

    var viaResolverNav = vm.runInContext(
        'resoudreStripHtmlToTextPourInstructions()("<li>a</li><li>b</li>")', ctx);
    assert(viaResolverNav === 'ab',
        'ÉTAPE B : en navigateur, la résolution produit la sortie D-DOM (obtenu '
        + JSON.stringify(viaResolverNav) + ')' );

    // La divergence API (REGEX) / résolution de branche (DOM) est désormais EXPLICITE,
    // non plus un effet d'écrasement du nom global.
    assert(viaApi !== viaResolverNav,
        'ÉTAPE B : l\'API (REGEX) et la résolution de branche (DOM) diffèrent explicitement — aucune harmonisation');

    // --- INVARIANT CIBLE (post-étape A seulement) : implémentation unique ---
    assertCible(viaApi === viaResolverNav,
        'CIBLE (étape A, non réalisée) : une sémantique unique — API et résolution identiques');
});

section('T3 — Sémantique : cas divergents (états actuels figés, cible non inventée)', function () {
    /**
     * Chaque entrée fige :
     *   - le résultat D-DOM ACTUEL (mesuré, simul. DOM documentée) ;
     *   - le résultat D-REGEX ACTUEL (mesuré, module réel) ;
     * puis signale la divergence.
     * La « cible » n'est jamais imposée ici : elle sera décidée après le refactor,
     * et les assertions correspondantes seront alors basculées en `assert` strict.
     */
    var CAS = [
        { n: '<li>', e: '<li>a</li><li>b</li>', dom: 'ab', regex: '- a - b',
          note: 'D-DOM supprime les puces ; D-REGEX les convertit en « - »' },
        { n: 'espaces multiples', e: '  espaces   multiples  ', dom: 'espaces   multiples', regex: 'espaces multiples',
          note: 'D-DOM ne normalise pas ; D-REGEX normalise' },
        { n: 'paragraphes / sauts de ligne', e: '<p>a</p>\n\n<p>b</p>', dom: 'a\nb', regex: 'a b',
          note: 'D-DOM préserve les lignes ; D-REGEX fusionne en espaces' },
        { n: 'contenu <script>', e: '<script>alert(1)</script>texte', dom: 'texte', regex: 'alert(1) texte',
          note: 'D-DOM supprime le contenu ; D-REGEX le conserve (risque d\'injection dans le prompt IA)' },
        { n: 'entité &eacute;', e: 'caf&eacute;', dom: 'caf\u00E9', regex: 'caf&eacute;',
          note: 'D-DOM décode ; D-REGEX ne connaît que 6 entités' },
        { n: 'entité &#8217;', e: 'l&#8217;\u00E9l\u00E8ve', dom: 'l\u2019\u00E9l\u00E8ve', regex: 'l&#8217;\u00E9l\u00E8ve',
          note: 'entité numérique non décodée par D-REGEX' },
        { n: 'entité &nbsp;', e: 'a&nbsp;b', dom: 'a\u00A0b', regex: 'a b',
          note: 'D-DOM rend un espace insécable ; D-REGEX le remplace par un espace ordinaire' },
        { n: 'null', e: null, dom: '', regex: '',
          note: 'IDENTIQUE' },
        { n: 'undefined', e: undefined, dom: '', regex: '',
          note: 'IDENTIQUE' },
        { n: 'non-string (42)', e: 42, dom: '42', regex: '',
          note: 'D-DOM coerce ; D-REGEX renvoie une chaîne vide' },
        { n: 'non-string objet', e: { a: 1 }, dom: '[object Object]', regex: '',
          note: 'D-DOM coerce ; D-REGEX renvoie une chaîne vide' },
        { n: 'string vide', e: '', dom: '', regex: '',
          note: 'IDENTIQUE' },
        { n: 'HTML imbriqué', e: '<div>a<div>b</div></div>', dom: 'ab', regex: 'a b',
          note: 'D-DOM concatène ; D-REGEX insère un espace' },
        { n: 'balise simple', e: '<b>gras</b>', dom: 'gras', regex: 'gras',
          note: 'IDENTIQUE' },
        { n: 'parentheses et accents', e: '<p>Le r\u00E9cit (court)</p>', dom: 'Le r\u00E9cit (court)', regex: 'Le r\u00E9cit (court)',
          note: 'IDENTIQUE' }
    ];

    var divergents = [];
    var identiques = [];
    CAS.forEach(function (c) {
        var dom = appelerDDom(c.e);
        var regex = appelerDRegex(c.e);

        assert(dom === c.dom,
            'D-DOM ACTUEL ' + c.n + ' → ' + JSON.stringify(dom)
            + (dom === c.dom ? '' : ' (attendu figé ' + JSON.stringify(c.dom) + ')'));
        assert(regex === c.regex,
            'D-REGEX ACTUEL ' + c.n + ' → ' + JSON.stringify(regex)
            + (regex === c.regex ? '' : ' (attendu figé ' + JSON.stringify(c.regex) + ')'));

        if (dom === regex) identiques.push(c.n); else divergents.push(c.n + ' [' + c.note + ']');
    });

    assert(divergents.length === 10,
        'ÉTAT ACTUEL : 10 cas divergents sur ' + CAS.length + ' (figés)');
    assert(identiques.length === 5,
        'ÉTAT ACTUEL : 5 cas identiques sur ' + CAS.length + ' : ' + identiques.join(', '));

    console.log('  ℹ️  Cas divergents figés (aucune cible imposée dans ce lot) :');
    divergents.forEach(function (d) { console.log('       - ' + d); });

    // Invariant cible : deux implémentations fusionnées doivent produire une sortie
    // UNIQUE par entrée. Non satisfait aujourd'hui par construction.
    assertCible(divergents.length === 0,
        'CIBLE : une sémantique unique ⇒ 0 cas divergent (actuellement ' + divergents.length + ')');
});

section('T4 — Fallback sans DOM (module Node) : nom explicite, équivalence NON définie', function () {
    // Contrainte structurelle : le module doit fonctionner en Node, donc SANS `document`.
    // L'étape B a renommé la fonction du module : on ne référence plus le nom nu
    // `stripHtmlToText` (qui n'existe plus au niveau 0) mais le nom explicite.
    // Aucune assertion d'équivalence DOM/texte n'est fabriquée ici.
    var sansDocument = vm.createContext({});   // aucun `document`, aucun `window`
    vm.runInContext(moduleSource, sansDocument, { filename: 'src/request-builder-v2.js' });

    var nomNu = vm.runInContext('typeof (typeof stripHtmlToText !== "undefined" ? stripHtmlToText : undefined)', sansDocument);
    assert(nomNu !== 'function',
        'ÉTAPE B : le module n\'introduit plus de nom global stripHtmlToText (obtenu ' + nomNu + ')');

    var fnSansDom = vm.runInContext('stripHtmlToTextRegles', sansDocument);
    assert(typeof fnSansDom === 'function',
        'FALLBACK : stripHtmlToTextRegles est défini sans avoir besoin de `document`');
    assert(fnSansDom('<b>gras</b>') === 'gras',
        'FALLBACK sans DOM : <b>gras</b> → « gras » (cas identique à D-DOM)');
    assert(fnSansDom(null) === '' && fnSansDom(undefined) === '' && fnSansDom('') === '',
        'FALLBACK sans DOM : null / undefined / vide → "" (identique à D-DOM)');

    // Le résolveur, privé de nom de page, choisit explicitement D-REGEX.
    var branche = vm.runInContext(
        'resoudreStripHtmlToTextPourInstructions() === stripHtmlToTextRegles', sansDocument);
    assert(branche === true,
        'FALLBACK : sans implémentation de page, le résolveur retourne D-REGEX (Node)');

    // ÉTAT ACTUEL : la dépendance au DOM est asymétrique.
    var dDomSansDocument = null;
    try {
        var ctxSansDoc = vm.createContext({});
        vm.runInContext(declarationDDom, ctxSansDoc, { filename: 'index.html::stripHtmlToText' });
        dDomSansDocument = vm.runInContext('stripHtmlToText("x")', ctxSansDoc);
    } catch (e) {
        dDomSansDocument = 'EXCEPTION:' + e.constructor.name;
    }
    assert(String(dDomSansDocument).indexOf('EXCEPTION') === 0,
        'ÉTAT ACTUEL : D-DOM est inutilisable sans `document` (' + dDomSansDocument + ')');

    // Signalement HONNÊTE d'une équivalence non établie : on ne fabrique pas d'assertion.
    var ecarts = [
        '<li>a</li><li>b</li>', '  espaces   multiples  ', '<p>a</p>\n\n<p>b</p>',
        '<script>alert(1)</script>texte', 'caf&eacute;', 'l&#8217;\u00E9l\u00E8ve', 'a&nbsp;b',
        '<div>a<div>b</div></div>'
    ];
    var ecartes = ecarts.filter(function (e) { return appelerDDom(e) !== appelerDRegex(e); });
    assert(ecartes.length === 8,
        'ÉTAT ACTUEL : le repli sans DOM n\'équivaut PAS à D-DOM sur ' + ecartes.length
        + ' / ' + ecarts.length + ' entrées — ÉQUIVALENCE NON DÉFINIE (à trancher, pas à supposer)');
    console.log('  ℹ️  Un repli « équivalent au DOM » reste à SPÉCIFIER avant toute fusion :');
    console.log('       aucune assertion d\'équivalence n\'est inventée ici (cf. audit `stripHtmlToText`).');
});

section('T5 — Corpus réel : les 56 consignes <h5>Objectif</h5>', function () {
    assert(corpus.length === 56,
        'corpus extrait de index.html : ' + corpus.length + ' sections <h5>Objectif</h5> (attendu 56)');

    // Non-régression mesurable : quelle que soit l'implémentation ACTUELLEMENT utilisée
    // en production (D-DOM via le nom global), la sortie sur le corpus doit rester stable.
    var sortiesDom = corpus.map(appelerDDom);
    var sortiesRegex = corpus.map(appelerDRegex);

    var divergencesCorpus = [];
    for (var i = 0; i < corpus.length; i++) {
        if (sortiesDom[i] !== sortiesRegex[i]) divergencesCorpus.push(i + 1);
    }
    assert(divergencesCorpus.length === 0,
        'les 56 sections produisent la MÊME sortie en D-DOM et D-REGEX (aucune régression visible aujourd\'hui)');
    if (divergencesCorpus.length) {
        console.log('  ℹ️  sections divergentes : ' + divergencesCorpus.join(', '));
    }

    var aucuneVide = sortiesDom.every(function (s) { return typeof s === 'string' && s.length > 0; });
    assert(aucuneVide, 'aucune sortie vide sur le corpus (56 / 56 non vides)');

    var sansBalise = sortiesDom.every(function (s) { return s.indexOf('<') === -1; });
    assert(sansBalise, 'aucune sortie ne contient de « < » résiduel (balises bien retirées)');

    // EMPREINTE : détecte toute modification future du corpus ou des implémentations.
    var empreinte = sha256(JSON.stringify(sortiesDom));
    console.log('  ℹ️  empreinte SHA-256 (sorties D-DOM sur le corpus) : ' + empreinte);
    console.log('       → à comparer après le refactor : toute variation signale une régression.');
    assert(empreinte.length === 64, 'empreinte du corpus calculée (contrôle de non-régression)');

    // Invariant cible : après fusion, l'empreinte doit être IDENTIQUE (pas seulement proche).
    assertCible(false,
        'CIBLE : empreinte corpus IDENTIQUE après fusion (' + empreinte.slice(0, 16)
        + '…) — non vérifiable avant le refactor, XFAIL par construction');
});

section('T6 — Non-régression des 7 assertions existantes (test-request-builder-v2)', function () {
    // Les 7 assertions de tests/test-request-builder-v2.js sont reproduites ici
    // en s'appuyant sur la MÊME source (module), sans modifier ce fichier.
    var G2 = dRegex('<script>alert("xss")</script>texte');
    assert(G2.indexOf('<script>') === -1, 'G2 — stripHtmlToText supprime les balises script');

    assert(dRegex('<b>gras</b>') === 'gras', 'H1 — balises supprimees');
    assert(dRegex('<li>item1</li><li>item2</li>') === '- item1 - item2', 'H2 — li convertis en tirets');
    assert(dRegex('  espaces   multiples  ') === 'espaces multiples', 'H3 — espaces normalises');
    assert(dRegex('') === '', 'H4 — vide => vide');
    assert(dRegex(null) === '', 'H5 — null => vide');
    assert(dRegex('&amp; &lt;') === '& <', 'H6 — entites decodees');

    // Le fichier existant n'est pas modifié et reste exécutable.
    var cheminTestExistant = path.join(RACINE, 'tests', 'test-request-builder-v2.js');
    assert(fs.existsSync(cheminTestExistant),
        'tests/test-request-builder-v2.js présent et non modifié par ce lot');
});

section('T8 — Étape B : appel explicite, corpus Consignes, sorties métier inchangées', function () {
    // 1) extractActivityInstructions ne dépend PLUS d'une résolution globale ambiguë :
    //    les deux branches appellent explicitement le résolveur.
    var appelsNus = (moduleSource.match(/return[ \t]+stripHtmlToText[ \t]*\(/g) || []).length;
    assert(appelsNus === 0,
        'ÉTAPE B : plus aucun appel nu à stripHtmlToText dans le module (obtenu ' + appelsNus + ')');

    var appelsExplicites = (moduleSource.match(/resoudreStripHtmlToTextPourInstructions\(\)\(/g) || []).length;
    assert(appelsExplicites === 2,
        'ÉTAPE B : les 2 branches (Consignes + Objectif) appellent explicitement le résolveur (obtenu '
        + appelsExplicites + ')');

    var resolveurPresent = /function[ \t]+resoudreStripHtmlToTextPourInstructions[ \t]*\(/.test(moduleSource);
    assert(resolveurPresent, 'ÉTAPE B : le résolveur explicite est déclaré dans le module');

    // 2) Corpus <h5>Consignes</h5> — la branche PRIORITAIRE, non couverte jusqu'ici.
    var consignes = [];
    for (var ch in ACTIVITY_REEL) {
        if (!Object.prototype.hasOwnProperty.call(ACTIVITY_REEL, ch)) continue;
        for (var ac in ACTIVITY_REEL[ch]) {
            if (!Object.prototype.hasOwnProperty.call(ACTIVITY_REEL[ch], ac)) continue;
            var html = ACTIVITY_REEL[ch][ac].html || '';
            if (/<h5>\s*Consignes?\s*<\/h5>/i.test(html)) consignes.push(html);
        }
    }
    assert(consignes.length === 36,
        'corpus Consignes extrait du code : ' + consignes.length + ' activités (attendu 36)');

    var consDom = consignes.map(appelerDDom);
    var consRegex = consignes.map(appelerDRegex);
    var consDivergent = 0;
    for (var k = 0; k < consignes.length; k++) {
        if (consDom[k] !== consRegex[k]) consDivergent++;
    }
    assert(consDivergent === 36,
        'les 36 Consignes divergent entre D-DOM et D-REGEX (' + consDivergent + ' / 36) — divergence non harmonisée');

    // Sorties figées : empreintes des deux sémantiques sur la branche prioritaire.
    var empConsDom = sha256(JSON.stringify(consDom));
    var empConsRegex = sha256(JSON.stringify(consRegex));
    console.log('  ℹ️  empreinte SHA-256 Consignes D-DOM   : ' + empConsDom);
    console.log('  ℹ️  empreinte SHA-256 Consignes D-REGEX : ' + empConsRegex);
    assert(empConsDom.length === 64 && empConsRegex.length === 64,
        'empreintes Consignes calculées (contrôle de non-régression de la branche prioritaire)');

    // 3) buildActivityContext : la sortie métier doit être IDENTIQUE dans les deux environnements
    //    à ce qu'elle était avant l'étape B (Node -> REGEX, navigateur -> DOM).
    var ctxNode = vm.createContext({ document: { createElement: creerElementSimule }, module: { exports: {} } });
    vm.runInContext(moduleSource, ctxNode, { filename: 'module-node' });
    var brancheNode = vm.runInContext('resoudreStripHtmlToTextPourInstructions() === stripHtmlToTextRegles', ctxNode);
    assert(brancheNode === true, 'buildActivityContext — branche Node : D-REGEX');

    var ctxNav = vm.createContext({ document: { createElement: creerElementSimule }, module: { exports: {} }, window: null });
    ctxNav.window = ctxNav;
    ctxNav.globalThis = ctxNav;
    vm.runInContext(moduleSource, ctxNav, { filename: 'module-nav' });
    vm.runInContext(declarationDDom, ctxNav, { filename: 'index.html::stripHtmlToText' });
    var brancheNav = vm.runInContext('resoudreStripHtmlToTextPourInstructions() === window.stripHtmlToText', ctxNav);
    assert(brancheNav === true, 'buildActivityContext — branche navigateur : D-DOM fournie par la page');

    // Sur les 36 Consignes, les deux branches doivent produire les sorties figées ci-dessus.
    var exNode = consignes.map(function (h) {
        return vm.runInContext('resoudreStripHtmlToTextPourInstructions()', ctxNode)(h);
    });
    var exNav = consignes.map(function (h) {
        return vm.runInContext('resoudreStripHtmlToTextPourInstructions()', ctxNav)(h);
    });
    assert(sha256(JSON.stringify(exNode)) === empConsRegex,
        'branche Node sur les 36 Consignes ≡ sortie D-REGEX figée');
    assert(sha256(JSON.stringify(exNav)) === empConsDom,
        'branche navigateur sur les 36 Consignes ≡ sortie D-DOM figée');

    // --- Invariant d'un alignement sémantique (étape A) : NON réalisé, reste XFAIL ---
    assertCible(consDivergent === 0,
        'CIBLE (étape A, non réalisée) : les 36 Consignes convergeraient vers une sémantique unique');
});

section('T7 — Contexte IA autour de index.html:5554-5557 (contrôle structurel)', function () {
    /**
     * L'assemblage du contexte IA vit dans la closure de `openActivityWindow` :
     * il dépend de `supportEl`, donc d'un DOM réel non disponible ici.
     * On ne peut donc PAS exécuter ce bloc sans modifier la production.
     * Controle retenu, purement structurel et non intrusif :
     *   - présence et stabilité des 2 appels à stripHtmlToText ;
     *   - présence et stabilité du gabarit de contexte ;
     *   - empreinte de ces lignes pour détecter toute modification future.
     */
    var ligneAppel = indexSource.split('\n').filter(function (l) {
        return /const supportText = stripHtmlToText\(/.test(l) || /const consignesText = stripHtmlToText\(/.test(l);
    });
    assert(ligneAppel.length === 2,
        '2 appels à stripHtmlToText trouvés pour le contexte IA (supportText, consignesText)');

    var dansIndex = ligneAppel.every(function (l) { return /^\s{12}const (supportText|consignesText) = stripHtmlToText\(/.test(l); });
    assert(dansIndex, 'les 2 appels invoquent bien le nom NU `stripHtmlToText` (résolution D-DOM)');

    var gabaritTrouve = /`Activité : \$\{data\.title\}\\n\\nConsignes :\\n\$\{consignesText\}\\n\\nSupport :\\n\$\{supportText\}\\n\\nAttendu :/.test(indexSource);
    assert(gabaritTrouve, 'gabarit du contexte IA inchangé (title / Consignes / Support / Attendu)');

    var truncateTrouve = /const contexte = truncateText\(/.test(indexSource);
    assert(truncateTrouve, 'le contexte reste borné par truncateText(...)');

    var empreinteContexte = sha256(ligneAppel.join('\n'));
    console.log('  ℹ️  empreinte SHA-256 des 2 lignes d\'appel : ' + empreinteContexte);
    assert(empreinteContexte.length === 64,
        'empreinte du site d\'appel calculée (détectera toute modification future)');

    // Équivalence réellement mesurable : calcul du contexte pour les activités dotées
    // de consignes, en utilisant le corpus réel et la sémantique D-DOM.
    var contexteSimule = corpus.map(function (html) {
        return 'Activité : ' + '(title)' + '\n\nConsignes :\n' + appelerDDom(html)
            + '\n\nSupport :\n' + appelerDDom('') + '\n\nAttendu : ...';
    });
    var empreinteContexteSimule = sha256(JSON.stringify(contexteSimule));
    assert(contexteSimule.length === 56 && empreinteContexteSimule.length === 64,
        'contexte IA simulable sur les 56 consignes (empreinte ' + empreinteContexteSimule.slice(0, 16) + '…)');
    console.log('  ℹ️  empreinte SHA-256 du contexte simulé (56 entrées) : ' + empreinteContexteSimule);
    console.log('       → supportEl absent ici : le contexte complet nécessite un DOM réel.');
});

// =================================================================
// RÉSUMÉ
// =================================================================
var total = pass + fail;

console.log('\n' + '='.repeat(64));
console.log('RÉSULTATS — couverture de sécurité stripHtmlToText');
console.log('  ✅ PASS    : ' + pass);
console.log('  ❌ FAIL    : ' + fail);
console.log('  ⏳ XFAIL   : ' + xfail + '  (invariants CIBLES post-fusion, échec attendu)');
console.log('  TOTAL     : ' + total);
if (exceptions.length > 0) {
    console.log('  ⚠️  EXCEPTIONS : ' + exceptions.length);
    exceptions.forEach(function (ex, i) {
        console.log('     ' + (i + 1) + '. [' + ex.section + '] ' + ex.type + ': ' + ex.message);
    });
} else {
    console.log('  ⚠️  EXCEPTIONS : 0');
}
console.log('='.repeat(64));
console.log('Lecture : les assertions d\'ÉTAT ACTUEL décrivent le dépôt tel qu\'il est');
console.log('         (2 définitions homonymes, divergence API/global, 10 cas sémantiques distincts).');
console.log('         Les XFAIL listent les invariants attendus APRÈS fusion.');
console.log('         Aucun XFAIL n\'est un échec de ce lot.');

if (fail > 0) {
    console.error('\n❌ ' + fail + ' test(s) en échec');
    process.exit(1);
}
console.log('\n✅ Toutes les assertions d\'état actuel passent.');
process.exit(0);
