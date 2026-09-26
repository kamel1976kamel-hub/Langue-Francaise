# DEVELOPMENT LOG

> Journal de reprise. Une entrée par session de travail. Ne consigner que du vérifié ;
> marquer `DÉDUIT` / `NON VÉRIFIÉ` / `À TESTER` ce qui ne l'est pas.

## 2026-09-26 — Série ACTIONS 7-17 : restauration et sécurisation du moteur de correction

### Travail réalisé
- **A7** (`c14a0f3`) : restauration adaptée des 7 règles historiques perdues (contrat 1-argument, patterns restreints) ; 274→274 converties.
- **A8** (`c474c1a`) : audit des 47 corrections-fonctions ; 26 réparées/neutralisées, 10 bloquées documentées ; 0 règle perdue.
- **A9** (`91f34ee`) : oscillation de ponctuation éliminée (`espace_avant_point` / `espace_avant_ponctuation_double` : un signe = une autorité).
- **A10** (rapport) : audit des 26 anomalies restantes ; toutes classées données-réparables.
- **A11** (`0efdf1c`) : 26 anomalies corrigées en 4 lots (P1 corruptions, fantômes/doublons, casse, espace_avant_virgule ajoutée → 275 règles).
- **A12** (rapport) + **A13** (`7737735`) : audit puis neutralisation des 15 règles-conseils destructrices.
- **A14** (rapport) + **A15** (`2148613`) : `confusion_et_est` neutralisée + 4 gaps de casse couverts ; corruption `c_est_ce_sont` découverte et réparée en route.
- **A16** (rapport) : audit consolidé 55 entrées → 1 oscillation résiduelle découverte.
- **A17** (`dcab9ba`) : garde `(?!et\b)` sur `virgule_apres_cc` — oscillation virgule/et éliminée.
- Validations navigateur réelles à chaque action (`?v=` 46→53) ; harnais hors repo (sandbox Node VM + navigateur instrumenté).

### État final
- 275 source / 275 converties / 0 perdue ; 0 SyntaxError, 0 TypeError, 0 warning, 0 fantôme, 0 oscillation ; régressions A7-A16 vertes.
- **Push bloqué (403)** : identifiants locaux = `kamel1976`, sans écriture sur `kamel1976kamel-hub/Langue-Francaise` — 8 commits en attente de push.

## 2026-09-26 — Audit complet (lecture seule)

### Travail réalisé
- Audit Git exhaustif : 299 commits analysés (1er → 22 mars 2026), historique linéaire, 1 seule branche, aucun tag, aucune branche orpheline, `origin/main` synchronisé sur `b0b7e52`, worktree propre.
- Reconstitution chronologique en 7 phases et identification du point d'arrêt (confiance FORTE).
- Audit statique du front (`index.html` monolithe, `main.js`), des 9 modules NLP chargés, des modules orphelins, de la « base de données » et des 8 rapports d'archive.
- Analyse des diffs des 15 derniers commits (jusqu'au hunk près) pour dater la dernière intention de travail.
- Vérification croisée code ↔ rapports : les rapports `RAPPORT-IMPLEMENTATION-FLUIDITE/AVANCEES` revendiquent 12 modules **absents du repo** → documentation interne invalidée comme source de vérité.
- Production des livrables d'audit.

### Fichiers modifiés
- `AUDIT_COMPLET.md` (créé)
- `PROJECT_STATE.md` (créé)
- `DEVELOPMENT_LOG.md` (créé)
- Aucun fichier de code, de configuration ou de données touché.

### Problèmes rencontrés
- `git` en « dubious ownership » sur `F:/Langue-Francaise` (dossier propriété d'un autre SID) ; contourné en lecture par `git -c safe.directory=F:/Langue-Francaise …`, aucune config globale modifiée.
- Messages de commit quasi inutilisables (« changed », « change », « Update index.html ») → datation reconstruite via `--numstat` et horodatages, pas via les messages.
- Environnement de l'audit sans navigateur : « ce qui fonctionne réellement » n'a pas pu être observé (`À TESTER`).

### Décisions prises
- Traiter `init-browser-sqlite.js` (Map, 274 règles) comme la **seule** source de règles vivante ; classer MySQL (`nlp-rules.sql`) et `nlp/python-server/` comme abandonnés.
- Ne pas recommander de fusion/suppression de branche : il n'y a rien à fusionner.
- Ordonner le plan de reprise en exigeant l'observation navigateur **avant** toute correction, pour ne pas corriger des causes imaginées.

### Tests effectués
- Aucun (le projet ne contient aucun framework de test ; l'audit n'a rien exécuté).
- Vérifications par grep/lecture uniquement : absence de définition de `window.writingAssistant`, de `setupRealTimeCorrectionForChat`, de `configureAPIKey` ; async sans `await` (`main.js:215`) ; double parse Groq (`groq-ai-analyzer.js:66,112,144`).

### Résultats
- 10 bugs (BUG-001…010), 6 constats de sécurité (SEC-001…006), 1 risque d'architecture (ARCH-001), 1 UX, 1 test, 3 TODO documentés dans `AUDIT_COMPLET.md` §21.
- Point d'arrêt localisé au commit `b0b7e52`, fichiers : `index.html`, `main.js`, `nlp/database-integration.js`, `nlp/database/init-browser-sqlite.js`.
- GitHub Pages non configurée ; déploiement actuel inconnu (`NON VÉRIFIÉ`).

### Travail restant
- Étape 1 du plan de reprise : exécuter l'app et reproduire « la texte est important » dans une activité.
- Réparations BUG-002/004/003/007 + arbitrage ARCH-001, puis premiers tests, puis décision sur BUG-001.
- Révocation des clés Groq/HF exposées.

### Prochaine action
Servir le projet en local et ouvrir la console du navigateur sur le flux « réponse d'activité → `window.correctTextWithDatabase` », en vérifiant l'état de `window.NLPRules.grammaire`.
