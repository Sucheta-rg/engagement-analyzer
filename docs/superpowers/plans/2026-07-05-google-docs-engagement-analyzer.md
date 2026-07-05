# Google Docs Engagement Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Manifest V3 Chrome extension that opens a Google Docs-only side panel, reads the active Google Doc with read-only OAuth, and locally scores writing for engagement, rhythm, predictability, structure, specificity, and voice issues.

**Architecture:** Use a no-build vanilla JavaScript extension so the project can be loaded directly through `chrome://extensions`. Keep Chrome API code, Google Docs API code, text extraction, and analysis logic in separate ES modules. Use Node's built-in `node:test` runner for deterministic local modules.

**Tech Stack:** Chrome Extension Manifest V3, Chrome Side Panel API, Chrome Identity API, Google Docs REST API, vanilla ES modules, Node built-in tests.

---

## File Structure

- Create `package.json`: project metadata and `npm test` command using Node's built-in test runner.
- Create `README.md`: setup, Google OAuth configuration, local loading, testing, and privacy notes.
- Create `manifest.json`: MV3 extension configuration, side panel, service worker, `identity`, `sidePanel`, `tabs`, host permissions, and read-only Docs OAuth scope.
- Create `src/background.js`: enables the side panel only on Google Docs document URLs and opens the panel from the action icon.
- Create `src/sidepanel.html`: side panel shell.
- Create `src/sidepanel.css`: compact professional panel styling.
- Create `src/sidepanel.js`: UI controller that loads the active tab, fetches the doc, runs analysis, and renders results.
- Create `src/lib/document-id.js`: extracts Google document IDs from Docs URLs.
- Create `src/lib/docs-api.js`: gets Chrome OAuth token and calls Google Docs `documents.get`.
- Create `src/lib/docs-text.js`: converts Google Docs API document JSON into typed text blocks.
- Create `src/lib/analyzer.js`: local writing-quality heuristics.
- Create `src/lib/score.js`: shared score helpers.
- Create `tests/document-id.test.js`: URL parsing tests.
- Create `tests/docs-text.test.js`: Docs JSON extraction tests.
- Create `tests/analyzer.test.js`: analyzer scoring tests.
- Create `docs/google-oauth-setup.md`: OAuth client setup steps for Chrome extension testing.
- Create `docs/privacy.md`: plain-language privacy notes for testing and future Chrome Web Store listing.

---

### Task 1: Project Shell And Manifest

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `manifest.json`
- Create: `docs/google-oauth-setup.md`
- Create: `docs/privacy.md`

- [ ] **Step 1: Create project metadata**

Create `package.json`:

```json
{
  "name": "engagement-analyzer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Google Docs side panel extension for local engagement and readability analysis.",
  "scripts": {
    "test": "node --test tests/*.test.js"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create MV3 manifest**

Create `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Engagement Analyzer for Google Docs",
  "version": "0.1.0",
  "description": "Find robotic rhythm, generic phrasing, and weak engagement patterns in Google Docs.",
  "minimum_chrome_version": "116",
  "permissions": ["identity", "sidePanel", "tabs"],
  "host_permissions": ["https://docs.google.com/document/*", "https://docs.googleapis.com/*"],
  "oauth2": {
    "client_id": "000000000000-dev-client-id.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/documents.readonly"]
  },
  "background": {
    "service_worker": "src/background.js",
    "type": "module"
  },
  "action": {
    "default_title": "Analyze Google Doc"
  },
  "side_panel": {
    "default_path": "src/sidepanel.html"
  }
}
```

- [ ] **Step 3: Create setup README**

Create `README.md`:

```markdown
# Engagement Analyzer

Chrome extension MVP for analyzing Google Docs writing quality from a side panel.

## What It Does

- Opens a Chrome side panel on Google Docs.
- Reads the current document through Google Docs API after user consent.
- Runs local analysis for rhythm, predictability, structure, specificity, and voice.
- Shows sentence and paragraph-level guidance.

It does not claim that text is AI-written or human-written.

## Local Test

