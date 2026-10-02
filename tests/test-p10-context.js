/**
 * =================================================================
 * P10 — Tests du référentiel canonique et du contexte partagé
 * =================================================================
 * Couvre les contrats gelés par la directive P10 :
 *   P10.1  un seul contexte (parcours / année / semestre / module / leçon) ;
 *   P10.2  mapping des 43 modules, ids canoniques, homonymes non fusionnés ;
 *   P10.4  arbre Parcours piloté par les données, sans contenu inventé ;
 *   P10.5  arbre Discussion qui reprend la hiérarchie du Parcours ;
 *   P10.6  clés d'historique contextualisées et migration douce ;
 *   P10.7  payload IA enrichi (chapter_id, parcours, année, semestre) ;
 *   P10.8  fiche « colonne 4 » honnête ;
 *   P10.9  hash contextuel avec rétro-compatibilité #narratif-1 ;
 *   Sécurité : échappement du balisage, identifiants validés avant onclick,
 *              aucune donnée sensible dans le contexte envoyé à l'IA.
 *
 * Aucun DOM, aucun réseau, aucun fichier modifié :
 *   node tests/test-p10-context.js
 * =================================================================
 */

'use strict';

var path = require('path');
var P10 = require(path.join(__dirname, '..', 'src', 'p10-context.js'));
var RB = require(path.join(__dirname, '..', 'src', 'request-builder-v2.js'));

var pass = 0;
var fail = 0;
var exceptions = [];

function assert(cond, label) {
    if (cond) { pass++; console.log('  \u2705 PASS \u2014 ' + label); }
    else { fail++; console.log('  \u274c FAIL \u2014 ' + label); }
}

function section(titre, fn) {
    console.log('\n=== ' + titre + ' ===');
    try { fn(); }
    catch (e) {
        fail++;
        var type = (e && e.constructor && e.constructor.name) ? e.constructor.name : 'Error';
        var msg = (e && e.message) ? e.message : String(e);
        exceptions.push({ section: titre, type: type, message: msg });
        console.log('  \u274c FAIL \u2014 exception dans "' + titre + '" : ' + type + ': ' + msg);
    }
}

var CONTEXTE_ORIGINAL = P10.context();

/** Rétablit le contexte global après une section qui l'a modifié. */
function restaurerContexte() { P10.setContext(CONTEXTE_ORIGINAL); }

function fauxStockage(initial) {
    var data = {};
    Object.keys(initial || {}).forEach(function (k) { data[k] = initial[k]; });
    return {
        _data: data,
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
        setItem: function (k, v) { data[k] = String(v); },
        removeItem: function (k) { delete data[k]; },
        key: function (i) { return Object.keys(data)[i] === undefined ? null : Object.keys(data)[i]; }
    };
}

