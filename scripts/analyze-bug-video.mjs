/**
 * analyze-bug-video.mjs
 *
 * Uploads bug-video.mov to Gemini Files API, waits for processing,
 * then runs a detailed visual-bug analysis via Gemini.
 *
 * Usage:
 *   node scripts/analyze-bug-video.mjs
 *   node scripts/analyze-bug-video.mjs --file files/zhfr429x6sag   # reuse uploaded file
 */

import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ──────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '../.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('GEMINI_API_KEY missing from .env'); process.exit(1); }

const ai = new GoogleGenAI({ apiKey: API_KEY });
// Try these in order until one succeeds (503 = transient overload, retried per model)
const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash'];

// ── Reuse an already-uploaded file if --file <name> is passed ─────────────
const reuseArg = process.argv.indexOf('--file');
let file;

if (reuseArg !== -1 && process.argv[reuseArg + 1]) {
  const name = process.argv[reuseArg + 1];
  console.log(`Reusing uploaded file: ${name}`);
  file = await ai.files.get({ name });
  console.log(`State: ${file.state}`);
} else {
  // ── Upload ───────────────────────────────────────────────────────────────
  const VIDEO_PATH = resolve(__dirname, '../public/bug-video.mov');
  console.log(`Uploading ${VIDEO_PATH} ...`);
  file = await ai.files.upload({
    file: VIDEO_PATH,
    config: { mimeType: 'video/quicktime', displayName: 'hoppytech-bug-video' },
  });
  console.log(`Uploaded → name: ${file.name}  state: ${file.state}`);

  // ── Poll until ACTIVE ────────────────────────────────────────────────────
  while (file.state === 'PROCESSING') {
    process.stdout.write('  Processing...');
    await new Promise(r => setTimeout(r, 6000));
    file = await ai.files.get({ name: file.name });
    console.log(` state: ${file.state}`);
  }

  if (file.state === 'FAILED') {
    console.error('Video processing FAILED:', file.error ?? '(no details)');
    process.exit(1);
  }
}

console.log(`\nFile URI: ${file.uri}\n`);

// ── Analyse ────────────────────────────────────────────────────────────────
const PROMPT = `You are a senior front-end engineer doing a visual bug investigation.
Watch this screen-recording carefully and provide a thorough technical report covering:

1. **What you see** – describe every visual artifact, flicker, glitch, or rendering anomaly in detail.
2. **Mouse behaviour** – note any cursor issues: lag, offset, jitter, invisible cursor, wrong pointer type, incorrect hit-testing, or events firing on wrong elements.
3. **Trigger / timing** – when do the artifacts occur? On page load, scroll, hover, click, always, intermittently?
4. **Affected elements** – which specific UI elements are impacted? Whole viewport, a layer, a specific component, a z-index level?
5. **Severity & pattern** – does the glitch spread, is it periodic, does it compound over time?
6. **Root-cause hypotheses** – based on what you observe, list the most likely CSS/JS/browser-compositor causes in priority order. Consider: stacking-context bugs, transform/will-change GPU layer promotion, backdrop-filter, overflow:hidden on transformed elements, fixed-position compositing, pointer-events misconfiguration, infinite animation loops, requestAnimationFrame leaks, scroll event handlers, Framer Motion animation conflicts, z-index / isolation issues.
7. **Specific reproduction steps** – what must a developer do to trigger the bug?
8. **Recommended fixes** – ordered by likelihood, with specific CSS properties or JS patterns to investigate.

Be precise and technical. Your report feeds directly to an engineer who will fix the code.`;

const contents = [
  {
    role: 'user',
    parts: [
      { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
      { text: PROMPT },
    ],
  },
];

let response, MODEL;
for (const m of MODELS) {
  MODEL = m;
  try {
    console.log(`Trying model: ${m} ...`);
    response = await ai.models.generateContent({
      model: m,
      contents,
      config: { maxOutputTokens: 4096, temperature: 0.2 },
    });
    console.log(`Success with ${m}\n`);
    break;
  } catch (err) {
    const code = err.status ?? 0;
    if (code === 503 || code === 429) {
      // Transient overload — wait then try next model
      console.warn(`  ${m} overloaded (${code}), waiting 12s then trying next...`);
      await new Promise(r => setTimeout(r, 12000));
      continue;
    }
    if (code === 404 || code === 400) {
      console.warn(`  ${m} not available (${code}), trying next model`);
      continue;
    }
    throw err;
  }
}

if (!response) {
  console.error('All models failed. Try again later.');
  process.exit(1);
}

const report = response.text ?? '(no response text)';

// ── Print & save ───────────────────────────────────────────────────────────
console.log('═'.repeat(70));
console.log(`BUG ANALYSIS REPORT  (${MODEL})`);
console.log('═'.repeat(70));
console.log(report);
console.log('═'.repeat(70));
console.log(`\nHint: to re-run without re-uploading:\n  node scripts/analyze-bug-video.mjs --file ${file.name}`);

const outPath = resolve(__dirname, '../bug-report.txt');
writeFileSync(outPath, `Model: ${MODEL}\nFile: ${file.name}\n\n${report}`, 'utf-8');
console.log(`\nReport saved → ${outPath}`);
