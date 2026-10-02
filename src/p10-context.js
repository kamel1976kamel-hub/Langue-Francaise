/**
 * =================================================================
 * P10 — RÉFÉRENTIEL CANONIQUE DES MODULES ET CONTEXTE PARTAGÉ
 * =================================================================
 * Objectif : donner à la zone « Parcours » et à la zone « Discussion »
 * un seul et même modèle de navigation/contextualisation, sans inventer
 * de contenu pédagogique et sans toucher au backend.
 *
 * RÈGLES (décisions P10.0) :
 *   - A : le catalogue frontend reste la source de PRÉSENTATION de l'arbre.
 *     Aucune table parcours/semesters/modules/discussions n'est créée.
 *   - B : l'historique de chat est contextualisé par le module :
 *     chatHistory_<chapterId>:<topic>. L'ancien format est MIGRÉ, jamais perdu.
 *   - C : les modules sans contenu restent visibles, marqués « sans contenu »,
 *     et restent sélectionnables (cohérence du contexte Parcours).
 *   - D : aucune fausse pagination (le bouton « Load More » est supprimé).
 *   - E : les modules ne sont JAMAIS reliés par leur titre. La clé est le
 *     chapterId canonique 'pep-y{1|2}s{1|2}-NN'.
 *
 * Ce module est DOM-libre : il produit des CHAÎNES HTML échappées et de la
 * logique pure, testables sous Node (tests/test-p10-context.js).
 * =================================================================
 */

// =================================================================
 // IDENTIFIANTS ET LIBELLÉS
// =================================================================

/** Parcouris connus du référentiel. Seul PEP est peuplé à ce jour. */
const P10_PARCOURS = ['pep', 'pem', 'pes'];

/**
 * Libellés d'affichage EXACTEMENT conservés (intitulés pédocrimatiques
 * reprise du C6.2 — aucun renommage arbitraire).
 */
const P10_PARCOURS_LABELS = {
    pep: 'Parcours PEP — Professeur de l\'École Primaire',
    pem: 'Parcours PEM — Professeur de l\'Enseignement Moyen',
    pes: 'Parcours PES — Professeur de l\'Enseignement Secondaire'
};

const P10_YEAR_LABELS = { 1: 'Première année', 2: 'Deuxième année' };
const P10_SEMESTER_LABELS = { 1: 'Semestre 1', 2: 'Semestre 2' };

/**
 * Référentiel des 43 modules fonctionnels : [chapterId, titre EXACT, année, semestre].
 *
 * Les intitulés sont copiés mot pour mot du catalogue de la Gestion pédagogique
 * (_PEDAGOGY_MODULE_CATALOG, index.html) : apostrophes typographiques ’ et
 * ligature œ incluses, 'pratique' vs 'pratiques', 'langue' vs 'langue française',
 * 'Lecture des textes/œuvres', 'expression(s) théâtrale(s)'.
 * tests/test-p10-context.js compare cet arrayau catalogue admin : aucune dérive
 * des deux sources n'est tolérée.
 */
const P10_MODULE_SEEDS = [
    // Première année — Semestre 1 (13)
    ['pep-y1s1-01', 'Usage et maîtrise de la langue 1', 1, 1],
    ['pep-y1s1-02', 'Techniques et pratique de l’oral 1', 1, 1],
    ['pep-y1s1-03', 'Techniques et pratique de l’écrit 1', 1, 1],
    ['pep-y1s1-04', 'Graphie et dictée 1', 1, 1],
    ['pep-y1s1-05', 'Initiation à la lecture des œuvres littéraires 1', 1, 1],
    ['pep-y1s1-06', 'Initiation à la langue française par le théâtre 1', 1, 1],
    ['pep-y1s1-07', 'Phonétique fonctionnelle 1', 1, 1],
    ['pep-y1s1-08', 'Méthodologie du travail universitaire 1', 1, 1],
    ['pep-y1s1-09', 'Informatique 1', 1, 1],
    ['pep-y1s1-10', 'Langue arabe 1', 1, 1],
    ['pep-y1s1-11', 'Anglais 1', 1, 1],
    ['pep-y1s1-12', 'Histoire de l’Algérie 1', 1, 1],
    ['pep-y1s1-13', 'Nationalisme et Citoyenneté 1', 1, 1],
    // Première année — Semestre 2 (13)
    ['pep-y1s2-01', 'Usage et maîtrise de la langue 2', 1, 2],
    ['pep-y1s2-02', 'Techniques et pratique de l’oral 2', 1, 2],
    ['pep-y1s2-03', 'Techniques et pratique de l’écrit 2', 1, 2],
    ['pep-y1s2-04', 'Graphie et dictée 2', 1, 2],
    ['pep-y1s2-05', 'Initiation à la lecture des œuvres littéraires 2', 1, 2],
    ['pep-y1s2-06', 'Initiation à la langue française par le théâtre 2', 1, 2],
    ['pep-y1s2-07', 'Phonétique fonctionnelle 2', 1, 2],
    ['pep-y1s2-08', 'Méthodologie du travail universitaire 2', 1, 2],
    ['pep-y1s2-09', 'Informatique 2', 1, 2],
    ['pep-y1s2-10', 'Langue arabe 2', 1, 2],
    ['pep-y1s2-11', 'Anglais 2', 1, 2],
    ['pep-y1s2-12', 'Histoire de l’Algérie 2', 1, 2],
    ['pep-y1s2-13', 'Nationalisme et Citoyenneté 2', 1, 2],
    // Deuxième année — Semestre 1 (9)
    ['pep-y2s1-01', 'Usage et maîtrise de la langue 1', 2, 1],
    ['pep-y2s1-02', 'Techniques et pratiques de l’oral 1', 2, 1],
    ['pep-y2s1-03', 'Techniques et pratiques de l’écrit 1', 2, 1],
    ['pep-y2s1-04', 'Langue française et expression théâtrale 1', 2, 1],
    ['pep-y2s1-05', 'Lecture des textes littéraires 1', 2, 1],
    ['pep-y2s1-06', 'Linguistique générale 1', 2, 1],
    ['pep-y2s1-07', 'Psychologie de l’enfant et de l’adolescent 1', 2, 1],
    ['pep-y2s1-08', 'Intelligence artificielle dans l’apprentissage 1', 2, 1],
    ['pep-y2s1-09', 'Anglais 1', 2, 1],
    // Deuxième année — Semestre 2 (8)
    ['pep-y2s2-01', 'Usage et maîtrise de la langue française 2', 2, 2],
    ['pep-y2s2-02', 'Techniques et pratiques de l’oral 2', 2, 2],
    ['pep-y2s2-03', 'Techniques et pratiques de l’écrit 2', 2, 2],
    ['pep-y2s2-04', 'Langue française et expressions théâtrales 2', 2, 2],
    ['pep-y2s2-05', 'Lecture des œuvres littéraires 2', 2, 2],
    ['pep-y2s2-06', 'Linguistique générale 2', 2, 2],
    ['pep-y2s2-07', 'Psychologie de l’enfant et de l’adolescent 2', 2, 2],
    ['pep-y2s2-08', 'Anglais 2', 2, 2]
];

/**
 * Seuls les modules réellement peuplés déclarent du contenu.
 * 'pep-y1s2-03' porte les 5 types de textes (20 chapitres {type}-{1..4}) et
 * les 6 discussions héritées. Rien n'est inventé pour les 42 autres.
 */
const P10_CONTENT_MODULES = {
    'pep-y1s2-03': {
        // Clé d'arbre conservée du C6.2 (toggleTree/togglePath et le contrat
        // visuel « Semestre 2 et module écrit 2 ouverts par défaut »).
        toggleKey: 'tpe',
        textTypes: ['narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'],
        discussionTopics: ['techniques', 'narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume']
    }
};