// =================================================================
// P10.2 — RÉFÉRENTIEL CANONIQUE
// =================================================================
section('M1 — Les 43 modules du référentiel', function () {
    var modules = P10.MODULES;
    assert(modules.length === 43, '43 modules déclarés (obtenu: ' + modules.length + ')');

    var ids = modules.map(function (m) { return m.chapterId; });
    var uniques = Object.keys(ids.reduce(function (a, v) { a[v] = 1; return a; }, {}));
    assert(uniques.length === 43, 'tous les chapterId sont uniques');
    assert(ids.every(function (id) { return /^(pep|pem|pes)-y[12]s[12]-\d{2}$/.test(id); }),
        'chaque id suit la forme canonique parcours-y{1|2}s{1|2}-NN');

    var attendus = { 'pep-y1s1': 13, 'pep-y1s2': 13, 'pep-y2s1': 9, 'pep-y2s2': 8 };
    var repartitionOk = true;
    Object.keys(attendus).forEach(function (prefix) {
        var obtenu = ids.filter(function (id) { return id.indexOf(prefix + '-') === 0; }).length;
        if (obtenu !== attendus[prefix]) {
            repartitionOk = false;
            console.log('   \u21b3 ' + prefix + ' : ' + obtenu + ' attendu ' + attendus[prefix]);
        }
    });
    assert(repartitionOk, 'répartition 13 / 13 / 9 / 8 par semestre');

    assert(modules.every(function (m) {
        return m.parcours === m.chapterId.split('-')[0] &&
            m.yearNumber === parseInt(m.chapterId.split('-')[1].slice(1, 2), 10) &&
            m.semesterNumber === parseInt(m.chapterId.split('-')[1].slice(3, 4), 10);
    }), 'chaque module est cohérent avec son propre identifiant');

    var audit = P10.auditMapping();
    assert(audit.count === 43 && audit.uniqueIds === 43 && audit.issues.length === 0,
        'auditMapping : 43 ids uniques, aucune anomalie (problèmes: ' + audit.issues.join(', ') + ')');
    assert(audit.duplicateTitles.length >= 3,
        'les homonymes réels restent détectés comme homonymes (' + audit.duplicateTitles.length + ')');

    var ulm1 = modules.filter(function (m) { return m.title === 'Usage et maîtrise de la langue 1'; });
    assert(ulm1.length === 2 && ulm1[0].chapterId !== ulm1[1].chapterId,
        'homonymes P1/P2 : même libellé, identifiants distincts (jamais reliés par le titre)');

    var peuples = modules.filter(function (m) { return m.hasContent; });
    assert(peuples.length === 1 && peuples[0].chapterId === 'pep-y1s2-03',
        'un seul module réellement peuplé : pep-y1s2-03');
    assert(P10.CONTENT_MODULE_IDS.length === 1,
        'CONTENT_MODULE_IDS ne déclare que le module peuplé');

    var ordresOk = true;
    [['pep', 1, 1], ['pep', 1, 2], ['pep', 2, 1], ['pep', 2, 2]].forEach(function (coordonnees) {
        var liste = P10.modulesFor(coordonnees[0], coordonnees[1], coordonnees[2]);
        for (var i = 1; i < liste.length; i++) {
            if (!(liste[i - 1].order < liste[i].order)) ordresOk = false;
        }
    });
    assert(ordresOk, 'ordre de présentation strict dans chaque semestre');

    assert(P10.module('inexistant') === null && P10.module(null) === null && P10.module(42) === null,
        'module() renvoie null pour tout identifiant inconnu');
});

// =================================================================
// P10.1 — CONTEXTE PARTAGÉ UNIQUE
// =================================================================
section('M2 — Un contexte, une notification', function () {
    var defaut = P10.context();
    assert(defaut.parcours === 'pep' && defaut.yearNumber === 1 && defaut.semesterNumber === 2 &&
        defaut.chapterId === 'pep-y1s2-03',
        'contexte par défaut = PEP · 1re année · S2 · Techniques et pratique de l\u2019écrit 2');

    var copie = P10.context();
    copie.chapterId = 'détourné';
    assert(P10.context().chapterId === 'pep-y1s2-03',
        'context() renvoie une copie : l\u2019état interne n\u2019est pas modifiable de l\u2019extérieur');

    var ctx = P10.selectModule('pep-y2s1-05');
    assert(ctx && ctx.chapterId === 'pep-y2s1-05' && ctx.parcours === 'pep' &&
        ctx.yearNumber === 2 && ctx.semesterNumber === 1,
        'selectModule impose parcours / année / semestre depuis le référentiel');
    assert(ctx && ctx.lessonId === null && ctx.discussionTopic === null,
        'un module sans contenu ni discussion ne prétend rien (leçon et topic nuls)');

    var retour = P10.selectModule('module-fantome');
    assert(retour === null && P10.context().chapterId === 'pep-y2s1-05',
        'selectModule inconnu : null et contexte inchangé');

    var patchRefuse = P10.setContext({ yearNumber: 7, semesterNumber: 'deux' });
    assert(patchRefuse.context.yearNumber === 2 && patchRefuse.context.semesterNumber === 1,
        'patch invalide ignoré (année et semestre validés)');

    var patchParcours = P10.setContext({ parcours: 'PEM' });
    assert(patchParcours.context.parcours === 'pep' &&
        patchParcours.context.chapterId === 'pep-y2s1-05',
        'le module reste autorité : un parcours incompatible avec le module est corrigé');

    assert(P10.setContext({ parcours: 'PEP' }).context.parcours === 'pep',
        'un parcours valide est normalisé en clé interne');

    var lecon = P10.applyLegacyLesson('descriptif-3');
    assert(lecon && lecon.chapterId === 'pep-y1s2-03' && lecon.lessonId === 'descriptif-3',
        'applyLegacyLesson rattache le chapitre hérité à son module canonique');
    assert(P10.applyLegacyLesson('resume-99') === null && P10.applyLegacyLesson('import-export') === null,
        'chapitre hérité inconnu ou malformé ignoré');

    P10.setContext({ chapterId: 'pep-y2s2-01' });
    assert(P10.context().lessonId === null,
        'changer de module abandonne la leçon héritée qui ne lui appartient pas');

    var raisons = [];
    P10.subscribe(function (ctx2, reason) { raisons.push(reason); });
    P10.update({ discussionTopic: 'narratif' }, 'topic');
    assert(raisons.length === 1 && raisons[raisons.length - 1] === 'topic',
        'update() notifie les abonnés avec la raison demandée');

    var blocage = 0;
    P10.subscribe(function () { throw new Error('abonné défaillant'); });
    P10.subscribe(function () { blocage++; });
    var notifie = true;
    try { P10.notify('test'); } catch (e) { notifie = false; }
    assert(notifie && blocage === 1,
        'un abonné qui lève ne bloque ni la notification ni les autres abonnés');

    assert(P10.contextLine(P10.context()).indexOf('Parcours PEP') === 0,
        'contextLine() commence par le parcours et reste un libellé, pas un identifiant');
    restaurerContexte();
});

