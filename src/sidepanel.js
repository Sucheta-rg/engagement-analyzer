import { analyzeBlocks } from "./lib/analyzer.js";
import { getCadenceMessage, getCadenceState } from "./lib/companion.js";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "./lib/document-id.js";
import { fetchGoogleDocument, getActiveTab, requestDocsToken } from "./lib/docs-api.js";
import { extractTextBlocks } from "./lib/docs-text.js";
import {
  getMetricFocus,
  getReviewIntro,
  getScoreInsight,
  getScoreTone
} from "./lib/presentation.js";

const analyzeButton = document.querySelector("#analyzeButton");
const docStatus = document.querySelector("#docStatus");
const companion = document.querySelector("#companion");
const summary = document.querySelector("#summary");
const heatmap = document.querySelector("#heatmap");
const priority = document.querySelector("#priority");
const boosters = document.querySelector("#boosters");
const issues = document.querySelector("#issues");
const emptyState = document.querySelector("#emptyState");

let activeTab = null;
let focusItems = new Map();
let quietMode = false;
let lastScore = null;
let activeFocusId = null;
let activeMetric = "all";

init();

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

async function analyzeActiveDocument() {
  setBusy(true);
  renderCompanion(getCadenceState({ isAnalyzing: true, score: lastScore }));
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

    renderResult(analyzeBlocks(blocks));
  } catch (error) {
    renderMessage(error instanceof Error ? error.message : "Analysis failed.");
  } finally {
    setBusy(false);
  }
}

function renderResult(result) {
  focusItems = new Map();
  activeMetric = "all";
  lastScore = result.overallScore;
  renderCompanion(getCadenceState({ isAnalyzing: false, score: result.overallScore }));
  emptyState.classList.add("is-hidden");
  summary.classList.remove("is-hidden");
  heatmap.classList.remove("is-hidden");
  priority.classList.remove("is-hidden");
  boosters.classList.toggle("is-hidden", result.specificityBoosters.length === 0);

  summary.innerHTML = `
    <div class="studioPulse ${scoreTone(result.overallScore)}">
      <div class="pulseRing" style="--score-percent: ${result.overallScore}%">
        <strong>${result.overallScore}</strong>
        <span>pulse</span>
      </div>
      <div class="pulseCopy">
        <span class="eyebrow">Draft Pulse</span>
        <h2>${pulseTitle(result.overallScore)}</h2>
        <p>${summaryMessage(result.overallScore)}</p>
      </div>
    </div>
    <div class="scoreGrid">
      ${scoreCard("Rhythm", result.rhythmScore, "rhythm")}
      ${scoreCard("Predictability", result.predictabilityScore, "predictability")}
      ${scoreCard("Structure", result.structureScore, "structure")}
      ${scoreCard("Specificity", result.specificityScore, "specificity")}
    </div>
  `;

  heatmap.innerHTML = `
    <div class="sectionTitle">
      <h2>Draft Navigation</h2>
      <span>Click any line to jump</span>
    </div>
    <div class="heatmapBars">
      ${result.heatmap.slice(0, 12).map(renderHeatmapEntry).join("")}
    </div>
  `;

  priority.innerHTML = `
    <div class="reviewHeader">
      <span class="eyebrow">Guided Review</span>
      <h2>Start here</h2>
      <p>${getReviewIntro(result.fixPriority.length)}</p>
    </div>
    <div class="issues guidedIssues">
      ${result.fixPriority.length ? result.fixPriority.map((issue, index) => renderIssue(issue, index)).join("") : renderCleanIssue()}
    </div>
  `;

  boosters.innerHTML = `
    <div class="sectionTitle">
      <h2>Specificity Boosters</h2>
      <span>Make it concrete</span>
    </div>
    ${result.specificityBoosters.map(renderBooster).join("")}
  `;

  issues.innerHTML = result.issues.length
    ? `<div class="sectionTitle"><h2>All Notes</h2><span>${result.issues.length} total</span></div>${result.issues.map((issue, index) => renderIssue(issue, index)).join("")}`
    : "";
}

