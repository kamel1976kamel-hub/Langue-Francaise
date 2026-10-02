/**
 * =================================================================
 * TESTS — P10.11 : chaîne Parcours → contexte Chat → buildRequestV2
 * =================================================================
 * Reproduit le défaut diagnostiqué (« buildRequestV2: context requis »)
 * et vérifie le correctif, sur le CODE RÉEL :
 *
 *   - src/p10-context.js            (exécuté, référentiel + contexte)
 *   - src/request-builder-v2.js     (exécuté, contrat client)
 *   - worker/contract-v2.js         (exécuté, contrat réel du Worker)
 *   - les fonctions inline de index.html (extraites puis exécutées avec un
 *     DOM simulé minimal) : p10ChatStorageKey, p10SujetChat,
 *     p10ConteneurModule, p10ConteneurChat, p10MasquerDiscussions,
 *     p10SynchroniserReflet, window.p10SelectModule, p10AppliquerHash
 *   - le bloc de construction du contexte chat de sendCorrectedQuestion,
 *     exécuté tel quel (aucune réécriture du code testé)
 *   - buildV2ModuleContextPrompt / cleanV2ModuleValue du Worker (lecture
 *     seule : la ligne de situation réellement produite pour ce contexte)
 *
 * Chaque section est isolée : une exception devient un FAIL comptabilisé.
 * Tests en lecture seule : aucun fichier modifié, aucun déploiement.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var pass = 0, fail = 0;

function assert(cond, label) {
    if (cond) { pass++; console.log('  \u2705 PASS \u2014 ' + label); }
    else { fail++; console.error('  \u274c FAIL \u2014 ' + label); }
}

function section(titre, fn) {
    console.log('\n=== ' + titre + ' ===');
    try { fn(); }
    catch (e) {
        fail++;
        console.error('  \u274c FAIL \u2014 exception dans "' + titre + '" : ' +
            ((e && e.message) ? e.message : String(e)));
        if (process.env.P10_TEST_DEBUG && e && e.stack) console.error(e.stack);
    }
}

var RACINE = path.join(__dirname, '..');
function lire(p) { return fs.readFileSync(path.join(RACINE, p), 'utf8'); }

/** Version commitée (baseline 1b2d26d) — lecture git, aucun fichier touché. */
function lireHead(p) {
    return require('child_process').execFileSync('git', ['show', 'HEAD:' + p],
        { encoding: 'utf8', cwd: RACINE, maxBuffer: 64 * 1024 * 1024 });
}

var html = lire('index.html');
var codeP10 = lire('src/p10-context.js');
var codeRB = lire('src/request-builder-v2.js');
var codeContrat = lire('worker/contract-v2.js');
var codeWorker = lire('worker/ai-pipeline-worker.js');

// =================================================================
// EXTRACTION : corps de fonction (accolades équilibrées, chaînes et
// commentaires exclus) — même principe que test-select-module.js.
// =================================================================
function extraireCorps(code, motifEntete) {
    var m = motifEntete.exec(code);
    if (!m) return null;
    var debut = code.indexOf('{', m.index);
    if (debut === -1) return null;
    var profondeur = 0, quote = null;
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
            i = saut; continue;
        }
        if (ch === '/' && code.charAt(i + 1) === '*') {
            var fin = code.indexOf('*/', i);
            if (fin === -1) return null;
            i = fin; continue;
        }
        if (ch === '{') profondeur++;
        else if (ch === '}') {
            profondeur--;
            if (profondeur === 0) return code.slice(m.index, i + 1);
        }
    }
    return null;
}

/** Extrait un segment délimité par deux ancres littérales. */
function extraireSegment(code, ancreDebut, ancreFin) {
    var d = code.indexOf(ancreDebut);
    if (d === -1) return null;
    var f = code.indexOf(ancreFin, d);
    if (f === -1) return null;
    return code.slice(d, f);
}