// =================================================================
// P10.6 — CLÉS D'HISTORIQUE CONTEXTUALISÉES
// =================================================================
section('M3 — Historique par module et migration douce', function () {
    var cle = P10.historyKey('pep-y1s2-03', 'narratif');
    assert(cle === 'chatHistory_pep-y1s2-03:narratif',
        'clé canonique chatHistory_<chapterId>:<topic> (obtenu: ' + cle + ')');
    assert(P10.historyKey('pep-y2s1-01', 'narratif') !== cle,
        'narratif en PEP-1re année-S2 et en PEP-2e année-S1 ne partagent pas leur historique');
    assert(P10.historyKey('pep-y1s2-03', "narratif'; alert(1)") === null,
        'un topic malformé ne produit aucune clé');
    assert(P10.historyKey(null, 'narratif') === null && P10.historyKey('pep-y1s2-03', null) === null,
        'chapterId ou topic manquant : aucune clé (pas de chatHistory_null)');
    assert(P10.legacyHistoryKey('techniques') === 'chatHistory_techniques',
        'legacyHistoryKey() conserve la lecture de l\u2019ancien format');
    assert(P10.isCanonicalHistoryKey(cle) === true &&
        P10.isCanonicalHistoryKey('chatHistory_techniques') === false &&
        P10.isCanonicalHistoryKey(null) === false,
        'isCanonicalHistoryKey() distingue les deux formats');

    // Migration : legacy présent, canonique absent → déplacement sans perte.
    var storage = fauxStockage({
        chatHistory_techniques: '[{"role":"student","text":"bonjour"}]',
        chatHistory_narratif: '[]'
    });
    var journal = P10.migrateLegacyHistoryKeys(storage);
    assert(storage.getItem('chatHistory_pep-y1s2-03:techniques') === '[{"role":"student","text":"bonjour"}]',
        'l\u2019ancien historique est repris à la clé canonique, contenu intact');
    assert(storage.getItem('chatHistory_techniques') === null,
        'l\u2019ancienne clé est retirée seulement après écriture réussie');
    assert(journal.migrated.indexOf('techniques') !== -1,
        'migration journalisée pour techniques');

    // '[]' est vide : la clé canonique n\u2019est pas occupée, le legacy migre.
    var storageVide = fauxStockage({ chatHistory_narratif: '[{"role":"ai","text":"x"}]' });
    var journalVide = P10.migrateLegacyHistoryKeys(storageVide);
    assert(storageVide.getItem('chatHistory_pep-y1s2-03:narratif') === '[{"role":"ai","text":"x"}]' &&
        storageVide.getItem('chatHistory_narratif') === null &&
        journalVide.migrated.indexOf('narratif') !== -1,
        'un contenu existant est conservé, même si la clé canonique valait []');

    // Collision : canonique déjà occupé → le legacy n'est PAS supprimé.
    var storageConflit = fauxStockage({
        chatHistory_descriptif: 'ANCIEN',
        'chatHistory_pep-y1s2-03:descriptif': 'NEUVE'
    });
    var journalConflit = P10.migrateLegacyHistoryKeys(storageConflit);
    assert(storageConflit.getItem('chatHistory_descriptif') === 'ANCIEN' &&
        storageConflit.getItem('chatHistory_pep-y1s2-03:descriptif') === 'NEUVE' &&
        journalConflit.conflicts.indexOf('descriptif') !== -1,
        'en cas de collision, aucune donnée n\u2019est écrasée ni supprimée (conflit journalisé)');

    // Idempotence : une seconde passe ne re-migre pas un thème déjà traité.
    var avant = storage.getItem('chatHistory_pep-y1s2-03:techniques');
    var second = P10.migrateLegacyHistoryKeys(storage);
    assert(storage.getItem('chatHistory_pep-y1s2-03:techniques') === avant &&
        second.skipped.indexOf('techniques') !== -1,
        'migration idempotente : un thème traité n\u2019est plus jamais rejoué');

    // Après « Réinitialiser » : clé canonique vidée, legacy absent → rien ne revient.
    var storageApresReset = fauxStockage({ 'chatHistory_pep-y1s2-03:resume': '[]' });
    P10.migrateLegacyHistoryKeys(storageApresReset);
    var relance = P10.migrateLegacyHistoryKeys(storageApresReset);
    assert(storageApresReset.getItem('chatHistory_resume') === null &&
        relance.migrated.indexOf('resume') !== -1,
        'aucune réapparition d\u2019un historique supprimé par l\u2019utilisateur');

    assert(typeof storage.getItem(P10.MIGRATION_KEY) === 'string',
        'le registre de migration est écrit (' + P10.MIGRATION_KEY + ')');

    var sansStorage = P10.migrateLegacyHistoryKeys(null);
    assert(sansStorage && sansStorage.migrated.length === 0,
        'storage indisponible : la migration s\u2019arrête proprement sans exception');

    var stockageSansRemove = {
        getItem: function () { return null; },
        setItem: function () { }
    };
    var journalRobuste = P10.migrateLegacyHistoryKeys(stockageSansRemove);
    assert(journalRobuste && Array.isArray(journalRobuste.migrated),
        'storage partiel (pas de removeItem) : aucune exception');
});

