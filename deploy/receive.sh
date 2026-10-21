#!/usr/bin/env bash
set -euo pipefail
component=${1:-}
sha=${2:-}
[[ "$component" =~ ^(frontend|backend)$ && "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 64
root=/opt/neurocanino
umask 077
exec 9>"$root/deploy.lock"
flock -w 1800 9
mkdir -p "$root/releases/$component"
tmp=$(mktemp -d "$root/releases/$component/.incoming.XXXXXXXX")
trap 'rm -rf "$tmp"' EXIT
python3 -c '
import sys,tarfile,pathlib
root=pathlib.Path(sys.argv[1]); archive=root/"source.tar"
with archive.open("wb") as f:
    size=0
    while chunk:=sys.stdin.buffer.read(1024*1024):
        size+=len(chunk)
        if size>150*1024*1024: raise SystemExit("Archive exceeds 150 MiB")
        f.write(chunk)
with tarfile.open(archive) as t:
    for m in t.getmembers():
        p=pathlib.PurePosixPath(m.name)
        if p.is_absolute() or ".." in p.parts or m.issym() or m.islnk() or not (m.isfile() or m.isdir()):
            raise SystemExit("Unsafe archive member")
    t.extractall(root,filter="data")
archive.unlink()
' "$tmp"
[[ -f "$tmp/Dockerfile" && -f "$tmp/pnpm-lock.yaml" ]] || exit 65
if [[ ! -d "$root/releases/$component/$sha" ]]; then mv "$tmp" "$root/releases/$component/$sha"; else rm -rf "$tmp"; fi
exec /usr/local/sbin/neurocanino-deploy "$component" "$sha"
