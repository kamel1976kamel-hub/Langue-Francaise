/**
 * =================================================================
 * TESTS — PANNEAU D'ANNONCES (restauration de toggleAnnouncementsPanel)
 * =================================================================
 * Contexte : les deux boutons « Annonces » de index.html
 *   - l.2106 : bouton de la barre latérale
 *   - l.2980 : bouton de fermeture (×) du panneau
 * appellent `toggleAnnouncementsPanel()`, mais cette fonction avait été
 * supprimée lors du remplacement du bloc « PANEL ANNONCES » par le bloc
 * « PANEL BASE DE DONNÉES ». Le HTML du panneau, les fonctions d'annonces
 * et le stockage localStorage ont survécu : seule la bascule manquait.
 *
 * Approche : le bloc <script> inline principal de index.html est extrait,
 * puis exécuté dans un contexte instrumenté (document / localStorage
 * simulés) afin d'observer le comportement RÉEL des fonctions, plutôt que
 * de se coupler à leur implémentation interne.
 *
 * Ce test échoue avant la restauration de window.toggleAnnouncementsPanel
 * et passe après.
 *
 * Tests en lecture seule : aucun fichier modifié, aucun déploiement.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var INDEX_PATH = path.join(__dirname, '..', 'index.html');

var pass = 0;
var fail = 0;
var exceptions = [];

function assert(cond, label) {
    if (cond) { pass++; console.log('  [PASS] ' + label); }
    else { fail++; console.error('  [FAIL] ' + label); }
}

function assertEq(actual, expected, label) {
    if (actual === expected) { pass++; console.log('  [PASS] ' + label); }
    else {
        fail++;
        console.error('  [FAIL] ' + label);
        console.error('         attendu : ' + JSON.stringify(expected));
        console.error('         obtenu  : ' + JSON.stringify(actual));
    }
}

function section(name, fn) {
    console.log('\n--- ' + name + ' ---');
    try { fn(); }
    catch (e) {
        exceptions.push({ section: name, type: e.name, message: e.message });
        fail++;
        console.error('  [FAIL] exception : ' + e.name + ': ' + e.message);
    }
}

// =================================================================
// 1. EXTRACTION DU BLOC SCRIPT INLINE PRINCIPAL
// =================================================================

var html = fs.readFileSync(INDEX_PATH, 'utf8');
var lignes = html.split('\n');

/** Le plus grand bloc <script> inline (sans attribut src). */
function extraireBlocPrincipal() {
    var pairs = [];
    for (var i = 0; i < lignes.length; i++) {
        if (/<script(?![^>]*\ssrc=)[^>]*>/.test(lignes[i])) {
            for (var j = i + 1; j < lignes.length; j++) {
                if (/<\/script>/.test(lignes[j])) { pairs.push({ o: i, c: j }); break; }
            }
        }
    }
    if (pairs.length === 0) throw new Error('aucun bloc <script> inline trouvé');
    var best = pairs[0];
    for (var k = 1; k < pairs.length; k++) {
        if ((pairs[k].c - pairs[k].o) > (best.c - best.o)) best = pairs[k];
    }
    return lignes.slice(best.o + 1, best.c).join('\n');
}

var blocCode = extraireBlocPrincipal();

// =================================================================
// 2. ÉLÉMENTS DOM SIMULÉS
// =================================================================