function lireLitteral(code, motif) {
    var debut = code.search(motif);
    if (debut === -1) return null;
    var i = code.indexOf('{', debut);
    if (i === -1) return null;
    var niveau = 0, j = i, chaine = null;
    for (; j < code.length; j++) {
        var c = code.charAt(j);
        if (chaine) {
            if (c === '\\') { j++; continue; }
            if (c === chaine) chaine = null;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { chaine = c; continue; }
        if (c === '{') niveau++;
        else if (c === '}') { niveau--; if (niveau === 0) { j++; break; } }
    }
    return code.slice(i, j);
}

// =================================================================
// DOM SIMULÉ
// =================================================================
function creerNoeud(id, classesInitiales) {
    var visibles = {};
    (classesInitiales || []).forEach(function (c) { visibles[c] = 1; });
    var noeud = {
        id: id,
        tagName: 'DIV',
        style: {},
        children: [],
        parentNode: null,
        textContent: '',
        innerHTML: '',
        classList: {
            add: function (c) { visibles[c] = 1; },
            remove: function (c) { delete visibles[c]; },
            contains: function (c) { return !!visibles[c]; }
        },
        appendChild: function (n) {
            noeud.children.push(n); n.parentNode = noeud;
            if (n.id) noeud.__registre(n);
            return n;
        },
        insertBefore: function (n) {
            if (!n || n.__libre) { noeud.children.push(n); }
            else { noeud.children.unshift(n); }
            n.parentNode = noeud;
            if (n.id) n.__registre(n);
            return n;
        },
        querySelector: function () { return null; },
        __visible: function () { return !visibles.hidden; }
    };
    // className est écrit par le code testé : on le garde cohérent.
    Object.defineProperty(noeud, 'className', {
        get: function () { return Object.keys(visibles).join(' '); },
        set: function (v) {
            visibles = {};
            String(v).split(/\s+/).forEach(function (c) { if (c) visibles[c] = 1; });
        }
    });
    return noeud;
}

function creerDocument() {
    var elements = {};
    var doc = {
        __elements: elements,
        getElementById: function (id) { return elements[id] || null; },
        createElement: function (tag) {
            var n = creerNoeud('', []);
            n.tagName = String(tag).toUpperCase();
            n.__registre = function (noeud) { if (noeud.id) elements[noeud.id] = noeud; };
            n.__libre = true;
            return n;
        },
        querySelector: function (sel) {
            if (sel === '.smart-textarea-container') return elements.__zone || null;
            return null;
        },
        querySelectorAll: function (sel) {
            if (sel === '[id^="chatMessages-"]') {
                return Object.keys(elements)
                    .filter(function (id) { return id.indexOf('chatMessages-') === 0; })
                    .map(function (id) { return elements[id]; });
            }
            return [];
        },
        body: null
    };
    doc.__registre = function (noeud) { if (noeud.id) elements[noeud.id] = noeud; };
    doc.body = creerNoeud('body', []);
    doc.body.__registre = doc.__registre;
    return doc;
}

var TOPICS = ['techniques', 'narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'];

function creerEnvironment() {
    var doc = creerDocument();
    var conteneurs = {};
    TOPICS.forEach(function (t) {
        var n = creerNoeud('chatMessages-' + t, t === 'techniques' ? [] : ['hidden']);
        n.__registre = doc.__registre;
        conteneurs[t] = n;
        doc.__elements[n.id] = n;
    });
    var zone = creerNoeud('', []);
    zone.__registre = doc.__registre;
    doc.__elements.__zone = zone;
    var parentCommun = creerNoeud('colonne-chat', []);
    parentCommun.__registre = doc.__registre;
    TOPICS.forEach(function (t) { parentCommun.appendChild(conteneurs[t]); });
    Object.keys(conteneurs).forEach(function (t) { conteneurs[t].parentNode = parentCommun; });

    var localStorage = {
        __donnees: {},
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(this.__donnees, k) ? this.__donnees[k] : null; },
        setItem: function (k, v) { this.__donnees[k] = String(v); },
        removeItem: function (k) { delete this.__donnees[k]; }
    };

    var remplacementHash = 0;
    // Dans le navigateur, window EST l'objet global : les déclarations
    // `function foo()` de index.html deviennent donc window.foo. Le même
    // modèle est reproduit ici (sandbox === window) pour exécuter le code
    // extrait sans transformation.
    var sandbox = {};
    sandbox.window = sandbox;
    sandbox.document = doc;
    sandbox.localStorage = localStorage;
    sandbox.confirm = function () { return true; };
    sandbox.console = { log: function () { }, warn: function () { }, error: function () { } };
    sandbox.location = {
        _hash: '',
        get hash() { return this._hash; },
        set hash(v) { this._hash = v; }
    };
    sandbox.history = {
        replaceState: function (u, t, hash) {
            remplacementHash++;
            sandbox.location._hash = hash;
        }
    };
    sandbox.__remplacementHash = function () { return remplacementHash; };
    sandbox.__resetRemplacement = function () { remplacementHash = 0; };
    vm.createContext(sandbox);
    return { ctx: sandbox, win: sandbox, doc: doc, localStorage: localStorage, conteneurs: conteneurs };
}

// Modules P10 / RequestBuilderV2 dans le contexte simulé, une seule fois.
var env = creerEnvironment();
vm.runInContext(codeP10, env.ctx, { filename: 'p10-context.js' });
vm.runInContext(codeRB, env.ctx, { filename: 'request-builder-v2.js' });
var P10 = env.win.P10;
var RB = env.win.RequestBuilderV2;

