import { analyzeBlocks } from "./lib/analyzer.js";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "./lib/document-id.js";
import { fetchGoogleDocument, getActiveTab, requestDocsToken } from "./lib/docs-api.js";
import { extractTextBlocks } from "./lib/docs-text.js";

const analyzeButton = document.querySelector("#analyzeButton");
const docStatus = document.querySelector("#docStatus");
const summary = document.querySelector("#summary");
const heatmap = document.querySelector("#heatmap");
const priority = document.querySelector("#priority");
const boosters = document.querySelector("#boosters");
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
  docStatus.textContent = "Ready to analyze robotic rhythm and engagement risk.";
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
  heatmap.classList.remove("is-hidden");
  priority.classList.remove("is-hidden");
  boosters.classList.toggle("is-hidden", result.specificityBoosters.length === 0);

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

  heatmap.innerHTML = `
    <h2>Robotic Writing Heatmap</h2>
    <div class="heatmapBars">
      ${result.heatmap.slice(0, 12).map(renderHeatmapEntry).join("")}
    </div>
  `;

  priority.innerHTML = `
    <h2>Fix These First</h2>
    <div class="issues">
      ${result.fixPriority.length ? result.fixPriority.map(renderIssue).join("") : renderCleanIssue()}
    </div>
  `;

  boosters.innerHTML = `
    <h2>Specificity Boosters</h2>
    ${result.specificityBoosters.map(renderBooster).join("")}
  `;

  issues.innerHTML = result.issues.length
    ? `<h2>All Signals</h2>${result.issues.map(renderIssue).join("")}`
    : "";
}

function scoreCard(label, score) {
  return `<div class="score"><strong>${score}</strong><span>${label}</span></div>`;
}

function renderHeatmapEntry(entry) {
  return `
    <article class="heatmapBar">
      <span class="heatmapLevel ${entry.level}">${entry.level}</span>
      <p class="preview">${escapeHtml(entry.preview)}${entry.preview.length >= 130 ? "..." : ""}</p>
    </article>
  `;
}

function renderIssue(issue) {
  return `
    <article class="issue ${issue.severity}">
      <div class="issueMeta">${escapeHtml(issue.label)} · ${issue.category} · ${issue.severity}</div>
      <p class="issueMessage">${escapeHtml(issue.message)}</p>
      <p class="suggestion">${escapeHtml(issue.suggestion)}</p>
    </article>
  `;
}

function renderBooster(booster) {
  return `
    <article class="booster">
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