/** Discussion héritée rattachée à UN SEUL module : la migration d'historique. */
const P10_LEGACY_DISCUSSION_CHAPTER_ID = 'pep-y1s2-03';
const P10_LEGACY_DISCUSSION_TOPICS = ['techniques', 'narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'];

/** Types de textes : pure présentation (couleur + pictogramme du C6.2). */
const P10_TEXT_TYPE_VISUALS = {
    narratif: {
        gradient: 'from-blue-500 to-blue-600',
        icons: ['M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253']
    },
    descriptif: {
        gradient: 'from-emerald-500 to-emerald-600',
        icons: ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z']
    },
    explicatif: {
        gradient: 'from-amber-500 to-amber-600',
        icons: ['M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z']
    },
    argumentatif: {
        gradient: 'from-rose-500 to-rose-600',
        icons: ['M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z']
    },
    resume: {
        gradient: 'from-teal-500 to-teal-600',
        icons: ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z']
    }
};

/**
 * Ouverture initiale de la colonne Parcours : dépliage strictement progressif.
 * Au démarrage, seuls le parcours et ses deux années sont visibles ; les années
 * (Première comme Deuxième) ET les semestres sont repliés. Un clic sur une année
 * révèle ses deux semestres (repliés) ; un clic sur un semestre révèle ses
 * modules ; un clic sur un module ouvre le cours puis les activités. Aucune
 * donnée pédagogique n'est supprimée, seul l'état visuel initial change.
 */
const P10_DEFAULT_OPEN = {
    'pep': true,
    'pep/y1': false,
    'pep/y1/s1': false,
    'pep/y1/s2': false,
    'pep/y2': false,
    'pep/y2/s1': false,
    'pep/y2/s2': false
};

/** Clés d'arbre héritées du C6.2 : libellé de chemin → id de noeud. */
const P10_LEGACY_TREE_KEYS = {
    'pep': 'pep',
    'pep/y1': 'p1',
    'pep/y1/s1': 's1',
    'pep/y1/s2': 's2',
    'pep/y2': 'p2',
    'pep/y2/s1': 'p2s1',
    'pep/y2/s2': 'p2s2'
};

const P10_ID_RE = /^[a-z0-9-]+$/;
const P10_LEGACY_CHAPTER_RE = /^(narratif|descriptif|explicatif|argumentatif|resume)-([1-4])$/;
const P10_HASH_LIMITS = { module: 40, lesson: 24 };
const P10_MAX_CONTEXT_LINE = 240;
const P10_MAX_MODULE_TITLE = 120;

// =================================================================
 // NORMALISATION ET ÉCHAPPEMENT
// =================================================================

/**
 * Échappement HTML minimal mais strict : aucun donné issue du référentiel,
 * d'un titre de module ou d'un libellé de discussion n'entre en CRUDO dans
 * une chaîne HTML produite ici.
 */
