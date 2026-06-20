#!/bin/bash
# Legacy wrapper — use scripts/migrate-prod-to-city-tools.sh fix instead.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/migrate-prod-to-city-tools.sh" fix
