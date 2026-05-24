#!/usr/bin/env bash
# Stop XytherQL API (8000) and UI (3000)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT/.run"

echo "Stopping XytherQL..."

for port in 8000 3000; do
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing process(es) on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
  else
    echo "  Port $port: nothing running"
  fi
done

if [ -d "$PID_DIR" ]; then
  for f in "$PID_DIR"/*.pid; do
    [ -f "$f" ] || continue
    pid=$(cat "$f")
    if kill -0 "$pid" 2>/dev/null; then
      echo "  Killing PID $pid ($(basename "$f" .pid))"
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  done
fi

echo "Done."
