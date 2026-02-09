#!/bin/bash
# Pre-push quality gate — blocks push if critical checks fail
set -e

echo ""
echo "══════════════════════════════════════════"
echo "  Pulse Labs — Pre-push Quality Gate"
echo "══════════════════════════════════════════"
echo ""

# 1. TypeScript type check (HARD GATE)
echo "▶ [1/3] TypeScript type check..."
npx tsc --noEmit
echo "  ✓ Types OK"
echo ""

# 2. ESLint (soft — warn only, don't block)
echo "▶ [2/3] ESLint (warnings only)..."
npx eslint --quiet . || echo "  ⚠ Lint issues found (non-blocking)"
echo ""

# 3. Playwright public tests (HARD GATE)
echo "▶ [3/3] UAT tests..."
npx playwright test home login participation --reporter=list
echo "  ✓ Tests OK"
echo ""

echo "══════════════════════════════════════════"
echo "  ✓ All checks passed — pushing"
echo "══════════════════════════════════════════"
echo ""