// =================================================================
// P10.9 — HASH CONTEXTEUEL ET RÉTRO-COMPATIBILITÉ
// =================================================================
section('M4 — Hash #pep/y1/s2/<module>[/<leçon>]', function () {
    var ctx = P10.selectModule('pep-y1s2-03');
    var hash = P10.formatHash(ctx);
    assert(hash === '#pep/y1/s2/pep-y1s2-03', 'hash canonique du module peuplé (obtenu: ' + hash + ')');

    P10.applyLegacyLesson('narratif-2');
    var hashLecon = P10.formatHash(P10.context());
    assert(hashLecon === '#pep/y1/s2/pep-y1s2-03/narratif-2',
        'la leçon héritée est ajoutée au hash (obtenu: ' + hashLecon + ')');

    var relu = P10.parseHash(hashLecon);
    assert(relu && relu.kind === 'canonical' && relu.chapterId === 'pep-y1s2-03' && relu.lessonId === 'narratif-2',
        'round-trip format → parse sur le format canonique');

    var herite = P10.parseHash('#descriptif-4');
    assert(herite && herite.kind === 'legacy' && herite.chapterId === 'pep-y1s2-03' &&
        herite.lessonId === 'descriptif-4' && herite.semesterNumber === 2,
        'rétro-compatibilité : #descriptif-4 résout son module canonique');

    assert(P10.parseHash('#pep/y2/s1/pep-y1s2-03') === null,
        'hash incohérent (préfixe ≠ module) rejeté');
    assert(P10.parseHash('#pep/y1/s2/module-fantome') === null,
        'hash visant un module inconnu rejeté');
    assert(P10.parseHash('#pep/y1/s2/pep-y1s2-03/resume-9') === null,
        'hash visant une leçon hors bornes rejeté');
    assert(P10.parseHash('#s2') === null && P10.parseHash('') === null && P10.parseHash(undefined) === null,
        'hash de l\u2019ancien arbre visuel ou vide : aucun effet');
    assert(P10.parseHash('#pep/y1/s2/../../etc') === null,
        'tentative de traversal dans un hash rejetée');

    restaurerContexte();
    var restaure = P10.restoreFromHash('#pep/y2s1'.replace('y2s1', 'y2/s1/pep-y2s1-09'));
    assert(restaure && restaure.chapterId === 'pep-y2s1-09' && restaure.yearNumber === 2 &&
        restaure.semesterNumber === 1,
        'restoreFromHash applique le hash au contexte');
    assert(P10.restoreFromHash('#inconnu-1') === null,
        'restoreFromHash sur hash inexploitable : null, contexte intact');
    assert(P10.restoreFromHash('#argumentatif-1').lessonId === 'argumentatif-1',
        'restoreFromHash accepte un hash hérité');
    restaurerContexte();
});

