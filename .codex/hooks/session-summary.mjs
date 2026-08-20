// Stop hook: 변경 파일이 3개 이상이면 _workspace/session_log.md에 요약한다.

import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";

const LOG_PATH = ".codex/.session-changes.log";
const OUT_DIR = "_workspace";
const OUT_PATH = `${OUT_DIR}/session_log.md`;
const MIN_FILES = 3;

if (!existsSync(LOG_PATH)) process.exit(0);

let files;
try {
  const raw = readFileSync(LOG_PATH, "utf8");
  files = [...new Set(raw.split("\n").map((line) => line.trim()).filter(Boolean))];
} catch {
  process.exit(0);
}

try {
  unlinkSync(LOG_PATH);
} catch {
  // 정리 실패는 무시한다.
}

if (files.length < MIN_FILES) process.exit(0);

const now = new Date();
const date = now.toISOString().slice(0, 16).replace("T", " ");
const entry = [
  `## ${date} — 파일 ${files.length}개 변경`,
  ...files.map((file) => `- ${file}`),
  "",
].join("\n");

try {
  mkdirSync(OUT_DIR, { recursive: true });
  appendFileSync(OUT_PATH, `${entry}\n`);
} catch {
  // 요약 실패가 세션 종료를 막지 않도록 조용히 종료한다.
}

process.exit(0);