function scoreCard(label, score, filter) {
  return `
    <button class="scoreTile ${scoreTone(score)}" type="button" data-score-filter="${filter}">
      <span class="scoreTileTop">
        <strong>${score}</strong>
        <span>${label}</span>
      </span>
      <small>${escapeHtml(getMetricFocus(label, score))}</small>
    </button>
  `;
}

function renderHeatmapEntry(entry) {
  const focusId = registerFocusItem({
    text: entry.preview,
    label: `${levelLabel(entry.level)} passage`,
    message: `${entry.issueCount} writing signal${entry.issueCount === 1 ? "" : "s"} found in this block.`,
    suggestion: "Review this block for rhythm, specificity, and generic phrasing."
  });

  return `
    <article class="heatmapBar ${entry.level}" data-focus-card="${focusId}">
      <button class="heatmapButton" type="button" data-focus-id="${focusId}">
        <span class="heatmapLevel ${entry.level}">${levelLabel(entry.level)}</span>
        <span class="preview">${escapeHtml(entry.preview)}${entry.preview.length >= 130 ? "..." : ""}</span>
      </button>
    </article>
  `;
}

function renderIssue(issue, index = 0) {
  const focusId = registerFocusItem({
    text: issue.sentence ?? issue.excerpt ?? issue.message,
    label: issue.label,
    message: issue.message,
    suggestion: issue.suggestion
  });

  return `
    <article class="issue ${issue.severity}" data-focus-card="${focusId}" data-category="${issue.category}">
      <div class="issueTop">
        <div>
          <div class="issueMeta">${index === 0 ? "Start here" : `Note ${index + 1}`} - ${escapeHtml(issue.label)}</div>
          <h3>${issueTitle(issue)}</h3>
        </div>
        <button class="focusButton" type="button" data-focus-id="${focusId}">Locate</button>
      </div>
      <p class="issueMessage">${escapeHtml(issue.message)}</p>
      <p class="suggestion">${escapeHtml(issue.suggestion)}</p>
      <div class="issueActions">
        <button class="secondaryButton" type="button" data-focus-id="${focusId}">Locate in draft</button>
        <button class="copyButton" type="button" data-copy-id="${focusId}">Copy direction</button>
      </div>
    </article>
  `;
}

function renderBooster(booster) {
  const focusId = registerFocusItem({
    text: booster.question,
    label: "Specificity booster",
    message: booster.question,
    suggestion: booster.suggestion
  });

  return `
    <article class="booster" data-focus-card="${focusId}">
      <p class="issueMessage">${escapeHtml(booster.question)}</p>
      <p class="suggestion">${escapeHtml(booster.suggestion)}</p>
      <div class="issueActions">
        <button class="secondaryButton" type="button" data-focus-id="${focusId}">Locate in draft</button>
        <button class="copyButton" type="button" data-copy-id="${focusId}">Copy direction</button>
      </div>
    </article>
  `;
}

function renderCleanIssue() {
  return `<article class="issue low"><p class="issueMessage">No major robotic writing patterns found.</p></article>`;
}

function renderMessage(message) {
  emptyState.classList.remove("is-hidden");
  summary.classList.add("is-hidden");
  heatmap.classList.add("is-hidden");
  priority.classList.add("is-hidden");
  boosters.classList.add("is-hidden");
  issues.innerHTML = "";
  emptyState.innerHTML = `<h2>Status</h2><p>${escapeHtml(message)}</p>`;
}

function setBusy(isBusy) {
  analyzeButton.disabled = isBusy;
  analyzeButton.textContent = isBusy ? "Analyzing" : "Analyze";
}

