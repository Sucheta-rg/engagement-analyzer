# Cadence Lite Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cadence Lite, a restrained editorial companion that reacts to analysis states in the side panel and appears inside Focus overlays without distracting writers.

**Architecture:** Keep companion decision logic in a pure ES module with Node tests. Render the main Cadence card in the side panel and render a mini Cadence mark inside the existing Google Docs overlay. Store only a local Quiet mode preference using `chrome.storage.local`.

**Tech Stack:** Chrome Extension Manifest V3, vanilla ES modules, CSS/SVG animation, Chrome storage API, Node built-in tests.

---

## File Structure

- Create `src/lib/companion.js`: pure companion state mapping, message selection, and Quiet mode defaults.
- Create `tests/companion.test.js`: state and message tests.
- Modify `manifest.json`: add `storage` permission.
- Modify `src/sidepanel.html`: add companion card container.
- Modify `src/sidepanel.css`: add Cadence visual styling and compact animations.
- Modify `src/sidepanel.js`: render companion state, update messages after analysis, and wire Quiet mode.
- Modify `src/content-script.js`: add mini Cadence mark and companion line to the existing Focus overlay.

---

### Task 1: Companion State Logic

**Files:**
- Create: `src/lib/companion.js`
- Create: `tests/companion.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/companion.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  CADENCE_MESSAGES,
  DEFAULT_QUIET_MODE,
  getCadenceState,
  getCadenceMessage
} from "../src/lib/companion.js";

test("maps score to cadence state", () => {
  assert.equal(getCadenceState({ isAnalyzing: true, score: 0 }), "thinking");
  assert.equal(getCadenceState({ isAnalyzing: false, score: null }), "ready");
  assert.equal(getCadenceState({ isAnalyzing: false, score: 90 }), "strong");
  assert.equal(getCadenceState({ isAnalyzing: false, score: 75 }), "watchful");
  assert.equal(getCadenceState({ isAnalyzing: false, score: 52 }), "concerned");
});

test("focus state overrides score state", () => {
  assert.equal(getCadenceState({ isAnalyzing: false, score: 95, isPointing: true }), "pointing");
});

test("every cadence state has a message", () => {
  for (const state of Object.keys(CADENCE_MESSAGES)) {
    assert.equal(typeof getCadenceMessage(state), "string");
    assert.equal(getCadenceMessage(state).length > 0, true);
  }
});

test("quiet mode defaults to false", () => {
  assert.equal(DEFAULT_QUIET_MODE, false);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm.cmd test -- tests/companion.test.js`

Expected: FAIL because `src/lib/companion.js` does not exist.

- [ ] **Step 3: Implement companion logic**

Create `src/lib/companion.js`:

```js
export const DEFAULT_QUIET_MODE = false;

export const CADENCE_MESSAGES = {
  ready: "Open a draft. I will watch for rhythm, repetition, and proof gaps.",
  thinking: "Reading rhythm, patterns, and proof points.",
  strong: "This draft has a strong pulse.",
  watchful: "Good base. A few lines need sharper proof.",
  concerned: "Start with the red signals. They are costing clarity.",
  pointing: "This is the section to tighten first."
};

export function getCadenceState({ isAnalyzing, score, isPointing = false }) {
  if (isPointing) {
    return "pointing";
  }

  if (isAnalyzing) {
    return "thinking";
  }

  if (typeof score !== "number") {
    return "ready";
  }

  if (score >= 88) {
    return "strong";
  }

  if (score >= 70) {
    return "watchful";
  }

  return "concerned";
}

export function getCadenceMessage(state) {
  return CADENCE_MESSAGES[state] ?? CADENCE_MESSAGES.ready;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm.cmd test -- tests/companion.test.js`

Expected: PASS for all companion tests.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/companion.js tests/companion.test.js
git commit -m "feat: add cadence companion logic"
```

---

### Task 2: Side Panel Cadence Card

**Files:**
- Modify: `manifest.json`
- Modify: `src/sidepanel.html`
- Modify: `src/sidepanel.css`
- Modify: `src/sidepanel.js`

- [ ] **Step 1: Add storage permission**

Modify `manifest.json` permissions:

```json
"permissions": ["identity", "sidePanel", "storage", "tabs"],
```

- [ ] **Step 2: Add companion container**

Modify `src/sidepanel.html` by inserting this after the `</header>` closing tag:

```html
      <section id="companion" class="companion" aria-live="polite"></section>
