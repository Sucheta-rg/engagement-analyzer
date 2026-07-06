import assert from "node:assert/strict";
import test from "node:test";
import {
  getScoreInsight,
  getScoreTone,
  getMetricFocus,
  getReviewIntro,
  getMascotState,
  getStatusLabel,
  getIssueAction,
  getIssueReason,
  getEditPrompt,
  getNextQueueIndex,
  getRewriteOptions,
  getScoreScaleCopy
} from "../src/lib/presentation.js";

test("maps score to tone for the studio UI", () => {
  assert.equal(getScoreTone(92), "strong");
  assert.equal(getScoreTone(76), "warning");
  assert.equal(getScoreTone(45), "danger");
});

test("returns warm score insight copy", () => {
  assert.equal(getScoreInsight(92), "Strong draft. Clean the marked notes and ship it.");
  assert.equal(getScoreInsight(76), "Start with the next edit, then re-check the draft.");
  assert.equal(getScoreInsight(45), "Fix the concrete-detail notes first. Style can wait.");
});

test("returns metric-specific focus copy", () => {
  assert.equal(getMetricFocus("Predictability", 52), "Replace the most familiar phrase with plain language.");
  assert.equal(getMetricFocus("Rhythm", 100), "Sentence rhythm feels varied and easy to follow.");
  assert.equal(getMetricFocus("Specificity", 72), "Add one number, example, customer, or consequence.");
});

test("builds guided review intro from issue count", () => {
  assert.equal(getReviewIntro(0), "No major edits needed. Do a final read-through.");
  assert.equal(getReviewIntro(1), "Make this edit first.");
  assert.equal(getReviewIntro(4), "Work through four useful edits, one at a time.");
});

test("maps score to mascot state", () => {
  assert.equal(getMascotState({ isAnalyzing: true, score: 90 }), "writing");
  assert.equal(getMascotState({ isAnalyzing: false, score: 92 }), "bright");
  assert.equal(getMascotState({ isAnalyzing: false, score: 76 }), "focused");
  assert.equal(getMascotState({ isAnalyzing: false, score: 42 }), "supportive");
});

test("uses restrained status labels", () => {
  assert.equal(getStatusLabel("green", 0), "");
  assert.equal(getStatusLabel("green", 2), "Clear");
  assert.equal(getStatusLabel("yellow", 1), "Polish");
  assert.equal(getStatusLabel("red", 3), "Needs detail");
});

test("turns issues into action-first writing guidance", () => {
  const specificity = {
    category: "specificity",
    message: "This claim is broad.",
    suggestion: "Add a customer, number, or consequence."
  };
  const predictability = {
    category: "predictability",
    label: "Generic phrase",
    sentence: "Delve into the topic.",
    suggestion: "Replace it with a plain phrase."
  };

  assert.equal(getIssueAction(specificity), "Add one concrete detail");
  assert.equal(getIssueReason(predictability), "This wording is familiar, so it may feel chosen too quickly.");
  assert.equal(getEditPrompt(specificity), "Add a customer, number, or consequence.");
});

test("finds the next available queue item", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const statuses = { b: "done" };

  assert.equal(getNextQueueIndex(items, 0, statuses), 2);
  assert.equal(getNextQueueIndex(items, 2, statuses), 0);
  assert.equal(getNextQueueIndex(items, 0, { a: "done", b: "skipped", c: "done" }), -1);
});

test("builds concrete rewrite options for common issue types", () => {
  const predictable = {
    category: "predictability",
    sentence: "Delve into the digital landscape to unlock the power of innovation."
  };
  const specificity = {
    category: "specificity",
    excerpt: "Our strategy improves performance, efficiency, value, growth, and success."
  };

  assert.deepEqual(getRewriteOptions(predictable).slice(0, 2), [
    "Replace the familiar phrase with the plainest version of the point.",
    "Name the actual action, result, or audience instead of using a broad marketing phrase."
  ]);
  assert.equal(getRewriteOptions(specificity)[0], "Add one proof point: a number, named audience, example, or business consequence.");
});

test("explains the score scale in writer-facing terms", () => {
  assert.equal(getScoreScaleCopy(), "Below 70: add detail first. 70-87: polish. 88+: final pass.");
});