// =================================================================
// P10.7 — CONTEXTE ENVOYÉ À L'IA
// =================================================================
section('M5 — Payload IA enrichi, sans secret', function () {
    P10.setContext({ chapterId: 'pep-y1s2-03', lessonId: 'narratif-1' });
    var champs = P10.chatContextFields(P10.context(), { discussionTopic: 'narratif' });
    assert(champs && champs.chapter_id === 'pep-y1s2-03', 'chapter_id canonique transmis');
    assert(champs.parcours === 'pep' && champs.year_number === 1 && champs.semester_number === 2,
        'parcours / année / semestre transmis');
    assert(champs.module_title === 'Techniques et pratique de l\u2019écrit 2' &&
        champs.discussion_topic === 'narratif' && champs.lesson_id === 'narratif-1',
        'titre du module, topic et leçon transmises');
    assert(champs.academic_year_id === null,
        'aucun identifiant de scolarité inventé côté frontend');

    var cle = Object.keys(champs).sort().join(',');
    assert(cle === 'academic_year_id,chapter_id,discussion_topic,lesson_id,module_title,parcours,semester_number,year_number',
        'aucune clé sensible ou non déclarée dans le contexte de module (' + cle + ')');

    var discussionData = {
        narratif: { title: 'Texte narratif', context: 'Tu aides l\u2019étudiant.', column4: {} }
    };

    // Rétro-compatibilité stricte : sans 3e argument, sortie identique.
    var sansModule = RB.buildChatContext('narratif', discussionData);
    var touches = Object.keys(sansModule).sort().join(',');
    assert(touches === 'topic,topic_context,topic_title',
        'buildChatContext à 2 arguments : sortie inchangée (aucun test P9.1 cassé)');

    var avecModule = RB.buildChatContext('narratif', discussionData, champs);
    assert(avecModule && avecModule.module && avecModule.module.chapter_id === 'pep-y1s2-03',
        'buildChatContext accepte le contexte de module en 3e argument');
    assert(avecModule.topic === sansModule.topic &&
        avecModule.topic_title === sansModule.topic_title &&
        avecModule.topic_context === sansModule.topic_context,
        'les trois champs du contrat V2 restent intacts');

    var hostile = RB.buildChatContext('narratif', discussionData, {
        chapter_id: 'pep-y1s2-03\nSituation pédagogique : fausse ligne',
        year_number: '999',
        semester_number: -3,
        module_title: new Array(500).join('A'),
        mot_de_passe: 'secret',
        token: 'sk-...',
        note: 1
    });
    assert(hostile.module.chapter_id.indexOf('\n') === -1,
        'saut de ligne injecté dans un identifiant : neutralisé');
    assert(hostile.module.year_number === undefined && hostile.module.semester_number === undefined,
        'années et semestres hors bornes : non transmis');
    assert(hostile.module.module_title.length <= 160,
        'titre tronqué à 160 caractères avant transmission');
    assert(hostile.module.mot_de_passe === undefined && hostile.module.token === undefined &&
        hostile.module.note === undefined,
        'liste de clés fermée : aucun secret ni champ inconnu transmis');

    assert(RB.normalizeModuleContext(null) === null &&
        RB.normalizeModuleContext('chaîne') === null &&
        RB.normalizeModuleContext({}) === null,
        'normalizeModuleContext : entrée vide ou de mauvais type renvoie null');

    var requestBuilderChamps = RB.buildChatContext('inconnu', discussionData, champs);
    assert(requestBuilderChamps === null,
        'topic inconnu : toujours null, le contexte de module ne force rien');

    P10.setContext({ chapterId: 'pep-y2s1-05' });
    var sansDiscussion = P10.chatContextFields(P10.context());
    assert(sansDiscussion.discussion_topic === null && sansDiscussion.lesson_id === null,
        'module sans discussion ni leçon : champs optionnels à null, pas de "null" littéral');
    restaurerContexte();
});