```powershell
npm test
```

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project folder.
5. Open a Google Doc.
6. Click the extension toolbar icon.

## Google OAuth

The manifest contains a development client ID sentinel. Replace it with your Chrome extension OAuth client ID before testing live Google Docs API access. See `docs/google-oauth-setup.md`.
```

- [ ] **Step 4: Create OAuth setup guide**

Create `docs/google-oauth-setup.md`:

```markdown
# Google OAuth Setup

The extension uses `chrome.identity.getAuthToken()` and the read-only scope:

`https://www.googleapis.com/auth/documents.readonly`

## Steps

1. Open Google Cloud Console.
2. Create or select a project.
3. Enable Google Docs API.
4. Configure the OAuth consent screen.
5. Create an OAuth Client ID for a Chrome Extension.
6. Load the extension once in Chrome and copy its extension ID from `chrome://extensions`.
7. Use that extension ID when creating the Chrome Extension OAuth client.
8. Put the generated OAuth client ID into `manifest.json` under `oauth2.client_id`.

During private testing, add your Google account as a test user if the consent screen is in testing mode.
```

- [ ] **Step 5: Create privacy notes**

Create `docs/privacy.md`:

```markdown
# Privacy Notes

The MVP reads the active Google Doc only after the user clicks the analyze button and grants read-only Google Docs permission.

Document text is processed locally in the extension side panel. The MVP does not transmit document text to a developer server, sell user data, use user data for advertising, or train a model.

The extension requests the minimum scope needed for analysis:

`https://www.googleapis.com/auth/documents.readonly`
```

- [ ] **Step 6: Run tests**

Run: `npm test`

Expected: command starts and reports no tests found or passes once test files exist. If Node reports that no files matched, continue to Task 2 where tests are added.

- [ ] **Step 7: Commit**

```powershell
git add package.json README.md manifest.json docs/google-oauth-setup.md docs/privacy.md
git commit -m "chore: scaffold extension project"
```

---

### Task 2: Document URL Parsing

**Files:**
- Create: `src/lib/document-id.js`
- Create: `tests/document-id.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/document-id.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "../src/lib/document-id.js";

test("detects Google Docs document URLs", () => {
  assert.equal(isGoogleDocsDocumentUrl("https://docs.google.com/document/d/abc123/edit"), true);
  assert.equal(isGoogleDocsDocumentUrl("https://docs.google.com/spreadsheets/d/abc123/edit"), false);
  assert.equal(isGoogleDocsDocumentUrl("https://example.com/document/d/abc123/edit"), false);
});

test("extracts document ID from edit URL", () => {
  assert.equal(
    extractDocumentId("https://docs.google.com/document/d/1A2B-_-xyz/edit"),
    "1A2B-_-xyz"
  );
});

test("extracts document ID from URL with query string", () => {
  assert.equal(
    extractDocumentId("https://docs.google.com/document/d/doc987/edit?tab=t.0"),
    "doc987"
  );
});

