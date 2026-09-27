#!/usr/bin/env bash
# restore.sh — relève après reset du sandbox (quand le remote est inaccessible).
# mirror/*.dat → build/*.py ; audio-keep/*.dat → audio/*.mp3
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p build audio
for f in mirror/*.py.dat; do
  [ -e "$f" ] || continue
  cp "$f" "build/$(basename "$f" .py.dat).py"
done
for f in audio-keep/*.dat; do
  [ -e "$f" ] || continue
  cp "$f" "audio/$(basename "$f" .dat).mp3"
done
echo "[restore] build/: $(ls build/*.py 2>/dev/null | wc -l) fichiers ; audio/: $(ls audio/*.mp3 2>/dev/null | wc -l) segments"
bash build/bootstrap.sh | tail -2
