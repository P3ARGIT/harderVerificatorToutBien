#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
sudo apt-get update
sudo apt-get install -y python3-venv python3-tk python3-numpy python3-scipy libportaudio2 mpv unzip curl
python3 -m venv --system-site-packages .venv
.venv/bin/pip install 'vosk==0.3.45' 'sounddevice==0.5.1'
if [ ! -d model ]; then
  curl --fail --location --retry 3 https://alphacephei.com/vosk/models/vosk-model-small-nl-0.22.zip -o model.zip
  unzip -q model.zip
  mv vosk-model-small-nl-0.22 model
  rm model.zip
fi
printf '\nInstallatie klaar. Lees README.md voor kalibratie en starten.\n'
