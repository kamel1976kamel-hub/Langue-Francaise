# AUDIT COMPLET — Langue-Francaise

> Audit strictement en lecture/analyse, réalisé le **2026-09-26**.
> Aucun fichier modifié, aucun commit créé, aucune branche changée.
> Tags utilisés dans tout le document : `VÉRIFIÉ` (lu dans le code/Git), `DÉDUIT`, `NON VÉRIFIÉ`, `À TESTER`, `BLOQUÉ`.

---

## 1. Résumé exécutif

**Qu'est-ce que cette application fait ?** (`VÉRIFIÉ`)
SPA (single-page app) **100 % front-end en JavaScript vanilla**, sans framework ni build, destinée à l'enseignement du français — plus précisément un atelier de rédaction pour étudiants (contexte université de Biskra, 18 étudiants référencés). Elle propose :

1. Des **leçons** sur 6 types de textes (narratif, descriptif, explicatif, argumentatif, résumé, techniques), ~72 chapitres avec contenu HTML complet inline dans `index.html` (lignes ~4128–5500).
2. Des **activités** (exercices à saisir, tableaux à remplir) corrigées par une base de règles NLP locale + une IA (Groq).
3. Un **chat tuteur IA** par module (`window.demanderIA` → Groq `llama-3.1-8b-instant`).
4. Un **assistant d'écriture en temps réel** (« nuages violets » au-dessus des champs de saisie) — **actuellement non fonctionnel** (voir BUG-001).
5. Un **espace enseignant** : progression des 18 étudiants, annonces, documents de cours, devoirs — persistés en `localStorage` uniquement.
6. Une **connexion** entièrement client-side (comptes et mots de passe en clair dans le HTML — SEC-001).

**État global :** le projet est **fonctionnel en apparence mais gravement inachevé en interne**. Le pipeline de correction IA (Groq) est **cassé par au moins 3 bugs de câblage** (`VÉRIFIÉ` au code, `À TESTER` en navigateur) et la « base de données » des règles linguistiques est **une illusion** : un `Map` JavaScript en mémoire déguisé en SQLite, avec de fausses API SQLite. `main.js:215` (promesse non attendue), `nlp/advanced-text-corrector.js:148`, `nlp/groq-ai-analyzer.js:112` : chaque chaîne « avancée » retombe silencieusement sur des regex dures.

**Où le travail s'est arrêté :** le 22 mars 2026 à 00:44 (commit `b0b7e52`), en pleine **session de débogage de la correction des réponses d'activités par la base de règles** — le tout dernier hunk de code ajouté est un `console.log` de débogage sur la règle `genre_texte_masculin` (`la texte → le texte`). Confiance : **FORTE** (voir §5).

**Blocage opérationnel :** le repository local est `owned by` un autre SID utilisateur ; git échoue en « dubious ownership » pour l'utilisateur courant (`VÉRIFIÉ`). Non bloquant pour un agent : contournable avec `git -c safe.directory=F:/Langue-Francaise …` sans rien modifier. `BLOQUÉ` uniquement si l'agent refuse ce contournement.

---

## 2. État Git

```text
BRANCHE ACTUELLE : main (unique branche locale)
COMMIT ACTUEL : b0b7e52e353826899c8ea9bb073d904af0e26d60
DATE DU COMMIT : 2026-03-22T00:44:12+01:00
AUTEUR : kamel1976kamel-hub <chellouaikamel50@gmail.com>
MESSAGE DU COMMIT : "changed"
WORKTREE : propre ("nothing to commit, working tree clean") — VÉRIFIÉ, mais la propreté
           est déclarée par git lui-même avec safe.directory en ligne de commande
MODIFICATIONS NON COMMITÉES : aucune
FICHIERS NON SUIVIS : aucun (hors .qoder/, présent sur le disque : agents/ et skills/,
           créés le 2026-03-21/23, non suivis par git)
FICHIERS SUPPRIMÉS : aucun en attente
FICHIERS IGNORÉS PERTINENTS : aucun .gitignore dans le repo (VÉRIFIÉ: absent)
BRANCHES LOCALES : main uniquement
BRANCHES DISTANTES : origin/main = b0b7e52 (PARFAITEMENT SYNCHRONISÉE, 0 commit d'écart)
TAGS : AUCUN — NON DISPONIBLE
REMOTE : https://github.com/kamel1976kamel-hub/Langue-Francaise.git
CONFLITS : aucun. MERGE COMMITS : aucun checkable — historique linéaire de 299 commits,
           --all ne contient que main+origin/main (299 commits) → aucun travail hors main.
```

⚠️ Particularité d'environnement (`VÉRIFIÉ`) : `git` échoue sans `safe.directory` (propriétaire du dossier ≠ utilisateur courant sur Windows). Tous les résultats ci-dessus utilisent `git -c safe.directory=F:/Langue-Francaise`.

GitHub (`VÉRIFIÉ via API publique`) : `pushed_at = 2026-03-21T23:44:15Z` UTC (= 00:44 +01:00 du 22/03, soit bien `b0b7e52`), branche par défaut `main`, 0 issue ouverte, **pas de GitHub Pages configurée (API /pages → 404)** → le déploiement actuel est `NON VÉRIFIÉ` (le commit `b79ea66` du 05/03 visait « GitHub Pages + Cloudflare Workers », mais le worker a été archivé : `archive/doublons/chat-system-cloudflare.js`).

---

## 3. Historique du projet

