#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

(
  cd "$DIR"
  DIST="$DIR/dist"
  rm -rf "$DIST"
  NODE_ENV=production node_modules/.bin/webpack --mode production || exit 1
  (
    cd "$DIST"
    tar -cvf - *
  ) | gzip --best > build.tar.gz

  echo
  echo Package size: $(bc <<< "scale=2; $(wc -c < build.tar.gz) / 1024")Kb
)
