// PostToolUse hook: 이번 Codex 세션에서 Write/Edit한 파일 경로를 누적한다.

import { appendFileSync, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";

const LOG_PATH = ".codex/.session-changes.log";

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
  // 추적 실패가 본 작업을 막지 않도록 조용히 종료한다.
}

process.exit(0);