function creerElement(id) {
    var classes = {};
    var el = {
        id: id,
        innerHTML: '',
        dataset: {},
        style: {},
        children: [],
        classList: {
            add: function () { for (var i = 0; i < arguments.length; i++) classes[arguments[i]] = true; },
            remove: function () { for (var i = 0; i < arguments.length; i++) delete classes[arguments[i]]; },
            contains: function (c) { return !!classes[c]; },
            toggle: function (c) { if (classes[c]) { delete classes[c]; } else { classes[c] = true; } }
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

    // Fidélité au DOM réel : `textContent` et `innerHTML` sont liés.
    // index.html définit escapeHtml(text) via createElement('div') +
    // div.textContent = text, puis lit div.innerHTML : sans ce lien,
    // escapeHtml renverrait toujours une chaîne vide.
    var store = { text: '' };
    Object.defineProperty(el, 'textContent', {
        get: function () { return store.text; },
        set: function (v) {
            store.text = (v === null || v === undefined) ? '' : String(v);
            el.innerHTML = store.text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },
        enumerable: true,
        configurable: true
    });

    return el;
}

// =================================================================
// 3. FABRIQUE D'ENVIRONNEMENT
// =================================================================

/** Panneaux gérés par le mécanisme d'exclusion mutuelle. */
var PANNEAUX = [
    'announcementsPanel',
    'databasePanel',
    'homeworkPanel',
    'accessibilityPanel',
    'settingsPanel',
    'progressionPanel'
];

function creerEnvironnement(options) {
    options = options || {};
    var elements = {};

    function reg(id, classesInitiales) {
        elements[id] = creerElement(id);
        if (classesInitiales) {
            classesInitiales.forEach(function (c) { elements[id].classList.add(c); });
        }
        return elements[id];
    }

    // Panneaux : état initial `hidden`, tel qu'écrit dans le HTML.
    PANNEAUX.forEach(function (id) { reg(id, ['hidden']); });

    // Éléments du panneau d'annonces.
    reg('teacherAnnouncementsSection', ['hidden']);
    reg('announcementsList');
    reg('noAnnouncementsMessage');
    reg('announcementTitle');
    reg('announcementContent');
    reg('announcements-badge', ['hidden']);
    reg('announcementsSubtitle');

    // Éléments divers que le bloc principal peut toucher au chargement.
    reg('mainApp', ['hidden']);
    reg('authModal');
    reg('changePasswordModal', ['hidden']);
    reg('loginForm');
    reg('loginError');
    reg('activitiesContainer');
    reg('homeworkSubtitle');
    reg('studentHomeworkSection');
    reg('myHomeworkList');
    reg('progressionRole');
    reg('studentProgressionView');
    reg('teacherProgressionView');
    reg('settingsInitial');

    // Conteneurs de chat : index.html en touche un au niveau supérieur du bloc.
    ['techniques', 'narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume']
        .forEach(function (t) { reg('chatMessages-' + t, ['hidden']); });

    var noop = function () { };
    var warnMessages = [];

    var documentStub = {
        getElementById: function (id) { return elements[id] === undefined ? null : elements[id]; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        createElement: function (tag) { return creerElement(tag); },
        addEventListener: function (type, fn) { if (type === 'DOMContentLoaded') fn(); },
        body: creerElement('body'),
        documentElement: creerElement('html')
    };

    var storage = (function () {
        var d = {};
        return {
            getItem: function (k) { return d[k] === undefined ? null : d[k]; },
            setItem: function (k, v) { d[k] = String(v); },
            removeItem: function (k) { delete d[k]; },
            clear: function () { d = {}; },
            _dump: function () { return d; }
        };
    }());

    // Pré-remplissage de localStorage si demandé.
    if (options.announcements) {
        storage.setItem('announcements', JSON.stringify(options.announcements));
    }

    var sandbox = {
        console: {
            log: noop,
            warn: function () { warnMessages.push(Array.prototype.slice.call(arguments).join(' ')); },
            error: noop,
            info: noop,
            debug: noop
        },
        document: documentStub,
        localStorage: storage,
        sessionStorage: (function () {
            var d = {};
            return {
                getItem: function (k) { return d[k] === undefined ? null : d[k]; },
                setItem: function (k, v) { d[k] = String(v); },
                removeItem: function (k) { delete d[k]; },
                clear: function () { d = {}; }
            };
        }()),
        location: { hash: '', hostname: 'localhost', protocol: 'http:' },
        history: { replaceState: function () { } },
        setTimeout: function (fn) { if (typeof fn === 'function') { fn(); } return 0; },
        clearTimeout: noop,
        setInterval: function () { return 0; },
        clearInterval: noop,
        addEventListener: noop,
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

    var erreurChargement = null;
    var context;
    try {
        context = vm.createContext(sandbox);
        vm.runInContext(blocCode, context, { filename: 'index.html::script#principal' });
    } catch (e) {
        erreurChargement = e;
    }

    return {
        sandbox: sandbox,
        erreurChargement: erreurChargement,
        elements: elements,
        storage: storage,
        warnings: warnMessages,
        lire: function (expr) { return vm.runInContext(expr, context); },
        ecrire: function (expr, valeur) {
            context[valeur] = valeur;
            return vm.runInContext(expr, context);
        },
        definirCurrentUser: function (user) {
            sandbox.currentUser = user;
            try { vm.runInContext('currentUser = ' + JSON.stringify(user), context); } catch (e) { /* let non modifiable */ }
        },
        estCache: function (id) {
            var el = elements[id];
            if (!el) return null;
            return el.classList.contains('hidden');
        },
        possede: function (fnName) {
            return typeof sandbox[fnName] === 'function';
        }
    };
}

// =================================================================
// 0. PRÉALABLES STRUCTURELS
// =================================================================

section('0. Préalables structurels', function () {
    assertEq(blocCode.length > 100000, true,
        'bloc <script> inline principal extrait (' + blocCode.length + ' caractères)');

    // Les deux handlers existent toujours, inchangés.
    var handlers = [];
    lignes.forEach(function (l, i) {
        if (/onclick="toggleAnnouncementsPanel\(\)"/.test(l)) handlers.push(i + 1);
    });
    assertEq(handlers.length, 2,
        'les 2 handlers onclick="toggleAnnouncementsPanel()" sont présents (l.' + handlers.join(', l.') + ')');

    var env0 = creerEnvironnement();
    assertEq(env0.erreurChargement, null,
        'le bloc principal s\'exécute sans exception' + (env0.erreurChargement ? ' : ' + env0.erreurChargement.message : ''));

    assertEq(env0.possede('toggleAnnouncementsPanel'), true,
        'window.toggleAnnouncementsPanel est défini');

    // Le panneau et ses fonctions doivent exister (ils existaient déjà avant ce lot).
    assertEq(env0.elements['announcementsPanel'] !== undefined, true,
        '#announcementsPanel existe dans le DOM simulé');
    ['saveAnnouncement', 'loadAnnouncements', 'markAllAsRead', 'updateAnnouncementsBadge', 'clearAnnouncementForm']
        .forEach(function (f) {
            assertEq(env0.possede(f), true, 'window.' + f + ' est défini');
        });
});

// =================================================================
// T1 — OUVERTURE
// =================================================================

section('T1 — Ouverture du panneau', function () {
    var env = creerEnvironnement();
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T1 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'student', displayName: 'Test' });

    assertEq(env.estCache('announcementsPanel'), true,
        'T1 : le panneau est initialement caché');
    env.sandbox.toggleAnnouncementsPanel();
    assertEq(env.estCache('announcementsPanel'), false,
        'T1 : après le 1er appel, #announcementsPanel n\'a plus « hidden »');
});

// =================================================================
// T2 — FERMETURE
// =================================================================

section('T2 — Fermeture du panneau (bascule)', function () {
    var env = creerEnvironnement();
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T2 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'student', displayName: 'Test' });

    env.sandbox.toggleAnnouncementsPanel();
    assertEq(env.estCache('announcementsPanel'), false, 'T2 : ouvert après le 1er appel');
    env.sandbox.toggleAnnouncementsPanel();
    assertEq(env.estCache('announcementsPanel'), true,
        'T2 : après le 2e appel, #announcementsPanel retrouve « hidden »');
    env.sandbox.toggleAnnouncementsPanel();
    assertEq(env.estCache('announcementsPanel'), false,
        'T2 : la bascule est réversible (3e appel → ouvert)');
});

