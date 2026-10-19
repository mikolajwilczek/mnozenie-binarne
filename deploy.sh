#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

# Prywatny plik z przypisaniami zmiennych Bash; nie trafia do repozytorium.
if [[ -f .env.deploy.local ]]; then
  source .env.deploy.local
fi

: "${DEPLOY_HOST:?Ustaw DEPLOY_HOST w .env.deploy.local lub środowisku.}"
: "${DEPLOY_DIR:?Ustaw DEPLOY_DIR w .env.deploy.local lub środowisku.}"
: "${DEPLOY_URL:?Ustaw DEPLOY_URL w .env.deploy.local lub środowisku.}"

readonly deploy_host="$DEPLOY_HOST"
readonly deploy_dir="${DEPLOY_DIR%/}"
readonly deploy_url="$DEPLOY_URL"

# Ścieżka trafia też do zdalnej powłoki; nie dopuszczamy jej metaznaków,
# katalogu głównego ani segmentów . i .. przy synchronizacji z --delete.
if [[ ! "$deploy_host" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.@-]*$ ]]; then
  printf 'DEPLOY_HOST musi być nazwą hosta, aliasem SSH lub user@host.\n' >&2
  exit 1
fi
if [[ ! "$deploy_dir" =~ ^(/[a-zA-Z0-9_.-]+)+$ ]] || [[ "$deploy_dir/" == *'/../'* || "$deploy_dir/" == *'/./'* ]]; then
  printf 'DEPLOY_DIR musi być bezwzględną ścieżką katalogu aplikacji, bez spacji oraz segmentów "." i "..".\n' >&2
  exit 1
fi
if [[ ! "$deploy_url" =~ ^https?://[^[:space:]]+$ ]]; then
  printf 'DEPLOY_URL musi być adresem HTTP(S).\n' >&2
  exit 1
fi

for tool in node npm ssh rsync curl; do
  command -v "$tool" >/dev/null || { printf 'Brak narzędzia: %s\n' "$tool" >&2; exit 1; }
done

npm run build

ssh -o BatchMode=yes -o ConnectTimeout=15 "$deploy_host" \
  "sudo -n install -d -m 0755 '$deploy_dir'"

# Usuwanie starych plików obejmuje wyłącznie katalog tej aplikacji.
rsync -rltz --delete --delay-updates --chmod=D755,F644 \
  --rsync-path='sudo -n rsync' \
  -e 'ssh -o BatchMode=yes -o ConnectTimeout=15' \
  dist/ "$deploy_host:$deploy_dir/"

curl --fail --silent --show-error --retry 2 --output /dev/null "$deploy_url"
printf 'Wdrożono: %s\n' "$deploy_url"
