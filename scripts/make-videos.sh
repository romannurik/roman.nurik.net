#!/bin/sh
# https://gist.github.com/Vestride/278e13915894821e1d6f
# dependencies:
# - ffmpeg

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

while [[ "$1" != "" ]]; do
  in="$1"
  base=$(basename "$1")
  base=${base/.*/}

  ffmpeg \
      -y -an \
      -i "$in" \
      -vcodec h264 \
      -r 60 \
      -pix_fmt yuv420p \
      -profile:v baseline -level 3 -strict -2 \
      "${SCRIPT_DIR}/../app/media/${base}.mp4"

  $SCRIPT_DIR/make-thumbs.sh "${SCRIPT_DIR}/../app/media/${base}.mp4"
  echo "Wrote ${base}.mp4"
  shift
done