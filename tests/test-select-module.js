/**
 * =================================================================
 * TESTS — FUSION selectModule (refactor « merge duplicate selectModule »)
 * =================================================================
 * Vérifie le comportement observable de window.selectModule après fusion
 * des deux définitions historiques (D1 « chapterId » + D2 « moduleId »)
 * en une définition unique.
 *
 * Approche : le bloc <script> inline principal de index.html est extrait,
 * puis exécuté dans un contexte instrumenté (document / location / history
 * simulés) afin d'observer le comportement réel de la fonction, plutôt que
 * de se coupler à son implémentation interne.
 *
 * Les valeurs attendues (titres de chapitres, titres et théories de parcours)
 * sont lues DEPUIS le contexte exécuté, jamais recopiées en dur.
 *
 * Chaque section est isolée : une exception devient un FAIL comptabilisé et
 * n'empêche pas les sections suivantes de s'exécuter.
 *
 * Tests en lecture seule : aucun fichier modifié, aucun déploiement.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var pass = 0;
var fail = 0;
var exceptions = [];

function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ FAIL — ' + label); }
}

/**
 * Exécute une section de test en isolant les exceptions : toute exception
 * devient un FAIL comptabilisé, et les sections suivantes continuent.
 */
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

var INDEX_PATH = path.join(__dirname, '..', 'index.html');
var html = fs.readFileSync(INDEX_PATH, 'utf8');
var lines = html.split('\n');

var IDS_CHAPITRES = [
    'narratif-1', 'narratif-2', 'narratif-3', 'narratif-4',
    'descriptif-1', 'descriptif-2', 'descriptif-3', 'descriptif-4',
    'explicatif-1', 'explicatif-2', 'explicatif-3', 'explicatif-4',
    'argumentatif-1', 'argumentatif-2', 'argumentatif-3', 'argumentatif-4'
];
var IDS_RESUME = ['resume-1', 'resume-2', 'resume-3', 'resume-4'];
var IDS_20 = IDS_CHAPITRES.concat(IDS_RESUME);
var PARCOURS = ['narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'];

// =================================================================
// 1. EXTRACTION DU BLOC SCRIPT INLINE PRINCIPAL
// =================================================================
function extraireBlocPrincipal() {
    var pairs = [];
    for (var i = 0; i < lines.length; i++) {
        if (/<script(?![^>]*\ssrc=)[^>]*>/.test(lines[i])) {
            for (var j = i + 1; j < lines.length; j++) {
                if (/<\/script>/.test(lines[j])) { pairs.push({ o: i, c: j }); break; }
            }
        }
    }
    var best = null;
    for (var k = 0; k < pairs.length; k++) {
        if (!best || (pairs[k].c - pairs[k].o) > (best.c - best.o)) best = pairs[k];
    }
    return lines.slice(best.o + 1, best.c).join('\n');
}

var blocCode = extraireBlocPrincipal();

/**
 * Localise le corps (accolades incluses) de la première fonction dont l'en-tête
 * correspond à `motif`. Utilisé pour borner une assertion à UNE définition plutôt
 * qu'au bloc entier. Une extraction ratée renvoie null : le test échoue alors
 * bruyamment au lieu de compter faux.
 */
function extraireCorpsFonction(code, motif) {
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
            if (profondeur === 0) return { debut: debut, fin: i };
        }
    }
    return null;
}

// Ids RÉELS du document : getElementById renvoie un élément si et seulement si
// l'id existe dans index.html (sémantique fidèle, y compris pour les ids absents
// comme contentMeta / contentTitle qui rendent un bloc inatteignable).
var IDS_REELS = (function () {
    var found = {};
    var re = /id\s*=\s*["']([^"']+)["']/g;
    var m;
    while ((m = re.exec(html)) !== null) { found[m[1]] = true; }
    return found;
})();