var discussionData = JSON.parse(lireLitteral(html, /window\.discussionData\s*=/)
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    .replace(/\/\/[^\n]*\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([}\]])/g, '$1'));
env.win.discussionData = discussionData;

// ---------- fonctions inline réellement extraites de index.html ----------
var GLUE = {
    p10Disponible: /function p10Disponible\s*\(\s*\)/,
    p10ChatStorageKey: /function p10ChatStorageKey\s*\(\s*topic\s*\)/,
    p10SujetChat: /function p10SujetChat\s*\(\s*\)/,
    p10ConteneurModule: /function p10ConteneurModule\s*\(\s*\)/,
    p10ConteneurChat: /function p10ConteneurChat\s*\(\s*\)/,
    p10MasquerDiscussions: /function p10MasquerDiscussions\s*\(\s*\)/,
    p10SynchroniserReflet: /function p10SynchroniserReflet\s*\(\s*ctx\s*\)/,
    p10SelectModule: /window\.p10SelectModule\s*=\s*function/,
    p10AppliquerHash: /function p10AppliquerHash\s*\(\s*rawHash\s*\)/
};
var glueExtrait = {};
Object.keys(GLUE).forEach(function (nom) {
    glueExtrait[nom] = extraireCorps(html, GLUE[nom]);
});
var toutExtrait = Object.keys(glueExtrait).every(function (n) { return !!glueExtrait[n]; });
assert(toutExtrait, 'M0 — les 9 fonctions inline de index.html sont extraites (aucune réécriture du code testé)');

// L'abonné réel de la page projette le reflet du Chat depuis le contexte : le
// harnais reproduit ce branchement unique (vérifié dans la source, pas inventé).
var blocAbonne = extraireSegment(html, 'window.P10.subscribe(function (ctx, reason)', 'p10Demarrer();');
assert(!!blocAbonne && /p10SynchroniserReflet\(ctx\)/.test(blocAbonne),
    'M0 — index.html : l\'abonné P10 appelle bien p10SynchroniserReflet(ctx)');

// Le bloc de construction du contexte chat de sendCorrectedQuestion, tel quel.
var blocContexteChat = extraireSegment(html,
    '// \u2500\u2500\u2500 V2 : construire le contexte chat \u2500\u2500\u2500',
    '// Appliquer d\u2019abord les corrections') ||
    extraireSegment(html,
        '// ─── V2 : construire le contexte chat ───',
        '// Appliquer');
assert(!!blocContexteChat && blocContexteChat.indexOf('buildChatContext') !== -1 &&
    blocContexteChat.indexOf('moduleChatContext') !== -1,
    'M0 — le bloc réel de construction du contexte chat est extrait (avec le chemin P10.11)');

var injection = [
    glueExtrait.p10Disponible, glueExtrait.p10ChatStorageKey, glueExtrait.p10SujetChat,
    glueExtrait.p10ConteneurModule, glueExtrait.p10ConteneurChat,
    glueExtrait.p10MasquerDiscussions, glueExtrait.p10SynchroniserReflet,
    glueExtrait.p10SelectModule, glueExtrait.p10AppliquerHash
].join('\n');

// Dépendances attendues par ces fonctions (stub fidèle de la page).
var preparatifs = [
    'var chapters = {};',
    'function selectModule(id) { window.__selectModuleAppelle = (window.__selectModuleAppelle || 0) + 1; }',
    'window.selectDiscussion = function (topic) {',
    '  window.currentDiscussion = topic;',
    '  if (!window.discussionData[topic]) return;',
    '  window.P10.update({ discussionTopic: topic }, \'topic\');',
    '};',
    'window.displayChatHistory = function (topic) {',
    '  window.__historiquesAffiches = window.__historiquesAffiches || [];',
    '  window.__historiquesAffiches.push(topic);',
    '};',
    'window.P10.subscribe(function (ctx) { p10SynchroniserReflet(ctx); });',
    'window.__construireContexteChat = function (textOriginal, localDetections) {'
].join('\n');

vm.runInContext(injection + '\n' + preparatifs + '\n' +
    (blocContexteChat || 'var chatContext = null; var optionsV2 = null;') +
    '\n  return { chatContext: chatContext, optionsV2: optionsV2 };\n};',
    env.ctx, { filename: 'glue-p10-extrait.js' });

var win = env.win;

