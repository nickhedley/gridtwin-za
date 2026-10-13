#!/bin/bash
# Build the scratch engine copy the single-node scripts run against: the repository at a given commit, unpacked to a new
# folder, with engine_hook.patch applied to index.html (a read-only hook: simulate() hands each hour's inputs and running
# costs to globalThis.__SNH and its constants to __SNC; nothing in the engine changes). No Eskom file is needed.
# usage: bash make_root.sh <repo dir> <commit> <out dir>      e.g. bash make_root.sh . fa7d8af /tmp/sn_root
set -euo pipefail
REPO=$1; COMMIT=$2; OUT=$3; HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT"; [ -z "$(ls -A "$OUT")" ] || { echo "$OUT is not empty"; exit 1; }
git -C "$REPO" archive "$COMMIT" | tar -x -C "$OUT"
patch -s "$OUT/index.html" < "$HERE/engine_hook.patch"
echo "root ready: $OUT (commit $COMMIT, hook applied)"
