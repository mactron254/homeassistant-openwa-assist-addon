#!/usr/bin/env bash
set -euo pipefail

OPTIONS_FILE="/data/options.json"
OPENWA_DATA_DIR="/data/openwa"
BOT_DATA_DIR="/data/bot"
BOT_DIR="/opt/openwa-assist-bot"

read_option() {
  local key="$1"
  local default_value="$2"
  node "${BOT_DIR}/src/read-option.js" "${OPTIONS_FILE}" "${key}" "${default_value}"
}

cleanup() {
  echo "[OpenWA Assist] Stopping services..."
  if [ -n "${BOT_PID:-}" ]; then
    kill "${BOT_PID}" 2>/dev/null || true
  fi
  if [ -n "${PROXY_PID:-}" ]; then
    kill "${PROXY_PID}" 2>/dev/null || true
  fi
  if [ -n "${OPENWA_PID:-}" ]; then
    kill "${OPENWA_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

mkdir -p "${OPENWA_DATA_DIR}/sessions" "${OPENWA_DATA_DIR}/media" "${OPENWA_DATA_DIR}/plugins" "${OPENWA_DATA_DIR}/baileys"
mkdir -p "${BOT_DATA_DIR}/tmp"

if id openwa >/dev/null 2>&1; then
  chown -R openwa:openwa "${OPENWA_DATA_DIR}" "${BOT_DATA_DIR}"
fi

if [ ! -L "/app/data" ]; then
  mkdir -p /app
  rm -rf /app/data
  ln -s "${OPENWA_DATA_DIR}" /app/data
fi

API_MASTER_KEY="$(read_option api_master_key "")"
OPENWA_API_KEY="$(read_option openwa_api_key "")"
LOG_LEVEL="$(read_option log_level "info")"
ENGINE_TYPE="$(read_option engine_type "baileys")"

export NODE_ENV=production
export PORT=2787
export LOG_LEVEL="${LOG_LEVEL}"
export DATABASE_TYPE=sqlite
export DATABASE_NAME="/app/data/openwa.sqlite"
export DATABASE_SYNCHRONIZE=false
export MAIN_DATABASE_NAME="/app/data/main.sqlite"
export ENGINE_TYPE="${ENGINE_TYPE}"
export SESSION_DATA_PATH="/app/data/sessions"
export BAILEYS_AUTH_DIR="/app/data/baileys"
export PUPPETEER_HEADLESS=true
export PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu"
export STORAGE_TYPE=local
export STORAGE_LOCAL_PATH="/app/data/media"
export REDIS_ENABLED=false
export QUEUE_ENABLED=false
export WEBHOOK_TIMEOUT=10000
export WEBHOOK_MAX_RETRIES=3
export WEBHOOK_RETRY_DELAY=5000
export SSRF_ALLOWED_HOSTS="${SSRF_ALLOWED_HOSTS:-127.0.0.1,localhost}"
export BODY_SIZE_LIMIT="50mb"

if [ -n "${API_MASTER_KEY}" ]; then
  export API_MASTER_KEY
fi

if [ -n "${OPENWA_API_KEY}" ]; then
  export API_MASTER_KEY="${OPENWA_API_KEY}"
fi

echo "[OpenWA Assist] Starting OpenWA API on internal port 2787"
echo "[OpenWA Assist] Engine: ${ENGINE_TYPE}"
echo "[OpenWA Assist] Data: ${OPENWA_DATA_DIR}"

cd /app
/usr/local/bin/docker-entrypoint.sh node dist/main &
OPENWA_PID="$!"

echo "[OpenWA Assist] Waiting for OpenWA readiness..."
OPENWA_READY=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:2787/api/health/ready" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:2787/api/health" >/dev/null 2>&1; then
    echo "[OpenWA Assist] OpenWA is ready."
    OPENWA_READY=1
    break
  fi
  if ! kill -0 "${OPENWA_PID}" 2>/dev/null; then
    echo "[OpenWA Assist] OpenWA exited before ready."
    wait "${OPENWA_PID}" || true
    exit 1
  fi
  sleep 2
done

if [ "${OPENWA_READY}" != "1" ]; then
  echo "[OpenWA Assist] Timed out waiting for OpenWA readiness."
  wait "${OPENWA_PID}" || true
  exit 1
fi

echo "[OpenWA Assist] Starting helper on port 2786"
export OPENWA_BASE_URL="http://127.0.0.1:2787"
# Keep helper as root so it can read Home Assistant /data/options.json.
node "${BOT_DIR}/src/server.js" &
BOT_PID="$!"

echo "[OpenWA Assist] Starting OpenWA dashboard proxy on port 2785"
if command -v gosu >/dev/null 2>&1 && id openwa >/dev/null 2>&1; then
  gosu openwa node "${BOT_DIR}/src/openwa-dashboard-proxy.js" &
else
  node "${BOT_DIR}/src/openwa-dashboard-proxy.js" &
fi
PROXY_PID="$!"

wait -n "${OPENWA_PID}" "${BOT_PID}" "${PROXY_PID}"

