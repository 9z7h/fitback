#!/bin/bash
# FitBack 디자인 토큰 위반 후보를 grep으로 찾는다. 결과는 "위반 확정"이 아니라 "확인 필요 후보"다.
# 사용법: ./check-tokens.sh [git diff 대상 base, 기본 HEAD]
set -euo pipefail

base="${1:-HEAD}"
files=$(git diff --name-only "$base" -- '*.tsx' '*.ts' | grep -v '\.test\.' || true)

if [ -z "$files" ]; then
  echo "변경된 .ts/.tsx 파일 없음."
  exit 0
fi

echo "== raw hex 색상 리터럴 후보 =="
echo "$files" | xargs grep -nE "#[0-9A-Fa-f]{3,8}\b" 2>/dev/null | grep -v "theme.ts" || echo "(없음)"

echo
echo "== RN 기본 Text 사용 후보 (ThemedText 대신) =="
echo "$files" | xargs grep -nE "<Text[ >]" 2>/dev/null || echo "(없음)"

echo
echo "== Palette.profit / Palette.loss 사용처 (3중 표기 여부 수동 확인 필요) =="
echo "$files" | xargs grep -nE "Palette\.(profit|loss)" 2>/dev/null || echo "(없음)"

echo
echo "== 지오펜스 없는 방문 카운트 증가 후보 =="
echo "$files" | xargs grep -nE "(visits|checkIn|check_in).*(insert|update|\+\+|count \+=)" 2>/dev/null || echo "(없음)"
