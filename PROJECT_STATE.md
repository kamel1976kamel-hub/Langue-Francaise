# PROJECT STATE

> Mémoire opérationnelle du projet. Généraion : audit en lecture seule du 2026-09-26.
> Source de vérité détaillée : `AUDIT_COMPLET.md` (ne pas se fier aux rapports de `archive/rapports/`, ils décrivent du code inexistant).

## Dernière mise à jour
**2026-09-26 — CLÔTURE DE LA SÉRIE ACTIONS 7-17.** Moteur de correction restauré, audité et stabilisé :
- **275 règles source / 275 converties / 0 perdue** (`nlp/database/init-browser-sqlite.js`, cache `?v=53`).
- 7 règles historiques restaurées (adaptées au contrat `correction(match)` à 1 argument), 26 fonctions incompatibles réparées ou neutralisées, 15 règles-conseils destructrices neutralisées, 2 oscillations éliminées (points A9, virgule+et A17), couverture de casse locale complète.
- Corruptions éliminées (mesurées) : « je parler »→« e  », « les »→« e », « C'est les enfants »→« Ce sont », « S.N.C.F. »→« SF. », « Après que… »→« A », conseils substitués au texte, etc.
- Hors périmètre restant : `/gi` global (couvert localement par variantes), architecture `text.match/replace()`, Groq (clé 401 **à révoquer**), CacheManager, `confusion_leur_leurs`/`confusion_champ_chant` (variantes légitimes), interaction d'ordre « Qui d'autre » (résidu accepté).
- **Commits locaux non poussés (8)** : `5c00246`→`dcab9ba` — push bloqué (403 : identifiants `kamel1976` sans écriture sur `kamel1976kamel-hub`).
- Détail par action : voir `DEVELOPMENT_LOG.md` (entrée « Série ACTIONS 7-17 »).

### État historique (audit d'origine, périmé pour le moteur)
2026-09-26 (audit). Dernier commit réel du projet : **2026-03-22 00:44**.

## Branche actuelle
`main` — unique branche. `origin/main` = même commit. Worktree propre. Aucun tag. Aucun merge commit. Historique linéaire de 299 commits (1er → 22 mars 2026).

⚠️ Git local en « dubious ownership » : prefixer toute commande par
`git -c safe.directory=F:/Langue-Francaise …` (ou l'ajouter en config globale, hors périmètre de l'audit).

## Commit de référence
`b0b7e52e353826899c8ea9bb073d904af0e26d60` — « changed » (22/03/2026)

## État général
SPA 100 % front-end (vanilla JS, aucun framework/build) d'atelier de rédaction en français pour 18 étudiants (Biskra). Leçons + activités + chat IA (Groq) + panneau enseignant. Fonctionnel en apparence ; **le pipeline de correction est cassé en interne** et les noms « spaCy » / « SQLite » sont des illusions (regex + `Map` en mémoire).

## Ce qui est terminé
- 6 modules / ~72 leçons HTML complètes inline (`index.html:4128-5500`)
- Maquette de login étudiant/enseignant (client-side)
- Chat tuteur par module branché sur Groq
- UI des activités + flux de soumission/correction branchés (3 derniers commits)
- **274 règles linguistiques rédigées à la main** dans `nlp/database/init-browser-sqlite.js:3391` (le vrai livrable de valeur)
- Panneau enseignant (progression, annonces, documents, devoirs) sur localStorage
- Archivage du code mort dans `archive/{debug,doublons,rapports}`

## Ce qui est en cours
Correction automatique des réponses d'activités via `window.correctTextWithDatabase` : le dernier commit ajoute un **log de débogage ouvert** sur la règle `genre_texte_masculin` (« la texte → le texte ») qui ne remontait rien.