// =================================================================
// T3 — EXCLUSIVITÉ
// =================================================================

section('T3 — Exclusivité : les autres panneaux sont fermés à l\'ouverture', function () {
    var env = creerEnvironnement();
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T3 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'student', displayName: 'Test' });

    // Ouvrir d'abord un autre panneau pour vérifier qu'il est bien refermé.
    ['databasePanel', 'homeworkPanel', 'accessibilityPanel', 'settingsPanel', 'progressionPanel']
        .forEach(function (id) { env.elements[id].classList.remove('hidden'); });

    env.sandbox.toggleAnnouncementsPanel();

    ['databasePanel', 'homeworkPanel', 'accessibilityPanel', 'settingsPanel', 'progressionPanel']
        .forEach(function (id) {
            assertEq(env.estCache(id), true, 'T3 : ' + id + ' est fermé (hidden) après l\'ouverture des annonces');
        });
    assertEq(env.estCache('announcementsPanel'), false,
        'T3 : #announcementsPanel est ouvert');
});

// =================================================================
// T4 — RÉCIPROCITÉ : toggleDatabasePanel ferme toujours les annonces
// =================================================================

section('T4 — Réciprocité : toggleDatabasePanel ferme announcementsPanel', function () {
    var env = creerEnvironnement();
    assertEq(env.possede('toggleDatabasePanel'), true,
        'T4 : window.toggleDatabasePanel est défini (non modifié par ce lot)');

    if (env.possede('toggleAnnouncementsPanel')) {
        env.definirCurrentUser({ role: 'student', displayName: 'Test' });
        env.sandbox.toggleAnnouncementsPanel();
        assertEq(env.estCache('announcementsPanel'), false, 'T4 : annonces ouvertes au préalable');
    }

    env.sandbox.toggleDatabasePanel();
    assertEq(env.estCache('announcementsPanel'), true,
        'T4 : toggleDatabasePanel ferme toujours #announcementsPanel (mécanisme existant)');
    assertEq(env.estCache('databasePanel'), false,
        'T4 : #databasePanel est ouvert');
});

