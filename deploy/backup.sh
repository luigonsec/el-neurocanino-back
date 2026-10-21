#!/usr/bin/env bash
set -euo pipefail
cd /opt/neurocanino
umask 077
[[ -f .images.env ]] || exit 0
dc=(docker compose --project-directory "$PWD" --env-file .env --env-file .images.env -f runtime/docker-compose.yml)
"${dc[@]}" ps --status running --services | grep -qx db || exit 0
folder=/var/backups/neurocanino/$(date -u +%Y%m%dT%H%M%S)-$$
mkdir -p "$folder"
"${dc[@]}" exec -T db sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --no-tablespaces "$MYSQL_DATABASE"' | gzip > "$folder/database.sql.gz"
"${dc[@]}" run --rm --no-deps -T --user root --entrypoint tar backend -C /data -czf - uploads > "$folder/uploads.tar.gz"
cp .images.env "$folder/images.env"
cp .env "$folder/environment.env"
find /var/backups/neurocanino -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
echo "Backup created: $folder"
