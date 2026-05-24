#!/usr/bin/env bash
# Build (if needed) and start XytherQL API + UI

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT/.run"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOG_DIR="$ROOT/.run/logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

# Stop anything already on our ports
"$ROOT/scripts/kill.sh"

echo ""
echo "=== XytherQL — starting services ==="
echo ""

# --- Backend ---
if [ ! -d "$BACKEND/.venv" ]; then
  echo "Creating Python venv..."
  python3 -m venv "$BACKEND/.venv"
  "$BACKEND/.venv/bin/pip" install -q -r "$BACKEND/requirements.txt"
fi

echo "Starting API on http://127.0.0.1:8000"
(
  cd "$BACKEND"
  exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
) >>"$LOG_DIR/api.log" 2>&1 &
echo $! >"$PID_DIR/api.pid"

# --- Frontend ---
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND" && npm install)
fi

if [ ! -f "$FRONTEND/.next/BUILD_ID" ]; then
  echo "Building frontend..."
  (cd "$FRONTEND" && npm run build)
fi

if [ ! -f "$FRONTEND/.env.local" ]; then
  cp "$FRONTEND/.env.local.example" "$FRONTEND/.env.local" 2>/dev/null || \
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >"$FRONTEND/.env.local"
fi

echo "Starting UI on http://127.0.0.1:3000"
(
  cd "$FRONTEND"
  exec npm start -- --hostname 127.0.0.1 --port 3000
) >>"$LOG_DIR/web.log" 2>&1 &
echo $! >"$PID_DIR/web.pid"

# Wait for health
echo ""
echo "Waiting for services..."
for i in $(seq 1 30); do
  api_ok=0
  web_ok=0
  curl -sf http://127.0.0.1:8000/api/health >/dev/null 2>&1 && api_ok=1
  curl -sf -o /dev/null http://127.0.0.1:3000/ 2>/dev/null && web_ok=1
  if [ "$api_ok" = 1 ] && [ "$web_ok" = 1 ]; then
    echo ""
    echo "XytherQL is ready."
    echo "  UI:  http://localhost:3000"
    echo "  API: http://localhost:8000"
    echo "  Logs: $LOG_DIR/"
    echo ""
    echo "Stop with: ./scripts/kill.sh"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for services. Check logs:"
echo "  tail -f $LOG_DIR/api.log"
echo "  tail -f $LOG_DIR/web.log"
exit 1