```

- [ ] **Step 3: Import companion helpers**

Modify the imports in `src/sidepanel.js`:

```js
import { getCadenceMessage, getCadenceState } from "./lib/companion.js";
```

Then add this query next to the existing DOM queries:

```js
const companion = document.querySelector("#companion");
```

Then add state variables near `activeTab`:

```js
let quietMode = false;
let lastScore = null;
```

- [ ] **Step 4: Initialize quiet mode and render ready state**

Modify `init()` so it loads quiet mode before URL checks:

```js
async function init() {
  quietMode = await loadQuietMode();
  renderCompanion(getCadenceState({ isAnalyzing: false, score: null }));

  activeTab = await getActiveTab();
  if (!activeTab?.url || !isGoogleDocsDocumentUrl(activeTab.url)) {
    analyzeButton.disabled = true;
    docStatus.textContent = "Open a Google Doc to analyze writing.";
    return;
  }

  analyzeButton.disabled = false;
  docStatus.textContent = "Ready to review robotic rhythm and engagement risk.";
  analyzeButton.addEventListener("click", analyzeActiveDocument);
  document.addEventListener("click", handlePanelClick);
  companion.addEventListener("change", handleCompanionChange);
}
```

- [ ] **Step 5: Update analysis states**

At the start of `analyzeActiveDocument()`, after `setBusy(true);`, add:

```js
renderCompanion(getCadenceState({ isAnalyzing: true, score: lastScore }));
```

Inside `renderResult(result)`, before rendering HTML, add:

```js
lastScore = result.overallScore;
renderCompanion(getCadenceState({ isAnalyzing: false, score: result.overallScore }));
```

Inside `handlePanelClick`, before `chrome.tabs.sendMessage`, add:

```js
renderCompanion(getCadenceState({ isAnalyzing: false, score: lastScore, isPointing: true }));
```

After the `await chrome.tabs.sendMessage(...)` block succeeds, add:

```js
setTimeout(() => {
  renderCompanion(getCadenceState({ isAnalyzing: false, score: lastScore }));
}, 1800);
```

- [ ] **Step 6: Add companion helper functions**

Add these functions before `escapeHtml` in `src/sidepanel.js`:

```js
async function loadQuietMode() {
  const stored = await chrome.storage.local.get({ cadenceQuietMode: false });
  return Boolean(stored.cadenceQuietMode);
}

async function handleCompanionChange(event) {
  if (event.target?.id !== "quietModeToggle") {
    return;
  }

  quietMode = event.target.checked;
  await chrome.storage.local.set({ cadenceQuietMode: quietMode });
  renderCompanion(getCadenceState({ isAnalyzing: false, score: lastScore }));
}

function renderCompanion(state) {
  companion.classList.toggle("is-quiet", quietMode);
  companion.innerHTML = `
    <div class="cadenceMark ${state}" aria-hidden="true">
      <span class="cadenceFeather"></span>
      <span class="cadenceNib"></span>
      <span class="cadencePulse"></span>
    </div>
    <div class="cadenceCopy">
      <div class="cadenceKicker">Cadence</div>
      <p>${escapeHtml(quietMode ? "Quiet mode is on. Analysis stays active." : getCadenceMessage(state))}</p>
    </div>
    <label class="quietToggle">
      <input id="quietModeToggle" type="checkbox" ${quietMode ? "checked" : ""}>
      <span>Quiet mode</span>
    </label>
  `;
}
```

- [ ] **Step 7: Add Cadence CSS**

Add to `src/sidepanel.css` after `.header` styles:

```css
.companion {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #cfe7e4;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.companion.is-quiet .cadenceMark {
  opacity: 0.35;
  animation: none;
}

.cadenceMark {
  position: relative;
  width: 48px;
  height: 48px;
  animation: cadenceBreathe 3.8s ease-in-out infinite;
}

.cadenceFeather {
  position: absolute;
  left: 11px;
  top: 3px;
  width: 24px;
  height: 36px;
  border-radius: 80% 10% 80% 10%;
  background: linear-gradient(135deg, #0f766e, #164e63 58%, #f2b84b);
  transform: rotate(-22deg);
}

.cadenceFeather::before,
.cadenceFeather::after {
  content: "";
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
}

.cadenceFeather::before {
  width: 5px;
  height: 5px;
  left: 7px;
  top: 11px;
  box-shadow: 9px 3px 0 #ffffff;
  animation: cadenceBlink 5s infinite;
}

.cadenceFeather::after {
  width: 8px;
  height: 3px;
  left: 9px;
  top: 22px;
  background: #172033;
}

.cadenceNib {
  position: absolute;
  left: 23px;
  top: 30px;
  width: 8px;
  height: 17px;
  border-radius: 2px 2px 8px 8px;
  background: #172033;
  transform: rotate(-22deg);
}

.cadencePulse {
  position: absolute;
  right: 4px;
  bottom: 8px;
  width: 12px;
  height: 12px;
  border: 2px solid #0f766e;
  border-radius: 50%;
  animation: cadencePulse 2.2s ease-out infinite;
}

.cadenceMark.thinking {
  animation-duration: 1.6s;
}

.cadenceMark.concerned .cadencePulse {
  border-color: #b42318;
}

.cadenceMark.watchful .cadencePulse {
  border-color: #a15c07;
}

.cadenceMark.pointing {
  transform: rotate(-8deg);
}

.cadenceKicker {
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.cadenceCopy p {
  color: var(--text);
  font-size: 13px;
}

.quietToggle {
  display: grid;
  gap: 3px;
  justify-items: center;
  color: var(--muted);
  font-size: 11px;
}

.quietToggle input {
  width: 16px;
  height: 16px;
}

@keyframes cadenceBreathe {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(-2deg);
  }
}

@keyframes cadenceBlink {
  0%, 92%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.2);
  }
}

