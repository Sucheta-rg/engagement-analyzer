import { analyzeBlocks } from "./lib/analyzer.js";
import { getCadenceMessage, getCadenceState } from "./lib/companion.js";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "./lib/document-id.js";
import { fetchGoogleDocument, getActiveTab, requestDocsToken } from "./lib/docs-api.js";
import { extractTextBlocks } from "./lib/docs-text.js";

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
  lastScore = result.overallScore;
  renderCompanion(getCadenceState({ isAnalyzing: false, score: result.overallScore }));
  emptyState.classList.add("is-hidden");
  summary.classList.remove("is-hidden");
  heatmap.classList.remove("is-hidden");
  priority.classList.remove("is-hidden");
  boosters.classList.toggle("is-hidden", result.specificityBoosters.length === 0);

  summary.innerHTML = `
    <div class="heroScore ${scoreTone(result.overallScore)}">
      <span>Draft health</span>
      <strong>${result.overallScore}</strong>
      <p>${summaryMessage(result.overallScore)}</p>
    </div>
    <div class="scoreGrid">
      ${scoreCard("Rhythm", result.rhythmScore)}
      ${scoreCard("Predictability", result.predictabilityScore)}
      ${scoreCard("Structure", result.structureScore)}
      ${scoreCard("Specificity", result.specificityScore)}
    </div>
  `;

  heatmap.innerHTML = `
    <div class="sectionTitle">
      <h2>Robotic Writing Map</h2>
      <span>Click to locate</span>
    </div>
    <div class="heatmapBars">
      ${result.heatmap.slice(0, 12).map(renderHeatmapEntry).join("")}
    </div>
  `;

  priority.innerHTML = `
    <div class="sectionTitle">
      <h2>Fix These First</h2>
      <span>${result.fixPriority.length} priority signals</span>
    </div>
    <div class="issues">
      ${result.fixPriority.length ? result.fixPriority.map(renderIssue).join("") : renderCleanIssue()}
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
    ? `<div class="sectionTitle"><h2>All Signals</h2><span>${result.issues.length} total</span></div>${result.issues.map(renderIssue).join("")}`
    : "";
}

function scoreCard(label, score) {
  return `<div class="score ${scoreTone(score)}"><strong>${score}</strong><span>${label}</span></div>`;
}

function renderHeatmapEntry(entry) {
  const focusId = registerFocusItem({
    text: entry.preview,
    label: `${entry.level.toUpperCase()} block`,
    message: `${entry.issueCount} writing signal${entry.issueCount === 1 ? "" : "s"} found in this block.`,
    suggestion: "Review this block for rhythm, specificity, and generic phrasing."
  });

  return `
    <article class="heatmapBar ${entry.level}">
      <button class="heatmapButton" type="button" data-focus-id="${focusId}">
        <span class="heatmapLevel ${entry.level}">${entry.level}</span>
        <span class="preview">${escapeHtml(entry.preview)}${entry.preview.length >= 130 ? "..." : ""}</span>
      </button>
    </article>
  `;
}

function renderIssue(issue) {
  const focusId = registerFocusItem({
    text: issue.sentence ?? issue.excerpt ?? issue.message,
    label: issue.label,
    message: issue.message,
    suggestion: issue.suggestion
  });

  return `
    <article class="issue ${issue.severity}">
      <div class="issueTop">
        <div class="issueMeta">${escapeHtml(issue.label)} - ${issue.category} - ${issue.severity}</div>
        <button class="focusButton" type="button" data-focus-id="${focusId}">Focus</button>
      </div>
      <p class="issueMessage">${escapeHtml(issue.message)}</p>
      <p class="suggestion">${escapeHtml(issue.suggestion)}</p>
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
    <article class="booster">
      <button class="focusButton" type="button" data-focus-id="${focusId}">Focus</button>
      <p class="issueMessage">${escapeHtml(booster.question)}</p>
      <p class="suggestion">${escapeHtml(booster.suggestion)}</p>
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
  const button = event.target.closest("[data-focus-id]");
  if (!button) {
    return;
  }

  const item = focusItems.get(button.dataset.focusId);
  if (!item || !activeTab?.id) {
    return;
  }

  try {
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

function scoreTone(score) {
  if (score < 70) {
    return "danger";
  }
  if (score < 88) {
    return "warning";
  }
  return "strong";
}

function summaryMessage(score) {
  if (score < 70) {
    return "High bounce risk. Start with the priority fixes.";
  }
  if (score < 88) {
    return "Good draft, but several sections still feel generic.";
  }
  return "Strong base. Review the yellow/red map items first.";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
