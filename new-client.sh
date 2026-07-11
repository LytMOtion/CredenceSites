#!/usr/bin/env bash
# ============================================================================
# new-client.sh — friendly wrapper to start a new Credence client site.
# It only scaffolds input files. It NEVER asks for passwords, bank details,
# or secret keys, and it never edits the master demonstrations.
#
# Interactive:      ./new-client.sh
# Non-interactive:  ./new-client.sh --system parkland --slug example-golf-club --name "Example Golf Club"
#   (the non-interactive form is what Claude / automation should use.)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

SYSTEM=""; SLUG=""; NAME=""
while [ $# -gt 0 ]; do
  case "$1" in
    --system) SYSTEM="${2:-}"; shift 2;;
    --slug)   SLUG="${2:-}"; shift 2;;
    --name)   NAME="${2:-}"; shift 2;;
    *) echo "Unknown option: $1"; exit 2;;
  esac
done

if [ -z "$SYSTEM" ]; then
  echo "Which Course System?"
  echo "  1) coastal   — landscape / destination"
  echo "  2) parkland  — established club"
  echo "  3) desert    — architectural resort"
  read -r -p "Enter 1, 2, or 3: " choice
  case "$choice" in
    1) SYSTEM="coastal";; 2) SYSTEM="parkland";; 3) SYSTEM="desert";;
    *) echo "Please choose 1, 2, or 3."; exit 1;;
  esac
fi

if [ -z "$SLUG" ]; then
  read -r -p "Client slug (lowercase, hyphens — e.g. pine-valley-club): " SLUG
fi

if [ -z "$NAME" ]; then
  read -r -p "Public course name (optional, press Enter to skip): " NAME || true
fi

echo ""
echo "Creating a $SYSTEM client called '$SLUG' (draft mode)…"
node client-system/scripts/create-client.mjs --system "$SYSTEM" --slug "$SLUG"

# Optionally pre-fill the public name so the first build shows it.
if [ -n "$NAME" ]; then
  node -e '
    const fs=require("fs"), p="client-work/"+process.argv[1]+"/client.json";
    const j=JSON.parse(fs.readFileSync(p,"utf8")); j.business.publicName=process.argv[2];
    fs.writeFileSync(p, JSON.stringify(j,null,2)+"\n");
  ' "$SLUG" "$NAME"
  echo "Set business.publicName = \"$NAME\""
fi

echo ""
echo "Done. Next:"
echo "  1. Edit client-work/$SLUG/client.json and content.json"
echo "  2. Add photos to client-work/$SLUG/images/ and logos to client-work/$SLUG/logos/"
echo "  3. npm run client:validate -- --client $SLUG"
echo "  4. npm run client:build    -- --client $SLUG"
echo "  5. npm run client:preview  -- --client $SLUG"