test("returns null for unsupported URLs", () => {
  assert.equal(extractDocumentId("https://docs.google.com/document/u/0/"), null);
  assert.equal(extractDocumentId("not a url"), null);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/document-id.test.js`

Expected: FAIL because `src/lib/document-id.js` does not exist.

- [ ] **Step 3: Implement URL parsing**

Create `src/lib/document-id.js`:

```js
const DOC_URL_PATTERN = /^https:\/\/docs\.google\.com\/document\/d\/([^/]+)/;

export function isGoogleDocsDocumentUrl(url) {
  return extractDocumentId(url) !== null;
}

export function extractDocumentId(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(DOC_URL_PATTERN);
  return match ? decodeURIComponent(match[1]) : null;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- tests/document-id.test.js`

Expected: PASS for all document ID tests.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/document-id.js tests/document-id.test.js
git commit -m "feat: parse google docs document urls"
```

---

### Task 3: Google Docs Text Extraction

**Files:**
- Create: `src/lib/docs-text.js`
- Create: `tests/docs-text.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/docs-text.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { extractTextBlocks } from "../src/lib/docs-text.js";

const sampleDoc = {
  body: {
    content: [
      {
        paragraph: {
          paragraphStyle: { namedStyleType: "HEADING_1" },
          elements: [{ textRun: { content: "Launch Plan\n" } }]
        }
      },
      {
        paragraph: {
          elements: [
            { textRun: { content: "This is a clear first sentence. " } },
            { textRun: { content: "This is a second sentence.\n" } }
          ]
        }
      },
      {
        paragraph: {
          bullet: { listId: "kix.list" },
          elements: [{ textRun: { content: "A bullet point\n" } }]
        }
      },
      {
        table: {}
      }
    ]
  }
};

test("extracts headings, paragraphs, and bullets", () => {
  assert.deepEqual(extractTextBlocks(sampleDoc), [
    { id: "block-0", kind: "heading", text: "Launch Plan", index: 0 },
    {
      id: "block-1",
      kind: "paragraph",
      text: "This is a clear first sentence. This is a second sentence.",
      index: 1
    },
    { id: "block-2", kind: "bullet", text: "A bullet point", index: 2 }
  ]);
});

test("returns empty array for missing content", () => {
  assert.deepEqual(extractTextBlocks({}), []);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/docs-text.test.js`

Expected: FAIL because `src/lib/docs-text.js` does not exist.

- [ ] **Step 3: Implement extraction**

Create `src/lib/docs-text.js`:

```js
export function extractTextBlocks(document) {
  const content = document?.body?.content;
  if (!Array.isArray(content)) {
    return [];
  }

  const blocks = [];

  for (const item of content) {
    if (!item.paragraph) {
      continue;
    }

    const text = extractParagraphText(item.paragraph);
    if (!text) {
      continue;
    }

    blocks.push({
      id: `block-${blocks.length}`,
      kind: getParagraphKind(item.paragraph),
      text,
      index: blocks.length
    });
  }

  return blocks;
}

function extractParagraphText(paragraph) {
  return (paragraph.elements ?? [])
    .map((element) => element.textRun?.content ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function getParagraphKind(paragraph) {
  if (paragraph.bullet) {
    return "bullet";
  }

  const style = paragraph.paragraphStyle?.namedStyleType ?? "";
  if (style.startsWith("HEADING")) {
    return "heading";
  }

  return "paragraph";
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- tests/docs-text.test.js`

Expected: PASS for extraction tests.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/docs-text.js tests/docs-text.test.js
git commit -m "feat: extract text blocks from google docs"
```

---

### Task 4: Local Analyzer

**Files:**
- Create: `src/lib/score.js`
- Create: `src/lib/analyzer.js`
- Create: `tests/analyzer.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/analyzer.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { analyzeBlocks, splitSentences } from "../src/lib/analyzer.js";

test("splits sentences without keeping empty segments", () => {
  assert.deepEqual(splitSentences("Short. Another sentence! Final one?"), [
    "Short.",
    "Another sentence!",
    "Final one?"
  ]);
});

test("flags generic predictable phrases", () => {
  const result = analyzeBlocks([
    {
      id: "block-0",
      kind: "paragraph",
      index: 0,
      text: "In today's fast-paced digital landscape, it is important to note that brands must leverage content."
    }
  ]);

  assert.equal(result.issues.some((issue) => issue.category === "predictability"), true);
  assert.equal(result.predictabilityScore < 90, true);
});

test("flags uniform sentence rhythm", () => {
  const result = analyzeBlocks([
    {
      id: "block-0",
      kind: "paragraph",
      index: 0,
      text: "Teams need better content. Teams need better systems. Teams need better results. Teams need better habits."
    }
  ]);

  assert.equal(result.issues.some((issue) => issue.category === "rhythm"), true);
  assert.equal(result.rhythmScore < 90, true);
});

test("flags low-specificity abstract claims", () => {
  const result = analyzeBlocks([
    {
      id: "block-0",
      kind: "paragraph",
      index: 0,
      text: "This solution delivers value through optimization, innovation, transformation, and enhanced performance."
    }
  ]);

  assert.equal(result.issues.some((issue) => issue.category === "specificity"), true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/analyzer.test.js`

Expected: FAIL because analyzer files do not exist.

- [ ] **Step 3: Implement score helpers**

Create `src/lib/score.js`:

```js
export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreFromPenalty(penalty) {
  return clampScore(100 - penalty);
}

export function averageScore(scores) {
  if (!scores.length) {
    return 100;
  }

  return clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}
```

- [ ] **Step 4: Implement analyzer**

Create `src/lib/analyzer.js`:

```js
import { averageScore, scoreFromPenalty } from "./score.js";

const GENERIC_PHRASES = [
  "in today's fast-paced",
  "it is important to note",
  "delve into",
  "leverage",
  "unlock the power",
  "game-changer",
  "digital landscape",
  "seamlessly",
  "robust solution"
];

const ABSTRACT_TERMS = [
  "optimization",
  "innovation",
  "transformation",
  "performance",
  "efficiency",
  "value",
  "solution",
  "capabilities",
  "strategy"
];

export function analyzeBlocks(blocks) {
  const issues = [];
  let rhythmPenalty = 0;
  let predictabilityPenalty = 0;
  let structurePenalty = 0;
  let specificityPenalty = 0;
  let voicePenalty = 0;

  blocks.forEach((block) => {
    const sentences = splitSentences(block.text);

    const rhythmIssue = detectUniformRhythm(block, sentences);
    if (rhythmIssue) {
      issues.push(rhythmIssue);
      rhythmPenalty += severityPenalty(rhythmIssue.severity);
    }

    const phraseIssues = detectGenericPhrases(block);
    issues.push(...phraseIssues);
    predictabilityPenalty += phraseIssues.reduce((sum, issue) => sum + severityPenalty(issue.severity), 0);

    const repeatedStartIssue = detectRepeatedStarts(block, sentences);
    if (repeatedStartIssue) {
      issues.push(repeatedStartIssue);
      voicePenalty += severityPenalty(repeatedStartIssue.severity);
    }

    const specificityIssue = detectLowSpecificity(block);
    if (specificityIssue) {
      issues.push(specificityIssue);
      specificityPenalty += severityPenalty(specificityIssue.severity);
    }
  });

  const bulletStructureIssue = detectBulletSymmetry(blocks);
  if (bulletStructureIssue) {
    issues.push(bulletStructureIssue);
    structurePenalty += severityPenalty(bulletStructureIssue.severity);
  }

  const rhythmScore = scoreFromPenalty(rhythmPenalty);
  const predictabilityScore = scoreFromPenalty(predictabilityPenalty);
  const structureScore = scoreFromPenalty(structurePenalty);
  const specificityScore = scoreFromPenalty(specificityPenalty);
  const voiceScore = scoreFromPenalty(voicePenalty);

  return {
    overallScore: averageScore([
      rhythmScore,
      predictabilityScore,
      structureScore,
      specificityScore,
      voiceScore
    ]),
    rhythmScore,
    predictabilityScore,
    structureScore,
    specificityScore,
    voiceScore,
    issues
  };
}

export function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]+/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function detectUniformRhythm(block, sentences) {
  if (sentences.length < 4) {
    return null;
  }

  const lengths = sentences.map((sentence) => sentence.split(/\s+/).length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);

  if (max - min > 3) {
    return null;
  }

  return {
    id: `rhythm-${block.index}`,
    severity: "medium",
    category: "rhythm",
    blockIndex: block.index,
    message: "Several nearby sentences have nearly identical length, which can make the paragraph feel mechanical.",
    suggestion: "Vary the rhythm by combining one idea, shortening another, and adding one concrete detail."
  };
}

function detectGenericPhrases(block) {
  const lower = block.text.toLowerCase();
  return GENERIC_PHRASES.filter((phrase) => lower.includes(phrase)).map((phrase, index) => ({
    id: `predictability-${block.index}-${index}`,
    severity: phrase === "leverage" ? "low" : "medium",
    category: "predictability",
    blockIndex: block.index,
    sentence: findSentenceContaining(block.text, phrase),
    message: `The phrase "${phrase}" is common in generic marketing copy.`,
    suggestion: "Replace it with a specific, plain-language phrase that matches the actual point."
  }));
}

function detectRepeatedStarts(block, sentences) {
  if (sentences.length < 3) {
    return null;
  }

  const starts = sentences.map((sentence) =>
    sentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).slice(0, 2).join(" ")
  );

  const counts = new Map();
  starts.forEach((start) => counts.set(start, (counts.get(start) ?? 0) + 1));
  const repeated = [...counts.entries()].find(([, count]) => count >= 3);

  if (!repeated) {
    return null;
  }

  return {
    id: `voice-${block.index}`,
    severity: "medium",
    category: "voice",
    blockIndex: block.index,
    message: `Multiple sentences start with "${repeated[0]}", creating a repetitive cadence.`,
    suggestion: "Change the sentence openings so each idea enters from a different angle."
  };
}

function detectLowSpecificity(block) {
  if (block.kind === "heading" || block.text.split(/\s+/).length < 8) {
    return null;
  }

  const lower = block.text.toLowerCase();
  const abstractHits = ABSTRACT_TERMS.filter((term) => lower.includes(term)).length;
  const hasNumber = /\d/.test(block.text);
  const hasExampleMarker = /\b(for example|such as|including|like)\b/i.test(block.text);

  if (abstractHits < 4 || hasNumber || hasExampleMarker) {
    return null;
  }

  return {
    id: `specificity-${block.index}`,
    severity: "medium",
    category: "specificity",
    blockIndex: block.index,
    message: "This block leans on abstract claims without concrete proof or examples.",
    suggestion: "Add a named example, number, customer detail, or observable outcome."
  };
}

function detectBulletSymmetry(blocks) {
  const bullets = blocks.filter((block) => block.kind === "bullet");
  if (bullets.length < 4) {
    return null;
  }

  const lengths = bullets.map((block) => block.text.split(/\s+/).length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);

  if (max - min > 3) {
    return null;
  }

  return {
    id: "structure-bullets",
    severity: "medium",
    category: "structure",
    blockIndex: bullets[0].index,
    message: "The bullet list has very similar item lengths, which can read like a generated outline.",
    suggestion: "Make one bullet more specific, merge a weak item, and vary the syntax of the list."
  };
}

function findSentenceContaining(text, phrase) {
  return splitSentences(text).find((sentence) => sentence.toLowerCase().includes(phrase)) ?? text;
}

function severityPenalty(severity) {
  if (severity === "high") {
    return 24;
  }
  if (severity === "medium") {
    return 14;
  }
  return 7;
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `npm test -- tests/analyzer.test.js`

Expected: PASS for analyzer tests.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/score.js src/lib/analyzer.js tests/analyzer.test.js
git commit -m "feat: add local engagement analyzer"
```

---

### Task 5: Chrome Background And Docs API Client

**Files:**
- Create: `src/background.js`
- Create: `src/lib/docs-api.js`

- [ ] **Step 1: Create background service worker**

Create `src/background.js`:

```js
import { isGoogleDocsDocumentUrl } from "./lib/document-id.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

chrome.tabs.onUpdated.addListener(async (tabId, _info, tab) => {
  await updateSidePanel(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await updateSidePanel(tabId, tab.url);
});

async function updateSidePanel(tabId, url) {
  const enabled = isGoogleDocsDocumentUrl(url ?? "");
  await chrome.sidePanel.setOptions({
    tabId,
    path: "src/sidepanel.html",
    enabled
  });
}
```

- [ ] **Step 2: Create Docs API client**

Create `src/lib/docs-api.js`:

```js
const DOCS_GET_URL = "https://docs.googleapis.com/v1/documents";

export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

export async function requestDocsToken() {
  const result = await chrome.identity.getAuthToken({ interactive: true });
  const token = typeof result === "string" ? result : result.token;

  if (!token) {
    throw new Error("Google authorization did not return an access token.");
  }

  return token;
}

export async function fetchGoogleDocument(documentId, token) {
  const response = await fetch(`${DOCS_GET_URL}/${encodeURIComponent(documentId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google Docs API returned ${response.status}.`);
  }

  return response.json();
}
```

- [ ] **Step 3: Run existing tests**

Run: `npm test`

Expected: PASS for local module tests.

- [ ] **Step 4: Commit**

```powershell
git add src/background.js src/lib/docs-api.js
git commit -m "feat: add docs side panel integration"
```

---

### Task 6: Side Panel UI

**Files:**
- Create: `src/sidepanel.html`
- Create: `src/sidepanel.css`
- Create: `src/sidepanel.js`

- [ ] **Step 1: Create side panel HTML**

Create `src/sidepanel.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Engagement Analyzer</title>
    <link rel="stylesheet" href="./sidepanel.css">
  </head>
  <body>
    <main class="panel">
      <header class="header">
        <div>
          <h1>Engagement Analyzer</h1>
          <p id="docStatus">Open a Google Doc to begin.</p>
        </div>
        <button id="analyzeButton" type="button">Analyze</button>
      </header>

      <section id="summary" class="summary is-hidden" aria-live="polite"></section>
      <section id="issues" class="issues"></section>
      <section id="emptyState" class="empty">
        <h2>Ready when your draft is.</h2>
        <p>Analyze the active Google Doc to find robotic rhythm, predictable phrasing, and weak specificity.</p>
      </section>
    </main>
    <script type="module" src="./sidepanel.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create side panel CSS**

Create `src/sidepanel.css`:

```css
:root {
  color-scheme: light;
  --bg: #f8fafc;
  --panel: #ffffff;
  --text: #172033;
  --muted: #64748b;
  --border: #d9e1ec;
  --accent: #0f766e;
  --accent-strong: #115e59;
  --risk: #b42318;
  --warn: #a15c07;
  --good: #0f7a45;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  font-family: Arial, Helvetica, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.panel {
  padding: 14px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

h1 {
  margin: 0 0 4px;
  font-size: 18px;
  line-height: 1.2;
}

h2 {
  margin: 0 0 8px;
  font-size: 14px;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.4;
}

button {
  border: 0;
  border-radius: 6px;
  padding: 9px 12px;
  background: var(--accent);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: var(--accent-strong);
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.summary {
  display: grid;
  gap: 8px;
  margin: 14px 0;
}

.scoreGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.score {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
}

.score strong {
  display: block;
  font-size: 20px;
}

.score span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
}

.issues {
  display: grid;
  gap: 10px;
}

.issue {
  padding: 12px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--warn);
  border-radius: 8px;
  background: var(--panel);
}

.issue.high {
  border-left-color: var(--risk);
}

.issue.low {
  border-left-color: var(--good);
}

.issueMeta {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

.issueMessage {
  margin-bottom: 8px;
  color: var(--text);
}

.suggestion {
  color: var(--muted);
}

.empty {
  margin-top: 18px;
  padding: 14px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--panel);
}

.is-hidden {
  display: none;
}
```

- [ ] **Step 3: Create side panel controller**

Create `src/sidepanel.js`:

```js
import { analyzeBlocks } from "./lib/analyzer.js";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "./lib/document-id.js";
import { fetchGoogleDocument, getActiveTab, requestDocsToken } from "./lib/docs-api.js";
import { extractTextBlocks } from "./lib/docs-text.js";

const analyzeButton = document.querySelector("#analyzeButton");
const docStatus = document.querySelector("#docStatus");
const summary = document.querySelector("#summary");
const issues = document.querySelector("#issues");
const emptyState = document.querySelector("#emptyState");

let activeTab = null;

init();

async function init() {
  activeTab = await getActiveTab();
  if (!activeTab?.url || !isGoogleDocsDocumentUrl(activeTab.url)) {
    analyzeButton.disabled = true;
    docStatus.textContent = "Open a Google Doc to analyze writing.";
    return;
  }

  analyzeButton.disabled = false;
  docStatus.textContent = "Ready to analyze the active Google Doc.";
  analyzeButton.addEventListener("click", analyzeActiveDocument);
}

async function analyzeActiveDocument() {
  setBusy(true);
  renderMessage("Requesting read-only access to this document.");

  try {
    const documentId = extractDocumentId(activeTab.url);
    const token = await requestDocsToken();
    const doc = await fetchGoogleDocument(documentId, token);
    const blocks = extractTextBlocks(doc);

    if (!blocks.length) {
      renderMessage("No analyzable text was found in this document.");
      return;
    }

    const result = analyzeBlocks(blocks);
    renderResult(result);
  } catch (error) {
    renderMessage(error instanceof Error ? error.message : "Analysis failed.");
  } finally {
    setBusy(false);
  }
}

function renderResult(result) {
  emptyState.classList.add("is-hidden");
  summary.classList.remove("is-hidden");
  summary.innerHTML = `
    <div class="score">
      <strong>${result.overallScore}</strong>
      <span>Overall engagement score</span>
    </div>
    <div class="scoreGrid">
      ${scoreCard("Rhythm", result.rhythmScore)}
      ${scoreCard("Predictability", result.predictabilityScore)}
      ${scoreCard("Structure", result.structureScore)}
      ${scoreCard("Specificity", result.specificityScore)}
    </div>
  `;

  issues.innerHTML = result.issues.length
    ? result.issues.map(renderIssue).join("")
    : `<article class="issue low"><p class="issueMessage">No major robotic writing patterns found.</p></article>`;
}

function scoreCard(label, score) {
  return `<div class="score"><strong>${score}</strong><span>${label}</span></div>`;
}

function renderIssue(issue) {
  return `
    <article class="issue ${issue.severity}">
      <div class="issueMeta">${issue.category} · ${issue.severity}</div>
      <p class="issueMessage">${escapeHtml(issue.message)}</p>
      <p class="suggestion">${escapeHtml(issue.suggestion)}</p>
    </article>
  `;
}

function renderMessage(message) {
  emptyState.classList.remove("is-hidden");
  summary.classList.add("is-hidden");
  issues.innerHTML = "";
  emptyState.innerHTML = `<h2>Status</h2><p>${escapeHtml(message)}</p>`;
}

function setBusy(isBusy) {
  analyzeButton.disabled = isBusy;
  analyzeButton.textContent = isBusy ? "Analyzing" : "Analyze";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS for local module tests.

- [ ] **Step 5: Commit**

```powershell
git add src/sidepanel.html src/sidepanel.css src/sidepanel.js
git commit -m "feat: build side panel analysis ui"
```

---

### Task 7: Verification And GitHub Push

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Inspect Git status**

Run: `git status --short`

Expected: no uncommitted files after previous task commits.

- [ ] **Step 3: Confirm remote**

Run: `git remote -v`

Expected: remote `origin` points to `https://github.com/Sucheta-rg/engagement-analyzer.git`.

- [ ] **Step 4: Push to GitHub**

Run: `git push -u origin main`

Expected: local `main` branch is pushed to `Sucheta-rg/engagement-analyzer`.

- [ ] **Step 5: Manual Chrome loading check**

Manual steps:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `C:\Users\rangr\Downloads\engagement-analyzer`.
5. Open a Google Doc.
6. Click the extension toolbar icon.

Expected: side panel opens. If the OAuth client ID has not been configured, live analysis will fail at Google authorization; the local UI and tests should still work.

---

## Self-Review

Spec coverage:

- Google Docs side panel: Task 1, Task 5, Task 6.
- Read-only Docs API access: Task 1, Task 5, `docs/google-oauth-setup.md`.
- Local deterministic analyzer: Task 4.
- Text extraction from Docs API response: Task 3.
- No AI-authorship claims: README in Task 1 and analyzer labels in Task 4.
- Privacy and minimum permissions: Task 1.
- Testing: Tasks 2, 3, 4, and 7.
- GitHub connection: Task 7.

No ambiguous implementation dependencies are left for the MVP. Live Google Docs API testing requires a real Chrome Extension OAuth client ID created for the loaded extension ID; the project remains testable without that credential through local unit tests and Chrome UI loading.
