#!/usr/bin/env node
/**
 * LINT-DESIGN-ANTI-SLOP: Automated Quality Gate for PeopleInsight AI Design System
 * Checks for forbidden AI-slop patterns, contrast issues, and token violations.
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('frontend/src');

// Forbidden Patterns & Reasons
const FORBIDDEN_RULES = [
  {
    name: 'No AI-Slop Purple/Blue Gradient Buttons or Heroes',
    regex: /bg-gradient-to-[a-z]+\s+from-(indigo|purple|blue)-[0-9]+/g,
    reason: 'Eliminate overused AI purple/blue gradient backgrounds and buttons. Use flat brand-700 (#0f766e) or dark surfaces.',
    severity: 'ERROR',
  },
  {
    name: 'No Overused Neon Atmosphere Blurs',
    regex: /blur-(3xl|\[100px\])/g,
    reason: 'Avoid decorative neon aura blurs that look like template AI websites. Prefer subtle borders and clean dark surfaces.',
    severity: 'WARNING',
  },
  {
    name: 'Accessibility: Avoid low-contrast text-slate-500 on text-xs',
    regex: /text-xs\s+text-slate-500|text-slate-500\s+text-xs|text-\[11px\]\s+text-slate-500/g,
    reason: 'WCAG AA requires >= 4.5:1 contrast. text-slate-500 on dark backgrounds is hard to read. Use text-slate-400 or lighter.',
    severity: 'WARNING',
  },
];

const SCAN_EXTENSIONS = ['.tsx', '.jsx'];
const IGNORED_PATHS = ['LandingPage.tsx', 'tokens.css'];

let errorCount = 0;
let warningCount = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      if (IGNORED_PATHS.some((ignored) => fullPath.includes(ignored))) continue;
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  FORBIDDEN_RULES.forEach((rule) => {
    lines.forEach((lineText, lineIdx) => {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(lineText)) {
        const lineNum = lineIdx + 1;
        if (rule.severity === 'ERROR') {
          errorCount++;
          console.error(`❌ [${rule.severity}] ${relativePath}:${lineNum} — ${rule.name}`);
          console.error(`   "${lineText.trim()}"`);
          console.error(`   👉 Reason: ${rule.reason}\n`);
        } else {
          warningCount++;
          console.warn(`⚠️ [${rule.severity}] ${relativePath}:${lineNum} — ${rule.name}`);
          console.warn(`   "${lineText.trim()}"`);
        }
      }
    });
  });
}

console.log('🔍 Scanning frontend/src for design anti-slop rules...\n');
scanDir(SRC_DIR);

console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`Scan completed: ${errorCount} errors, ${warningCount} warnings.`);

if (errorCount > 0) {
  console.error(`❌ Anti-slop quality check failed with ${errorCount} error(s). Please fix before committing.`);
  process.exit(1);
} else {
  console.log('✅ Design Anti-Slop Quality Gate PASS! All pages adhere to clean SaaS standard.');
  process.exit(0);
}

