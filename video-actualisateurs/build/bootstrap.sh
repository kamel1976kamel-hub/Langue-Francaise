#!/usr/bin/env bash
# Bootstrap idempotent : ffmpeg statique + Pillow + reportlab + numpy dans ~/.cache.
set -uo pipefail
CACHE="${HOME}/.cache/video-actualisateurs"
PYLIBS="${CACHE}/pylibs"
BIN="${HOME}/.local/bin"
mkdir -p "${CACHE}" "${PYLIBS}" "${BIN}"
FF="$(ls "${PYLIBS}"/imageio_ffmpeg/binaries/ffmpeg-linux-* 2>/dev/null | head -1 || true)"
if [ -z "${FF}" ]; then
  echo "[bootstrap] installation d'ffmpeg statique…"
  pip3 install --quiet --target "${PYLIBS}" imageio-ffmpeg
  FF="$(ls "${PYLIBS}"/imageio_ffmpeg/binaries/ffmpeg-linux-* 2>/dev/null | head -1 || true)"
fi
if [ -n "${FF}" ]; then
  chmod +x "${FF}" 2>/dev/null || true
  ln -sf "${FF}" "${BIN}/ffmpeg"
  echo "[bootstrap] ffmpeg : $(${BIN}/ffmpeg -hide_banner -version 2>/dev/null | head -1)"
fi
for m in PIL reportlab numpy; do
  python3 -c "import ${m}" 2>/dev/null || pip3 install --quiet --target "${PYLIBS}" "${m,,}" >/dev/null 2>&1
done
export PYTHONPATH="${PYLIBS}${PYTHONPATH:+:${PYTHONPATH}}"
python3 -c "
import sys; sys.path.insert(0,'${PYLIBS}')
import PIL, reportlab, numpy
print('[bootstrap] Pillow', PIL.__version__, '| reportlab', reportlab.Version, '| numpy', numpy.__version__)
"
echo "[bootstrap] OK. export PYTHONPATH=${PYLIBS} ; export PATH=${BIN}:\$PATH"