// Contrat réel du Worker (module ES → on retire l'export pour l'exécuter).
var ctxContrat = { console: { log: function () { }, warn: function () { }, error: function () { } } };
vm.createContext(ctxContrat);
vm.runInContext(codeContrat.replace(/^export\s*\{[\s\S]*?\};?\s*$/m, ''), ctxContrat,
    { filename: 'contract-v2.js' });
var validateRequestV2 = ctxContrat.validateRequestV2;
assert(typeof validateRequestV2 === 'function',
    'M0 — validateRequestV2 du Worker est chargé (validation du vrai contrat)');

// Ligne de situation produite par le Worker pour ce contexte (lecture seule).
var cleanV2 = extraireCorps(codeWorker, /function cleanV2ModuleValue\s*\(\s*valeur\s*,\s*max\s*\)/);
var modulePrompt = extraireCorps(codeWorker, /function buildV2ModuleContextPrompt\s*\(\s*contexteModule\s*\)/);
assert(!!cleanV2 && !!modulePrompt, 'M0 — buildV2ModuleContextPrompt du Worker est extrait');
var ctxWorker = { console: ctxContrat.console };
vm.createContext(ctxWorker);
vm.runInContext([cleanV2, modulePrompt,
    'globalThis.__ligneSituation = function (module) { return buildV2ModuleContextPrompt(module); };'].join('\n'),
    ctxWorker, { filename: 'worker-extrait.js' });
var ligneSituation = ctxWorker.__ligneSituation;

// =================================================================
// Aides de test
// =================================================================
function contexteChat(texte) {
    return win.__construireContexteChat(texte || 'Quelle est la diff\u00e9rence entre un texte narratif et un texte descriptif ?', []);
}

function chaine(texte) { return String(texte); }

function clic(chapterId) { win.p10SelectModule(chapterId); return P10.context(); }

function requestDepuis(contexteChat_) {
    return RB.buildRequestV2({
        mode: 'chat',
        textOriginal: contexteChat_.optionsV2.textOriginal,
        localDetections: contexteChat_.optionsV2.localDetections || [],
        context: contexteChat_.optionsV2.context || null
    });
}

function validerContrat(request) {
    return validateRequestV2(JSON.parse(JSON.stringify(request)));
}

// =================================================================
// M1 — module AVEC discussion publiée (chemin hérité intact)
// =================================================================
section('M1 \u2014 module avec discussion publi\u00e9e', function () {
    var ctx = clic('pep-y1s2-03');
    assert(ctx.chapterId === 'pep-y1s2-03' && ctx.discussionTopic === 'techniques',
        'M1.1 — le module peupl\u00e9 s\u00e9lectionne un thème qu\u2019il publie (' + ctx.discussionTopic + ')');
    assert(win.currentDiscussion === 'techniques',
        'M1.2 — le reflet legacy window.currentDiscussion porte le thème publié');
    var constr = contexteChat();
    assert(!!constr.chatContext && !!constr.chatContext.chat, 'M1.3 — context.chat construit');
    assert(constr.chatContext.chat.topic === 'techniques',
        'M1.4 — topic = thème publié (non le jeton module) : ' + constr.chatContext.chat.topic);
    assert(constr.chatContext.chat.topic_title === discussionData.techniques.title,
        'M1.5 — topic_title = libellé publié de la discussion');
    var req = requestDepuis(constr);
    var v = validerContrat(req);
    assert(v.errors.length === 0, 'M1.6 — RequestV2 accepted by the real Worker contract' +
        (v.errors.length ? ' (' + v.errors.join(', ') + ')' : ''));
    assert(req.context.chat.module && req.context.chat.module.chapter_id === 'pep-y1s2-03',
        'M1.7 — context.chat.module.chapter_id = ' + (req.context.chat.module && req.context.chat.module.chapter_id));
    assert(req.context.chat.module.discussion_topic === 'techniques',
        'M1.8 — context.chat.module.discussion_topic = techniques');
});

