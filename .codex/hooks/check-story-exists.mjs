// .claude/hooks/check-story-exists.mjs
// PostToolUse hook: 컴포넌트에 .stories.tsx가 없으면 경고
// Node.js 기반이라 Windows/macOS/Linux 모두 동작

import { existsSync, readFileSync } from "fs";
import { dirname, basename, join } from "path";

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

// src/components/ 하위의 .tsx만 대상
if (!filePath.match(/^src[\\/]components[\\/].*\.tsx$/)) process.exit(0);

if (/\.(stories|test|spec)\.tsx$/.test(filePath)) process.exit(0);
if (/index\.ts/.test(filePath)) process.exit(0);

const dir = dirname(filePath);
const name = basename(filePath, ".tsx");
const storyFile = join(dir, `${name}.stories.tsx`);

if (!existsSync(storyFile)) {
  const output = {
    additionalContext: `⚠️ Story 파일 누락: ${storyFile} — 컴포넌트와 함께 .stories.tsx를 생성하는 걸 권장합니다.`,
  };
  process.stdout.write(JSON.stringify(output));
}

process.exit(0);
