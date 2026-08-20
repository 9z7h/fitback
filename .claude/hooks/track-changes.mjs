// .claude/hooks/track-changes.mjs
// PostToolUse hook: 이번 세션에서 Write/Edit한 파일 경로를 스크래치 로그에 누적.
// Stop 훅(session-summary.mjs)이 이 로그를 읽어 세션 요약을 남기고 비운다.

import { appendFileSync, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";

const LOG_PATH = ".claude/.session-changes.log";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath = data?.tool_input?.file_path ?? "";
if (!filePath) process.exit(0);

try {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  appendFileSync(LOG_PATH, `${filePath}\n`);
} catch {
  // 로그 실패는 조용히 무시 — 본 작업을 막지 않는다.
}

process.exit(0);