// P10 — l'arborescence Parcours n'est plus écrite en dur dans index.html : elle
// est fabriquée au démarrage par src/p10-context.js. Le simulateur enregistre les
// ids RÉELLEMENT émis par cette fabrique (modules-*, arrow-*, tree-* …) au lieu
// d'en recopier la liste : la sémantique « getElementById renvoie null si l'id
// n'existe pas » reste celle du navigateur.
var P10_REFERENTIEL = (function () {
    try {
        var mod = require(path.join(__dirname, '..', 'src', 'p10-context.js'));
        if (mod && typeof mod.renderParcoursTree === 'function' && typeof mod.buildContents === 'function') {
            return mod;
        }
    } catch (e) { /* référentiel indisponible : on s'en tient aux ids du HTML */ }
    return null;
})();

var IDS_GENERES = (function () {
    var found = {};
    if (!P10_REFERENTIEL) return found;
    var htmlGenere = P10_REFERENTIEL.renderParcoursTree({
        contents: P10_REFERENTIEL.buildContents({})
    });
    var re = /id\s*=\s*["']([^"']+)["']/g;
    var m;
    while ((m = re.exec(htmlGenere)) !== null) { found[m[1]] = true; }
    return found;
})();

// =================================================================
// 2. ÉLÉMENT DOM SIMULÉ
// =================================================================
function creerElement(id) {
    var classes = {};
    var el = {
        id: id,
        textContent: '',
        innerHTML: '',
        dataset: {},
        style: {},
        children: [],
        classList: {
            add: function () { for (var i = 0; i < arguments.length; i++) classes[arguments[i]] = true; },
            remove: function () { for (var i = 0; i < arguments.length; i++) delete classes[arguments[i]]; },
            contains: function (c) { return !!classes[c]; },
            toggle: function (c) { if (classes[c]) delete classes[c]; else classes[c] = true; }
        },
        appendChild: function (c) { el.children.push(c); return c; },
        removeChild: function (c) { var i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); },
        remove: function () { },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () { },
        setAttribute: function (k, v) { el.dataset[k] = v; },
        getAttribute: function (k) { return el.dataset[k] === undefined ? null : el.dataset[k]; }
    };
    return el;
}

