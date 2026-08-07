// .claude/hooks/check-design-tokens.mjs
// PostToolUse hook: 하드코딩된 색상값 감지 → Claude에 피드백
// FitBack 규칙: 색은 src/constants/theme.ts의 Palette.* 만 사용 (CLAUDE.md 절대 규칙)

import { readFileSync } from "fs";
import { extname } from "path";

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

const ext = extname(filePath);
const skipPatterns = [".css", ".json", ".svg"];
const skipPaths = ["src/constants/theme.ts", ".test.", ".spec.", "node_modules", ".stories."];

if (skipPatterns.includes(ext)) process.exit(0);
if (skipPaths.some((p) => filePath.includes(p))) process.exit(0);
if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) process.exit(0);

let content;
try {
  content = readFileSync(filePath, "utf8");
} catch {
  process.exit(0);
}

const lines = content.split("\n");
const violations = [];

lines.forEach((line, i) => {
  const lineNum = i + 1;
  if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;

  if (/#[0-9a-fA-F]{3,8}\b/.test(line)) {
    violations.push(`L${lineNum}: ${line.trim()}`);
  }
  if (/(?:rgb|rgba|hsl)\(/.test(line)) {
    violations.push(`L${lineNum}: ${line.trim()}`);
  }
});

if (violations.length > 0) {
  const msg = violations.slice(0, 5).join(" | ");
  const output = {
    additionalContext: `⚠️ 하드코딩된 색상값 발견: ${filePath} — ${msg} → src/constants/theme.ts의 Palette.* 토큰을 사용하세요.`,
  };
  process.stdout.write(JSON.stringify(output));
}

process.exit(0);
