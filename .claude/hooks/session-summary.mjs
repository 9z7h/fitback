// .claude/hooks/session-summary.mjs
// Stop hook: 세션 동안 Write/Edit한 파일이 3개 이상이면 _workspace/session_log.md에
// 날짜별 항목으로 append. 매 실행 후 스크래치 로그(.claude/.session-changes.log)는 비운다.
// 맥락 관리 개선 — _workspace/ 요약이 하네스를 안 탄 작업에서도 남도록.

import { existsSync, mkdirSync, readFileSync, unlinkSync, appendFileSync } from "fs";

const LOG_PATH = ".claude/.session-changes.log";
const OUT_DIR = "_workspace";
const OUT_PATH = `${OUT_DIR}/session_log.md`;
const MIN_FILES = 3;

if (!existsSync(LOG_PATH)) process.exit(0);

let files;
try {
  const raw = readFileSync(LOG_PATH, "utf8");
  files = [...new Set(raw.split("\n").map((l) => l.trim()).filter(Boolean))];
} catch {
  process.exit(0);
}

try {
  unlinkSync(LOG_PATH);
} catch {
  // 정리 실패는 무시
}

if (files.length < MIN_FILES) process.exit(0);

const now = new Date();
const date = now.toISOString().slice(0, 16).replace("T", " ");
const entry = [
  `## ${date} — 파일 ${files.length}개 변경`,
  ...files.map((f) => `- ${f}`),
  "",
].join("\n");

try {
  mkdirSync(OUT_DIR, { recursive: true });
  appendFileSync(OUT_PATH, `${entry}\n`);
} catch {
  // 요약 기록 실패는 조용히 무시 — 세션 종료를 막지 않는다.
}

process.exit(0);