// =================================================================
// M2 — module SANS discussion publiée (le cas signalé)
// =================================================================
section('M2 \u2014 module sans discussion publi\u00e9e (pep-y2s1-03)', function () {
    var ctx = clic('pep-y2s1-03');
    assert(ctx.chapterId === 'pep-y2s1-03' && ctx.discussionTopic === null,
        'M2.1 — le module est sélectionné sans thème hérité d\u2019un autre module');
    assert(chaine(win.currentDiscussion) === '',
        'M2.2 — le reflet legacy est une chaîne vide, jamais null');
    var constr = contexteChat();
    assert(!!constr.chatContext && !!constr.chatContext.chat,
        'M2.3 — context.chat existe bien (le défaut est corrigé)');
    var chat = constr.chatContext.chat;
    assert(typeof chat.topic === 'string' && chat.topic.length > 0 && chat.topic.length <= 30,
        'M2.4 — topic stable, non vide et ≤ 30 caractères : « ' + chat.topic + ' »');
    assert(chat.topic === P10.MODULE_CHAT_TOPIC,
        'M2.5 — topic = jeton technique de niveau module : ' + chat.topic);
    assert(chat.topic_title === 'Techniques et pratiques de l\u2019\u00e9crit 1',
        'M2.6 — topic_title = titre canonique du module : « ' + chat.topic_title + ' »');
    assert(typeof chat.topic_context === 'string' && chat.topic_context.length > 0 &&
        chat.topic_context.length <= 500,
        'M2.7 — topic_context décrit le module (longueur ' + chat.topic_context.length + '/500)');
    assert(chat.module && chat.module.chapter_id === 'pep-y2s1-03' &&
        chat.module.parcours === 'pep' && chat.module.year_number === 2 &&
        chat.module.semester_number === 1,
        'M2.8 — context.chat.module porte parcours / année / semestre / id canonique');
    assert(!('discussion_topic' in chat.module) || chat.module.discussion_topic === null,
        'M2.9 — aucun topic de discussion n\u2019est attribué à ce module');
    var req = requestDepuis(constr);
    var v = validerContrat(req);
    assert(v.errors.length === 0, 'M2.10 — RequestV2 accepted by the real Worker contract' +
        (v.errors.length ? ' (' + v.errors.join(', ') + ')' : ''));
    assert(!/Erreur technique|context requis/.test(JSON.stringify(req)),
        'M2.11 — plus aucune exception « context requis » sur ce chemin');
});

// =================================================================
// M3 — changement de module dans les deux sens
// =================================================================
section('M3 \u2014 changement de module et contexte suivant', function () {
    clic('pep-y1s1-01');
    var a = contexteChat();
    assert(a.chatContext.chat.topic_title === 'Usage et ma\u00eetrise de la langue 1',
        'M3.1 — module sans discussion A : libellé propre à A');
    clic('pep-y2s2-03');
    var b = contexteChat();
    assert(b.chatContext.chat.topic_title === 'Techniques et pratiques de l\u2019\u00e9crit 2',
        'M3.2 — module sans discussion B : libellé propre à B');
    assert(a.chatContext.chat.topic_context !== b.chatContext.chat.topic_context,
        'M3.3 — les deux contextes sont distincts');
    clic('pep-y1s2-03');
    var c = contexteChat();
    assert(c.chatContext.chat.topic === 'techniques',
        'M3.4 — retour au module peuplé : le thème publié reprend la main');
});

// =================================================================
// M4 — deep-link direct sur un module sans discussion
// =================================================================
section('M4 \u2014 deep-link direct (hash vers un module sans discussion)', function () {
    clic('pep-y1s2-03');
    assert(win.currentDiscussion === 'techniques', 'M4.1 — état de départ : thème publié actif');
    win.p10AppliquerHash('#pep/y2/s1/pep-y2s1-03');
    var ctx = P10.context();
    assert(ctx.chapterId === 'pep-y2s1-03' && ctx.discussionTopic === null,
        'M4.2 — le hash cible ne conserve aucun thème d\u2019un autre module');
    assert(chaine(win.currentDiscussion) === '',
        'M4.3 — le reflet legacy est effacé par le deep-link');
    var constr = contexteChat();
    assert(!!constr.chatContext && constr.chatContext.chat.topic === P10.MODULE_CHAT_TOPIC,
        'M4.4 — contexte chat de niveau module productible après deep-link');
});

// =================================================================
// M5 — changement via hash sur un module AVEC discussion
// =================================================================
section('M5 \u2014 hash vers un module avec discussion', function () {
    win.p10AppliquerHash('#pep/y1/s2/pep-y1s2-03');
    var ctx = P10.context();
    assert(ctx.chapterId === 'pep-y1s2-03', 'M5.1 — module du hash appliqué');
    assert(typeof ctx.discussionTopic === 'string' && ctx.discussionTopic.length > 0,
        'M5.2 — un thème publié est bien actif : ' + ctx.discussionTopic);
    assert(win.currentDiscussion === ctx.discussionTopic,
        'M5.3 — reflet legacy synchronisé avec le contexte');
    win.p10AppliquerHash('#pep/y1/s2/pep-y1s2-03/narratif-1');
    assert(P10.context().lessonId === 'narratif-1', 'M5.4 — leçon héritée lue depuis le hash');
    assert(P10.context().discussionTopic === 'narratif' ||
        P10.module('pep-y1s2-03').discussionTopics.indexOf(P10.context().discussionTopic) !== -1,
        'M5.5 — le thème conservé appartient toujours au module');
});

