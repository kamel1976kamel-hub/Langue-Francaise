# PROTOCOLE DE PRODUCTION — « Les actualisateurs du substantif »

Convenu le 2026-09-27 avec l'enseignant, après deux resets du sandbox.

## 1. Sauvegarde (commit par artefact)
- **Après chaque segment audio généré** : vérification (`verify.py`) → copie de
  secours `audio-keep/segNN.dat` → `git commit` → `git push origin
  arena/01a0e194-langue-francaise`. Jamais regroupé en fin de tour.
- **Après chaque fichier de scène / moteur écrit** : commit + push immédiats,
  ET copie miroir `mirror/<nom>.py.dat` (les `.py` ont déjà été perdus dans un
  reset, les `.dat`/`.md`/`.png` ont toujours survécu).
- Restauration après reset :
  `git fetch origin arena/01a0e194-langue-francaise && git checkout FETCH_INDEX -- video-actualisateurs`
  ou, si le remote est inaccessible : `build/restore.sh` (recopie `mirror/*.dat`
  → `build/*.py` et `audio-keep/*.dat` → `audio/*.mp3`).

## 2. Vérification avant annonce
- Aucun livrable annoncé sans sortie `verify.py` : taille en octets, durée,
  codecs/streams (mp4/m4a/mp3/wav), dimensions (png), pages (pdf).
- Le build statique ne fournit pas de binaire `ffprobe` séparé : `verify.py`
  extrait les mêmes champs via `ffmpeg -i` (libavformat identique). Si une
  vérification est impossible, le dire explicitement au lieu d'annoncer.

## 3. Rendu MP4 — plan B (découpé / rejouable / parallèle)
- **Machine** : locale, dans le sandbox Arena (conteneur Linux, 2 cœurs CPU,
  3 Gio RAM). Aucun rendu distant. ffmpeg statique + Pillow.
- **Découpage** : chaque scène = un chunk `out/parts/part_NN_sid.mp4` (coupes
  propres aux frontières de scènes). `render.py --resume` saute les chunks déjà
  présents ET valides (durée vérifiée à ±0,25 s).
- **Si un processus est tué** : seul le chunk en cours est perdu ; on relance
  `render.py --resume`, qui reprend au chunk manquant. L'assemblage final
  (`render.py --concat` puis `mix.py`) est en copy-stream : quelques secondes.
- **Parallélisme** : `render.py --worker k n` rend les chunks idx ≡ k [n] ;
  2 workers sur les 2 cœurs.
- **Exécution** : chunks lancés par appels `bash` (timeout jusqu'à 30 min par
  appel) ou `start_process` supervisé ; le rendu complet tient dans un seul
  tour grâce au parallélisme ; sinon reprise au tour suivant sans rien perdre
  (les chunks sont copiés dans `parts-keep/` commité si le tour doit s'arrêter).

## 4. Chaîne
`bootstrap.sh` → `timeline.py` (durées réelles / ATEMPO 1.12) →
`render.py` (chunks) → `mix.py` (voix placée + chapitres) → `verify.py`.