function p10Escape(value) {
    var s = (value === null || value === undefined) ? '' : String(value);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Un identifiant n'est jamais injecté dans un onclick s'il n'est pas sûr. */
function p10SafeId(value) {
    var s = (typeof value === 'string') ? value.trim() : '';
    if (!s || !P10_ID_RE.test(s)) return null;
    if (s.length > 64) return null;
    return s;
}

function p10IntIn(value, allowed) {
    var n = (typeof value === 'number' && isFinite(value)) ? value : parseInt(value, 10);
    if (isNaN(n)) return null;
    return allowed.indexOf(n) !== -1 ? n : null;
}

function p10ParcoursKey(value) {
    var p = (typeof value === 'string') ? value.trim().toLowerCase() : '';
    return P10_PARCOURS.indexOf(p) !== -1 ? p : null;
}

// =================================================================
 // MAPPING CANONIQUE DES 43 MODULES (P10.2)
// =================================================================

/**
 * @typedef {{
 *   chapterId: string, parcours: string, yearNumber: number, semesterNumber: number,
 *   title: string, order: number, hasContent: boolean,
 *   toggleKey: (string|null), textTypes: string[], discussionTopics: string[]
 * }} P10Module
 */
function p10BuildModules() {
    var out = [];
    var perSemester = {};
    for (var i = 0; i < P10_MODULE_SEEDS.length; i++) {
        var seed = P10_MODULE_SEEDS[i];
        var chapterId = p10SafeId(seed[0]);
        if (!chapterId) continue;
        var year = p10IntIn(seed[2], [1, 2]);
        var semester = p10IntIn(seed[3], [1, 2]);
        if (year === null || semester === null) continue;
        var key = 'pep/y' + year + '/s' + semester;
        perSemester[key] = (perSemester[key] || 0) + 1;
        var content = P10_CONTENT_MODULES[chapterId] || null;
        out.push({
            chapterId: chapterId,
            parcours: 'pep',
            yearNumber: year,
            semesterNumber: semester,
            title: (typeof seed[1] === 'string') ? seed[1] : '',
            // 'order' = rang dans le semestre, porté par le suffixe de l'id.
            order: parseInt(chapterId.split('-')[2], 10) || perSemester[key],
            hasContent: !!content,
            toggleKey: content ? (content.toggleKey || null) : null,
            textTypes: content ? content.textTypes.slice() : [],
            discussionTopics: content ? content.discussionTopics.slice() : []
        });
    }
    return out;
}

const P10_MODULES = p10BuildModules();

/** index O(1) chapterId → module. */
const P10_MODULE_INDEX = (function () {
    var m = {};
    for (var i = 0; i < P10_MODULES.length; i++) m[P10_MODULES[i].chapterId] = P10_MODULES[i];
    return m;
})();

function p10GetModule(chapterId) {
    var id = p10SafeId(chapterId);
    return id && P10_MODULE_INDEX[id] ? P10_MODULE_INDEX[id] : null;
}

/** Modules d'un (parcours, année, semestre), dans l'ordre du référentiel. */
function p10ModulesFor(parcours, yearNumber, semesterNumber) {
    var p = p10ParcoursKey(parcours);
    var y = p10IntIn(yearNumber, [1, 2]);
    var s = p10IntIn(semesterNumber, [1, 2]);
    if (!p || y === null || s === null) return [];
    return P10_MODULES.filter(function (m) {
        return m.parcours === p && m.yearNumber === y && m.semesterNumber === s;
    });
}

/** Semestres réellement présents pour (parcours, année). */
function p10SemestersFor(parcours, yearNumber) {
    return p10ModulesFor(parcours, yearNumber, 1).length
        ? [1].concat(p10ModulesFor(parcours, yearNumber, 2).length ? [2] : [])
        : [];
}

function p10YearsFor(parcours) {
    var out = [];
    [1, 2].forEach(function (y) {
        if (p10ModulesFor(parcours, y, 1).length || p10ModulesFor(parcours, y, 2).length) out.push(y);
    });
    return out;
}

/** Un chapitre hérité {type}-{1..4} appartient à quel module canonique ? */
function p10ModuleOfLegacyChapter(legacyChapterId) {
    var s = (typeof legacyChapterId === 'string') ? legacyChapterId.trim() : '';
    if (!P10_LEGACY_CHAPTER_RE.test(s)) return null;
    for (var chapterId in P10_CONTENT_MODULES) {
        if (!Object.prototype.hasOwnProperty.call(P10_CONTENT_MODULES, chapterId)) continue;
        var types = P10_CONTENT_MODULES[chapterId].textTypes;
        if (types.indexOf(s.split('-')[0]) !== -1) return p10GetModule(chapterId);
    }
    return null;
}

function p10TopicsFor(chapterId) {
    var m = p10GetModule(chapterId);
    return m ? m.discussionTopics.slice() : [];
}

function p10ModuleHasDiscussions(chapterId) {
    return p10TopicsFor(chapterId).length > 0;
}

// =================================================================
 // CONTEXTE GLOBAL UNIQUE (P10.1)
// =================================================================

/**
 * Source unique de vérité pour les deux zones. Les anciens portails
 * (currentParcours / currentModule / currentDiscussion) restent des reflets
 * de ce contexte, plus jamais des états concurrents.
 */
const P10Context = {
    parcours: 'pep',
    academicYearId: null,
    yearNumber: 1,
    semesterNumber: 2,
    chapterId: 'pep-y1s2-03',
    offeringId: null,
    lessonId: null,
    discussionTopic: null
};

const p10Subscribers = [];

/** Patch partiel, validé ; renvoie le contexte normalisé_effectif. */
function p10SetContext(patch) {
    var next = {
        parcours: P10Context.parcours,
        academicYearId: P10Context.academicYearId,
        yearNumber: P10Context.yearNumber,
        semesterNumber: P10Context.semesterNumber,
        chapterId: P10Context.chapterId,
        offeringId: P10Context.offeringId,
        lessonId: P10Context.lessonId,
        discussionTopic: P10Context.discussionTopic
    };
    var p = patch && typeof patch === 'object' ? patch : {};

    if ('parcours' in p) {
        var k = p10ParcoursKey(p.parcours);
        if (k) next.parcours = k;
    }
    if ('yearNumber' in p) {
        var y = p10IntIn(p.yearNumber, [1, 2]);
        if (y !== null) next.yearNumber = y;
    }
    if ('semesterNumber' in p) {
        var s = p10IntIn(p.semesterNumber, [1, 2]);
        if (s !== null) next.semesterNumber = s;
    }
    if ('academicYearId' in p) {
        next.academicYearId = (p.academicYearId === null || p.academicYearId === undefined)
            ? null : p10SafeId(String(p.academicYearId));
    }
    if ('offeringId' in p) {
        next.offeringId = (p.offeringId === null || p.offeringId === undefined)
            ? null : p10SafeId(String(p.offeringId));
    }
    if ('chapterId' in p) {
        var mod = p10GetModule(p.chapterId);
        if (mod) {
            // Le module est autorité : il impose parcours / année / semestre.
            next.chapterId = mod.chapterId;
            next.parcours = mod.parcours;
            next.yearNumber = mod.yearNumber;
            next.semesterNumber = mod.semesterNumber;
            if (!('lessonId' in p) && P10Context.lessonId &&
                p10ModuleOfLegacyChapter(P10Context.lessonId) &&
                p10ModuleOfLegacyChapter(P10Context.lessonId).chapterId !== mod.chapterId) {
                next.lessonId = null; // la leçon héritée ne suit pas le nouveau module
            }
        }
    }
    if ('lessonId' in p) {
        var l = p10SafeId(p.lessonId);
        next.lessonId = (l && P10_LEGACY_CHAPTER_RE.test(l)) ? l : null;
    }
    if ('discussionTopic' in p) {
        var t = p10SafeId(p.discussionTopic);
        next.discussionTopic = t || null;
    }

    // Invariant de cohérence : le module reste l'autorité. Un patch qui
    // placerait parcours / année / semestre en contradiction avec le module
    // courant (par exemple un parcours sans aucun module publié) est corrigé
    // par le module : le contexte ne peut jamais devenir incohérent.
    var autorite = p10GetModule(next.chapterId);
    if (autorite && (next.parcours !== autorite.parcours ||
            next.yearNumber !== autorite.yearNumber ||
            next.semesterNumber !== autorite.semesterNumber)) {
        next.parcours = autorite.parcours;
        next.yearNumber = autorite.yearNumber;
        next.semesterNumber = autorite.semesterNumber;
    }

    // Invariant P10.11 : un topic de discussion n'appartient qu'au module qui
    // le publie. Un thème hérité d'un autre module (deep-link, retour arrière,
    // patch croisé, restauration de hash) est retiré ici : l'état
    // « chapterId = A avec discussionTopic = topic de B » devient impossible,
    // y compris quand le module A ne publie aucune discussion.
    if (autorite && next.discussionTopic &&
            (autorite.discussionTopics || []).indexOf(next.discussionTopic) === -1) {
        next.discussionTopic = null;
    }

    var changed = false;
    for (var key in next) {
        if (Object.prototype.hasOwnProperty.call(next, key) && next[key] !== P10Context[key]) changed = true;
    }
    for (var k2 in next) {
        if (Object.prototype.hasOwnProperty.call(next, k2)) P10Context[k2] = next[k2];
    }
    return { context: p10GetContext(), changed: changed };
}

function p10GetContext() {
    return {
        parcours: P10Context.parcours,
        academicYearId: P10Context.academicYearId,
        yearNumber: P10Context.yearNumber,
        semesterNumber: P10Context.semesterNumber,
        chapterId: P10Context.chapterId,
        offeringId: P10Context.offeringId,
        lessonId: P10Context.lessonId,
        discussionTopic: P10Context.discussionTopic
    };
}

function p10Subscribe(fn) {
    if (typeof fn === 'function') p10Subscribers.push(fn);
    return fn;
}

function p10Notify(reason) {
    var ctx = p10GetContext();
    for (var i = 0; i < p10Subscribers.length; i++) {
        try { p10Subscribers[i](ctx, reason || 'set'); }
        catch (e) { /* un abonné défaillant ne bloque pas les autres */ }
    }
    return ctx;
}

/** Set + notify en un coup (le hash est écrit par l'abonné, pas par selectModule). */
function p10Update(patch, reason) {
    var r = p10SetContext(patch);
    p10Notify(reason || (r.changed ? 'set' : 'noop'));
    return r;
}

/**
 * Sélecteur d'un module canonique depuis l'arbre (Parcours ou Discussion).
 * Un module sans contenu reste sélectionnable : seuls les états visibles
 * changent, aucun contenu n'est inventé.
 */
function p10SelectCanonicalModule(chapterId, extra) {
    var mod = p10GetModule(chapterId);
    if (!mod) return null;
    var patch = {
        chapterId: mod.chapterId,
        lessonId: mod.hasContent ? (P10Context.lessonId || null) : null,
        discussionTopic: mod.discussionTopics.length
            ? (mod.discussionTopics.indexOf(P10Context.discussionTopic) !== -1
                ? P10Context.discussionTopic
                : mod.discussionTopics[0])
            : null
    };
    if (extra && typeof extra === 'object') {
        for (var k in extra) {
            if (Object.prototype.hasOwnProperty.call(extra, k)) patch[k] = extra[k];
        }
    }
    p10Update(patch, 'module');
    return p10GetContext();
}

/**
 * Sélecteur d'un chapitre hérité {type}-{1..4} : résout le module canonique
 * parent, puis applique les deux niveaux (module + leçon).
 */
function p10ApplyLegacyLesson(legacyChapterId) {
    var mod = p10ModuleOfLegacyChapter(legacyChapterId);
    if (!mod) return null;
    var l = p10SafeId(legacyChapterId);
    p10Update({ chapterId: mod.chapterId, lessonId: l }, 'lesson');
    return p10GetContext();
}

// =================================================================
 // LIBELLÉS ET CONTEXTES LISIBLES
// =================================================================

function p10Module(chapterId) { return p10GetModule(chapterId); }

/** 'Parcours PEP · Première année · Semestre 2 · <module>' (+ leçon/disposition). */
function p10ContextLine(ctx, options) {
    var c = ctx || P10Context;
    var opts = options || {};
    var mod = p10GetModule(c.chapterId);
    var parts = [
        'Parcours ' + String(c.parcours || '').toUpperCase(),
        P10_YEAR_LABELS[c.yearNumber] || '',
        P10_SEMESTER_LABELS[c.semesterNumber] || '',
        mod ? mod.title : ''
    ].filter(function (x) { return !!x; });
    if (opts.withDiscussion && c.discussionTopic) {
        parts.push('Discussion : ' + (opts.discussionTitle || c.discussionTopic));
    }
    var line = parts.filter(function (x, i) { return x && parts.indexOf(x) === i; }).join(' · ');
    if (opts.withState) {
        line += mod && mod.hasContent ? '' : (mod ? ' — (sans contenu)' : '');
    }
    return line.slice(0, P10_MAX_CONTEXT_LINE);
}

/** Ligne d'affichage courte pour l'en-tête de la colonne Parcours. */
function p10HeaderLine(ctx) {
    var c = ctx || P10Context;
    var mod = p10GetModule(c.chapterId);
    return (P10_PARCOURS_LABELS[c.parcours] || ('Parcours ' + String(c.parcours || '').toUpperCase())) +
        ' · ' + (P10_YEAR_LABELS[c.yearNumber] || '') +
        ' · ' + (P10_SEMESTER_LABELS[c.semesterNumber] || '') +
        (mod ? ' · ' + mod.title : '');
}

// =================================================================
 // HACHES CONTEXTEUALISÉS (P10.9)
// =================================================================

/**
 * Forme canonique : #pep/y1/s2/pep-y1s2-03[/narratif-1]
 * Le préfixe encode déjà le module choisi ; l'identifiant canonique reste
 * présent en clair pour que la lecture soit non ambigüe et résiliente.
 */
function p10FormatHash(ctx, options) {
    var c = ctx || P10Context;
    var opts = options || {};
    var mod = p10GetModule(c.chapterId);
    if (!mod) return '#' + String(opts.fallback || c.chapterId || '');
    var base = '#' + mod.parcours + '/y' + mod.yearNumber + '/s' + mod.semesterNumber + '/' + mod.chapterId;
    var lesson = opts.includeLesson === false ? null : p10SafeId(c.lessonId);
    if (lesson && P10_LEGACY_CHAPTER_RE.test(lesson)) base += '/' + lesson;
    return base.slice(0, 1 + 3 + 4 + 4 + 4 + P10_HASH_LIMITS.module + 1 + P10_HASH_LIMITS.lesson);
}

const P10_CANONICAL_HASH_RE = /^#(pep|pem|pes)\/y([12])\/s([12])\/([a-z0-9-]+?)(?:\/(narratif|descriptif|explicatif|argumentatif|resume)-([1-4]))?$/;

/**
 * Lit un hash. Trois cas :
 *   { kind:'canonical' }  nouveau format ;
 *   { kind:'legacy' }     ancien #narratif-1 (compatibilité) ;
 *   null                  hash inconnu / module inexistant (aucun effet).
 */
function p10ParseHash(rawHash) {
    var h = (typeof rawHash === 'string') ? rawHash.trim() : '';
    if (!h) return null;
    if (h.charAt(0) !== '#') h = '#' + h;

    var m = P10_CANONICAL_HASH_RE.exec(h);
    if (m) {
        var mod = p10GetModule(m[4]);
        // Le segment canonique DOIT être un module connu et cohérent avec le
        // prefixe parcours / année / semestre : sinon hash inexploitable.
        if (!mod || mod.parcours !== m[1] || mod.yearNumber !== parseInt(m[2], 10) ||
            mod.semesterNumber !== parseInt(m[3], 10)) {
            return null;
        }
        var lesson = m[5] ? (m[5] + '-' + m[6]) : null;
        if (lesson && p10ModuleOfLegacyChapter(lesson) &&
            p10ModuleOfLegacyChapter(lesson).chapterId !== mod.chapterId) {
            return null; // leçon et module incompatibles
        }
        return {
            kind: 'canonical',
            parcours: m[1],
            yearNumber: parseInt(m[2], 10),
            semesterNumber: parseInt(m[3], 10),
            chapterId: mod.chapterId,
            lessonId: lesson
        };
    }

    var bare = h.slice(1);
    if (P10_LEGACY_CHAPTER_RE.test(bare)) {
        var parent = p10ModuleOfLegacyChapter(bare);
        if (!parent) return null;
        return {
            kind: 'legacy',
            parcours: parent.parcours,
            yearNumber: parent.yearNumber,
            semesterNumber: parent.semesterNumber,
            chapterId: parent.chapterId,
            lessonId: bare
        };
    }
    // Hash de l'ancien arbre visuel (#s2, #pep…) ou n'importe quoi : on ignore.
    return null;
}

/** Applique un hash lu au contexte. Renvoie le contexte ou null. */
function p10RestoreFromHash(rawHash) {
    var parsed = p10ParseHash(rawHash);
    if (!parsed) return null;
    p10Update({
        parcours: parsed.parcours,
        yearNumber: parsed.yearNumber,
        semesterNumber: parsed.semesterNumber,
        chapterId: parsed.chapterId,
        lessonId: parsed.lessonId
    }, 'hash');
    return p10GetContext();
}

// =================================================================
 // HISTORIQUE DE DISCUSSION CONTEXTUALISÉ (P10.6)
// =================================================================

const P10_HISTORY_PREFIX = 'chatHistory_';
const P10_MIGRATION_KEY = 'p10_history_migration';

/** chatHistory_pep-y1s2-03:narratif — la clé ne dépend plus du seul thème. */
function p10HistoryKey(chapterId, topic) {
    var c = p10SafeId(chapterId);
    var t = p10SafeId(topic);
    if (!c || !t) return null;
    return P10_HISTORY_PREFIX + c + ':' + t;
}

function p10LegacyHistoryKey(topic) {
    var t = p10SafeId(topic);
    return t ? P10_HISTORY_PREFIX + t : null;
}

function p10IsCanonicalHistoryKey(key) {
    return typeof key === 'string' &&
        key.indexOf(P10_HISTORY_PREFIX) === 0 &&
        key.slice(P10_HISTORY_PREFIX.length).indexOf(':') !== -1;
}

/**
 * Migration douce et idempotente de l'ancien format.
 *
 * Les six discussions héritées n'ont jamais existé que pour UN module
 * ('pep-y1s2-03'), donc l'ancien chatHistory_<topic> y est rattaché.
 *
 * Garanties :
 *   - aucune donnée perdue : le legacy n'est retiré qu'après écriture réussie ;
 *   - aucune collision : si la clé canonique est déjà occupée, on ne touche
 *     pas au legacy et on journalise 'conflit' ;
 *   - aucune réapparition après « Réinitialiser la conversation » : le
 *     registre p10_history_migration interdit toute re-migration du même thème.
 *
 * @param {Object} storage localStorage-like (getItem/setItem/removeItem/key)
 * @param {Object} [opts] { chapterId, topics, legacyChapterId }
 * @returns {Object} journal { migrated:[], conflicts:[], skipped:[], failed:[] }
 */
function p10MigrateLegacyHistoryKeys(storage, opts) {
    var log = { migrated: [], conflicts: [], skipped: [], failed: [] };
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') return log;
    var o = opts || {};
    var chapterId = p10SafeId(o.chapterId || P10_LEGACY_DISCUSSION_CHAPTER_ID);
    var topics = Array.isArray(o.topics) ? o.topics : P10_LEGACY_DISCUSSION_TOPICS;
    if (!chapterId) return log;

    var done = [];
    try {
        var rawDone = storage.getItem(P10_MIGRATION_KEY);
        var parsedDone = rawDone ? JSON.parse(rawDone) : null;
        if (parsedDone && Array.isArray(parsedDone.migrated)) done = parsedDone.migrated;
        if (parsedDone && Array.isArray(parsedDone.conflicts)) {
            parsedDone.conflicts.forEach(function (c) { if (done.indexOf(c) === -1) done.push(c); });
        }
    } catch (e) { done = []; }

    var journal = { migrated: done.slice(), conflicts: [], skipped: [], failed: [] };

    for (var i = 0; i < topics.length; i++) {
        var topic = p10SafeId(topics[i]);
        if (!topic) continue;
        if (done.indexOf(topic) !== -1) { journal.skipped.push(topic); continue; }

        var legacyKey = p10LegacyHistoryKey(topic);
        var canonicalKey = p10HistoryKey(chapterId, topic);
        var legacyRaw;
        try { legacyRaw = storage.getItem(legacyKey); } catch (e) { legacyRaw = null; }
        if (legacyRaw === null || legacyRaw === undefined) {
            journal.migrated.push(topic); // rien à migrer, mais jamais retenté
            continue;
        }
        var canonicalRaw = null;
        try { canonicalRaw = storage.getItem(canonicalKey); } catch (e) { canonicalRaw = null; }

        if (canonicalRaw !== null && canonicalRaw !== undefined && canonicalRaw !== '[]') {
            journal.conflicts.push(topic);
            continue;
        }
        try {
            storage.setItem(canonicalKey, legacyRaw);
            if (typeof storage.removeItem === 'function' && storage.getItem(canonicalKey) === legacyRaw) {
                storage.removeItem(legacyKey);
            }
            journal.migrated.push(topic);
        } catch (e) {
            journal.failed.push(topic);
        }
    }

    journal.conflicts.forEach(function (t) { if (done.indexOf(t) === -1) done.push(t); });
    try {
        // Le registre doit mémoriser TOUT ce qui a été traité (héritage du
        // registre précédent + migrations de cette passe) : sinon une passe
        // suivante rejouerait des thèmes déjà traités.
        storage.setItem(P10_MIGRATION_KEY, JSON.stringify({
            at: 'p10', chapterId: chapterId, migrated: journal.migrated, conflicts: journal.conflicts
        }));
    } catch (e) { /* quota : la migration sera retentée, aucune perte */ }

    log.migrated = journal.migrated;
    log.conflicts = journal.conflicts;
    log.skipped = journal.skipped;
    log.failed = journal.failed;
    return log;
}

// =================================================================
 // CONTEXTE IA (P10.7)
// =================================================================

/**
 * Champs additionnels envoyés dans context.chat. Le contrat V2 reste
 * tolerant (ces clés sont optionnelles) : les anciens clients ne sont pas
 * cassés. chapterId est l'identifiant canonique ; le titre n'est jamais
 * utilisé comme clé par le backend.
 */
function p10ChatContextFields(ctx, options) {
    var c = ctx || P10Context;
    var opts = options || {};
    var mod = p10GetModule(c.chapterId);
    if (!mod) return null;
    var topic = p10SafeId(opts.discussionTopic || c.discussionTopic);
    return {
        chapter_id: mod.chapterId.slice(0, 64),
        parcours: mod.parcours.slice(0, 16),
        academic_year_id: c.academicYearId ? String(c.academicYearId).slice(0, 64) : null,
        year_number: mod.yearNumber,
        semester_number: mod.semesterNumber,
        module_title: mod.title.slice(0, P10_MAX_MODULE_TITLE),
        discussion_topic: topic ? topic.slice(0, 32) : null,
        lesson_id: c.lessonId ? String(c.lessonId).slice(0, 32) : null
    };
}

/**
 * P10.11 — jeton technique employé comme context.chat.topic lorsqu'aucune
 * discussion n'est publiée pour le module courant. Ce n'est PAS un libellé
 * destiné à l'utilisateur : le libellé envoyé au modèle reste le titre réel du
 * module (topic_title). Le jeton respecte P10_ID_RE (aucun deux-points, donc
 * compatible avec la clé d'historique chatHistory_<chapterId>:<topic>) et les
 * bornes du contrat V2 (topic 30, topic_title 100, topic_context 500).
 */
const P10_MODULE_CHAT_TOPIC = 'module';
const P10_CHAT_TOPIC_LIMIT = 30;
const P10_CHAT_TOPIC_TITLE_LIMIT = 100;
const P10_CHAT_TOPIC_CONTEXT_LIMIT = 500;

/** Le module donné publie-t-il réellement ce topic ? */
function p10OwnsDiscussionTopic(chapterId, topic) {
    var mod = p10GetModule(chapterId);
    var t = p10SafeId(topic);
    return !!(mod && t && (mod.discussionTopics || []).indexOf(t) !== -1);
}

/**
 * Contexte chat « au niveau module » pour un module sélectionné mais sans
 * discussion publiée : le module lui-même est un contexte pédagogique valide.
 * La sortie a exactement la forme de buildChatContext (topic / topic_title /
 * topic_context / module) et reste strictement dans le contrat V2 existant —
 * le contrat n'est ni assoupli ni contourné. Aucun contenu n'est inventé : la
 * description rappelle que rien n'est publié pour ce module.
 */
function p10ModuleChatContext(ctx, options) {
    var c = ctx || P10Context;
    var mod = p10GetModule(c.chapterId);
    if (!mod) return null;
    var opts = options || {};
    var topic = p10SafeId(opts.topic) || P10_MODULE_CHAT_TOPIC;
    var champs = p10ChatContextFields(c, {});
    if (champs && !p10OwnsDiscussionTopic(mod.chapterId, champs.discussion_topic)) {
        champs.discussion_topic = null; // jamais le topic d'un autre module
    }
    var ligne = p10ContextLine(c, { withDiscussion: false, withState: true });
    var description = 'Module sélectionné dans le Parcours : ' + (mod.title || topic) + '. ' + ligne + '. '
        + 'Aucune discussion publiée n\'est attachée à ce module : la question de l\'étudiant '
        + 'porte sur le module lui-même. Réponds dans le cadre de ce module, sans supposer '
        + 'de contenu pédagogique qui n\'a pas été publié.';
    return {
        topic: topic.slice(0, P10_CHAT_TOPIC_LIMIT),
        topic_title: String(mod.title || topic).slice(0, P10_CHAT_TOPIC_TITLE_LIMIT),
        topic_context: description.slice(0, P10_CHAT_TOPIC_CONTEXT_LIMIT),
        module: champs
    };
}

// =================================================================
 // PROJECTION « COLONNE 4 » (P10.8)
// =================================================================

/**
 * Construit la fiche de module affichée à droite de la conversation.
 * Un module sans contenu renvoie une fiche honnête : titre réel, libellé
 * « sans contenu », aucun texte inventé.
 */
function p10Column4For(ctx, discussionData, options) {
    var c = ctx || P10Context;
    var mod = p10GetModule(c.chapterId);
    if (!mod) return null;
    var opts = options || {};
    var topic = p10SafeId(opts.discussionTopic || c.discussionTopic);
    var data = (discussionData && topic && discussionData[topic]) ? discussionData[topic] : null;
    var source = data && data.column4 && typeof data.column4 === 'object' ? data.column4 : null;

    if (source) {
        return {
            title: typeof source.title === 'string' ? source.title : mod.title,
            finalities: typeof source.finalities === 'string' ? source.finalities : '',
            objectives: Array.isArray(source.objectives) ? source.objectives.slice() : [],
            content: typeof source.content === 'string' ? source.content : '',
            contextLine: p10ContextLine(c, {
                withDiscussion: !!topic,
                discussionTitle: typeof data.title === 'string' ? data.title : topic
            }),
            hasContent: true
        };
    }
    return {
        title: mod.title,
        finalities: mod.hasContent ? '' : 'Aucune fiche de module n’est disponible pour ce module.',
        objectives: [],
        content: mod.hasContent ? '' : 'Contenu pédagogique non encore publié (module sélectionné pour le contexte de navigation).',
        contextLine: p10ContextLine(c, { withState: true }),
        hasContent: !!mod.hasContent
    };
}

// =================================================================
 // RENDU DE L'ARBRE PARCOURS (P10.4)
// =================================================================

const P10_NODE_CLASSES = {
    pathItem: 'path-item',
    branchButton: 'w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left',
    arrowSvg: 'h-4 w-4 text-slate-400 transition-transform',
    subtreeOpen: 'ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-2',
    subtreeClosed: 'hidden ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-2',
    branchLabel: 'text-sm font-medium text-white truncate',
    parcoursLabel: 'text-xs font-semibold uppercase tracking-wide text-white truncate',
    leaf: 'p10-module-leaf w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left',
    leafDot: 'h-1.5 w-1.5 rounded-full bg-slate-600 flex-shrink-0',
    emptyBadge: 'ml-auto text-[10px] uppercase tracking-wide text-slate-500',
    contentBadge: 'ml-auto text-[10px] uppercase tracking-wide text-emerald-500',
    groupButton: 'w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors text-left',
    groupIconBox: 'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
    groupTitle: 'text-sm font-medium text-white truncate',
    groupCount: 'text-xs text-slate-400',
    moduleBtn: 'module-btn w-full text-left px-3 py-2 rounded text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors',
    moduleBtnIndex: 'h-5 w-5 rounded-full bg-slate-700 flex items-center justify-center text-xs',
    activeLeaf: ' bg-slate-800 text-white',
    activeModuleBtn: ' bg-slate-800 text-white'
};

/**
 * Gestionnaire d'événement inline : uniquement des identifiants validés
 * (p10SafeId) entrent dans un onclick, jamais un titre ni une donnée libre.
 * Les apostrophes restent littérales pour coller au balisage existant.
 */
function p10Handler(fnName, id) {
    var safe = p10SafeId(id);
    return safe ? (fnName + '(\'' + safe + '\')') : '';
}

function p10Handlers(list) {
    var ok = list.filter(function (h) { return !!h; });
    return ok.length ? ok.join(';') : '';
}

/**
 * Noeud dépliable : <div class="path-item"> + bouton (flèche + libellé) +
 * sous-arbre. buttonAttrs permet de rendre un module à la fois sélectionnable
 * (contexte P10) et dépliable (affichage), sans dupliquer le balisage.
 */
function p10Branch(o) {
    var labelClass = o.labelClass || P10_NODE_CLASSES.branchLabel;
    var prefix = o.idPrefix || '';
    var onclick = o.onclick || p10Handler('toggleTree', prefix + o.nodeKey);
    var attrs = (o.buttonAttrs ? ' ' + o.buttonAttrs : '') +
        (o.current ? ' aria-current="true"' : '');
    var handler = onclick ? ' onclick="' + onclick + '"' : '';
    return '<div class="' + (o.wrapperClass || P10_NODE_CLASSES.pathItem) + '"' +
        (o.wrapperAttrs ? ' ' + o.wrapperAttrs : '') + '>' +
        '<button' + (handler ? ' ' + handler.trim() : '') + attrs +
        ' class="' + (o.buttonClass || P10_NODE_CLASSES.branchButton) + '">' +
        '<svg id="tarrow-' + p10Escape(prefix + o.nodeKey) + '" class="' +
        (o.arrowClass || P10_NODE_CLASSES.arrowSvg) + '" fill="none" stroke="currentColor" viewBox="0 0 24 24"' +
        (o.open ? ' style="transform: rotate(90deg);"' : '') + '>' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' +
        '<span class="' + labelClass + '">' + p10Escape(o.label) + '</span>' +
        '</button>' +
        '<div id="tree-' + p10Escape(prefix + o.nodeKey) + '" class="' +
        (o.open ? (o.subtreeOpenClass || P10_NODE_CLASSES.subtreeOpen)
                : (o.subtreeClosedClass || P10_NODE_CLASSES.subtreeClosed)) + '">' +
        (o.subtree || '') +
        '</div>' +
        '</div>';
}

/** Feuille de module : sélectionnable même sans contenu, sans contenu inventé. */
function p10ModuleLeaf(mod, ctx) {
    var id = p10SafeId(mod.chapterId);
    if (!id) return '';
    var active = ctx && ctx.chapterId === id;
    var badge = mod.hasContent
        ? '<span class="' + P10_NODE_CLASSES.contentBadge + '">contenu</span>'
        : '<span class="' + P10_NODE_CLASSES.emptyBadge + '">sans contenu</span>';
    var state = mod.hasContent ? 'content' : 'empty';
    return '<button type="button"' +
        ' onclick="' + p10Handler('p10SelectModule', id) + '"' +
        (active ? ' aria-current="true"' : '') +
        ' class="' + P10_NODE_CLASSES.leaf + (active ? P10_NODE_CLASSES.activeLeaf : '') +
        '" data-module-id="' + p10Escape(id) + '" data-nav-state="' + state + '">' +
        '<span class="' + P10_NODE_CLASSES.leafDot + '"></span>' +
        '<span>' + p10Escape(mod.title) + '</span>' +
        badge +
        '</button>';
}

function p10TextTypeGroup(spec, type, ctx) {
    var visual = P10_TEXT_TYPE_VISUALS[type] || { gradient: 'from-slate-500 to-slate-600', icons: [] };
    var lessons = Array.isArray(spec && spec.lessons) ? spec.lessons : [];
    var title = (spec && typeof spec.title === 'string' && spec.title) || type;
    var icons = (visual.icons || []).map(function (d) {
        return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + p10Escape(d) + '"/>';
    }).join('');
    var items = lessons.map(function (lesson, index) {
        var lid = p10SafeId(lesson && lesson.id);
        if (!lid) return '';
        var active = ctx && ctx.lessonId === lid;
        return '<button class="' + P10_NODE_CLASSES.moduleBtn + (active ? P10_NODE_CLASSES.activeModuleBtn : '') +
            '" data-chapter="' + p10Escape(lid) + '" onclick="selectModule(\'' + p10Escape(lid) + '\')">' +
            '<span class="flex items-center gap-2">' +
            '<span class="' + P10_NODE_CLASSES.moduleBtnIndex + '">' + (index + 1) + '</span>' +
            p10Escape(lesson.title || lid) +
            '</span></button>';
    }).join('');

    return '<div class="' + P10_NODE_CLASSES.pathItem + '" data-path="' + p10Escape(type) + '">' +
        '<button class="' + P10_NODE_CLASSES.groupButton + '" onclick="togglePath(\'' + p10Escape(type) + '\')">' +
        '<div class="' + P10_NODE_CLASSES.groupIconBox + ' bg-gradient-to-br ' + p10Escape(visual.gradient) + '">' +
        '<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">' + icons + '</svg>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
        '<p class="' + P10_NODE_CLASSES.groupTitle + '">' + p10Escape(title) + '</p>' +
        '<p class="' + P10_NODE_CLASSES.groupCount + '">' + lessons.length + ' modules</p>' +
        '</div>' +
        '<svg id="arrow-' + p10Escape(type) + '" class="' + P10_NODE_CLASSES.arrowSvg +
        '" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' +
        '</button>' +
        '<div id="modules-' + p10Escape(type) + '" class="hidden ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-4">' +
        items +
        '</div>' +
        '</div>';
}

/**
 * Construit la carte de contenu attendue par p10RenderParcoursTree à partir
 * du parcoursData EXISTANT de l'application ({type: {title, modules}}).
 *
 * Aucune leçon n'est inventée : un module {type}-{n} absent du parcoursData
 * reste affiché avec son identifiant technique comme libellé.
 *
 * @param {Object} parcoursData - window.parcoursData (forme actuelle)
 * @returns {Object} { 'pep-y1s2-03': { narratif: { title, lessons: [...] } } }
 */
function p10BuildContents(parcoursData) {
    var out = {};
    var source = (parcoursData && typeof parcoursData === 'object') ? parcoursData : {};
    for (var chapterId in P10_CONTENT_MODULES) {
        if (!Object.prototype.hasOwnProperty.call(P10_CONTENT_MODULES, chapterId)) continue;
        var types = P10_CONTENT_MODULES[chapterId].textTypes;
        var byType = {};
        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            var group = source[type] && typeof source[type] === 'object' ? source[type] : null;
            var modules = (group && group.modules && typeof group.modules === 'object') ? group.modules : {};
            var lessons = [];
            for (var n = 1; n <= 4; n++) {
                var lessonId = type + '-' + n;
                var item = modules[lessonId];
                lessons.push({
                    id: lessonId,
                    title: (item && typeof item.title === 'string' && item.title) ? item.title : lessonId
                });
            }
            byType[type] = {
                title: (group && typeof group.title === 'string' && group.title) ? group.title : type,
                lessons: lessons
            };
        }
        out[chapterId] = byType;
    }
    return out;
}