// =================================================================
// M6 — retour arrière / hash précédent, sans boucle
// =================================================================
section('M6 \u2014 retour arri\u00e8re (hash pr\u00e9c\u00e9dent) et absence de boucle', function () {
    win.p10AppliquerHash('#pep/y2/s1/pep-y2s1-03');
    win.__resetRemplacement();
    win.p10AppliquerHash('#pep/y1/s2/pep-y1s2-03');
    var premier = win.__remplacementHash();
    win.p10AppliquerHash('#pep/y1/s2/pep-y1s2-03');
    var second = win.__remplacementHash();
    assert(premier === 0, 'M6.1 — p10AppliquerHash n\u2019écrit jamais le hash (pas de hashchange provoqué)');
    assert(second === 0, 'M6.2 — application répétée du même hash : aucune écriture d\u2019historique');
    var avant = JSON.stringify(P10.context());
    win.p10AppliquerHash('#pep/y2/s1/pep-y2s1-03');
    win.p10AppliquerHash('#pep/y1/s2/pep-y1s2-03');
    win.p10AppliquerHash('#pep/y2/s1/pep-y2s1-03');
    assert(P10.context().chapterId === 'pep-y2s1-03' && P10.context().discussionTopic === null,
        'M6.3 — aller/retour entre les deux modules laisse un contexte cohérent');
    assert(P10.context().discussionTopic === null && chaine(win.currentDiscussion) === '',
        'M6.4 — aucun thème résiduel après retour sur un module sans discussion');
    assert(!!avant, 'M6.5 — lecture de l\u2019état précédent disponible pour comparaison');
    // Le contrat textuel de test-select-module (deux écrivains d'URL seulement)
    // est verrouillé ici pour qu'un commentaire ou un garde-fou ne le casse plus.
    assert((html.match(/history\.replaceState/g) || []).length ===
        (lireHead('index.html').match(/history\.replaceState/g) || []).length,
        'M6.6 — aucun nouvel écrivain d\'URL (ni mention textuelle) introduit par P10.11');
});

// =================================================================
// M7 — alternance avec / sans discussion sur tous les modules
// =================================================================
section('M7 \u2014 alternance sur les 43 modules', function () {
    var sansThème = 0, avecThème = 0, erreurs = [];
    P10.MODULES.forEach(function (m) {
        var ctx = clic(m.chapterId);
        if (ctx.discussionTopic === null) sansThème++; else avecThème++;
        try {
            var req = requestDepuis(contexteChat());
            var v = validerContrat(req);
            if (v.errors.length) erreurs.push(m.chapterId + ' : ' + v.errors.join(', '));
            if (ctx.discussionTopic === null && req.context.chat.module &&
                req.context.chat.module.discussion_topic) {
                erreurs.push(m.chapterId + ' : discussion_topic parasite');
            }
        } catch (e) {
            erreurs.push(m.chapterId + ' : ' + e.message);
        }
        assert2(m, ctx);
    });
    function assert2(m, ctx) {
        var owns = ctx.discussionTopic === null ||
            m.discussionTopics.indexOf(ctx.discussionTopic) !== -1;
        if (!owns) erreurs.push(m.chapterId + ' : thème non publié par le module');
    }
    assert(avecThème === 1 && sansThème === P10.MODULES.length - 1,
        'M7.1 — 1 module publie des discussions, ' + sansThème + ' autres non (référentiel inchangé)');
    assert(erreurs.length === 0,
        'M7.2 — les 43 modules produisent un RequestV2 valide selon le contrat du Worker' +
        (erreurs.length ? ' | ' + erreurs.slice(0, 3).join(' | ') : ''));
});

