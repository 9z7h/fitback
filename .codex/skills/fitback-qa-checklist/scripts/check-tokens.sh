#!/bin/bash
set -euo pipefail

base="${1:-HEAD}"
files=$(git diff --name-only "$base" -- '*.tsx' '*.ts' | grep -v '\.test\.' || true)

if [ -z "$files" ]; then
  echo "변경된 .ts/.tsx 파일 없음."
  exit 0
fi

echo "== raw hex 색상 리터럴 후보 =="
echo "$files" | xargs grep -nE "#[0-9A-Fa-f]{3,8}\b" 2>/dev/null | grep -v "theme.ts" || echo "(없음)"
echo "== RN 기본 Text 사용 후보 =="
echo "$files" | xargs grep -nE "<Text[ >]" 2>/dev/null || echo "(없음)"
echo "== Palette.profit / Palette.loss 사용처 =="
echo "$files" | xargs grep -nE "Palette\.(profit|loss)" 2>/dev/null || echo "(없음)"
echo "== 방문 카운트 변경 후보 =="
echo "$files" | xargs grep -nE "(visits|checkIn|check_in).*(insert|update|\+\+|count \+=)" 2>/dev/null || echo "(없음)"
