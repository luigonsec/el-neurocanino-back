#!/usr/bin/env bash
# Forced SSH command: stdin is a git archive, the only accepted command is its SHA.
set -euo pipefail
component=${1:-}
sha=${SSH_ORIGINAL_COMMAND:-}
[[ "$component" =~ ^(frontend|backend)$ && "$sha" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid deployment command' >&2; exit 64; }
exec sudo -n /usr/local/sbin/neurocanino-receive "$component" "$sha"