@keyframes cadencePulse {
  0% {
    transform: scale(0.6);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}
```

- [ ] **Step 8: Run tests and syntax checks**

Run: `npm.cmd test`

Expected: PASS for all tests.

Run:

```powershell
node --check src/sidepanel.js
node --check src/content-script.js
```

Expected: no syntax errors.

- [ ] **Step 9: Commit**

```powershell
git add manifest.json src/sidepanel.html src/sidepanel.css src/sidepanel.js
git commit -m "feat: add cadence side panel companion"
```

---

### Task 3: Mini Cadence In Focus Overlay

**Files:**
- Modify: `src/content-script.js`

- [ ] **Step 1: Update overlay HTML**

In `showSuggestionOverlay(details)`, replace the overlay `innerHTML` assignment with:

```js
  overlay.innerHTML = `
    <button class="ea-close" type="button" aria-label="Close">x</button>
    <div class="ea-overlay-head">
      <div class="ea-cadence" aria-hidden="true">
        <span class="ea-feather"></span>
        <span class="ea-nib"></span>
      </div>
      <div>
        <div class="ea-kicker">${escapeHtml(details.found ? "Focused in document" : "Text not visible")}</div>
        <div class="ea-title">${escapeHtml(details.label ?? "Writing signal")}</div>
      </div>
    </div>
    <p>${escapeHtml(details.message ?? "Review this part of the draft.")}</p>
    <div class="ea-suggestion">${escapeHtml(details.suggestion ?? "Add a concrete detail or rewrite for clearer rhythm.")}</div>
    <div class="ea-line">Cadence: Add proof here: number, example, or consequence.</div>
  `;
```

- [ ] **Step 2: Update overlay CSS**

Inside the `style.textContent` template in `src/content-script.js`, add these CSS rules before `.ea-kicker`:

```css
    #${OVERLAY_ID} .ea-overlay-head {
      display: grid;
      grid-template-columns: 38px 1fr;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }

    #${OVERLAY_ID} .ea-cadence {
      position: relative;
      width: 34px;
      height: 34px;
    }

    #${OVERLAY_ID} .ea-feather {
      position: absolute;
      left: 7px;
      top: 1px;
      width: 18px;
      height: 27px;
      border-radius: 80% 10% 80% 10%;
      background: linear-gradient(135deg, #0f766e, #164e63 58%, #f2b84b);
      transform: rotate(-22deg);
    }

    #${OVERLAY_ID} .ea-feather::before {
      content: "";
      position: absolute;
      left: 5px;
      top: 8px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 7px 2px 0 #ffffff;
    }

    #${OVERLAY_ID} .ea-nib {
      position: absolute;
      left: 17px;
      top: 22px;
      width: 6px;
      height: 12px;
      border-radius: 2px 2px 7px 7px;
      background: #172033;
      transform: rotate(-22deg);
    }
```

Add this after `.ea-suggestion`:

```css
    #${OVERLAY_ID} .ea-line {
      margin-top: 8px;
      color: #0f766e;
      font-weight: 700;
    }
```

- [ ] **Step 3: Run syntax check**

Run: `node --check src/content-script.js`

Expected: no syntax errors.

- [ ] **Step 4: Commit**

```powershell
git add src/content-script.js
git commit -m "feat: add cadence focus overlay"
```

---

### Task 4: Verification And Push

**Files:**
- No new files.

- [ ] **Step 1: Run full tests**

Run: `npm.cmd test`

Expected: all tests pass.

- [ ] **Step 2: Run syntax checks**

Run:

```powershell
node --check src/sidepanel.js
node --check src/content-script.js
node --check src/background.js
```

Expected: no syntax errors.

- [ ] **Step 3: Inspect Git status**

Run: `git status --short`

Expected: no uncommitted files.

- [ ] **Step 4: Push to GitHub**

Run: `git push`

Expected: local `main` is pushed to `origin/main`.

- [ ] **Step 5: Manual extension reload**

Manual steps:

1. Open `chrome://extensions`.
2. Reload **Engagement Analyzer for Google Docs**.
3. Reload the Google Doc tab.
4. Click Analyze.
5. Confirm Cadence appears in the side panel.
6. Toggle Quiet mode and confirm the companion card becomes quiet.
7. Click Focus on an issue and confirm mini Cadence appears in the document overlay.

---

## Self-Review

Spec coverage:

- Cadence Lite side panel companion: Task 2.
- Mini Cadence in Focus overlay: Task 3.
- Quiet mode preference: Task 2.
- Pure companion logic and tests: Task 1.
- No automatic idle nudges in this MVP: deliberately excluded per spec.
- Real-time paragraph watch roadmap: deliberately excluded for a later plan.

No unresolved implementation gaps remain. The plan keeps the first implementation serious, low-motion, and testable.
