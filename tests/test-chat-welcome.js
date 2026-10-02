// ============================================================================
// test-chat-welcome.js
// GO FINAL — Chat : l'icône livre et la fiche du module sont supprimées ; la
// sélection d'un module affiche uniquement un message de bienvenue contextuel,
// construit dynamiquement depuis le module réellement sélectionné. Ce test
// vérifie le générateur de bienvenue, la sécurité d'injection (textContent),
// l'intégration réelle PEP / PEM / PES dans la navigation du Chat, et la
// conservation du contexte logique P10.
// ============================================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.log('  ✗ ' + msg); }
}
function section(t) { console.log('\n' + t); }

// --- Extracteur d'une fonction `function NOM(...){...}` par équilibrage d'accolades ---
function extraireFonction(code, nom) {
    const cle = 'function ' + nom;
    const debut = code.indexOf(cle);
    if (debut === -1) return null;
    const paren = code.indexOf('(', debut);
    const braceOuverte = code.indexOf('{', paren);
    let niveau = 0, i = braceOuverte, fin = -1;
    for (; i < code.length; i++) {
        const c = code[i];
        if (c === '{') niveau++;
        else if (c === '}') { niveau--; if (niveau === 0) { fin = i + 1; break; } }
    }
    return fin === -1 ? null : code.slice(debut, fin);
}

// ============================================================================
// 1 — Générateur de message de bienvenue contextuel
// ============================================================================
section('W1 — le message de bienvenue est contextuel et change selon le module');

const srcPhrase = extraireFonction(html, 'p10AssistantPhraseFor');
const srcWelcome = extraireFonction(html, 'buildModuleWelcomeMessage');
assert(!!srcPhrase, 'p10AssistantPhraseFor() présente dans index.html');
assert(!!srcWelcome, 'buildModuleWelcomeMessage() présente dans index.html');

const sandbox = {};
sandbox.console = console;
vm.createContext(sandbox);
vm.runInContext([srcPhrase, srcWelcome,
    'globalThis.buildModuleWelcomeMessage = buildModuleWelcomeMessage;'].join('\n'),
    sandbox, { filename: 'welcome-extrait.js' });
const buildModuleWelcomeMessage = sandbox.buildModuleWelcomeMessage;

const wEcrit = buildModuleWelcomeMessage('Techniques et pratiques de l’écrit 2');
const wOral = buildModuleWelcomeMessage('Techniques et pratiques de l’oral 2');
const wTheatre = buildModuleWelcomeMessage('Initiation à la langue française par le théâtre 2');
const wInconnu = buildModuleWelcomeMessage('Module pilote sans domaine connu');

assert(/^Bienvenue dans le module « .+ » !/.test(wEcrit), 'format « Bienvenue dans le module « X » ! » : ' + wEcrit.slice(0, 60));
assert(wEcrit.indexOf('Techniques et pratiques de l’écrit 2') !== -1, 'le titre réellement sélectionné apparaît dans le message');
assert(/assistant pour .+\. Par quoi/.test(wEcrit), 'phrase d’assistance + relance « Par quoi aimeriez-vous commencer ? »');
assert(wEcrit !== wOral && wEcrit !== wTheatre, 'le message change quand le module change');
assert(wEcrit.indexOf('production écrite') !== -1, 'écrit → domaine production écrite');
assert(wOral.indexOf('orales') !== -1, 'oral → domaine expression/compréhension orales');
assert(wTheatre.indexOf('théâtre') !== -1, 'théâtre → domaine langue française par le théâtre');
assert(typeof wInconnu === 'string' && wInconnu.indexOf('Module pilote') !== -1, 'module inconnu → message générique avec son titre');

// Le message ne doit contenir AUCUN des libellés « fiche » proscrits.
const interdits = ['Aucune fiche de module', 'Contenu pédagogique non encore publié', 'Finalités', 'Objectifs', 'sans contenu'];
section('W2 — aucun libellé de fiche / « sans contenu » dans le message de bienvenue');
interdits.forEach(function (motif) {
    const present = [wEcrit, wOral, wTheatre, wInconnu].some(function (m) { return m.indexOf(motif) !== -1; });
    assert(!present, 'le message ne contient jamais « ' + motif + ' »');
});

// ============================================================================
// 3 — Sécurité d'injection : le titre dynamique passe par textContent
// ============================================================================
section('W3 — sécurité : le titre dynamique n’est jamais injecté en HTML');