/**
 * Lignes des parcours déclarés mais non peuplés (PEM / PES) : libellé exact,
 * aucun module, aucun gestionnaire — comportement repris de l'arbre actuel.
 */
function p10PlaceholderParcours() {
    var html = '';
    for (var i = 0; i < P10_PARCOURS.length; i++) {
        var p = P10_PARCOURS[i];
        if (p === 'pep') continue;
        if (p10YearsFor(p).length) continue;
        html += '<div class="' + P10_NODE_CLASSES.pathItem + '">' +
            '<div class="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">' +
            '<span class="' + P10_NODE_CLASSES.leafDot + '"></span>' +
            p10Escape(P10_PARCOURS_LABELS[p] || p) +
            '</div></div>';
    }
    return html;
}

/**
 * Arbre Parcours complet, généré depuis le mapping canonique.
 *
 * @param {Object} opts
 *   context   : contexte courant (reflets visuels)
 *   contents  : { 'pep-y1s2-03': { narratif: { title, lessons:[{id,title}] }, … } }
 * @returns {string} HTML échappé
 */
function p10RenderParcoursTree(opts) {
    var o = opts || {};
    var ctx = o.context || p10GetContext();
    var contents = o.contents || {};

    var html = '';
    var parcoursList = ['pep'];
    for (var pi = 0; pi < parcoursList.length; pi++) {
        var p = parcoursList[pi];
        var years = p10YearsFor(p);
        var yearsHtml = '';
        for (var yi = 0; yi < years.length; yi++) {
            var y = years[yi];
            var semesters = p10SemestersFor(p, y);
            var semHtml = '';
            for (var si = 0; si < semesters.length; si++) {
                var s = semesters[si];
                var mods = p10ModulesFor(p, y, s);
                var modsHtml = '';
                for (var mi = 0; mi < mods.length; mi++) {
                    var mod = mods[mi];
                    if (!mod.hasContent) { modsHtml += p10ModuleLeaf(mod, ctx); continue; }
                    var groupsHtml = '';
                    var typeSpecs = contents[mod.chapterId] || {};
                    for (var ti = 0; ti < mod.textTypes.length; ti++) {
                        groupsHtml += p10TextTypeGroup(typeSpecs[mod.textTypes[ti]], mod.textTypes[ti], ctx);
                    }
                    var key = mod.toggleKey || ('m-' + mod.chapterId);
                    modsHtml += p10Branch({
                        label: mod.title,
                        nodeKey: key,
                        subtree: groupsHtml,
                        open: true,
                        onclick: p10Handlers([
                            p10Handler('p10SelectModule', mod.chapterId),
                            p10Handler('toggleTree', key)
                        ]),
                        buttonAttrs: 'data-module-id="' + p10Escape(mod.chapterId) +
                            '" data-nav-state="content"' +
                            (ctx.chapterId === mod.chapterId ? ' aria-current="true"' : '')
                    });
                }
                var semPathKey = p + '/y' + y + '/s' + s;
                semHtml += p10Branch({
                    label: P10_SEMESTER_LABELS[s],
                    nodeKey: P10_LEGACY_TREE_KEYS[semPathKey] || semPathKey,
                    subtree: modsHtml,
                    open: !!P10_DEFAULT_OPEN[semPathKey]
                });
            }
            var yearPathKey = p + '/y' + y;
            yearsHtml += p10Branch({
                label: P10_YEAR_LABELS[y],
                nodeKey: P10_LEGACY_TREE_KEYS[yearPathKey] || yearPathKey,
                subtree: semHtml,
                open: !!P10_DEFAULT_OPEN[yearPathKey]
            });
        }
        html += p10Branch({
            label: P10_PARCOURS_LABELS[p] || p,
            nodeKey: P10_LEGACY_TREE_KEYS[p] || p,
            subtree: yearsHtml,
            open: !!P10_DEFAULT_OPEN[p],
            labelClass: P10_NODE_CLASSES.parcoursLabel
        });
    }
    if (o.withPlaceholders !== false) html += p10PlaceholderParcours();
    return html;
}

