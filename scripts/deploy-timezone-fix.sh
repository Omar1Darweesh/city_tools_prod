#!/bin/bash
# Run ON THE SERVER inside /root/city-tools after copying updated source files
set -euo pipefail

ROOT="/root/city-tools"

echo "==> Building backend..."
cd "$ROOT/backend"
npm run build
pm2 restart citytools-backend-city-tools

echo "==> Building backoffice..."
cd "$ROOT/backoffice"
npm run build

echo "==> Done. Hard-refresh browser (Ctrl+Shift+R)."
