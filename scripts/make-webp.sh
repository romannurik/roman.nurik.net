#!/bin/bash
# dependencies:
# - cwebp (https://developers.google.com/speed/webp/download)

function process() {
  base=${1%.png}
  webp="${base}.webp"
  cwebp "$1" -o "$webp"
}

if [[ "$1" != "" ]]; then
  while [[ "$1" != "" ]]; do
    process "$1"
    shift
  done
else
  for f in app/media/*.png; do
    process "$f"
  done
fi