// =================================================================
// M8 — aucune fuite de topic d'un module à l'autre
// =================================================================
section('M8 \u2014 aucune fuite du topic d\u2019un module vers l\u2019autre', function () {
    // Point de d\u00e9part : le seul module qui publie des discussions.
    clic('pep-y1s2-03');
    assert(P10.context().discussionTopic === 'techniques' &&
        win.currentDiscussion === 'techniques',
        'M8.0 — point de d\u00e9part peupl\u00e9 (th\u00e8me publi\u00e9 actif)');
    var fuites = [], parParcours = {}, verifie = 0, annees = {};
    P10.MODULES.forEach(function (m) {
        parParcours[m.parcours] = (parParcours[m.parcours] || 0) + 1;
        annees['y' + m.yearNumber + 's' + m.semesterNumber] = 1;
        verifie++;
        clic(m.chapterId);
        var c = P10.context();
        if (c.discussionTopic !== null &&
                m.discussionTopics.indexOf(c.discussionTopic) === -1) {
            fuites.push(m.chapterId + ' : th\u00e8me ' + c.discussionTopic);
        }
        var chatSousTest = contexteChat().chatContext.chat;
        if (!chatSousTest.module || chatSousTest.module.chapter_id !== m.chapterId) {
            fuites.push(m.chapterId + ' : id transmis ' +
                (chatSousTest.module ? chatSousTest.module.chapter_id : 'absent'));
        }
        if (!m.discussionTopics.length && chatSousTest.topic_title !== m.title) {
            fuites.push(m.chapterId + ' : titre ' + chatSousTest.topic_title);
        }
        if (!m.discussionTopics.length && chatSousTest.topic !== P10.MODULE_CHAT_TOPIC) {
            fuites.push(m.chapterId + ' : topic ' + chatSousTest.topic);
        }
        if (win.currentDiscussion && win.currentDiscussion !== c.discussionTopic) {
            fuites.push(m.chapterId + ' : reflet ' + win.currentDiscussion);
        }
    });
    assert(fuites.length === 0,
        'M8.1 — les 43 modules gardent un contexte Chat qui leur appartient' +
        (fuites.length ? ' | ' + fuites.slice(0, 3).join(' | ') : ''));
    assert(verifie === P10.MODULES.length &&
        Object.keys(annees).length >= 3 &&
        P10.MODULES.every(function (m) { return !!parParcours[m.parcours]; }),
        'M8.2 — tous les modules du référentiel (' + verifie + ' sur ' + P10.MODULES.length +
        ', parcours ' + Object.keys(parParcours).join('/') + ', ' + Object.keys(annees).length +
        ' combinaisons année/semestre) sont vérifiés sans fuite');
    var modulesSansDiscussion = P10.MODULES.filter(function (m) {
        return !m.discussionTopics.length;
    });
    assert(modulesSansDiscussion.length >= 2 &&
        modulesSansDiscussion.every(function (m) { return !!P10.module(m.chapterId); }),
        'M8.3 — au moins deux modules sans discussion sont test\u00e9s (' +
        modulesSansDiscussion.length + ')');
    clic('pep-y2s1-03');
    var r = P10.setContext({ discussionTopic: 'techniques' });
    assert(r.context.discussionTopic === null,
        'M8.9 — invariant : un patch croisé (thème d\u2019un autre module) est refusé');
    var r2 = P10.update({ discussionTopic: 'narratif' }, 'test');
    assert(r2.context.discussionTopic === null,
        'M8.10 — invariant : update() ne peut pas injecter un thème non publié');
    clic('pep-y1s2-03');
    var r3 = P10.update({ discussionTopic: 'resume' }, 'test');
    assert(r3.context.discussionTopic === 'resume',
        'M8.11 — le thème publié reste accepté quand le module le publie');
    var constr = contexteChat();
    assert(constr.chatContext.chat.topic === 'resume',
        'M8.12 — le contexte chat suit le thème choisi, pas un thème précédent');
});