## Ce qui reste à faire
1. Revenir à un état observé : lancer l'app en local et reproduire le cas « la texte ».
2. Réparer BUG-002 (`main.js:215` await manquant), BUG-004 (parse Groq `groq-ai-analyzer.js:112,144`), BUG-003 (`advanced-text-corrector.js:22,148,149`), BUG-007 (`spacy-analyzer.js:525-547` mapping `grammaire`), ARCH-001 (double `window.NLPDatabase` + `correction:'function(...)'` en chaîne jamais évaluée).
3. Décider de BUG-001 : `window.writingAssistant` inexistant mais appelé par 9+ champs (`index.html:5969,5977,6131,6138,6216,7979,8926`) et `setupRealTimeCorrectionForChat()` jamais définie (`index.html:9542,9549`).
4. Ajouter des tests (zéro test aujourd'hui).
5. Nettoyage : BUG-008 (`index.html:30` texte orphelin), BUG-009 (scripts de secours + `DEBUG_WICTIONARY=true:7450` + 190 console.log), BUG-006 (branches mortes hybrid/cloud, `migrate-from-js.js` erreur de syntaxe, message d'erreur « OpenAI » mensonger `main.js:124-136`).
6. **État des anciens candidats orphelins :** `nlp/python-server/`, `activities-optimized.js`, `src/style.css` et les anciens composants MySQL/Express de `nlp/database/` ont été traités dans des lots séparés. Le fichier actif `nlp/database/init-browser-sqlite.js` est conservé comme source de règles vivante. `memory/student-profile-unified.js` et `contexts/*.md` restent des sujets distincts dont la décision n'est pas tranchée.

## Bugs critiques
| ID | Résumé | Lieu |
|---|---|---|
| BUG-001 | Assistant d'écriture temps réel 100 % inerte (`writingAssistant` non défini) | index.html:5969+ |
| BUG-002 | `analyzeTextLocal` async appelé sans await → corrections vides dans le chat | main.js:215 |
| BUG-004 | Réponse Groq doublement parsée → suggestions IA toujours `[]` | nlp/groq-ai-analyzer.js:66,112,144 |
| BUG-003 | « Correcteur avancé » = no-op (arg ignoré + formats incompatibles) | nlp/advanced-text-corrector.js:22,148,149 |
| BUG-007 | Catégorie `grammaire` non mappée → règle du dernier commit possiblement droppée | nlp/spacy-analyzer.js:525-547 |
| SEC-001/002 | Clé Groq (2×) et token HF (6×) en dur dans un repo **public** ; token loggé en clair | groq-ai-analyzer.js:8, main.js:657, cloud-spacy-configured.js:2,8,256 |

## Blocages
Aucun blocage Git/technique dur. Deux incertitudes : (a) rien n'a été exécuté en navigateur lors de l'audit → « ce qui marche réellement » = `À TESTER` ; (b) déploiement inconnu (GitHub Pages non configurée, API `/pages` → 404).

## Dernière tâche réalisée
Commit `b0b7e52` : ajout du mode `activité` dans `runFourModelPipeline` (`main.js:672-682,733-741`) + bascule de la règle `genre_texte_masculin` en correction-fonction (`init-browser-sqlite.js:39-42`) + log de diagnostic (`database-integration.js:225-230`).

## Point exact d'arrêt
Séance de débogage nocturne du 21→22/03 : 12 commits entre 23:00 et 00:44, tous sur le même sous-système. Arrêt net après un `console.log` de debug — pas une livraison. Confiance **FORTE**.

## Prochaine tâche
Reproduire en navigateur : login étudiant → activité → répondre « la texte est important » → soumettre → lire les logs du diagnostic et l'état de `window.NLPRules.grammaire`. Confirmer BUG-007 avant toute correction.

## Fichiers concernés
`index.html` (HEAD ~9 600 l., scripts chargés en lignes 10-28), `main.js`, `nlp/database-integration.js`, `nlp/database/init-browser-sqlite.js`, `nlp/database-rules-manager.js`, `nlp/spacy-analyzer.js`, `nlp/groq-ai-analyzer.js`, `nlp/advanced-text-corrector.js`, `nlp/integrated-correction-system.js`.

## Tests à lancer
Aucun test automatisé n'existe. À créer en priorité (après réparation) : test unitaire du jeu de 274 règles ; test d'intégration `correctTextWithDatabase("la texte est important")` ⇒ ≥1 correction ; test `demanderIA` côté chat. Pages HTML de test héritées (`nlp/pipeline-*.html`, `test-spacy-proxy.html`) référencent des fichiers déplacés/supprimés → ne pas s'y fier.

## Commandes utiles
```bash
# Git (obligatoire sur cette machine)
git -c safe.directory=F:/Langue-Francaise <cmd>

# Servir l'app (aucun build nécessaire)
python -m http.server 8000        # NON VÉRIFIÉE par l'audit — À TESTER
# puis ouvrir http://localhost:8000/index.html

# Illisibles / non déployés (orphelins) :
#   nlp/database/server.js      → suppose MySQL local
#   nlp/python-server/app.py    → suppose pip install -r requirements.txt
```

## Décisions techniques importantes
- **Zéro backend Node** depuis `b79ea66` (05/03) : tout est censé tourner depuis le navigateur → la clé Groq a été mise en dur en consequence (`4026c4a`). Toute reprise doit assumer ou inverser cette décision.
- « spaCy » (fichier `spacy-analyzer.js`) = **émulation regex**, pas le vrai spaCy. Le vrai spaCy n'existe que dans `nlp/python-server/` (abandonné).
- **`nlp/auto-nlp-installer.js` — ABANDON ACTÉ** (décision du 2026-09-29, lot E-3H-b). Motifs factuels : composant **jamais consommé** (aucune référence à `window.AutoNLPInstaller` ni à son événement `nlp-installer-ready` dans tout le dépôt, vérifié sur HEAD et sur les branches distantes), **fonctionnalité incomplète/simulée** (stubs vides `downloadFile`/`executeInstaller`/`installSpacyModel`/`startLocalProxy`, `loadWasmModule()` renvoyant `{loaded:true}` en dur) et **cible locale supprimée** — `nlp/python-server/` a été retiré séparément par `7db0cbc`, laissant dans l'installer une référence pendante à `proxy-spacy-pro.py` (`nlp/auto-nlp-installer.js:184`). Cette décision porte **exclusivement** sur l'installer et sa balise `index.html:17` ; elle **ne remet pas en cause la chaîne NLP active** (`nlp/database-integration.js`, `nlp/spacy-analyzer.js`, les règles locales de `nlp/database/init-browser-sqlite.js`) et **ne statuie pas** sur `nlp/database/`. La suppression physique du fichier et de sa balise sera réalisée dans un **lot séparé** (à ce stade le fichier reste chargé au démarrage).
- « Browser SQLite » = `new Map()` (`init-browser-sqlite.js:14`). La vraie base MySQL (`nlp-rules.sql`, 30 règles) n'a jamais été initialisée ; la source vivante est le `Map` de 274 règles.
- Nettoyages majeurs déjà faits : `380b70a`/`bc0a522` (07/03), `f2b5fdd` (suppression dashboard), `5c3e719` (21/03, −365 l. de debug). Ne pas « re-découvrir » ces suppressions.
- ES5 imposé (commit `696d32a`) pour éviter les erreurs de syntaxe → ne pas réintroduire de template literals/ES6 dans les fichiers chargés.

## Points à ne pas casser
- **Ordre des `<script>` `index.html:18-26`** (commenté « ordre critique ») : `init-browser-sqlite` → `database-rules-manager` → `database-integration` → `groq-ai-analyzer` → `advanced-text-corrector` → `spacy-analyzer` → `integration-manager` → `integrated-correction-system` → `main.js`.
- Le cache-busting `?v=` : incrémenter **tous** les fichiers Modifiés ensemble, sinon versions incohérentes (pattern d'échec visible dans les derniers commits).
- Les définitions globales dupliquées (`selectModule` 5893/8766, `logout` 5864/9300, `login`, `showLoginError`) : la dernière définition gagne. Ne pas réordonner sans auditer.
- Le « script de secours » `index.html:9404-9425` force l'affichage de l'UI : le retirer **seulement après** avoir corrigé la restauration de session, sinon l'app paraîtra cassée.
- Les 274 règles de `init-browser-sqlite.js:3391` : ne pas régénérer ce fichier par un script (`migrate-from-js.js` est syntaxiquement mort et pointe des fichiers absents).

## Branches importantes
Aucune. `main` est la seule branche locale et distante ; `git log --all` = 299 commits identiques → **aucun travail perdu hors de main** (`VÉRIFIÉ`).

## Commits importants
| Commit | Date | Pourquoi |
|---|---|---|
| `f1fa493` / `1818c51` | 01/03 | Naissance + upload initial (9 456 l.) |
| `46de7ec` | 05/03 | Tuteur IA multi-agents RAG (avant repli) |
| `b79ea66` | 05/03 | Décision « GitHub Pages + Workers, sans Node » |
| `380b70a`, `bc0a522` | 07/03 | Grands nettoyages/fusions (chat, profils) |
| `9d09be6` | 07/03 | Migration « SPA CY » = regex remplace french-analyzer |
| `696d32a` | 07/03 | Conversion ES6→ES5 |
| `4026c4a` | 21/03 | « chat ckes » → clés/endpoint Groq en dur |
| `5c3e719` | 21/03 21:52 | −365 l. de debug ; `correction-integration-examples.js` déclaré OBSOLÈTE |
| `b0d43a3`,`7db7cc7`,`ca92d18` | 22/03 00:06-00:33 | +793 l. : `analyzeActivityAnswer` / `analyzeAndSubmitActivity` / `submitCorrectedActivity` |
| **`b0b7e52`** | **22/03 00:44** | **HEAD — point d'arrêt (debug règle grammaire)** |

## TODO prioritaires
1. Reproduire + diagnostiquer en navigateur (Étape 1 du plan, débloque tout).
2. Révoquer les clés Groq & HuggingFace exposées publiquement.
3. Réparer la chaîne de correction (BUG-002 → 004 → 003 → 007 → ARCH-001).
4. Écrire les premiers tests des 274 règles.
5. Trancher BUG-001 / TODO-001 (`writingAssistant`, `setupRealTimeCorrectionForChat`).
6. Nettoyage de vérité des noms + suppression des orphelins et du debug (BUG-006/008/009).
