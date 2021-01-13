#!/bin/sh

# TODO:
# video conversion / format unification
# https://gist.github.com/Vestride/278e13915894821e1d6f

# dependencies:
# - ffmpeg
# - optipng
# - pngquant
for f in app/**/*.mp4; do
  base=${f%.mp4}
  thumb="${base}-thumb.png"
  tempfile="${base}-thumb.tmp.png"
  ffmpeg -y -i "$f" -ss 00:00:00.01  -vframes 1 "$tempfile"
  optipng "$tempfile"
  pngquant --force "$tempfile" --output "$thumb"
  rm "$tempfile"
done