// =================================================================
 // RENDU DE L'ARBRE DISCUSSION (P10.5)
// =================================================================

const P10_DNODE = {
    item: 'path-item',
    branch: 'w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left',
    arrow: 'h-4 w-4 text-slate-400 transition-transform flex-shrink-0',
    subtreeOpen: 'ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2',
    subtreeClosed: 'hidden ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2',
    levelLabel: 'text-sm truncate',
    parcoursLabel: 'text-xs font-semibold uppercase tracking-wide truncate',
    moduleLabel: 'text-sm truncate',
    leaf: 'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-white/5 discussion-item',
    leafActive: ' active',
    dot: 'w-2 h-2 rounded-full indicator',
    empty: 'ml-auto text-[10px] uppercase tracking-wide',
    noContent: 'px-3 py-2 text-[11px] uppercase tracking-wide'
};

function p10DBranch(o) {
    return p10Branch({
        label: o.label,
        nodeKey: 'd-' + o.nodeKey,
        subtree: o.subtree,
        open: o.open,
        current: o.current,
        wrapperAttrs: o.wrapperAttrs,
        buttonAttrs: o.buttonAttrs,
        onclick: o.onclick,
        buttonClass: P10_DNODE.branch,
        arrowClass: P10_DNODE.arrow,
        labelClass: o.labelClass || P10_DNODE.levelLabel,
        subtreeOpenClass: P10_DNODE.subtreeOpen,
        subtreeClosedClass: P10_DNODE.subtreeClosed
    });
}

