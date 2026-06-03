#!/usr/bin/env bash
# Open every RehabBridge route for Figma html-to-design capture.
#
# Usage (needs one capture ID per page from Figma MCP generate_figma_design):
#   export FIGMA_FILE_KEY=RspAOoTwAbWf6FEzrlNoRw
#   ./scripts/figma-capture-all-routes.sh <capture-id> <path>
#   ./scripts/figma-capture-all-routes.sh 3b6532e3-0693-491e-883f-6cf0f4cf0a25 /patient
#
# Batch: put capture IDs in scripts/figma-capture-ids.env (see figma-capture-ids.env.example)
#   source scripts/figma-capture-ids.env && ./scripts/figma-capture-all-routes.sh --batch
#
# Manual (no IDs): opens routes in browser for visual check only
#   ./scripts/figma-capture-all-routes.sh --preview

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="${REHAB_BASE_URL:-http://localhost:5173}"
DELAY_MS="${FIGMA_CAPTURE_DELAY_MS:-3500}"

ENDPOINT_TEMPLATE='https://mcp.figma.com/mcp/capture/%s/submit'
ENCODED_ENDPOINT_TEMPLATE='https%%3A%%2F%%2Fmcp.figma.com%%2F%%mcp%%2Fcapture%%2F%s%%2Fsubmit'

open_capture() {
  local capture_id="$1"
  local path="$2"
  local encoded
  encoded=$(printf "$ENCODED_ENDPOINT_TEMPLATE" "$capture_id")
  local url="${BASE_URL}${path}#figmacapture=${capture_id}&figmaendpoint=${encoded}&figmadelay=${DELAY_MS}"
  echo "→ $path (capture ${capture_id:0:8}…)"
  if [[ "$(uname)" == "Darwin" ]]; then
    open "$url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url"
  else
    echo "  $url"
  fi
}

open_preview() {
  local path="$1"
  echo "→ $path"
  if [[ "$(uname)" == "Darwin" ]]; then
    open "${BASE_URL}${path}"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${BASE_URL}${path}"
  else
    echo "  ${BASE_URL}${path}"
  fi
}

ensure_dev_server() {
  if curl -sf -o /dev/null "${BASE_URL}/" 2>/dev/null; then
    echo "Dev server OK: ${BASE_URL}"
    return 0
  fi
  echo "Starting dev server in ${ROOT}…"
  (cd "$ROOT" && npm run dev) &
  local i=0
  while ! curl -sf -o /dev/null "${BASE_URL}/" 2>/dev/null; do
    sleep 1
    i=$((i + 1))
    if [[ $i -gt 60 ]]; then
      echo "Timeout waiting for ${BASE_URL}" >&2
      exit 1
    fi
  done
  echo "Dev server ready."
}

inject_capture_script() {
  local html="${ROOT}/index.html"
  if grep -q 'html-to-design/capture.js' "$html"; then
    return 0
  fi
  echo "Adding Figma capture script to index.html (remove after capture if desired)."
  sed -i.bak 's|<title>RehabBridge</title>|<title>RehabBridge</title>\n      <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>|' "$html"
}

# All app routes (static paths + one representative dynamic URL each)
declare -a ROUTES=(
  "/"
  "/patient"
  "/patient/rehab/knee_flexion"
  "/patient/guided/RX023"
  "/family"
  "/doctor"
  "/blueprint"
)

if [[ "${1:-}" == "--preview" ]]; then
  ensure_dev_server
  for path in "${ROUTES[@]}"; do
    open_preview "$path"
    sleep 2
  done
  echo "Done. Preview only — no Figma upload."
  exit 0
fi

if [[ "${1:-}" == "--batch" ]]; then
  ENV_FILE="${ROOT}/scripts/figma-capture-ids.env"
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE — copy from figma-capture-ids.env.example" >&2
    exit 1
  fi
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  ensure_dev_server
  inject_capture_script
  open_capture "${CAPTURE_ROOT:-}" "/"
  sleep 3
  open_capture "${CAPTURE_PATIENT:-}" "/patient"
  sleep 3
  open_capture "${CAPTURE_REHAB:-}" "/patient/rehab/knee_flexion"
  sleep 3
  open_capture "${CAPTURE_GUIDED:-}" "/patient/guided/RX023"
  sleep 3
  open_capture "${CAPTURE_FAMILY:-}" "/family"
  sleep 3
  open_capture "${CAPTURE_DOCTOR:-}" "/doctor"
  sleep 3
  open_capture "${CAPTURE_BLUEPRINT:-}" "/blueprint"
  echo "Batch open complete. Poll each captureId in Cursor/Figma MCP until status=completed."
  exit 0
fi

if [[ $# -lt 2 ]]; then
  cat <<'EOF'
RehabBridge — capture all routes into Figma file RspAOoTwAbWf6FEzrlNoRw

Routes:
  /                          角色選擇
  /patient                   長者首頁
  /patient/rehab/knee_flexion 角度訓練（範例）
  /patient/guided/RX023      引導式訓練（計時/手動）
  /family                    家屬端
  /doctor                    醫師端
  /blueprint                 開發藍圖

Examples:
  ./scripts/figma-capture-all-routes.sh --preview
  ./scripts/figma-capture-all-routes.sh <capture-uuid> /doctor

For all pages at once, use figma-capture-ids.env + --batch (7 capture IDs from MCP).
EOF
  exit 1
fi

ensure_dev_server
inject_capture_script
open_capture "$1" "$2"
echo "Opened. Wait ~${DELAY_MS}ms, then poll MCP: fileKey=RspAOoTwAbWf6FEzrlNoRw captureId=$1"