// =================================================================
// T5 — RÔLE ENSEIGNANT
// =================================================================

section('T5 — Rôle enseignant : la section de rédaction devient visible', function () {
    var env = creerEnvironnement();
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T5 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'teacher', displayName: 'Prof' });

    assertEq(env.estCache('teacherAnnouncementsSection'), true,
        'T5 : la section enseignant est initialement cachée');
    env.sandbox.toggleAnnouncementsPanel();
    assertEq(env.estCache('teacherAnnouncementsSection'), false,
        'T5 : avec role === "teacher", #teacherAnnouncementsSection devient visible');
});

// =================================================================
// T6 — RÔLE NON ENSEIGNANT
// =================================================================

section('T6 — Rôle non enseignant : section cachée + markAllAsRead() appelé', function () {
    var env = creerEnvironnement({ announcements: [{ id: 1, title: 'T', content: 'C', read: false, author: 'P', date: new Date().toISOString() }] });
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T6 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'student', displayName: 'Élève' });

    var appels = 0;
    var original = env.sandbox.markAllAsRead;
    env.sandbox.markAllAsRead = function () { appels++; };

    try {
        env.elements['teacherAnnouncementsSection'].classList.remove('hidden');
        env.sandbox.toggleAnnouncementsPanel();
    } finally {
        env.sandbox.markAllAsRead = original;
    }

    assertEq(env.estCache('teacherAnnouncementsSection'), true,
        'T6 : avec un rôle non enseignant, #teacherAnnouncementsSection reste cachée');
    assertEq(appels, 1,
        'T6 : markAllAsRead() a été appelé exactement 1 fois');
});

// =================================================================
// T7 — CHARGEMENT
// =================================================================

section('T7 — loadAnnouncements() est appelé à l\'ouverture', function () {
    // Rôle ENSEIGNANT : markAllAsRead() n\'est PAS appelé dans cette branche,
    // donc loadAnnouncements() ne doit être appelé qu\'une fois (par le toggle).
    var envT = creerEnvironnement();
    if (!envT.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T7 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    envT.definirCurrentUser({ role: 'teacher', displayName: 'Prof' });

    var appelsT = 0;
    var origT = envT.sandbox.loadAnnouncements;
    envT.sandbox.loadAnnouncements = function () { appelsT++; };
    try {
        envT.sandbox.toggleAnnouncementsPanel();
    } finally {
        envT.sandbox.loadAnnouncements = origT;
    }
    assertEq(appelsT, 1,
        'T7 : avec un rôle enseignant, loadAnnouncements() est appelé exactement 1 fois');

    // Rôle ÉLÈVE : markAllAsRead() (l.6942) appelle lui aussi loadAnnouncements(),
    // et le toggle l\'appelle ensuite — soit 2 appels, comme l\'ancienne implémentation.
    var envS = creerEnvironnement();
    envS.definirCurrentUser({ role: 'student', displayName: 'Élève' });

    var appelsS = 0;
    var origS = envS.sandbox.loadAnnouncements;
    envS.sandbox.loadAnnouncements = function () { appelsS++; };
    try {
        envS.sandbox.toggleAnnouncementsPanel();
    } finally {
        envS.sandbox.loadAnnouncements = origS;
    }
    assertEq(appelsS, 2,
        'T7 : avec un rôle élève, 2 appels (markAllAsRead → loadAnnouncements, puis le toggle) — comportement historique');
});

// =================================================================
// T8 — localStorage AVEC ANNONCES
// =================================================================

section('T8 — localStorage peuplé : la liste est alimentée', function () {
    var annonces = [
        { id: 2, title: 'Rappel de devoir', content: 'Rendez le devoir lundi', read: false, author: 'Prof', date: '2026-09-29T10:00:00.000Z' },
        { id: 1, title: 'Bienvenue', content: 'Bonjour à tous', read: true, author: 'Prof', date: '2026-09-28T10:00:00.000Z' }
    ];
    var env = creerEnvironnement({ announcements: annonces });
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T8 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'student', displayName: 'Élève' });

    env.sandbox.toggleAnnouncementsPanel();

    var htmlListe = env.elements['announcementsList'].innerHTML;
    assert(htmlListe.indexOf('Rappel de devoir') !== -1,
        'T8 : la liste contient le titre de la 1re annonce');
    assert(htmlListe.indexOf('Bienvenue') !== -1,
        'T8 : la liste contient le titre de la 2e annonce');
    assert(htmlListe.indexOf('Aucune annonce') === -1,
        'T8 : le message « aucune annonce » n\'est pas rendu');
});