function p10IsCurrentSemester(ctx, p, y, s) {
    return ctx.parcours === p && ctx.yearNumber === y && ctx.semesterNumber === s;
}

/** Feuille de discussion, rendue uniquement sous le module qui en possède. */
function p10DiscussionLeaf(topic, title, active) {
    var t = p10SafeId(topic);
    if (!t) return '';
    var style = active
        ? 'background-color: var(--bs-primary);'
        : 'background-color: rgb(107 114 128);';
    return '<button' + (active ? ' aria-current="true"' : '') +
        ' onclick="' + p10Handler('selectDiscussion', t) + '"' +
        ' class="' + P10_DNODE.leaf + (active ? P10_DNODE.leafActive : '') + '"' +
        ' data-topic="' + p10Escape(t) + '">' +
        '<span class="' + P10_DNODE.dot + '" style="' + style + '"></span>' +
        '<span class="text-sm">' + p10Escape(title || t) + '</span></button>';
}

/**
 * Arbre Discussion : reprend la hiérarchie du Parcours (parcours → année →
 * semestre → module) et n'affiche les discussions que sous le module qui en
 * possède réellement. Un module sans discussion reste sélectionnable et
 * affiche « sans contenu » : rien n'est inventé.
 *
 * @param {Object} opts { context, discussionTitles: { topic: titre } }
 */