299 commits, tous de `kamel1976kamel-hub`, **étalés du 1er mars au 22 mars 2026** (3 semaines d'activité intensive, puis arrêt net). Très forte densité : ~150 commits sur les 21–22 mars uniquement.

Qualité des messages : extrêmement faible. ~70 % des commits sont nommés « changed/change/CHANGED/Update index.html ». Les commits utiles sont ceux du 7 mars (préfixes émojis 🔄🗑️🧠📊), du 2–4 mars (assistant d'écriture) et quelques-uns :
- `f1fa493` 01/03 « Initial commit » (README seul)
- `1818c51` 01/03 « Add files via upload » (9 456 lignes : index.html 7 659 lignes + 9 fichiers)
- `46de7ec` 05/03 « Tuteur IA multi-agents RAG »
- `b79ea66` 05/03 « Version simple GitHub Pages + Cloudflare Workers - sans Node »
- `4026c4a` 21/03 « chat ckes » (coquille pour « chat clés » ? — `DÉDUIT : modification des clés/endpoints IA` ; touche `index.html`, `main.js`, `nlp/groq-ai-analyzer.js`)
- `5c3e719` 21/03 « changed » : **−365 lignes net** de code de débogage (voir §5)

Aucun commit WIP/TODO/FIXME/HOTFIX explicite « à finir ». Aucun commit de merge. `DÉDUIT` : développement solo, chaque commit = une sauvegarde d'itération depuis l'interface GitHub ou un outil d'agent.

## 4. Chronologie

| Période | Commits | Travail réalisé | Fonctionnalité | Impact |
|---|---|---|---|---|
| 01/03 | f1fa493→95f35b9 | Upload initial 9 456 lignes | Base SPA : leçons, login, chat basique, audio | Création du projet |
| 02/03 | ~50 commits | LanguageTool → Grammalecte → spaCy lg, « nuages violets », règles regex | Assistant d'écriture temps réel | Cycle de pile la plus chaotique (3 remplacements de techno/jour) |
| 03–04/03 | 76a46d8→8ff9354 | Moteur de règles spaCy modulaire (« Le style et ses pièges ») | Règles grammaire/style | Ces fichiers seront tous archivés (archive/doublons/) |
| 05/03 | 46de7ec→b79ea66 | Tuteur IA multi-agents RAG, puis repli « GitHub Pages + Cloudflare Workers sans Node » | Chat IA | Décision : zéro backend Node |
| 06/03 | ~25 commits | chat-system-simple.js itératif | Chat | Stabilisation du chat |
| 07/03 | 380b70a→696d32a | Grand nettoyage/unification : fusions chat/profiles, migration « spaCy » (regex), suppression tableau de bord pédagogique, corrections syntaxe ES5 | Refactorisation majeure | Perte du dashboard enseignant puis retour partiel |
| 08–18/03 | ~90 commits « changed » | Chat, activités, tableaux de bord progression, intégration 18 étudiants Biskra | Espace enseignant | Difficiles à dater finement (messages vides) |
| 19–21/03 | ~50 commits | Système de correction intégré + `correction-integration-examples.js` + base de règles « SQLite » | Correction par base de règles | Direction : règles locales plutôt qu'IA |
| 21/03 21:52 | 5c3e719 | Suppression du débogage (−365 lignes), `correction-integration-examples.js` marqué « 🗑️ FICHIER OBSOLÈTE » | Nettoyage avant finalisation | Bascule vers l'intégration directe |
| 21/03 22:00–23:47 | 14556be→a566c6c | Iterations sur `database-rules-manager.js`, `init-browser-sqlite.js`, `database-integration.js` | Base de règles navigateur | Le dernier vrai sous-système actif |
| 22/03 00:06–00:33 | b0d43a3, 7db7cc7, ca92d18 | **+793 lignes dans index.html** : `analyzeActivityAnswer`, `analyzeAndSubmitActivity`, `submitCorrectedActivity` | Correction des réponses d'activités avant soumission | Fonctionnalité terminale commencée |
| 22/03 00:44 | **b0b7e52 (HEAD)** | Contexte « activité » dans `runFourModelPipeline` (main.js), règle `genre_texte_masculin` passée en fonction de correction, **log de débogage ajouté dans database-integration.js** | Débogage règle « la texte → le texte » | **Point d'arrêt** |

**Phases :**
```text
PHASE 1 — Initialisation (01/03)
PHASE 2 — Assistant d'écriture / guerre des moteurs de correction (02–04/03)
PHASE 3 — Chat IA multi-backend + décision sans-Node (05–06/03)
PHASE 4 — Refactorisation/unification massive (07/03)
PHASE 5 — Espace enseignant : profils, progression, 18 étudiants (08–18/03)
PHASE 6 — Base de règles NLP « SQLite navigateur » + correction d'activités (19–22/03)
PHASE 7 — État actuel : arrêt en plein débogage de la phase 6 (22/03/2026)
```

---

## 5. Point d'arrêt

```text
# POINT D'ARRÊT PROBABLE

Confiance : FORTE

Dernier travail identifié : rendre opérationnelle la CORRECTION AUTOMATIQUE DES
  RÉPONSES D'ACTIVITÉES via la base de règles NLP en mémoire du navigateur
  (window.correctTextWithDatabase), avec repli IA Groq en mode "activité".
Dernière fonctionnalité modifiée : analyzeActivityAnswer / analyzeAndSubmitActivity /
  submitCorrectedActivity (index.html, +793 lignes en 3 commits les 30 dernières minutes)
  + contexte 'activité' dans runFourModelPipeline (main.js).
Derniers fichiers modifiés : index.html (54× depuis 18/03), nlp/correction-integration-examples.js
  (19×, neutralisé), nlp/database-integration.js, nlp/database-rules-manager.js,
  nlp/database/init-browser-sqlite.js, main.js.
Dernier commit significatif : b0b7e52 (22/03 00:44) — 4 fichiers, 32 insertions.
Travail terminé : structure SPA + leçons + login + chat + panneau enseignant +
  flux d'appels de correction branchés dans l'UI.
Travail commencé mais non terminé :
  1) La règle grammaire "genre_texte_masculin" ne matchait pas → le dernier hunk
     ajouté est un console.log de DIAGNOSTIC ("Test avec un pattern plus large pour
     le débogage", nlp/database-integration.js:225-230) — débogage ouvert au moment de l'arrêt.
  2) Le format `correction: 'function(match){...}'` (chaîne contenant du code) stocké
     dans init-browser-sqlite.js:39-42 n'est évalué nulle part de façon prouvée.
  3) Le cache-busting ?v= manuel (v=70 sur main.js, v=46/47 sur nlp/database) montre
     une course à l'invalidation de cache en cours au moment de l'arrêt.
Problème probablement rencontré : les corrections affichées aux étudiants étaient
  vides ou partielles (chaîne cassée async/await + règles droppées — BUG-002/003/004),
  et le navigateur servait d'anciennes versions des fichiers (?v=).
Élément bloquant : aucun commit après 00:44, aucun WIP : le développeur a stoppé en
  milieu de itération debugger-console, pas sur une erreur Git.
Prochaine action logique : ouvrir l'app, reproduire « la texte » / « une texte » dans
  une activité, et tracer la chaîne window.correctTextWithDatabase → NLPRules →
  displayActivityCorrections (voir §29).
```
**Preuves :** `git show b0b7e52` (hunks cités ci-dessus), agrégat `git log --since=2026-03-18 --name-only`, `?v=` incrémentés dans les 6 derniers commits uniquement.

---

## 6. Architecture

```text
F:\Langue-Francaise\
├── index.html (526 KB, ~9 600 lignes)  ← TOUTE l'UI : HTML + CSS + ~72 leçons +
│       vue/login/chat/activités/enseignant, 6000+ lignes de JS inline. Monolithe.
├── main.js (47 KB)          ← demanderIA, runFourModelPipeline (Groq), cache, erreurs
├── activities-optimized.js  ← prompts/activités — ORPHELIN (0 consommateur, VÉRIFIÉ)
├── src/style.css            ← quasi inutilisé (Tailwind CDN domine) — DÉDUIT mort
├── contexts/*.md (6)        ← prompts système par type de texte — JAMAIS chargés (VÉRIFIÉ)
├── memory/student-profile-unified.js ← window.StudentProfileManager — JAMAIS consommé
├── services/ai-pedagogical-service.js ← service "IA pédagogique" structuré
├── nlp/                     ← cœur correction (seuls 9 fichiers sont chargés par index.html:18-26)
│   ├── LOURDÉs : auto-nlp-installer, database/init-browser-sqlite, database-rules-manager,
│   │   database-integration, groq-ai-analyzer, advanced-text-corrector, spacy-analyzer,
│   │   integration-manager, integrated-correction-system
│   ├── ORPHELINs : hybrid-pipeline-*.js, hybrid-nlp-analyzer.js, cloud-spacy-*.js,
│   │   correction-integration-examples.js (auto-déclaré OBSOLÈTE), reorganize.js
│   ├── database/ : nlp-rules.sql (MySQL, 30 règles seed), server.js (Express+mysql2,
│   │   localhost:3000), init-sqlite.js, migrate-from-js.js (SYNTAX ERROR, §21)
│   └── python-server/ : FastAPI/Flask spaCy + proxies HF (8000/8001/8002) — 100% orphelins
└── archive/{debug,doublons,rapports} ← versions mortes + 8 rapports de dev markdown
```

**Chaîne réelle de production des corrections** (`VÉRIFIÉ`) :
`UI (index.html:206/678/890)` → `window.correctTextWithDatabase` (`nlp/database-integration.js:309→171-268`) → boucle regex sur `window.NLPRules` (274 règles en `Map` simulé, `nlp/database/init-browser-sqlite.js:3391`). Tout le reste (« pipeline 4 modèles », « spaCy », « Groq analyzer avancé ») retombe sur des fallbacks ou renvoie vide (§13, bugs 002–004).

## 7. Stack

| Couche | Technologie | Preuve |
|---|---|---|
| Frontend | JS vanilla ES5 (converti depuis ES6 au commit 696d32a), HTML monolithique, **Tailwind via CDN runtime**, Google Fonts Poppins | index.html:10-13 |
| Routing/State | Aucune lib : functions globales `window.*` + classes CSS `hidden`, état = variables globales + localStorage | index.html (selectModule défini 2× : 5893 et 8766) |
| « Backend » | **Aucun déployé.** Express+mysql2 (`nlp/database/server.js`) et Python FastAPI/Flask spaCy (`nlp/python-server/`) existent mais ne sont lancés par rien | server.js:5, app.py:32 |
| IA | Groq API `llama-3.1-8b-instant`, clé codée en dur côté client | main.js:657, groq-ai-analyzer.js:8-10 |
| NLP | « spaCy » = **émulation regex** côté navigateur (spacy-analyzer.js:1-52) ; vrais modèles spaCy uniquement dans python-server (non branché) | hybrid-pipeline-fixed.js:149 « spaCy (simulé) » |
| « DB » | MySQL `nlp-rules.sql` (30 règles) ; SQLite **factice** en navigateur : `this.db = new Map()` | init-browser-sqlite.js:14,3396-3417 |
| Auth | 100 % client-side, comptes en dur | index.html:5600-5740 |
| Build/CI/Docker | **AUCUN** — pas de package.json racine, pas de .github/, pas de Dockerfile (VÉRIFIÉ `git ls-files`) | — |
| Tests | **AUCUN framework.** Quelques pages HTML de test manuel dans nlp/ (pipeline-*.html, test-spacy-proxy.html) et nlp/archive/*.html | — |

## 8. Fonctionnalités

| Fonctionnalité | Frontend | Backend | DB | Tests | Git | État |
|---|---|---|---|---|---|---|
| Leçons 6 types de textes | ✅ inline | n/a | n/a | ❌ | ✅ | **TERMINÉE** (statique) |
| Login étudiant/enseignant | ✅ | ❌ (client-only) | ❌ | ❌ | ✅ | **PARTIELLE** (démo-only, SEC-001/002) |
| Chat tuteur IA (Groq) | ✅ | API externe directe | n/a | ❌ | ✅ | **PARTIELLE** — fonctionne si clé valide, mais câblage local cassé (BUG-004/005) |
| Correction temps réel « nuages » | appels `window.writingAssistant.checkText` (index.html:5969+ ×9) | ❌ writingAssistant **jamais défini** | ❌ | ❌ | code archivé | **NON COMMENCÉE** côté runtime (BUG-001) |
| Correction d'activités via règles DB | ✅ (dernier commit) | Map mémoire | factice | ❌ | ✅ | **EN COURS / PARTIELLE** — point d'arrêt (§5) |
| Pipeline IA « 4 modèles » | ✅ branché | 1 seul appel Groq réel | n/a | ❌ | ✅ | **ABANDONNÉE dans les faits** (nom mensonger, main.js:107-141 vs 646-761) |
| Progression/annonce/devoirs enseignant | ✅ | ❌ | localStorage | ❌ | ✅ | **PARTIELLE** (mono-navigateur, non partagé) |
| Profil étudiant adaptatif | module `memory/` complet | ❌ | ❌ | ❌ | importé mais **jamais appelé** | **ABANDONNÉE** (orpheline) |
| Dashboard pédagogique | supprimé f2b5fdd/7c33e12 | — | — | — | ✅ | **ABANDONNÉE** volontairement (07/03) |
| TTS audio (speechSynthesis) | ✅ index.html:6289-6476 | n/a | n/a | ❌ | ✅ | PARTIELLE (À TESTER) |
| Wiktionary (définitions nuages) | ✅ index.html:7452 | API publique | n/a | ❌ | ✅ | PARTIELLE (DEBUG_WICTIONARY=true laissé à :7450) |
| Base de règles MySQL + API REST | schéma+serveur écrits | non déployé | non initialisée | ❌ | ✅ | **ABANDONNÉE** (la version navigateur « fake SQLite » l'a remplacée — DÉDUIT) |
| spaCy Python/HF/cloud | 4 clients + 5 scripts py | non lancés | n/a | pages test HTML | ✅ archivés/orphelins | **ABANDONNÉE** |
| Grammalecte / LanguageTool / Cloudflare Worker | ❌ | ❌ | ❌ | ❌ | archivés (archive/doublons/) | **ABANDONNÉES** |

## 9. Frontend

- 526 KB dans un seul fichier ; 140 `console.log` en production (`VÉRIFIÉ` count) + un `<script>` de diagnostic avec `setTimeout` 2 s/5 s (`index.html:31-60`) ; **ligne 30 : texte orphelin `// Debug script -->` hors balise** (BUG-UI-001, affiché ou ignoré selon parse — `À TESTER`).
- **Duplications** : `window.selectModule` ×2 (5893, 8766 — le 2ᵉ écrase), `logout` ×2 (5864, 9300), `login`/`showLoginError` ×2, blocs d'submit d'activité répétés ~3× (764-848, 1070-1154, 1272-1356), textes d'accueil dupliqués HTML/JS (3238/3266 vs 8272/8289), `window.currentAudioSource` réaffecté 17×.
- **Morts/brisés** : `setupRealTimeCorrectionForChat()` appelée (index.html:9542,9549) mais **définie nulle part** (garde `typeof` → échec silencieux) ; commentaire pointant `writing-assistant-grammalecte.js` inexistant (9531) ; scripts spaCy-rules commentés « conflits et erreurs » (9556-9566) ; `generateMockDefinition()` jamais appelé (7751) ; `pipelineEngine = null` (9451) inutilisé ; « script de secours » qui force l'affichage de l'UI (9404-9425) et masque les bugs de restauration de session (`DÉDUIT`).
- **Responsive/AX** : Tailwind CDN uniquement + 3 media queries (1578-1673) + hack de font-size en JS (9440) ; ~3 attributs `aria-*`/`alt` et 0 `role=` dans tout le document → accessibilité quasi inexistante (`VÉRIFIÉ`).
- **Données mockées** : 18 étudiants + mots de passe en dur (5607-5626) ; messages de chat « demo/simulated » (7955, 8047, 8998).

## 10. Backend

Aucun backend en production (`VÉRIFIÉ`). Pièces mortes : `nlp/database/server.js` (Express, mysql2, port 3000, endpoints `/api/nlp/query|rules|stats` :47-236 — dont `/api/nlp/query` qui **exécute du SQL fourni par le client**, SEC-004) ; `nlp/python-server/*` (4 serveurs concurrents sur 8000/8001/8002, aucun lancé par l'app, ports incohérents avec le client qui vise 8002 : `cloud-spacy-proxy-client.js:7` vs docs 8001).

## 11. API (calls sortants)

| Méthode | Endpoint | Auth | Rôle | Consommateur front | État |
|---|---|---|---|---|---|
| POST | api.groq.com/openai/v1/chat/completions | clé codée en dur | réponses tuteur + analyse | main.js:689, groq-ai-analyzer.js:44 | Partiellement cassé (BUG-004) |
| POST | api-inference.huggingface.co/models/…/spacy | token HF en dur | analyse spaCy cloud | cloud-spacy-client/configured.js | Orphelin (non chargé) |
| GET | router.huggingface.co/spacy/fr_core_news_sm | token HF | proxy spaCy | proxy-server.py (non lancé) | Orphelin |
| GET | api.dictionnaire.api.cnrtl.fr / Wiktionary | — | définitions nuages | index.html:7452 | Actif, debug on |
| — | localhost:8000/8001/8002/3000 | — | spaCy/MySQL locaux | jamais démarré | Mort |
| GET | cdn.tailwindcss.com, fonts.googleapis | — | UI | index.html:7-10 | Externe, SPOF |

## 12. Base de données

Trois « bases » coexistent sans se parler (`VÉRIFIÉ`) :
1. **MySQL** `nlp-rules.sql` : tables `linguistic_rules` (ENUM style|vocabulaire|conjugaison|orthographe), `rule_metadata`, `rule_usage_stats`, vues + 3 procédures ; **30 règles seed**. Jamais instanciée.
2. **nlp_rules.db (sqlite fichier)** produit par `init-sqlite.js` (30 règles) — lu par personne.
3. **Browser « fake SQLite »** `init-browser-sqlite.js` : `Map` en mémoire avec **274 règles** codées en dur (140 vocabulaire, 58 orthographe, 44 style, 31 conjugaison, 1 grammaire, 4 `pattern_type:'function'`). `query()` (3396-3417) ne sait traiter que `SELECT`/`WHERE category`. **C'est la seule source réellement utilisée.**
Chaîne Migration→Model→Service→API→Front : **rupture à chaque maillon** (SQL non appliqué, manager MySQL jamais joint, catégorie `grammaire` non mappée dans `SpacyAnalyzer.patterns` → la règle `genre_texte_masculin` — celle du dernier commit — peut être **silencieusement droppée** : `VÉRIFIÉ` spacy-analyzer.js:525-547, impact `À TESTER`). `migrate-from-js.js` = **erreur de syntaxe** (ligne 2, commentaire non terminé) → chaîne de migration cassée.

## 13. Authentification / autorisation

`AuthManager` client-side (index.html:5600-5740) : session 24 h, lockout 3 tentatives, users/mots de passe **en clair dans le HTML public** (5607-5626), mot de passe loggé (9309). Rôles « student/teacher » purement décoratifs : toute la data « enseignant » vit dans le `localStorage` du navigateur local — aucun partage, aucun contrôle serveur. Incohérence front/back : **le back n'existe pas**, donc la notion de ressource protégée est `NON VÉRIFIABLE`. `DÉDUIT` : l'app est une maquette pédagogique locale, pas un système multi-postes.

## 14. Sécurité (audit défensif)

```text
SEC-001 | Clé API Groq en dur côté client (2 exemplaires) | GRAVE | nlp/groq-ai-analyzer.js:8 + main.js:657
        | Preuve: chaînes littérales; log des 10 premiers caractères main.js:662
        | Impact: clé volable par tout visiteur (repo PUBLIC GitHub), quota/billing
        | Fix: déplacer derrière un proxy serveur + tourner la clé immédiatement
SEC-002 | Token HuggingFace en dur, 6 fichiers ; token COMPLET loggé console | GRAVE | nlp/cloud-spacy-configured.js:2,8,256 ; python-server/proxy-server.py:18, test-*.py:10
SEC-003 | Identifiants + mots de passe des 18 étudiants en clair dans index.html | ÉLEVÉ | index.html:5607-5626 (auth client, sans hash)
SEC-004 | SQL arbitraire : POST /api/nlp/query exécute la requête du client, sans auth | ÉLEVÉ (si déployé) | nlp/database/server.js:47+ ; creds par défaut root/mot de passe vide server.js:10-19
SEC-005 | Aucune validation/sanitisation des saisies injectées dans innerHTML (leçons, devoirs, annonces) | MOYEN | multiples index.html; CORS/CSP/rate-limit: inexistants ; .env: supprimé volontairement (commit 526b498 du 07/03)
SEC-006 | Dépendance CDN runtime (Tailwind) sans SRI | MOYEN | index.html:10
```
Aucune exploitation réalisée (audit passif uniquement).

## 15. Performance

`PROBLÈME MESURÉ` : `index.html` 526 KB + 12 scripts séquentiels sans bundle ; 190 `console.log` (index+main) exécutés au chargement ; 2 `setTimeout` de diagnostic (2 s/5 s) ; Tailwind compilé côté navigateur (CDN). `RISQUE POTENTIEL` : cache ?v= manuel → re-téléchargement complet de 526 KB à chaque bump (pattern visible des derniers commits) ; pas de Service Worker ; les rapports eux-mêmes listent ces manques (§22).

## 16. Qualité du code

- Monolithe 9 600 lignes sans modules ; globals sur `window` comme seule architecture ; nommage incohérent (`correctionSystem` vs `integratedCorrectionSystem` — BUG ci-dessous), messages de commit vides, duplication §9, code commenté au lieu d'être supprimé (index.html:9473, 9555-9566), **rapports internes qui documentent des fichiers n'ayant jamais existé** (§20/22).
- TODO réels : `auto-nlp-installer.js:46` « Simulation de spaCy-WASM (à implémenter) » + stubs vides `downloadFile/executeInstaller/installSpacyModel/startLocalProxy` (165-185) + `loadWasmModule()` qui renvoie `{loaded:true}` inconditionnel (:187-195) ; placeholders sql.js `database-rules-manager.js:540-561`.

## 17. Tests

Aucun test automatisable (0 framework, 0 CI). Pages de test HTML manuelles et orphelines : `nlp/pipeline-demo.html`, `pipeline-step-test.html`, `pipeline-test-fixed.html`, `test-spacy-proxy.html`, `nlp/archive/*.html` (référencent pour la plupart des fichiers **déplacés ou supprimés** — `À TESTER` pour leur ouvrabilité). Couverture : **non mesurée, et non mesurable** (aucun runner).

| Domaine | Tests | État | Risque |
|---|---|---|---|
| Correction règles | aucun | ❌ | Élevé — cœur métier, 3 bugs passés inaperçus |
| Chat IA | aucun | ❌ | Moyen |
| Auth | aucun | ❌ | Moyen |
| Persistance localStorage | aucun | ❌ | Moyen |

## 18. Dépendances

`VÉRIFIÉ` : **il n'y a pas de package.json à la racine** — zéro dépendance JS gérée pour l'app elle-même (tout est CDN ou inline). Fichiers de deps isolés : `nlp/database/package.json` (mysql2/express — non installé, `NON VÉRIFIÉ`), `nlp/python-server/requirements*.txt` (spaCy fr_core_news_sm/md/lg, FastAPI/Flask — non installés). `DÉDUIT` : vulnérabilités non auditées possible dans ces orphelins ; aucune mesure `npm audit` faite (à réserver à l'étape de reprise).

## 19. Configuration

Aucun .env (supprimé par `526b498`), aucune variable d'env lue. Configuration = constantes en dur dans les JS. Commandes documentées dans les docs/archives et **NON VÉRIFIÉES** (ne pas les considérer comme exactes) :
```text
installation dev : ouvrir index.html (ou python -m http.server — À TESTER ; fetch des contexts/*.md inexistants)
nlp/database     : node server.js            (suppose MySQL local — BLOQUÉ sans DB)
nlp/python-server: pip install -r requirements.txt && python app.py   (orphelin de l'app)
build/tests/prod : INEXISTANTS — NON DISPONIBLE
```

## 20. Documentation

README racine : **1 ligne** (« # Langue-Francaise ») → inutilisable. La vraie doc = `archive/rapports/*.md` + `nlp/archive/*.md` + `nlp/README-GROQ-MODELS.md`. **Problème majeur constaté** (`VÉRIFIÉ`) : `RAPPORT-IMPLEMENTATION-FLUIDITE.md` et `RAPPORT-IMPLEMENTATION-AVANCEES.md` marquent « ✅ TERMINÉS » 12 modules (`progressive-loader.js`, `streaming-pipeline.js`, `intelligent-cache.js`, …) **qui n'existent nulle part dans le repo** ; `RAPPORT-NETTOYAGE-GLOBAL.md` idem pour `comptes-etudiants.js`/`utils.js`. `nlp/archive/USAGE-GUIDE.md` et `INTEGRATION-COMPLETE.md` documentent une architecture (`spacy-rules-*-simple.js`, `text-corrector-ui.js`, `rules-validator.js`) entièrement supprimée. → **La doc interne n'est pas une source de vérité fiable ; ne jamais s'y fier sans vérifier le disque.** `DÉDUIT` : rapports générés par un agent IA sur la base d'intentions, pas de réalisations.

## 21. Registre des bugs

| ID | Type | Description | Gravité | Fichier:ligne | Preuve | Impact | Statut | Action |
|---|---|---|---|---|---|---|---|---|
| BUG-001 | Fonctionnel | `window.writingAssistant` jamais défini ; les 9+ inputs l'appellent (`checkText`, `toggleAudio`) | HAUTE | index.html:5969,5977,6131,6138,6216,7979,8926 + module archivé | grep sans définition | Assistant d'écriture temps réel 100 % inerte | OUVERT | Réimplanter ou supprimer les appels |
| BUG-002 | Fonctionnel | `analyzeTextLocal` est `async` (spacy-analyzer.js:273) mais appelé sans `await` dans une garde `&&` → renvoie un Objet-Promesse truthy dont `.errors` est `undefined` | HAUTE | main.js:215 | VÉRIFIÉ | Corrections vides dans `demanderIA` (chat) | OUVERT | awaiter / utiliser `correctTextWithDatabase` |
| BUG-003 | Fonctionnel | `advanced-text-corrector.js:148` appelle `window.loadAllRules()` sans await ; `applyRules` ignore son argument (:149 vs spacy-analyzer.js:399) ; format de retour incompatible (`{errors}` vs tableau, :22) → **résultats de règles toujours jetés** | HAUTE | nlp/advanced-text-corrector.js:22,148,149 | VÉRIFIÉ | « Correcteur avancé » = no-op | OUVERT | Refondre la fusion |
| BUG-004 | Fonctionnel | Chaîne Groq cassée : `callGroqAPI` renvoie un objet déjà parsé (groq-ai-analyzer.js:66-68), puis `JSON.parse(obj)` lève (:112), `extractSuggestionsFromText(obj)` sort (:144) → `aiResults = []` permanent | HAUTE | nlp/groq-ai-analyzer.js:66,112,144 | VÉRIFIÉ | Analyse IA style = silencieusement vide | OUVERT | Parser `.choices[0].message.content` |
| BUG-005 | Câblage | `integrated-correction-system.js:74-80,326` appelle `window.correctionSystem.*` alors que l'instance est `window.integratedCorrectionSystem` (:692) → boutons modaux lèvent | MOYENNE | nlp/integrated-correction-system.js | VÉRIFIÉ | UI « correction intégrée » HS | OUVERT | Renommer les références |
| BUG-006 | Câblage | Branches mortes : `processWithHybridPipeline`/`spacyProxyClient` jamais chargés mais encore branchés (:152,:158) ; `migrate-from-js.js:2` erreur de syntaxe ; message d'erreur renvoyé parle d'« OpenAI » et de `configureAPIKey()` inexistante (main.js:124-136) | MOYENNE | cf. gauche | VÉRIFIÉ | Confusion au débogage | OUVERT | Nettoyage |
| BUG-007 | Données | Catégorie `grammaire` non mappée dans `SpacyAnalyzer.patterns` (spacy-analyzer.js:525-547) → la règle `genre_texte_masculin` (sujet du dernier commit) potentiellement droppée | MOYENNE | gauche | VÉRIFIÉ code / À TESTER runtime | Debug en cours à l'arrêt | OUVERT | Ajouter le mapping |
| BUG-008 | UI | Texte orphelin `// Debug script -->` hors balise, visible dans le DOM | FAIBLE | index.html:30 | VÉRIFIÉ | Résidu visuel | OUVERT | Supprimer |
| BUG-009 | UI/Cache | « Script de secours » qui force l'affichage (9404-9425) masque les bugs de restauration de session ; `DEBUG_WICTIONARY=true` (:7450) ; 190 console.log | MOYENNE | gauche | VÉRIFIÉ | Comportements trompeurs | OUVERT | Retirer après debug |
| BUG-010 | Environnement | `git` local en « dubious ownership » (dossier F: propriété d'un autre SID Windows) | FAIBLE (contournable) | repo | VÉRIFIÉ (sortie `fatal:`) | Toute commande git nue échoue | OUVERT | `git config --global --add safe.directory F:/Langue-Francaise` (fait par le futur utilisateur, pas par l'audit) |
| ARCH-001 | Architecture | `window.NLPDatabase` défini par 2 modules concurrents (database-integration.js:68 vs database-rules-manager.js:571) ; format de règle `correction: 'function(match){…}'` stocké en chaîne (init-browser-sqlite.js:39-42) sans évaluateur prouvé | HAUTE | gauche | VÉRIFIÉ | Race + règles « fonction » inertes | OUVERT | Source unique |
| UX-001 | UX | Accessibilité ~0 (3 aria, 0 role sur 9 600 lignes) ; pas d'états d'erreur vides côté user (console-only) | MOYENNE | index.html | VÉRIFIÉ | Exclusion + support handicap | OUVERT | Audit UI dédié |
| TEST-001 | Tests | Zéro test sur le cœur (correction/chat) | HAUTE | repo | VÉRIFIÉ | Régressions invisibles (déjà 4 bugs silencieux) | OUVERT | Tests du pipeline de règles d'abord |
| TODO-001 | Restant | `setupRealTimeCorrectionForChat` à créer (appelée index.html:9542/9549, définie nulle part) | — | gauche | VÉRIFIÉ | Le temps-réel n'accroche pas | À FAIRE | — |
| TODO-002 | Restant | `auto-nlp-installer.js` : stubs WASM/local-proxy à implémenter (:46,165-195) | — | gauche | VÉRIFIÉ | Installer fictif | DECIDED-PARK ? `DÉDUIT` abandonné le 07/03 | — |
| TODO-003 | Restant | Perchoir du §22 de RAPPORT-OPTIMISATION-COMPLETE.md : bundle, SW, gzip, WebP, CDN, ES6, TS, tests automatisés | — | gauche | VÉRIFIÉ doc + absence code | Dette connue et écrite | À FAIRE (priorité basse) | — |

## 22. TODO/FIXME — pertinence

`grep TODO|FIXME|XXX|HACK|WIP` (`VÉRIFIÉ`) : **aucun TODO/FIXME dans le code vivant hors §21** (marqueurs restants confinés à `archive/` et `auto-nlp-installer.js`). Pertinence : les « TODO » des rapports d'archive sont périmés (architecture décrite supprimée) ; seul le §22 de `RAPPORT-OPTIMISATION-COMPLETE.md` correspond encore à du réel. Le vrai « reste à faire » est **dans les diffs des 3 derniers commits** (§5), pas dans les commentaires.

## 23. Travail réalisé (reconstitution)

### Architecture
SPA sans build monolithique ; décision assumée « zéro Node côté serveur » (b79ea66, 05/03) ; 4 grands nettoyages documentés (380b70a, bc0a522, f2b5fdd, 5c3e719) ; archivage discipliné du code mort dans `archive/{debug,doublons,rapports}` (`VÉRIFIÉ` : 16 fichiers JS archivés).
### Fonctionnalités
~72 leçons HTML complètes sur 6 types de textes ; flux d'activités avec soumission + panneau de correction ; chat par module ; assistant « nuages » (UI + logique d'affichage terminées, branchement runtime perdu) ; audio TTS ; espace enseignant (progression 18 étudiants, annonces, documents, devoirs).
### Backend
Aucun déployé ; 2 serveurs écrits puis abandonnés (Express/MySQL, FastAPI/Flask spaCy).
### Frontend
Tout listé ci-dessus, + cache purging (`main.js:1112`), thème (`localStorage theme/themeColor`), gestion erreurs `appState.errors`.
### Base de données
274 règles linguistiques rédigées **à la main** dans `init-browser-sqlite.js:3391` (véritable livrable de valeur du projet) ; schéma MySQL complet + 30 seed rules ; procédures/vues écrites.
### Sécurité
Aucune — tout exposé côté client (volontairement, `DÉDUIT` : contrainte « GitHub Pages sans backend »).
### Tests
Pages HTML de diagnostic (créées puis orphelines) ; aucune suite.

## 24. Travail abandonné

1. **Grammalecte** : 02/03 flambée (e222023→c7c6644…) puis supprimé `d378ac6`/`dfc2c60`. Preuve de mort : commentaire piquant un fichier inexistant (index.html:9531). Non réutilisable en l'état (archive vide de ce fichier — `VÉRIFIÉ` absence).
2. **LanguageTool** : 9764a25→b3fd7d2, zero référence restante (`VÉRIFIÉ` grep).
3. **Cloudflare Workers chat** : b79ea66 puis archivé (`archive/doublons/chat-system-cloudflare.js`).
4. **spaCy réel (python/cloud/WASM)** : clients + 5 scripts py + installer à stubs ; jamais branché à l'app finale. Reprenable : oui (code complet mais ports incohérents 8001/8002).
5. **MySQL `nlp_rules`** : schéma+serveur complets ; `migrate-from-js.js` syntaxiquement mort. Reprenable mais concurrent du `Map` navigateur.
6. **Dashboard pédagogique** : créé 396eb91… puis « SUPPRESSION COMPLÈTE » (f2b5fdd 07/03) puis réincarné en panneau progression (`VÉRIFIÉ` dans index.html) — semi-abandon.
7. **`memory/student-profile-unified.js` et `activities-optimized.js`** : importés (`index.html:13,27`) mais **zero consommateur** (`VÉRIFIÉ` grep) → abandonnés en plein vol.
8. **Pipeline « 4 modèles »** : le nom survit (main.js:107-141) mais l'implémentation est 1 appel Groq (`VÉRIFIÉ`) — approche abandonnée sans nettoyage.
Raisons : Git ne les documente pas — non déterminées.

## 25. Décisions techniques historiques

| Décision | Date | Commit(s) | Ancienne → Nouvelle | État actuel |
|---|---|---|---|---|
| Correction : LanguageTool → Grammalecte → spaCy-lg → règles maison | 02-03/03 | 9764a25→e222023→b30364e→41752db | multi-backend → regex uniques | En place (regex) |
| Zéro backend : Node → GitHub Pages + Cloudflare Workers | 05/03 | b79ea66 | serveur local → statique+worker | Partiellement (worker ensuite archivé, app 100 % statique) |
| Multi-agents RAG → chat simple | 05-06/03 | 46de7ec→…simple.js | multi-agent → 1 prompt Groq | En place |
| IA locale « spaCy » = émulation regex (SPA CY) | 07/03 | 9d09be6 | french-analyzer → spacy-analyzer (regex) | En place — **trompeur pour un repreneur** |
| Unifications | 07/03 | d25978a, 2b4b493 | chat×2→1, profils×2→1 | En place |
| ES6 → ES5 (syntaxe) | 07/03 | 696d32a | template literals → concat | En place |
| Dashboard supprimé | 07/03 | f2b5fdd | présent → retiré | Recréé différemment |
| Règles MySQL → « browser SQLite » (Map) | ~19-21/03 | chaîne 5c3e719→b0b7e52 | serveur DB → mémoire client | **En cours à l'arrêt** |
| Clé Groq en dur client | 21/03 | 4026c4a « chat ckes » | config → en dur | En place (SEC-001) |

## 26. Risques à la reprise

1. **Faire confiance aux rapports `archive/rapports`** → ils décrivent du code inexistant (§20). Risque n°1.
2. **Croire « spaCy » et « SQLite » réels** → deux noms mensongers ; toute refonte qui suppose leur présence part sur de fausses prémisses.
3. **Modifier l'un des ~25 fichiers orphelins en croyant modifier le runtime** — seul le chargement `index.html:10-28` est vivant.
4. **Clés Groq/HF publiées dans un repo public** → à révoquer indépendamment du code.
5. **Cache-busting manuel `?v=`** : tout bump invalide 526 KB + risque d'incohérence de version entre fichiers si un seul est incrémenté (pattern des derniers commits).
6. **Aucun test** : les 4 bugs de câblage (§21) ont survécu des semaines — la reprise sans tests en produira d'autres.
7. **Environment git** : `dubious ownership` (BUG-010) sur toute machine où le dossier est copié/changé de propriétaire.
8. **Doublons de définitions globales** (`selectModule` ×2, `logout` ×2) : l'ordre de chargement/définition décide du comportement — fragile à toute réorganisation.
9. localStorage = seule persistance → pas de migration possible, aucune synchro multi-postes ; ne pas promettre de « données étudiants ».

## 27. État global

| Domaine | État | Confiance | Problèmes |
|---|---|---|---|
| Architecture | Monolithe cohérent mais non conforme aux noms (faux spaCy/SQLite) | FORTE | ARCH-001, orphelins |
| Frontend | Fonctionnel (statique + flux principaux) | MOYENNE (jamais ouvert en navigateur ici) | BUG-001/008/009, UX-001 |
| Backend | Inexistant (volontaire) | FORTE | — |
| API (sortantes) | Groq = route unique | MOYENNE | BUG-004 |
| DB | Map mémoire 274 règles ; chaînes MySQL/SQLite mortes | FORTE | §12, BUG-007 |
| Auth | Démo client-only | FORTE | SEC-003 |
| Sécurité | Mauvaise (repo public + clés) | FORTE | SEC-001..006 |
| Tests | Nuls | FORTE | TEST-001 |
| Performance | Chargement lourd, logs, CDN runtime | MOYENNE | §15 |
| Documentation | Trompeuse (rapports faux) | FORTE | §20 |
| Git | Propre, linéaire, synchronisé, mais messages vides et pas de tag | FORTE | — |

## 28. Point exact de reprise

```text
# POINT DE REPRISE

Branche : main
Commit de référence : b0b7e52 (= origin/main, worktree propre)
Dernier commit significatif : b0b7e52 "changed" (22/03/2026 00:44)
Dernière fonctionnalité travaillée : correction automatique des réponses d'activités
  via window.correctTextWithDatabase + base de règles navigateur (+ repli IA 'activité')
État de cette fonctionnalité : PARTIELLE — UI branchée (analyzeActivityAnswer /
  analyzeAndSubmitActivity / submitCorrectedActivity, index.html ~+793 l. les 3 avant-derniers
  commits) ; chaîne de correction douteuse (règle grammaire potentiellement droppée BUG-007 ;
  format 'function' non évalué ARCH-001 ; débogage console laissé OUVERT dans
  database-integration.js:225-230)
Derniers fichiers modifiés : index.html, main.js, nlp/database-integration.js,
  nlp/database/init-browser-sqlite.js (b0b7e52) ; puis nlp/database-rules-manager.js,
  nlp/correction-integration-examples.js, nlp/integrated-correction-system.js
Dernière modification importante : bascule de la règle genre_texte_masculin en
  « correction-fonction » (init-browser-sqlite.js:39-42) + mode 'activité' dans
  runFourModelPipeline (main.js:672-682,733-741)
Dernier problème identifié : la correction d'une réponse contenant « la texte » /
  « une texte » ne remontait rien → log de diagnostic inséré juste avant l'arrêt
Travail restant : 1) valider la chaîne de correction d'activités end-to-end ;
  2) réparer BUG-002/003/004 ; 3) trancher ARCH-001 (source unique de règles) ;
  4) supprimer ou réimplanter BUG-001 ; 5) retirer le debug (BUG-009)
Blocage : aucun (hors BUG-010 environment)
Dépendances : BUG-002/007 conditionnent la validation du §5 ; TEST-001 avant refactor
Première action recommandée : servir le site en local (python -m http.server ou eq.) et
  reproduire : login étudiant → activité → répondre "la texte est interesting" →
  soumettre → observer console (logs du diagnostic de b0b7e52)
Deuxième action : tracer window.NLPRules.grammaire (existe ? chargé dans l'objet ?
  mappé dans SpacyAnalyzer.patterns ?) → confirmer BUG-007
Troisième action : corriger le mapping async/await (BUG-002) puis re-valider le même cas
Confiance : FORTE (diffs + horodatages + worktree propre + branche unique)
Pourquoi : le HEAD contient du code de DEBUG non terminé (jamais on ne commit volontairement
  un console.log « pour le débogage » comme état final), 3 des 4 derniers commits touchent
  le même sous-système en <1 h, et plus aucun commit après 00:44 — arrêt net en cours
  d'itération, pas une livraison.
```

## 29. Plan de reprise (ordonné, avec dépendances)

```text
ÉTAPE 0 — Photographie & sécurité du contexte
  Vérifier `git -c safe.directory=… status` propre ; ne rien pusher ; révoquer/clear les
  clés Groq+HF même sans changer le code. Validation : repo propre, agent averti.
↓ conditionne tout

ÉTAPE 1 — Revenir à un état observé (BLOQUE la compréhension de tout le reste)
  Lancer le site + console ; exécuter le cas "la texte" ; consigner les logs réels.
  Fichiers : index.html, main.js, nlp/database-integration.js, nlp/database/init-browser-sqlite.js
  Résultat : confirmer/infirmer BUG-007 et le symptôme du §5. Validation : log du diagnostic
  de database-integration.js:225 visible.

ÉTAPE 2 — Réparer la chaîne de correction (dépend de Étape 1)
  BUG-002 await (main.js:215) ; BUG-004 parse Groq (groq-ai-analyzer.js:112/144) ;
  BUG-003 advanced-text-corrector (22/148/149) ; BUG-007 mapping 'grammaire'
  (spacy-analyzer.js:525-547) ; ARCH-001 (correction-fonction + double NLPDatabase).
  Validation : "la texte est important" → correction affichée ; chat → corrections non vides.

ÉTAPE 3 — Ajouter des tests (dépend de Étape 2, avant toute refactor)
  TEST-001 : tests unitaires des règles (274) + 3 tests du flux demanderIA
  (runner minimal à choisir — hors périmètre audit). Validation : suite verte reproductible.

ÉTAPE 4 — Trancher BUG-001 / TODO-001 (temps réel)
  Décider : réimplanter writingAssistant.checkText (via correctTextWithDatabase) ou retirer
  les 9+ hooks + `setupRealTimeCorrectionForChat`. Dépend de Étape 2 (réutiliser la chaîne réparée).
  Validation : taper « la texte » dans un input → nuage de suggestion.

ÉTAPE 5 — Nettoyage vérité-noms
  BUG-008/009, messages d'erreur mensongers (main.js:124-136 "OpenAI"/configureAPIKey),
  branches mortes hybrid/cloud (BUG-006), renommer "spaCy"/"SQLite" ou les rendre vrais.
  Dépend de Étape 3 (tests garants).

ÉTAPE 6 — (Option, hors chemin critique) Décider de MySQL/spaCy réel : réactiver ou
  supprimer nlp/database et nlp/python-server + docs. Répond à « abandonné vs parké ».

ÉTAPE 7 — Qualité : bundle/SWR/cache policy (§15), a11y UX-001, séparation du monolithe
  si l'équipe le souhaite (TODO-003).
```

## 30. Priorisation (critères explicites)

1. **Bloquant** : Étape 1 (aucune reprise possible sans observabilité) — critère : « empêche toute action ».
2. **Sécurité** : SEC-001/002 (clés dans repo **public** — révocation indépendante du code, à faire dès que possible) > SEC-003/004.
3. **Intégrité des données** : ARCH-001 + BUG-007 (règles silencieusement droppées = fausse correction d'étudiants).
4. **Fonctionnalité critique** : BUG-002/003/004 (cœur métier : la correction), puis BUG-001.
5. **Tests** : TEST-001 (empêche la rechute des 4 bugs).
6. **Dette** : BUG-006/008/009, orphelins.
7. **Performance** : §15. 8. **UX** : UX-001. 9. **Secondaire** : TODO-003.

## 31. Checklist finale de l'audit

```text
[x] Branche actuelle identifiée      [x] Commit actuel identifié
[x] Worktree analysé (propre)        [x] Historique Git analysé (299/299)
[x] Branches analysées (1 seule)     [x] Commits non fusionnés recherchés (aucun)
[x] Tags analysés (aucun)            [x] Derniers commits analysés (15 en détail)
[x] Fichiers récemment modifiés      [x] Architecture comprise
[x] Stack identifiée                 [x] Fonctionnalités inventoriées
[x] Frontend audité                  [x] Backend audité (inexistant, prouvé)
[x] API auditée                      [x] Base de données auditée
[x] Authentification auditée         [x] Sécurité auditée (passive)
[~] Performance ANALYSÉE mais non mesurée en navigateur (À TESTER)
[x] Tests analysés (néants)          [x] Dépendances analysées
[~] Configuration : commandes documentées mais NON exécutées (audit en lecture seule)
[x] Documentation vérifiée (et invalidée)
[x] TODO/FIXME recherchés            [x] Travail abandonné recherché
[x] Travail réalisé reconstitué      [x] Point d'arrêt identifié
[x] Confiance indiquée (FORTE)       [x] Travail restant + dépendances
[x] Plan de reprise créé             [x] AUDIT_COMPLET.md créé
[x] PROJECT_STATE.md créé            [x] DEVELOPMENT_LOG.md créé
[x] Prompt de reprise créé
```
Questions ouvertes persistantes (et pourquoi) :
- « Qu'est-ce qui fonctionne réellement dans un navigateur ? » → `À TESTER` : audit purement statique, aucune exécution. Étape 1 du plan le résout.
- « Le site est-il déployé quelque part ? » → `NON VÉRIFIÉ` : pas de Pages sur GitHub ; chercher un éventuel déploiement externe (inconnu de Git).
- « Pourquoi arrêt le 22/03 ? » → `NON VÉRIFIÉ` : Git ne documente pas les raisons extra-techniques.

---

## SI JE REPRENDS DEMAIN

```text
Branche : main (= origin/main, worktree propre, 299e commit, aucun tag)
Commit : b0b7e52 — "changed", 2026-03-22 00:44
État : SPA statique qui charge ; correction IA/règles interne = 4 bugs de câblage silencieux
Dernier travail : correction des réponses d'activités par la base de règles navigateur (+793 l. index.html)
Problème actuel : "la texte → le texte" ne se corrige pas ; log de debug laissé ouvert
  dans nlp/database-integration.js:225-230 ; règle 'grammaire' possiblement droppée (BUG-007)
Fichiers : index.html:~9542+, main.js:215,672, nlp/database-integration.js, nlp/database/init-browser-sqlite.js:36-45
Prochaine action : servir en local, login étudiant, répondre « la texte… » dans une activité, lire la console
Test à effectuer : correctTextWithDatabase("la texte est important") renvoie ≥1 correction
```

---

**ADDENDUM 2026-09-26 — Série ACTIONS 7-17 clôturée — aucun résidu actionnable identifié.**

> Les anomalies de correction décrites dans ce document ont été traitées par la série ACTIONS 7-17
> (commits `c14a0f3`, `c474c1a`, `91f34ee`, `0efdf1c`, `7737735`, `2148613`, `dcab9ba` — branche
> `main`, non poussée au moment de la clôture). État final : 275 règles source / 275 converties /
> 0 perdue ; 0 SyntaxError, 0 TypeError, 0 warning, 0 fantôme, 0 oscillation ; deux oscillations
> éliminées (points A9, virgule+et A17) ; harnais de validation hors repo (répertoire Temp).
> Restent hors périmètre traité : BUG-001/002/003/004/005, SEC-001..003 (clés **à révoquer**),
> la perte globale `/gi` (couverture locale en place), l'architecture `text.match/replace()`,
> Groq, CacheManager. Détail : `PROJECT_STATE.md` (section Clôture) et `DEVELOPMENT_LOG.md`.
