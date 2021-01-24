#!/bin/bash
# dependencies:
# - ffmpeg
# - imagemagick (convert)
# - imagemin + imagemin-mozjpeg
function process() {
  base=${1%.mp4}
  thumb="${base}-thumb.jpg"
  tempfile="${base}-thumb.tmp.png"
  tempfile2="${base}-thumb.tmp.jpg"
  ffmpeg \
      -y \
      -i "$1" \
      -ss 00:00:00.01 \
      -vframes 1 \
      -vf colorspace=all=bt709:iall=bt601-6-625:fast=1 \
      "$tempfile"
  convert "$tempfile" "$tempfile2"
  imagemin "$tempfile2" --plugin=mozjpeg > "$thumb"
  rm "$tempfile" "$tempfile2"
}

if [[ "$1" != "" ]]; then
  while [[ "$1" != "" ]]; do
    process "$1"
    shift
  done
else
  for f in app/**/*.mp4; do
    process "$f"
  done
fi