function p10RenderDiscussionTree(opts) {
    var o = opts || {};
    var ctx = o.context || p10GetContext();
    var titles = o.discussionTitles || {};
    var html = '';

    var parcoursList = ['pep'];
    for (var pi = 0; pi < parcoursList.length; pi++) {
        var p = parcoursList[pi];
        var years = p10YearsFor(p);
        var yearsHtml = '';
        for (var yi = 0; yi < years.length; yi++) {
            var y = years[yi];
            var semesters = p10SemestersFor(p, y);
            var semHtml = '';
            for (var si = 0; si < semesters.length; si++) {
                var s = semesters[si];
                var mods = p10ModulesFor(p, y, s);
                var modsHtml = '';
                for (var mi = 0; mi < mods.length; mi++) {
                    var mod = mods[mi];
                    var isCurrent = ctx.chapterId === mod.chapterId;
                    if (!mod.discussionTopics.length) {
                        modsHtml += '<div class="' + P10_DNODE.item + '"' +
                            ' data-dmodule-id="' + p10Escape(mod.chapterId) + '" data-nav-state="empty"' +
                            (isCurrent ? ' data-current="true"' : '') + '>' +
                            '<button' + (isCurrent ? ' aria-current="true"' : '') +
                            ' onclick="' + p10Handler('p10SelectModule', mod.chapterId) + '"' +
                            ' class="' + P10_DNODE.branch + '">' +
                            '<span class="' + P10_DNODE.moduleLabel + '">' + p10Escape(mod.title) + '</span>' +
                            '<span class="' + P10_DNODE.empty + '">sans contenu</span></button></div>';
                        continue;
                    }
                    var topicHtml = mod.discussionTopics.map(function (topic) {
                        return p10DiscussionLeaf(topic, titles[topic], isCurrent && ctx.discussionTopic === topic);
                    }).join('');
                    modsHtml += p10DBranch({
                        label: mod.title,
                        nodeKey: 'm-' + mod.chapterId,
                        subtree: topicHtml,
                        open: isCurrent,
                        current: isCurrent,
                        labelClass: P10_DNODE.moduleLabel,
                        wrapperAttrs: 'data-dmodule-id="' + p10Escape(mod.chapterId) + '" data-nav-state="content"',
                        onclick: p10Handlers([
                            p10Handler('p10SelectModule', mod.chapterId),
                            p10Handler('toggleTree', 'd-m-' + mod.chapterId)
                        ])
                    });
                }
                var semPathKey = p + '/y' + y + '/s' + s;
                var legacySemKey = P10_LEGACY_TREE_KEYS[semPathKey] || semPathKey;
                semHtml += p10DBranch({
                    label: P10_SEMESTER_LABELS[s],
                    nodeKey: legacySemKey,
                    subtree: modsHtml,
                    open: p10IsCurrentSemester(ctx, p, y, s) || !!P10_DEFAULT_OPEN[semPathKey]
                });
            }
            var yearPathKey = p + '/y' + y;
            yearsHtml += p10DBranch({
                label: P10_YEAR_LABELS[y],
                nodeKey: P10_LEGACY_TREE_KEYS[yearPathKey] || yearPathKey,
                subtree: semHtml,
                open: (ctx.parcours === p && ctx.yearNumber === y) || !!P10_DEFAULT_OPEN[yearPathKey]
            });
        }
        html += p10DBranch({
            label: P10_PARCOURS_LABELS[p] || p,
            nodeKey: p,
            subtree: yearsHtml,
            open: true,
            labelClass: P10_DNODE.parcoursLabel
        });
    }
    return html;
}

