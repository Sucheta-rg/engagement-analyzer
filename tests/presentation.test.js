import assert from "node:assert/strict";
import test from "node:test";
import {
  getScoreInsight,
  getScoreTone,
  getMetricFocus,
  getReviewIntro
} from "../src/lib/presentation.js";

test("maps score to tone for the studio UI", () => {
  assert.equal(getScoreTone(92), "strong");
  assert.equal(getScoreTone(76), "warning");
  assert.equal(getScoreTone(45), "danger");
});

test("returns warm score insight copy", () => {
  assert.equal(getScoreInsight(92), "Strong draft. Use the marked notes for final polish.");
  assert.equal(getScoreInsight(76), "Good base. A few passages need sharper proof.");
  assert.equal(getScoreInsight(45), "Start with the proof gaps before polishing style.");
});

test("returns metric-specific focus copy", () => {
  assert.equal(getMetricFocus("Predictability", 52), "Expected phrasing is pulling the draft down.");
  assert.equal(getMetricFocus("Rhythm", 100), "Sentence rhythm feels varied and easy to follow.");
  assert.equal(getMetricFocus("Specificity", 72), "Add concrete examples where claims feel broad.");
});

test("builds guided review intro from issue count", () => {
  assert.equal(getReviewIntro(0), "No major writing signals found.");
  assert.equal(getReviewIntro(1), "One note is worth reviewing first.");
  assert.equal(getReviewIntro(4), "Four notes are worth reviewing first.");
});