// =================================================================
// 3. FABRIQUE D'ENVIRONNEMENT
// =================================================================
function creerEnvironnement(hashInitial) {
    var elements = {};

    function reg(id, classesInitiales) {
        elements[id] = creerElement(id);
        if (classesInitiales) classesInitiales.forEach(function (c) { elements[id].classList.add(c); });
        return elements[id];
    }

    // Tous les ids RÉELS du document sont disponibles (comme dans le navigateur).
    Object.keys(IDS_REELS).forEach(function (id) {
        if (elements[id] === undefined) reg(id);
    });

    // Ids de l'arborescence générée par P10 au démarrage de la page réelle.
    Object.keys(IDS_GENERES).forEach(function (id) {
        if (elements[id] === undefined) reg(id);
    });

    // État initial tel qu'écrit dans le HTML pour les éléments qui nous intéressent.
    // GO 3 : #theoryColumn n'existe plus — le cours vit dans #lessonContent (col 3).
    // GO 4 COLONNES : la 4e colonne du chat n'existe plus. GO FICHE MODULE :
    // la fiche du module et son icône livre ont été supprimées ; le workspace
    // du chat affiche un message de bienvenue contextuel lors d'une sélection.
    PARCOURS.forEach(function (p) {
        if (elements['modules-' + p]) elements['modules-' + p].classList.add('hidden');
    });

    var boutons = IDS_20.map(function (id) {
        var b = creerElement('btn-' + id);
        b.dataset.chapter = id;
        b.classList.add('module-btn');
        b.classList.add('text-slate-300');
        elements['btn-' + id] = b;
        return b;
    });

    var replaceStateCalls = [];
    var hashchangeListeners = [];
    var timers = [];
    var warnings = [];

    var documentStub = {
        getElementById: function (id) { return elements[id] === undefined ? null : elements[id]; },
        querySelector: function (sel) {
            var m = /\[data-chapter="([^"]+)"\]/.exec(sel);
            if (m) return elements['btn-' + m[1]] || null;
            return null;
        },
        querySelectorAll: function (sel) {
            if (sel === '.module-btn') return boutons;
            return [];
        },
        createElement: function (tag) { return creerElement(tag); },
        addEventListener: function () { },
        body: creerElement('body'),
        documentElement: creerElement('html')
    };

    var locationStub = { hash: hashInitial || '', hostname: 'localhost', protocol: 'http:' };
    var historyStub = {
        replaceState: function (a, b, url) {
            replaceStateCalls.push(url);
            locationStub.hash = String(url || '');
        }
    };

    var storageStub = function () {
        var d = {};
        return {
            getItem: function (k) { return d[k] === undefined ? null : d[k]; },
            setItem: function (k, v) { d[k] = String(v); },
            removeItem: function (k) { delete d[k]; },
            clear: function () { d = {}; }
        };
    };

    var noop = function () { };

    var sandbox = {
        console: {
            log: noop,
            warn: function () { warnings.push(Array.prototype.slice.call(arguments).join(' ')); },
            error: noop,
            info: noop,
            debug: noop
        },
        document: documentStub,
        location: locationStub,
        history: historyStub,
        localStorage: storageStub(),
        sessionStorage: storageStub(),
        setTimeout: function (fn, ms) { timers.push({ fn: fn, ms: ms }); return timers.length; },
        clearTimeout: noop,
        setInterval: function () { return 0; },
        clearInterval: noop,
        addEventListener: function (type, fn) {
            if (type === 'hashchange') hashchangeListeners.push(fn);
            if (type === 'DOMContentLoaded') fn();
        },
        removeEventListener: noop,
        navigator: { userAgent: 'node-test' },
        alert: noop,
        confirm: function () { return true; },
        prompt: function () { return null; },
        fetch: function () { return Promise.reject(new Error('réseau désactivé en test')); },
        speechSynthesis: {
            speaking: false,
            getVoices: function () { return []; },
            speak: noop,
            cancel: noop
        },
        SpeechSynthesisUtterance: function (t) { this.text = t; },
        JSON: JSON, Math: Math, Date: Date, Object: Object, Array: Array,
        String: String, Number: Number, Boolean: Boolean, RegExp: RegExp,
        Function: Function, Error: Error, TypeError: TypeError,
        Map: Map, Set: Set, Promise: Promise, Symbol: Symbol,
        isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat,
        encodeURIComponent: encodeURIComponent,
        decodeURIComponent: decodeURIComponent,
        URLSearchParams: URLSearchParams,
        btoa: function (s) { return Buffer.from(s, 'binary').toString('base64'); },
        atob: function (s) { return Buffer.from(s, 'base64').toString('binary'); }
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;

    var context = vm.createContext(sandbox);
    vm.runInContext(blocCode, context, { filename: 'index.html::script#principal' });

    return {
        sandbox: sandbox,
        // Les déclarations `let`/`const` de haut niveau ne sont pas des propriétés
        // du sandbox : on les lit via le contexte lexical du script. Sert aussi à
        // obtenir les valeurs attendues (chapters / parcoursData) sans les recopier.
        lire: function (expr) { return vm.runInContext(expr, context); },
        currentModule: function () { return vm.runInContext('currentModule', context); },
        currentParcours: function () { return vm.runInContext('currentParcours', context); },
        elements: elements,
        boutons: boutons,
        replaceStateCalls: replaceStateCalls,
        hashchangeListeners: hashchangeListeners,
        timers: timers,
        warnings: warnings,
        location: locationStub
    };
}

// =================================================================
// 4. TESTS
// =================================================================