// =================================================================
// P10.4 / P10.5 — RENDUS DATA-DRIVEN ET SÉCURISÉS
// =================================================================
section('M6 — Arbres générés : échappement et aucune donnée inventée', function () {
    var contents = P10.buildContents({
        narratif: {
            title: 'Texte narratif',
            modules: {
                'narratif-1': { title: 'Situation initiale' },
                'narratif-2': { title: '<img src=x onerror=alert(1)>' }
            }
        }
    });
    assert(Object.keys(contents).length === 1 && contents['pep-y1s2-03'].narratif.lessons.length === 4,
        'buildContents produit les 4 leçons de chaque type présent');
    assert(contents['pep-y1s2-03'].narratif.lessons[2].title === 'narratif-3',
        'leçon absente : libellé = identifiant technique, rien n\u2019est inventé');
    assert(contents['pep-y1s2-03'].descriptif &&
        contents['pep-y1s2-03'].descriptif.title === 'descriptif' &&
        contents['pep-y1s2-03'].descriptif.lessons[0].title === 'descriptif-1',
        'un type de texte absent du parcoursData garde ses identifiants techniques \u2014 aucun libellé inventé');

    var arbre = P10.renderParcoursTree({
        context: P10.context(),
        contents: contents
    });
    assert(arbre.indexOf('<img src=x onerror') === -1,
        'un titre hostile n\u2019est jamais recopié brut dans l\u2019arbre');
    assert(arbre.indexOf('&lt;img src=x onerror=alert(1)&gt;') !== -1,
        'le même titre est échappé (entités HTML)');
    assert((arbre.match(/data-module-id="/g) || []).length === 43,
        '43 modules sélectionnables dans l\u2019arbre généré');
    assert((arbre.match(/data-chapter="/g) || []).length === 20,
        'les 20 chapitres hérités produisent toujours un bouton data-chapter');
    assert((arbre.match(/sans contenu/g) || []).length === 42,
        '42 badges « sans contenu » — aucune activité prétendue');
    assert(/onclick="p10SelectModule\('pep-y1s1-01'\)"/.test(arbre),
        'gestionnaire d\u2019un module vide : uniquement son identifiant canonique');
    assert(arbre.indexOf("p10SelectModule('<") === -1 && arbre.indexOf('toggleTree(\'<') === -1,
        'aucun identifiant non validé n\u2019entre dans un onclick');
    assert((arbre.match(/<div/g) || []).length === (arbre.match(/<\/div>/g) || []).length,
        'arbre Parcours : balisage <div> équilibré');
    assert((arbre.match(/<button/g) || []).length === (arbre.match(/<\/button>/g) || []).length,
        'arbre Parcours : balisage <button> équilibré');

    var discussions = P10.renderDiscussionTree({
        context: P10.context(),
        discussionTitles: { techniques: '<script>alert(2)</script>' }
    });
    assert((discussions.match(/data-topic="/g) || []).length === 6,
        'les 6 discussions héritées, uniquement sous le module qui les porte');
    assert(discussions.indexOf('<script>alert(2)</script>') === -1,
        'titre de discussion hostile échappé dans l\u2019arbre Discussion');
    assert((discussions.match(/data-dmodule-id="/g) || []).length === 43,
        'arbre Discussion : 43 modules repris de la hiérarchie du Parcours');
    assert((discussions.match(/sans contenu/g) || []).length === 42,
        'arbre Discussion : 42 modules sans discussion publiée');
    assert(discussions.indexOf('Load More') === -1,
        'P10.0-D : aucune fausse pagination « Load More » dans le balisage généré');
    assert((discussions.match(/<div/g) || []).length === (discussions.match(/<\/div>/g) || []).length,
        'arbre Discussion : balisage <div> équilibré');

    var placeholders = P10.placeholderParcours();
    assert(placeholders.indexOf('PEM') !== -1 && placeholders.indexOf('PES') !== -1 &&
        placeholders.indexOf('onclick') === -1,
        'PEM / PES restent des libellés sans module ni gestionnaire');
});

// =================================================================
// P10.8 — FICHE « COLONNE 4 »
// =================================================================
section('M7 — Colonne 4 honnête', function () {
    var discussionData = {
        techniques: {
            title: 'Techniques et pratiques de l\u2019écrit',
            column4: {
                title: 'Techniques et pratiques de l\u2019écrit',
                finalities: 'Produire un écrit structuré.',
                objectives: ['Planifier', 'Réviser'],
                content: 'Contenu du module.'
            }
        }
    };
    P10.setContext({ chapterId: 'pep-y1s2-03', discussionTopic: 'techniques' });
    var fiche = P10.column4For(P10.context(), discussionData);
    assert(fiche && fiche.title === 'Techniques et pratiques de l\u2019écrit' && fiche.hasContent === true,
        'module peuplé : la fiche réelle du module est affichée');
    assert(fiche.objectives.length === 2 && fiche.finalities.indexOf('Produire') === 0,
        'finalités et objectifs repris de la fiche existante');
    assert(fiche.contextLine.indexOf('Parcours PEP') === 0 &&
        fiche.contextLine.indexOf('Techniques et pratique de l\u2019écrit 2') !== -1,
        'la ligne de contexte situant la fiche est produite depuis le contexte');

    P10.setContext({ chapterId: 'pep-y2s1-05', discussionTopic: null });
    var vide = P10.column4For(P10.context(), discussionData);
    assert(vide && vide.hasContent === false && vide.title === 'Lecture des textes littéraires 1',
        'module sans fiche : titre réel du module conservé');
    assert(vide.finalities.length > 0 && vide.objectives.length === 0 &&
        vide.content.indexOf('non encore publié') !== -1,
        'aucun contenu inventé : états explicites « aucune fiche » / « non encore publié »');
    assert(vide.contextLine.indexOf('(sans contenu)') !== -1,
        'l\u2019état « sans contenu » est visible dans la ligne de contexte');

    assert(P10.column4For({ chapterId: 'module-inconnu' }, discussionData) === null,
        'module inconnu : aucune fiche produite');
    restaurerContexte();
});

// =================================================================
// UTILITAIRES DE SÉCURITÉ
// =================================================================
section('M8 — Échappement et identifiants validés', function () {
    assert(P10.escape('<a href="x">&\'') === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;',
        'escape() couvre <, >, &, " et \'');
    assert(P10.escape(null) === '' && P10.escape(undefined) === '',
        'escape() sur une valeur absente renvoie une chaîne vide');
    assert(P10.safeId('pep-y1s2-03') === 'pep-y1s2-03', 'identifiant canonique accepté');
    assert(P10.safeId("narratif-1'; alert(1)") === null, 'identifiant avec ponctuation rejeté');
    assert(P10.safeId('<script>') === null && P10.safeId('../../etc/passwd') === null,
        'balisage et traversal rejetés');
    assert(P10.safeId(new Array(80).join('a')) === null, 'identifiant trop long rejeté');
    assert(P10.safeId(42) === null && P10.safeId({}) === null,
        'un identifiant doit être une chaîne');
});

// =================================================================
// RÉSUMÉ
// =================================================================
var total = pass + fail;
console.log('\n' + '='.repeat(60));
console.log('RÉSULTATS — P10 contexte et référentiel');
console.log('  \u2705 PASS : ' + pass);
console.log('  \u274c FAIL : ' + fail);
console.log('  TOTAL   : ' + total);
if (exceptions.length > 0) {
    console.log('  \u26a0\ufe0f  EXCEPTIONS : ' + exceptions.length);
    exceptions.forEach(function (ex, i) {
        console.log('     ' + (i + 1) + '. [' + ex.section + '] ' + ex.type + ': ' + ex.message);
    });
} else {
    console.log('  \u26a0\ufe0f  EXCEPTIONS : 0');
}
console.log('='.repeat(60));

if (fail > 0) {
    console.error('\n\u274c ' + fail + ' test(s) en échec');
    process.exit(1);
}
console.log('\n\u2705 Tous les tests P10 passent !');
process.exit(0);