const xss = '<img src=x onerror=alert(1)>';
const wXss = buildModuleWelcomeMessage(xss);
assert(wXss.indexOf(xss) !== -1, 'le titre est rendu comme TEXTE brut (aucune exécution possible via textContent)');
// La page écrit le message via textContent (jamais innerHTML) : vérification structurelle.
assert(/\.textContent\s*=\s*buildModuleWelcomeMessage\(/.test(html),
    'index.html : le message de bienvenue est assigné via textContent (sink sûr)');
assert(!/innerHTML\s*=\s*[^;]*buildModuleWelcomeMessage/.test(html),
    'index.html : aucun innerHTML ne reçoit le message de bienvenue');

// ============================================================================
// 4 — Intégration réelle PEP / PEM / PES dans la navigation du Chat
// ============================================================================
section('W4 — PEP / PEM / PES présents dans la navigation contextuelle du Chat');

const P10 = require(path.join(__dirname, '..', 'src', 'p10-context.js'));

// Arbre des discussions (colonne 2 du Chat) + lignes des parcours non peuplés.
const arbreDiscussions = P10.renderDiscussionTree({
    context: P10.context(),
    discussionTitles: {}
});
const avecPlaceholders = arbreDiscussions + P10.placeholderParcours();

assert(avecPlaceholders.indexOf('Parcours PEP') !== -1, 'Parcours PEP présent dans le Chat');
assert(avecPlaceholders.indexOf('Parcours PEM') !== -1, 'Parcours PEM présent dans le Chat');
assert(avecPlaceholders.indexOf('Parcours PES') !== -1, 'Parcours PES présent dans le Chat');
assert(avecPlaceholders.indexOf("Professeur de l'École Primaire") !== -1 ||
    avecPlaceholders.indexOf('École Primaire') !== -1, 'libellé exact PEP (source de vérité, non dupliqué)');
assert(avecPlaceholders.indexOf('Enseignement Moyen') !== -1, 'libellé exact PEM');
assert(avecPlaceholders.indexOf('Enseignement Secondaire') !== -1, 'libellé exact PES');

// Les labels viennent bien de la source P10, pas d'un texte statique de la vue.
assert(P10.PARCOURS.indexOf('pep') !== -1 && P10.PARCOURS.indexOf('pem') !== -1 && P10.PARCOURS.indexOf('pes') !== -1,
    'P10.PARCOURS est la source de vérité (pep/pem/pes)');

// ============================================================================
// 5 — Conservation du contexte logique (module / parcours / année / semestre)
// ============================================================================
section('W5 — le contexte logique du module est conservé pour P10 et le Chat');

P10.selectModule('pep-y1s2-06'); // Initiation à la langue française par le théâtre 2
const ctx = P10.context();
const champs = P10.chatContextFields(ctx, {});
assert(ctx.chapterId === 'pep-y1s2-06', 'chapter_id conservé : ' + ctx.chapterId);
assert(champs && champs.parcours === 'pep', 'parcours conservé dans le contexte chat');
assert(champs && Number(champs.year_number) === 1, 'année conservée dans le contexte chat');
assert(champs && Number(champs.semester_number) === 2, 'semestre conservé dans le contexte chat');

const moduleChat = P10.moduleChatContext(ctx);
assert(moduleChat && moduleChat.topic_title === 'Initiation à la langue française par le théâtre 2',
    'moduleChatContext porte le titre réel du module : ' + (moduleChat && moduleChat.topic_title));

// ============================================================================
// 6 — La fiche et l’icône livre ne subsistent nulle part dans le Chat
// ============================================================================
section('W6 — aucune trace de la fiche / icône livre dans index.html');
assert(html.indexOf('chatModuleFiche') === -1, 'aucun identifiant #chatModuleFiche');
assert(html.indexOf('chatModuleTitle') === -1 && html.indexOf('chatModuleFinalities') === -1 &&
    html.indexOf('chatModuleObjectives') === -1 && html.indexOf('chatModuleContent') === -1,
    'aucun id de fiche (titre/finalités/objectifs/contenu)');
assert(html.indexOf('toggleChatModuleFiche') === -1, 'aucun handler toggleChatModuleFiche');
assert(html.indexOf('updateChatModuleFiche') === -1, 'aucune fonction updateChatModuleFiche');
assert(html.indexOf('speakChatModuleText') === -1, 'aucune fonction speakChatModuleText');

// ============================================================================
console.log('\n============================================================');
console.log('test-chat-welcome : ' + passed + ' réussis, ' + failed + ' échoués');
console.log('============================================================');
process.exit(failed > 0 ? 1 : 0);
