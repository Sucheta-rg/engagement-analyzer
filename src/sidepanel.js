import { analyzeBlocks } from "./lib/analyzer.js";
import { getCadenceMessage, getCadenceState } from "./lib/companion.js";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "./lib/document-id.js";
import { fetchGoogleDocument, getActiveTab, requestDocsToken } from "./lib/docs-api.js";
import { extractTextBlocks } from "./lib/docs-text.js";
import {
  getEditPrompt,
  getIssueAction,
  getIssueReason,
  getMetricFocus,
  getMascotState,
  getNextQueueIndex,
  getReviewIntro,
  getRewriteOptions,
  getScoreScaleCopy,
  getScoreInsight,
  getScoreTone,
  getStatusLabel
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
let reviewQueue = [];
let queueIndex = 0;
let queueStatus = {};

init();

async function init() {
  quietMode = await loadQuietMode();
  renderCompanion(getCadenceState({ isAnalyzing: false, score: null }));

  activeTab = await getActiveTab();
  if (!activeTab?.url || !isGoogleDocsDocumentUrl(activeTab.url)) {
    analyzeButton.disabled = true;
    docStatus.textContent = "Open a Google Doc to review your draft.";
    return;
  }

  analyzeButton.disabled = false;
  docStatus.textContent = "Ready to find the next useful edit.";
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
  queueIndex = 0;
  queueStatus = {};
  reviewQueue = result.fixPriority.map((issue, index) => ({
    ...issue,
    queueId: `queue-${index}`
  }));
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
        <span>score</span>
      </div>
      <div class="pulseCopy">
        <span class="eyebrow">Overall score</span>
        <h2>${pulseTitle(result.overallScore)}</h2>
        <p>${summaryMessage(result.overallScore)}</p>
        <small>${getScoreScaleCopy()}</small>
      </div>
    </div>
    <div class="filterHeader">
      <span>Filter notes by score area</span>
      <button class="clearFilterButton" type="button" data-score-filter="all">Clear</button>
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
      <span class="eyebrow">Priority queue</span>
      <h2>${result.fixPriority.length ? `Step 1 of ${result.fixPriority.length}: Fix this first` : "No priority edits"}</h2>
      <p>${getReviewIntro(result.fixPriority.length)}</p>
    </div>
    <div id="queueMount" class="queueMount">${renderQueueCard()}</div>
  `;

  boosters.innerHTML = `
    <div class="sectionTitle">
      <h2>Detail Options</h2>
      <span>Make it concrete</span>
    </div>
    ${result.specificityBoosters.map(renderBooster).join("")}
  `;

  issues.innerHTML = result.issues.length
    ? `<div class="sectionTitle"><h2>Other useful edits</h2><span>${result.issues.length} total</span></div>${result.issues.map((issue, index) => renderIssue(issue, index)).join("")}`
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
    label: `${levelLabel(entry.level, entry.issueCount)} passage`,
    message: `${entry.issueCount} note${entry.issueCount === 1 ? "" : "s"} found in this block.`,
    suggestion: "Review this block for rhythm, specificity, and generic phrasing."
  });

  return `
    <article class="heatmapBar ${entry.level}" data-focus-card="${focusId}">
      <button class="heatmapButton" type="button" data-focus-id="${focusId}">
        ${renderStatusPill(entry.level, entry.issueCount)}
        <span class="preview">${escapeHtml(entry.preview)}${entry.preview.length >= 130 ? "..." : ""}</span>
      </button>
    </article>
  `;
}

function renderQueueCard() {
  if (!reviewQueue.length) {
    return renderCleanIssue();
  }

  const availableIndex = reviewQueue.findIndex((issue) => {
    const status = queueStatus[issue.queueId];
    return status !== "done" && status !== "skipped";
  });

  if (availableIndex === -1) {
    return `
      <article class="queueCard queueDone">
        <div class="queueMark">Done</div>
        <h3>Priority edits are complete</h3>
        <p>Re-analyze after editing to check the draft again.</p>
      </article>
    `;
  }

  if (queueStatus[reviewQueue[queueIndex]?.queueId]) {
    queueIndex = availableIndex;
  }

  const issue = reviewQueue[queueIndex] ?? reviewQueue[availableIndex];
  const activeIndex = reviewQueue.indexOf(issue);
  const focusId = registerFocusItem({
    text: issue.sentence ?? issue.excerpt ?? issue.message,
    label: getIssueAction(issue),
    message: getIssueReason(issue),
    suggestion: getClipboardText(issue)
  });
  const completedCount = Object.values(queueStatus).filter(Boolean).length;
  const rewriteOptions = getRewriteOptions(issue);

  return `
    <article class="queueCard ${issue.severity}" data-focus-card="${focusId}" data-category="${issue.category}">
      <div class="queueTop">
        <span class="queueProgress">Step ${activeIndex + 1} of ${reviewQueue.length}</span>
        <span class="queueCounter">${completedCount} cleared</span>
      </div>
      <h3>${escapeHtml(getIssueAction(issue))}</h3>
      <blockquote>${escapeHtml(issue.sentence ?? issue.excerpt ?? issue.message)}</blockquote>
      <p class="issueReason">${escapeHtml(getIssueReason(issue))}</p>
      <div class="nextMove">
        <span>Edit prompt</span>
        <p>${escapeHtml(getEditPrompt(issue))}</p>
      </div>
      <div class="rewriteBox">
        <span>Suggested rewrite</span>
        <ul>
          ${rewriteOptions.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}
        </ul>
      </div>
      <div class="issueActions">
        <button class="secondaryButton" type="button" data-focus-id="${focusId}">Locate</button>
        <button class="copyButton" type="button" data-copy-id="${focusId}">Copy rewrite</button>
        <button class="doneButton" type="button" data-queue-action="done">Done with this edit</button>
        <button class="ghostButton" type="button" data-queue-action="skip">Skip this edit</button>
        <button class="ghostButton" type="button" data-queue-action="next">Show another edit</button>
      </div>
      <p class="queueFeedback" id="queueFeedback" aria-live="polite"></p>
    </article>
  `;
}

function renderIssue(issue, index = 0) {
  const focusId = registerFocusItem({
    text: issue.sentence ?? issue.excerpt ?? issue.message,
    label: getIssueAction(issue),
    message: getIssueReason(issue),
    suggestion: getClipboardText(issue)
  });
  const rewriteOptions = getRewriteOptions(issue);

  return `
    <article class="issue ${issue.severity}" data-focus-card="${focusId}" data-category="${issue.category}">
      <div class="issueTop">
        <div>
          <div class="issueMeta">Note ${index + 1} - ${escapeHtml(issue.label)}</div>
          <h3>${escapeHtml(getIssueAction(issue))}</h3>
        </div>
      </div>
      <blockquote>${escapeHtml(issue.sentence ?? issue.excerpt ?? issue.message)}</blockquote>
      <p class="issueMessage">${escapeHtml(getIssueReason(issue))}</p>
      <div class="nextMove">
        <span>Edit prompt</span>
        <p>${escapeHtml(getEditPrompt(issue))}</p>
      </div>
      <div class="rewriteBox">
        <span>Suggested rewrite</span>
        <ul>
          ${rewriteOptions.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}
        </ul>
      </div>
      <div class="issueActions">
        <button class="secondaryButton" type="button" data-focus-id="${focusId}">Locate</button>
        <button class="copyButton" type="button" data-copy-id="${focusId}">Copy rewrite</button>
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
      <div class="nextMove">
        <span>Detail prompt</span>
        <p>${escapeHtml(booster.suggestion)}</p>
      </div>
      <div class="issueActions">
        <button class="secondaryButton" type="button" data-focus-id="${focusId}">Locate</button>
        <button class="copyButton" type="button" data-copy-id="${focusId}">Copy edit prompt</button>
      </div>
    </article>
  `;
}

function renderCleanIssue() {
  return `<article class="issue low"><p class="issueMessage">No major notes found. Do a final read-through.</p></article>`;
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
  const queueButton = event.target.closest("[data-queue-action]");
  if (queueButton) {
    handleQueueAction(queueButton.dataset.queueAction);
    return;
  }

  const scoreButton = event.target.closest("[data-score-filter]");
  if (scoreButton) {
    activeMetric = scoreButton.dataset.scoreFilter === "all" || activeMetric === scoreButton.dataset.scoreFilter
      ? "all"
      : scoreButton.dataset.scoreFilter;
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
    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: "EA_FOCUS_TEXT",
      ...item
    });
    showLocateFeedback(response?.found === false
      ? "Could not jump exactly. Use the overlay text to search this line manually."
      : "Marked in the draft.");
    setTimeout(() => {
      renderCompanion(getCadenceState({ isAnalyzing: false, score: lastScore }));
    }, 1800);
  } catch {
    renderMessage("Reload the Google Doc tab once, then run Analyze again so document focusing can connect.");
  }
}

function handleQueueAction(action) {
  const currentIssue = reviewQueue[queueIndex];
  if (!currentIssue) {
    return;
  }

  if (action === "done" || action === "skip") {
    queueStatus[currentIssue.queueId] = action === "done" ? "done" : "skipped";
  }

  const statusesById = Object.fromEntries(reviewQueue.map((issue) => [issue.queueId, queueStatus[issue.queueId]]));
  const nextIndex = getNextQueueIndex(
    reviewQueue.map((issue) => ({ ...issue, id: issue.queueId })),
    queueIndex,
    statusesById
  );
  queueIndex = nextIndex === -1 ? 0 : nextIndex;
  renderQueueMount();
  showLocateFeedback(action === "done"
    ? "Marked done. Re-analyze after editing to verify it."
    : action === "skip"
      ? "Skipped. Re-analyze later to bring it back."
      : "Showing another edit.");
}

function renderQueueMount() {
  const queueMount = document.querySelector("#queueMount");
  if (!queueMount) {
    return;
  }

  queueMount.innerHTML = renderQueueCard();
  applyMetricFilter();
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
    const originalText = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  }
  activeFocusId = id;
  updateActiveFocusCard();
}

function getClipboardText(issue) {
  const options = getRewriteOptions(issue);
  return [
    getEditPrompt(issue),
    "",
    "Suggested rewrite:",
    ...options.map((option) => `- ${option}`)
  ].join("\n");
}

function showLocateFeedback(message) {
  const feedback = document.querySelector("#queueFeedback");
  if (feedback) {
    feedback.textContent = message;
  }
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
  const mascotState = getMascotState({ isAnalyzing: state === "thinking", score: lastScore });
  companion.classList.toggle("is-quiet", quietMode);
  companion.innerHTML = `
    <div class="inklet ${mascotState}" aria-hidden="true">
      <span class="inkletQuill"></span>
      <span class="inkletFace"></span>
      <span class="inkletBlush"></span>
    </div>
    <div class="cadenceCopy">
      <div class="cadenceKicker">Inklet</div>
      <p>${escapeHtml(quietMode ? "Quiet mode is on. Analysis stays active." : getCadenceMessage(state))}</p>
      <label class="quietToggle">
        <input id="quietModeToggle" type="checkbox" ${quietMode ? "checked" : ""}>
        <span>Quiet mode</span>
      </label>
    </div>
  `;
}

function levelLabel(level, issueCount = 1) {
  return getStatusLabel(level, issueCount) || "Clear";
}

function renderStatusPill(level, issueCount) {
  const label = getStatusLabel(level, issueCount);
  if (!label) {
    return `<span class="heatmapDot ${level}" aria-hidden="true"></span>`;
  }

  return `<span class="heatmapLevel ${level}">${label}</span>`;
}

function pulseTitle(score) {
  if (score < 70) {
    return "Add concrete detail first";
  }
  if (score < 88) {
    return "Good draft, a few rough edges";
  }
  return "Strong draft, ready to polish";
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
  if (activeMetric !== "all" && firstMatch) {
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