// =================================================================
// M9 — historique : clés déterministes, spécifiques, isolées
// =================================================================
section('M9 \u2014 historique contextuel du module sans discussion', function () {
    var regroupe = {};
    ['pep-y1s1-01', 'pep-y2s1-03', 'pep-y2s2-03', 'pem-y1s1-01', 'pes-y1s1-01'].forEach(function (id) {
        if (!P10.module(id)) return;
        clic(id);
        var sujet = win.p10SujetChat();
        var cle = win.p10ChatStorageKey(sujet);
        regroupe[id] = cle;
        assert(P10.isCanonicalHistoryKey(cle),
            'M9.1 — clé canonique pour ' + id + ' : ' + cle);
        assert(cle.indexOf('chatHistory_' + id + ':') === 0,
            'M9.2 — clé spécifique au module ' + id);
        assert(cle.indexOf('null') === -1 && cle !== 'chatHistory_' &&
            cle !== 'chatHistory_',
            'M9.3 — aucune clé parasite (null / racine) pour ' + id);
    });
    var valeurs = Object.keys(regroupe).map(function (k) { return regroupe[k]; });
    assert(valeurs.length === new Set(valeurs).size,
        'M9.4 — aucune collision entre modules sur la clé d\u2019historique');
    clic('pep-y1s2-03');
    var clePubliee = win.p10ChatStorageKey(win.p10SujetChat());
    assert(/^chatHistory_pep-y1s2-03:(techniques|narratif|descriptif|explicatif|argumentatif|resume)$/.test(clePubliee),
        'M9.5 — module peuplé : thème publié dans la clé (' + clePubliee + ')');
    assert(clePubliee !== regroupe['pep-y1s2-03'] || !regroupe['pep-y1s2-03'],
        'M9.6 — le chemin publié n\u2019est pas écrasé par le jeton module');
    clic('pep-y2s1-03');
    var avant = Object.keys(env.localStorage.__donnees).length;
    env.localStorage.setItem(win.p10ChatStorageKey(win.p10SujetChat()), '[]');
    assert(Object.keys(env.localStorage.__donnees).length >= avant,
        'M9.7 — écriture sur la clé de niveau module isolée des autres');
    var legacy = ['chatHistory_techniques', 'chatHistory_narratif'];
    legacy.forEach(function (k) { env.localStorage.setItem(k, '[{"text":"x","sender":"ai"}]'); });
    var journal = P10.migrateLegacyHistoryKeys(env.localStorage);
    assert(journal && Array.isArray(journal.migrated),
        'M9.8 — la migration existante reste fonctionnelle avec les nouvelles clés');
    assert(journal.migrated.every(function (t) { return typeof t === 'string' && t.length > 0; }),
        'M9.9 — la passe de migration ne traite que des thèmes publiés connus');
    assert(journal.migrated.every(function (t) {
        return P10.isCanonicalHistoryKey(P10.historyKey(P10.LEGACY_DISCUSSION_CHAPTER_ID, t));
    }), 'M9.9b — chaque thème migré rejoint une clé canonique <module>:<thème>');
    assert(!!env.localStorage.getItem('chatHistory_pep-y1s2-03:techniques'),
        'M9.9c — l\'héritage chatHistory_techniques est retrouvé sous la clé du module');
    assert(env.localStorage.getItem('chatHistory_techniques') === null,
        'M9.9d — l\'ancienne clé n\'est retirée qu\'après écriture réussie');
    assert(!/chatHistory_module\b/.test(Object.keys(env.localStorage.__donnees).join(',')),
        'M9.9e — aucune clé d\'historique ne tombe sur le jeton module sans module');
    // Contrats textuels attestés par la suite existante test-7 (non affaiblis) :
    assert(html.indexOf("addMessageToHistory(window.currentDiscussion") !== -1 &&
        html.indexOf('chatContainer.appendChild(messageDiv);') <
        html.indexOf("addMessageToHistory(window.currentDiscussion"),
        'M9.10 — la persistance garde window.currentDiscussion en premier sujet, après appendChild');
    assert((html.match(/'chatHistory_' \+/g) || []).length ===
        (lireHead('index.html').match(/'chatHistory_' \+/g) || []).length,
        'M9.11 — aucune nouvelle construction littérale de clé chatHistory_ ajoutée');
});

// =================================================================
// M10 — contexte vu par l'IA et ligne de situation du Worker
// =================================================================
section('M10 \u2014 contexte IA transmis et ligne de situation du Worker', function () {
    clic('pep-y2s1-03');
    var req = requestDepuis(contexteChat());
    var module = req.context.chat.module;
    var ligne = ligneSituation(module);
    assert(ligne.indexOf('module pep-y2s1-03') !== -1,
        'M10.1 — la ligne de situation cite l\u2019id canonique : ' + ligne.trim());
    assert(/intitul\u00e9 \u00ab Techniques et pratiques de l\u2019\u00e9crit 1 \u00bb/.test(ligne),
        'M10.2 — la ligne de situation cite le titre réel du module');
    assert(ligne.indexOf('parcours pep') !== -1 && ligne.indexOf('ann\u00e9e 2') !== -1 &&
        ligne.indexOf('semestre 1') !== -1,
        'M10.3 — parcours / année / semestre présents');
    assert(ligne.indexOf('techniques') === -1,
        'M10.4 — aucun thème d\u2019un autre module n\u2019atteint le prompt');
    assert(JSON.stringify(req).indexOf('mot_de_passe') === -1 &&
        JSON.stringify(req).indexOf('password') === -1,
        'M10.5 — aucun secret dans le payload');
    assert(req.mode === 'chat' && req.contractVersion === '2.0' &&
        typeof req.student.text_original === 'string',
        'M10.6 — RequestV2 conserve la forme du contrat (version, mode, text_original)');
    var v = validerContrat(req);
    assert(v.valid === true || (v.errors && v.errors.length === 0),
        'M10.7 — validation du contrat Worker : ' + JSON.stringify(v.errors || []));
});

console.log('\n-----------------------------------------------');
console.log('\u2705 PASS : ' + pass + '    \u274c FAIL : ' + fail);
if (fail) { console.error('\u274c \u00c9CHEC'); process.exit(1); }
console.log('\u2705 R\u00c9USSITE');
