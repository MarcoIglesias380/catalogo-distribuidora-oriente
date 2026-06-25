#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8000
URL="http://localhost:${PORT}/"
LOG_FILE="/tmp/catalogo-distribuidora-oriente.log"

cd "$PROJECT_DIR" || exit 1

if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 \
    >"$LOG_FILE" 2>&1 &

  for attempt in {1..20}; do
    if curl --silent --fail "$URL" >/dev/null 2>&1; then
      break
    fi
    sleep 0.15
  done
fi

open -a "Google Chrome" "$URL"
