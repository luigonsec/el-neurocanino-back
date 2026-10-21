#!/usr/bin/env bash
# Caller holds /opt/neurocanino/deploy.lock. Used both by forced SSH and bootstrap.
set -euo pipefail
cd /opt/neurocanino
umask 077
component=${1:-}
sha=${2:-}
[[ "$component" =~ ^(frontend|backend)$ && "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 64
release="$PWD/releases/$component/$sha"
image="neurocanino/$component:$sha"
docker build --target runtime -t "$image" "$release"
[[ -f .images.env ]] || { echo 'Bootstrap both initial images before deploying.' >&2; exit 65; }
/usr/local/sbin/neurocanino-backup
previous=$(mktemp "$PWD/.previous.XXXXXXXX")
candidate=$(mktemp "$PWD/.candidate.XXXXXXXX")
cp .images.env "$previous"
cp .images.env "$candidate"
var=FRONTEND_IMAGE
[[ "$component" != backend ]] || var=BACKEND_IMAGE
sed -i "s|^${var}=.*|${var}=${image}|" "$candidate"
# Runtime configuration is owned by the backend repository.
if [[ "$component" == backend ]]; then
  docker compose --project-directory "$PWD" --env-file .env --env-file "$candidate" -f "$release/deploy/docker-compose.yml" config -q
  cp runtime/docker-compose.yml runtime/docker-compose.previous.yml
  cp runtime/Caddyfile runtime/Caddyfile.previous
  cp "$release/deploy/docker-compose.yml" runtime/docker-compose.yml
  cp "$release/deploy/Caddyfile" runtime/Caddyfile
fi
dc=(docker compose --project-directory "$PWD" --env-file .env --env-file "$candidate" -f runtime/docker-compose.yml)
rollback() {
  echo 'Deployment failed. Restoring previous container images; database is not downgraded.' >&2
  if [[ "$component" == backend && -f runtime/docker-compose.previous.yml ]]; then
    cp runtime/docker-compose.previous.yml runtime/docker-compose.yml
    cp runtime/Caddyfile.previous runtime/Caddyfile
  fi
  docker compose --project-directory "$PWD" --env-file .env --env-file "$previous" -f runtime/docker-compose.yml up -d --wait --wait-timeout 180 db backend frontend proxy || true
  rm -f "$candidate" "$previous"
}
trap rollback ERR
"${dc[@]}" up -d --wait --wait-timeout 180 db
if [[ "$component" == backend ]]; then "${dc[@]}" run --rm -T migrate; fi
"${dc[@]}" up -d --wait --wait-timeout 180 backend frontend proxy
"${dc[@]}" exec -T proxy caddy reload --config /etc/caddy/Caddyfile
curl --fail --silent --show-error --retry 5 --retry-delay 2 http://127.0.0.1/health/ > /dev/null
curl --fail --silent --show-error --retry 5 --retry-delay 2 http://127.0.0.1/api/v1/health > /dev/null
mv "$candidate" .images.env
rm -f "$previous"
trap - ERR
echo "Deployed $component $sha"