async function handlePanelClick(event) {
  const scoreButton = event.target.closest("[data-score-filter]");
  if (scoreButton) {
    activeMetric = activeMetric === scoreButton.dataset.scoreFilter ? "all" : scoreButton.dataset.scoreFilter;
    applyMetricFilter();
    return;
  }

  const copyButton = event.target.closest("[data-copy-id]");
  if (copyButton) {
    await copySuggestion(copyButton.dataset.copyId);
    return;
  }

  const button = event.target.closest("[data-focus-id]");
  if (!button) {
    return;
  }

  const item = focusItems.get(button.dataset.focusId);
  if (!item || !activeTab?.id) {
    return;
  }

  try {
    activeFocusId = button.dataset.focusId;
    updateActiveFocusCard();
    renderCompanion(getCadenceState({ isAnalyzing: false, score: lastScore, isPointing: true }));
    await chrome.tabs.sendMessage(activeTab.id, {
      type: "EA_FOCUS_TEXT",
      ...item
    });
    setTimeout(() => {
      renderCompanion(getCadenceState({ isAnalyzing: false, score: lastScore }));
    }, 1800);
  } catch {
    renderMessage("Reload the Google Doc tab once, then run Analyze again so document focusing can connect.");
  }
}

function registerFocusItem(item) {
  const id = `focus-${focusItems.size}`;
  focusItems.set(id, item);
  return id;
}

function updateActiveFocusCard() {
  document.querySelectorAll("[data-focus-card]").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.focusCard === activeFocusId);
  });
}

async function copySuggestion(id) {
  const item = focusItems.get(id);
  if (!item?.suggestion) {
    return;
  }

  await navigator.clipboard.writeText(item.suggestion);
  const button = document.querySelector(`[data-copy-id="${CSS.escape(id)}"]`);
  if (button) {
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy direction";
    }, 1500);
  }
  activeFocusId = id;
  updateActiveFocusCard();
}

function scoreTone(score) {
  return getScoreTone(score);
}

function summaryMessage(score) {
  return getScoreInsight(score);
}

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
    <div class="editorialSignal ${state}" aria-hidden="true">
      <span class="signalFeather"></span>
      <span class="signalNib"></span>
      <span class="signalPulse"></span>
    </div>
    <div class="cadenceCopy">
      <div class="cadenceKicker">Editorial pulse</div>
      <p>${escapeHtml(quietMode ? "Quiet mode is on. Analysis stays active." : getCadenceMessage(state))}</p>
      <label class="quietToggle">
        <input id="quietModeToggle" type="checkbox" ${quietMode ? "checked" : ""}>
        <span>Quiet mode</span>
      </label>
    </div>
  `;
}

function levelLabel(level) {
  if (level === "red") {
    return "Needs proof";
  }
  if (level === "yellow") {
    return "Polish";
  }
  return "Strong";
}

function severityLabel(severity) {
  if (severity === "high") {
    return "high attention";
  }
  if (severity === "medium") {
    return "worth polishing";
  }
  return "light note";
}

function pulseTitle(score) {
  if (score < 70) {
    return "Shape the proof first";
  }
  if (score < 88) {
    return "Good draft, a few rough edges";
  }
  return "Strong draft, ready to polish";
}

function issueTitle(issue) {
  const titles = {
    rhythm: "Rhythm feels too even",
    predictability: "This phrase feels expected",
    structure: "The structure feels too symmetrical",
    specificity: "This needs proof",
    voice: "The line could sound more alive"
  };

  return titles[issue.category] ?? severityLabel(issue.severity);
}

function applyMetricFilter() {
  document.querySelectorAll("[data-score-filter]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.scoreFilter === activeMetric);
  });

  document.querySelectorAll("[data-category]").forEach((card) => {
    const isVisible = activeMetric === "all" || card.dataset.category === activeMetric;
    card.classList.toggle("is-dimmed", !isVisible);
  });

  const firstMatch = document.querySelector(`[data-category="${CSS.escape(activeMetric)}"]`);
  if (firstMatch) {
    firstMatch.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