// =================================================================
// T9 — localStorage VIDE
// =================================================================

section('T9 — localStorage vide : aucune exception', function () {
    var env = creerEnvironnement();
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T9 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser({ role: 'student', displayName: 'Test' });

    var leve = false;
    try {
        env.sandbox.toggleAnnouncementsPanel();
    } catch (e) {
        leve = true;
        console.error('         exception : ' + e.name + ': ' + e.message);
    }
    assertEq(leve, false, 'T9 : aucun exception levée avec un localStorage vide');
    assert(env.elements['announcementsList'].innerHTML.indexOf('Aucune annonce') !== -1,
        'T9 : le comportement actuel de #noAnnouncementsMessage est conservé');
});

// =================================================================
// T10 — currentUser null
// =================================================================

section('T10 — currentUser = null : aucune exception, section cachée', function () {
    var env = creerEnvironnement();
    if (!env.possede('toggleAnnouncementsPanel')) {
        assert(false, 'T10 : window.toggleAnnouncementsPanel est défini');
        return;
    }
    env.definirCurrentUser(null);

    var appels = 0;
    var original = env.sandbox.markAllAsRead;
    env.sandbox.markAllAsRead = function () { appels++; };

    var leve = false;
    try {
        env.sandbox.toggleAnnouncementsPanel();
    } catch (e) {
        leve = true;
        console.error('         exception : ' + e.name + ': ' + e.message);
    } finally {
        env.sandbox.markAllAsRead = original;
    }

    assertEq(leve, false, 'T10 : aucune exception avec currentUser = null');
    assertEq(env.estCache('teacherAnnouncementsSection'), true,
        'T10 : #teacherAnnouncementsSection reste cachée');
    assertEq(appels, 1,
        'T10 : le comportement historique est conservé (markAllAsRead() appelé)');
});

// =================================================================
// NON-RÉGRESSION : les autres toggles restent intacts
// =================================================================

section('T11 — Non-régression : les autres panneaux fonctionnent toujours', function () {
    var env = creerEnvironnement();

    env.sandbox.toggleSettingsPanel();
    assertEq(env.estCache('settingsPanel'), false, 'T11 : toggleSettingsPanel ouvre settingsPanel');
    assertEq(env.estCache('progressionPanel'), true, 'T11 : toggleSettingsPanel ferme progressionPanel');

    env.sandbox.toggleHomeworkPanel();
    assertEq(env.estCache('homeworkPanel'), false, 'T11 : toggleHomeworkPanel ouvre homeworkPanel');
    assertEq(env.estCache('settingsPanel'), true, 'T11 : toggleHomeworkPanel ferme settingsPanel');

    env.sandbox.toggleDatabasePanel();
    assertEq(env.estCache('databasePanel'), false, 'T11 : toggleDatabasePanel ouvre databasePanel');
});

// =================================================================
// RÉSUMÉ
// =================================================================

var total = pass + fail;

console.log('\n' + '='.repeat(60));
console.log('RÉSULTATS — panneau d\'annonces');
console.log('  PASS : ' + pass);
console.log('  FAIL : ' + fail);
console.log('  TOTAL : ' + total);
if (exceptions.length > 0) {
    console.log('  EXCEPTIONS : ' + exceptions.length);
    exceptions.forEach(function (ex, i) {
        console.log('     ' + (i + 1) + '. [' + ex.section + '] ' + ex.type + ': ' + ex.message);
    });
} else {
    console.log('  EXCEPTIONS : 0');
}
console.log('='.repeat(60));

if (fail > 0) {
    console.error('\n' + fail + ' test(s) en échec');
    process.exit(1);
}
console.log('\nTous les tests passent !');
process.exit(0);