// =================================================================
 // Garde-fou d'auto-contrôle du référentiel
// =================================================================

/** Diagnostic du mapping : unicité, cohérence id ↔ (année, semestre, ordre). */
function p10AuditMapping() {
    var issues = [];
    var seen = {};
    for (var i = 0; i < P10_MODULES.length; i++) {
        var m = P10_MODULES[i];
        if (seen[m.chapterId]) issues.push('doublon chapterId ' + m.chapterId);
        seen[m.chapterId] = true;
        var expected = 'pep-y' + m.yearNumber + 's' + m.semesterNumber + '-' +
            (m.order < 10 ? '0' + m.order : String(m.order));
        if (m.chapterId !== expected) issues.push('id incohérent : ' + m.chapterId + ' ≠ ' + expected);
        if (!m.title) issues.push('titre vide : ' + m.chapterId);
        if (m.parcours !== 'pep') issues.push('parcours inattendu : ' + m.chapterId);
    }
    // Un même titre doit rester rattaché à des chapterId distincts (homonymes).
    var byTitle = {};
    for (var j = 0; j < P10_MODULES.length; j++) {
        var t = P10_MODULES[j].title;
        byTitle[t] = byTitle[t] || [];
        byTitle[t].push(P10_MODULES[j].chapterId);
    }
    for (var k in byTitle) {
        if (!Object.prototype.hasOwnProperty.call(byTitle, k)) continue;
        if (byTitle[k].length > 1 && (new Set(byTitle[k])).size !== byTitle[k].length) {
            issues.push('titre homonyme avec chapterId dupliqué : ' + k);
        }
    }
    return {
        count: P10_MODULES.length,
        uniqueIds: Object.keys(seen).length,
        duplicateTitles: Object.keys(byTitle).filter(function (t) { return byTitle[t].length > 1; }),
        issues: issues
    };
}

// =================================================================
 // EXPORTS
// =================================================================

const P10 = {
    // référentiel
    PARCOURS: P10_PARCOURS,
    PARCOURS_LABELS: P10_PARCOURS_LABELS,
    YEAR_LABELS: P10_YEAR_LABELS,
    SEMESTER_LABELS: P10_SEMESTER_LABELS,
    MODULES: P10_MODULES,
    CONTENT_MODULE_IDS: Object.keys(P10_CONTENT_MODULES),
    LEGACY_DISCUSSION_CHAPTER_ID: P10_LEGACY_DISCUSSION_CHAPTER_ID,
    LEGACY_DISCUSSION_TOPICS: P10_LEGACY_DISCUSSION_TOPICS,
    HISTORY_PREFIX: P10_HISTORY_PREFIX,
    MIGRATION_KEY: P10_MIGRATION_KEY,

    // identité et requêtes
    escape: p10Escape,
    safeId: p10SafeId,
    getModule: p10GetModule,
    module: p10Module,
    modulesFor: p10ModulesFor,
    yearsFor: p10YearsFor,
    semestersFor: p10SemestersFor,
    moduleOfLegacyChapter: p10ModuleOfLegacyChapter,
    topicsFor: p10TopicsFor,
    moduleHasDiscussions: p10ModuleHasDiscussions,
    ownsDiscussionTopic: p10OwnsDiscussionTopic,
    MODULE_CHAT_TOPIC: P10_MODULE_CHAT_TOPIC,
    auditMapping: p10AuditMapping,

    // contexte
    context: p10GetContext,
    setContext: p10SetContext,
    update: p10Update,
    subscribe: p10Subscribe,
    notify: p10Notify,
    selectModule: p10SelectCanonicalModule,
    applyLegacyLesson: p10ApplyLegacyLesson,
    contextLine: p10ContextLine,
    headerLine: p10HeaderLine,

    // hash
    formatHash: p10FormatHash,
    parseHash: p10ParseHash,
    restoreFromHash: p10RestoreFromHash,

    // historique
    historyKey: p10HistoryKey,
    legacyHistoryKey: p10LegacyHistoryKey,
    isCanonicalHistoryKey: p10IsCanonicalHistoryKey,
    migrateLegacyHistoryKeys: p10MigrateLegacyHistoryKeys,

    // IA et affichage
    chatContextFields: p10ChatContextFields,
    moduleChatContext: p10ModuleChatContext,
    column4For: p10Column4For,
    renderParcoursTree: p10RenderParcoursTree,
    renderDiscussionTree: p10RenderDiscussionTree,
    buildContents: p10BuildContents,
    placeholderParcours: p10PlaceholderParcours
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = P10;
}
if (typeof window !== 'undefined') {
    window.P10 = P10;
}