section('T1 — Unicité de la définition', function () {
    var occurrences = (html.match(/window\s*\.\s*selectModule\s*=/g) || []).length;
    assert(occurrences === 1, 'une seule définition window.selectModule (obtenu: ' + occurrences + ')');
    assert(!/window\s*\.\s*selectModule\s*=\s*function\s*\(\s*chapterId\s*\)/.test(html),
        'ancienne définition D1 (chapterId) supprimée');
    assert((html.match(/addEventListener\s*\(\s*['"]hashchange['"]/g) || []).length === 1,
        'listener hashchange unique');
});

section('T2 — Ordre de déclaration (protection contre le TDZ)', function () {
    var marqueurs = {
        parcours: /const\s+parcoursData\s*=\s*\{/,
        letMod: /let\s+currentModule\s*=\s*null\s*;/,
        def: /window\s*\.\s*selectModule\s*=\s*function\s*\(\s*moduleId\s*\)/,
        init: /const\s+initial\s*=\s*\(\s*location\s*\.\s*hash/,
        hc: /addEventListener\s*\(\s*['"]hashchange['"]/
    };
    var idx = {};
    Object.keys(marqueurs).forEach(function (k) {
        idx[k] = -1;
        for (var i = 0; i < lines.length; i++) {
            if (marqueurs[k].test(lines[i])) { idx[k] = i; break; }
        }
    });
    var tousPresents = Object.keys(idx).every(function (k) { return idx[k] >= 0; });
    assert(tousPresents, 'les 5 marqueurs sont présents (parcoursData, currentModule, définition, initialisation, listener)');
    assert(idx.parcours >= 0 && idx.parcours < idx.def,
        'parcoursData disponible AVANT la définition unique');
    assert(idx.letMod >= 0 && idx.letMod < idx.def,
        'currentModule (let) disponible AVANT la définition unique');
    assert(idx.def >= 0 && idx.def < idx.init,
        'définition unique AVANT l\'initialisation par le hash');
    assert(idx.init >= 0 && idx.init < idx.hc,
        'initialisation AVANT le listener hashchange');
});

section('T3 — Initialisation avec #narratif-1 (absence de TDZ)', function () {
    var env = creerEnvironnement('#narratif-1');
    var attenduTitre = env.lire('chapters["narratif-1"].title');
    assert(env.elements['theoryContent'].innerHTML.length > 0,
        '#theoryContent alimenté au chargement via #narratif-1');
    assert(env.elements['theoryTitle'].textContent === attenduTitre,
        '#theoryTitle = chapters["narratif-1"].title (« ' + attenduTitre + ' »)');
    assert(env.replaceStateCalls.indexOf('#narratif-1') !== -1,
        'history.replaceState appelé avec #narratif-1');
    assert(!env.elements['modules-narratif'].classList.contains('hidden'),
        'parcours narratif déplié au chargement');
    assert(env.elements['arrow-narratif'].style.transform === 'rotate(90deg)',
        'flèche du parcours orientée');
    // GO 3 — nouveau contrat : plus de 4e colonne, le cours est dans la colonne 3.
    assert(env.elements['theoryColumn'] === undefined,
        '#theoryColumn absent du DOM (4e colonne Parcours supprimée)');
    assert(env.elements['lessonContent'] !== undefined,
        '#lessonContent présent (bloc de cours de la colonne 3)');
    assert(/id="middleColumn"[\s\S]*id="lessonContent"[\s\S]*id="theoryContent"[\s\S]*id="activitiesContainer"/.test(html),
        'cours + activités confinés dans #middleColumn (une seule colonne 3)');
});

section('T4 — Initialisation avec #resume-1 (non déclenchée, comportement actuel)', function () {
    var env = creerEnvironnement('#resume-1');
    assert(env.replaceStateCalls.length === 0,
        'aucun history.replaceState (chapters["resume-1"] inexistant)');
    assert(env.elements['theoryContent'].innerHTML === '', '#theoryContent non alimenté');
    assert(env.elements['modules-resume'].classList.contains('hidden'), 'parcours resume non déplié');
    assert(env.elements['theoryColumn'] === undefined, '#theoryColumn absent du DOM');
    assert(env.currentModule() === null, 'currentModule laissé à null par l\'initialisation');
});

section('T5 — Les 20 identifiants de module', function () {
    var env = creerEnvironnement();
    var manquants = [];
    IDS_20.forEach(function (id) {
        var avant = env.replaceStateCalls.length;
        env.sandbox.selectModule(id);
        if (env.replaceStateCalls.length <= avant) manquants.push(id);
    });
    assert(manquants.length === 0,
        'les 20 modules déclenchent un rendu (manquants: ' + manquants.join(', ') + ')');
    var dernier = env.replaceStateCalls[env.replaceStateCalls.length - 1];
    assert(dernier === '#resume-4', 'dernier hash = #resume-4 (obtenu: ' + dernier + ')');
});

section('T6 — Branche chapters (16 modules) : titres et contenus exacts', function () {
    var env = creerEnvironnement();
    IDS_CHAPITRES.forEach(function (id) {
        var attenduTitre = env.lire('chapters["' + id + '"].title');
        var attenduBody = env.lire('chapters["' + id + '"].body');
        env.sandbox.selectModule(id);
        var titre = env.elements['theoryTitle'].textContent;
        var contenu = env.elements['theoryContent'].innerHTML;
        // GO 3 : l'étiquette « Vidéo » vivait dans la 4e colonne supprimée ; le
        // contrat porte désormais sur le titre et le corps du cours (colonne 3).
        var ok = (titre === attenduTitre) && (contenu === attenduBody);
        assert(ok, id + ' → titre/body === chapters["' + id + '"]'
            + (ok ? '' : ' (titre: ' + JSON.stringify(titre) + ' attendu ' + JSON.stringify(attenduTitre)
                + ' ; body: ' + (contenu === attenduBody ? 'ok' : '≠') + ')'));
    });
});

section('T7 — Branche fallback resume-* (4 modules) : valeurs de parcoursData', function () {
    var env = creerEnvironnement();
    IDS_RESUME.forEach(function (id) {
        var parcours = id.split('-')[0];
        var attenduTitre = env.lire('parcoursData["' + parcours + '"].modules["' + id + '"].title');
        var attenduTheory = env.lire('parcoursData["' + parcours + '"].modules["' + id + '"].theory');
        env.sandbox.selectModule(id);
        var titre = env.elements['theoryTitle'].textContent;
        var contenu = env.elements['theoryContent'].innerHTML;
        // GO 3 : plus d'étiquette vidéo (4e colonne supprimée) — titre + corps uniquement.
        var ok = (titre === attenduTitre) && (contenu === '<p>' + attenduTheory + '</p>');
        assert(ok, id + ' → titre/<p>theory</p> === parcoursData["' + parcours + '"].modules["' + id + '"]'
            + (ok ? '' : ' (titre: ' + JSON.stringify(titre) + ' attendu ' + JSON.stringify(attenduTitre)
                + ' ; contenu: ' + (contenu === '<p>' + attenduTheory + '</p>' ? 'ok' : JSON.stringify(contenu.slice(0, 40))) + ')'));
    });
});

section('T8 — currentModule / currentParcours', function () {
    var env = creerEnvironnement();
    env.sandbox.selectModule('argumentatif-3');
    assert(env.currentModule() === 'argumentatif-3', 'currentModule = argumentatif-3');
    assert(env.currentParcours() === 'argumentatif', 'currentParcours = argumentatif');
    env.sandbox.selectModule('resume-2');
    assert(env.currentModule() === 'resume-2', 'currentModule = resume-2');
    assert(env.currentParcours() === 'resume', 'currentParcours = resume');
});

section('T9 — #activitiesTitle aligné sur parcoursData (20 modules)', function () {
    var env = creerEnvironnement();
    IDS_20.forEach(function (id) {
        var parcours = id.split('-')[0];
        var attendu = env.lire('parcoursData["' + parcours + '"].modules["' + id + '"].title');
        env.elements['activitiesTitle'].textContent = '';
        env.sandbox.selectModule(id);
        var obtenu = env.elements['activitiesTitle'].textContent;
        assert(obtenu === attendu,
            id + ' → #activitiesTitle === parcoursData["' + parcours + '"].modules["' + id + '"].title'
            + (obtenu === attendu ? '' : ' (obtenu ' + JSON.stringify(obtenu) + ', attendu ' + JSON.stringify(attendu) + ')'));
    });
});

section('T10 — Activation du bon bouton', function () {
    var env = creerEnvironnement();
    env.sandbox.selectModule('descriptif-2');
    var actifs = env.boutons.filter(function (b) { return b.classList.contains('bg-slate-800'); });
    assert(actifs.length === 1, 'exactement 1 bouton actif (obtenu: ' + actifs.length + ')');
    assert(actifs.length === 1 && actifs[0].dataset.chapter === 'descriptif-2',
        'le bouton actif est descriptif-2');
    assert(actifs.length === 1 && actifs[0].classList.contains('text-white'),
        'le bouton actif porte text-white');
    var nonActifs = env.boutons.filter(function (b) { return !b.classList.contains('bg-slate-800'); });
    var malEteints = nonActifs.filter(function (b) { return !b.classList.contains('text-slate-300'); });
    assert(malEteints.length === 0, 'les 19 autres boutons portent text-slate-300');
});

section('T11 — Rendu du cours dans la colonne 3 (sans 4e colonne)', function () {
    var env = creerEnvironnement();
    assert(env.elements['theoryColumn'] === undefined,
        'aucune 4e colonne #theoryColumn avant sélection');
    var avant = env.elements['theoryContent'].innerHTML;
    env.sandbox.selectModule('explicatif-1');
    assert(env.elements['theoryContent'].innerHTML.length > 0 &&
        env.elements['theoryContent'].innerHTML !== avant,
        '#theoryContent (colonne 3) alimenté après sélection — sans révéler de colonne');
    assert(env.elements['theoryTitle'].textContent === env.lire('chapters["explicatif-1"].title'),
        '#theoryTitle reflète le chapitre sélectionné');
});

section('T12 — Mise à jour du hash', function () {
    var env = creerEnvironnement();
    env.sandbox.selectModule('narratif-4');
    assert(env.replaceStateCalls[env.replaceStateCalls.length - 1] === '#narratif-4',
        'hash = #narratif-4');
    env.sandbox.selectModule('resume-3');
    assert(env.replaceStateCalls[env.replaceStateCalls.length - 1] === '#resume-3',
        'hash = #resume-3');
});

section('T13 — Listener hashchange', function () {
    var env = creerEnvironnement();
    assert(env.hashchangeListeners.length === 1,
        'un seul listener hashchange (obtenu: ' + env.hashchangeListeners.length + ')');
    env.location.hash = '#explicatif-3';
    env.hashchangeListeners[0]();
    assert(env.replaceStateCalls[env.replaceStateCalls.length - 1] === '#explicatif-3',
        'le listener applique le module du hash');
    assert(env.currentModule() === 'explicatif-3',
        'currentModule mis à jour par le listener');
    assert(env.currentParcours() === 'explicatif',
        'currentParcours mis à jour par le listener');
    env.location.hash = '#inexistant-9';
    var avant = env.replaceStateCalls.length;
    env.hashchangeListeners[0]();
    assert(env.replaceStateCalls.length === avant,
        'hash inconnu → aucun rendu (pas de TypeError)');
});

section('T14 — Identifiants invalides (pas de TypeError)', function () {
    var env = creerEnvironnement();
    var cas = [undefined, null, '', 'inconnu-1', 'zzz', 42, {}, [], true, 'resume-99', 'narratif-99'];
    var erreurs = [];
    cas.forEach(function (c) {
        try {
            var avant = env.replaceStateCalls.length;
            env.sandbox.selectModule(c);
            if (env.replaceStateCalls.length !== avant) {
                erreurs.push('effet de bord sur ' + JSON.stringify(c));
            }
        } catch (e) {
            erreurs.push(JSON.stringify(c) + ' → ' + e.constructor.name);
        }
    });
    assert(erreurs.length === 0,
        'aucune exception ni effet de bord pour entrée invalide (' + erreurs.join(' ; ') + ')');
    assert(env.currentModule() === null,
        'currentModule reste inchangé après entrées invalides');
});

section('T15 — Retry (comportement conservé)', function () {
    var env = creerEnvironnement();
    var vrai = env.elements['theoryContent'];
    delete env.elements['theoryContent'];
    var avant = env.replaceStateCalls.length;
    env.sandbox.selectModule('narratif-1');
    assert(env.replaceStateCalls.length === avant,
        'aucun rendu tant que #theoryContent est absent');
    assert(env.timers.length === 1, 'un retry planifié (obtenu: ' + env.timers.length + ')');
    assert(env.timers.length === 1 && env.timers[0].ms === 100,
        'retry à 100 ms (sémantique conservée)');
    assert(env.warnings.length >= 1, 'un avertissement émis');
    var attenduTitre = env.lire('chapters["narratif-1"].title');
    env.elements['theoryContent'] = vrai;
    if (env.timers.length) env.timers[0].fn();
    assert(env.replaceStateCalls[env.replaceStateCalls.length - 1] === '#narratif-1',
        'après retry, le rendu est effectué');
    assert(env.elements['theoryTitle'].textContent === attenduTitre,
        'après retry, le titre rendu est correct');
});

section('T16 — Non-régression structurelle de la définition', function () {
    // Le contrat porte sur LA définition de window.selectModule : une écriture de
    // hash et un rendu d'activités, pas deux. P10.9 ajoute en dehors d'elle un
    // unique écriteur contextuel (p10EcrireHash) ; le solde du bloc doit rester
    // vide, ce qui rend tout replaceState sauvage détectable.
    var corps = extraireCorpsFonction(blocCode, /window\.selectModule\s*=\s*function/);
    var def = corps === null ? null : blocCode.slice(corps.debut, corps.fin + 1);
    assert(def !== null, 'définition window.selectModule localisée dans le bloc');

    var appels = def ? (def.match(/loadActivities\s*\(\s*moduleId\s*\)/g) || []).length : 0;
    assert(appels === 1,
        'un seul appel loadActivities(moduleId) dans la définition (obtenu: ' + appels + ')');

    var replaceDef = def ? (def.match(/history\s*\.\s*replaceState/g) || []).length : 0;
    assert(replaceDef === 1,
        'un seul history.replaceState dans la définition (obtenu: ' + replaceDef + ')');

    var ecriteur = extraireCorpsFonction(blocCode, /function\s+p10EcrireHash/);
    var nbP10 = 0;
    if (ecriteur !== null) {
        var corpsP10 = blocCode.slice(ecriteur.debut, ecriteur.fin + 1);
        nbP10 = (corpsP10.match(/history\s*\.\s*replaceState/g) || []).length;
        assert(nbP10 === 1, 'l\'écrivain contextuel P10 contient exactement un history.replaceState (obtenu: ' + nbP10 + ')');
    }
    var totalBloc = (blocCode.match(/history\s*\.\s*replaceState/g) || []).length;
    assert(totalBloc === replaceDef + nbP10,
        'aucun history.replaceState hors de selectModule et de l\'écrivain contextuel (bloc: ' +
        totalBloc + ', définition: ' + replaceDef + ', P10: ' + nbP10 + ')');
    assert(!/window\s*\.\s*selectModule\s*=\s*function\s*\(\s*chapterId\s*\)/.test(blocCode),
        'aucun résidu de la définition D1 dans le bloc script');
});

// =================================================================
// RÉSUMÉ
// =================================================================
var total = pass + fail;

console.log('\n' + '='.repeat(60));
console.log('RÉSULTATS — fusion selectModule');
console.log('  ✅ PASS : ' + pass);
console.log('  ❌ FAIL : ' + fail);
console.log('  TOTAL   : ' + total);
if (exceptions.length > 0) {
    console.log('  ⚠️  EXCEPTIONS : ' + exceptions.length);
    exceptions.forEach(function (ex, i) {
        console.log('     ' + (i + 1) + '. [' + ex.section + '] ' + ex.type + ': ' + ex.message);
    });
} else {
    console.log('  ⚠️  EXCEPTIONS : 0');
}
console.log('='.repeat(60));

if (fail > 0) {
    console.error('\n❌ ' + fail + ' test(s) en échec');
    process.exit(1);
}
console.log('\n✅ Tous les tests passent !');
process.exit(0);
