import assert from "node:assert/strict";
import test from "node:test";
import {
  getScoreInsight,
  getScoreTone,
  getMetricFocus,
  getReviewIntro,
  getMascotState,
  getStatusLabel
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
  assert.equal(getMetricFocus("Predictability", 52), "Replace the most familiar phrase with plain language.");
  assert.equal(getMetricFocus("Rhythm", 100), "Sentence rhythm feels varied and easy to follow.");
  assert.equal(getMetricFocus("Specificity", 72), "Add one number, example, customer, or consequence.");
});

test("builds guided review intro from issue count", () => {
  assert.equal(getReviewIntro(0), "No major writing signals found.");
  assert.equal(getReviewIntro(1), "One note is worth reviewing first.");
  assert.equal(getReviewIntro(4), "Four notes are worth reviewing first.");
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
  assert.equal(getStatusLabel("red", 3), "Needs proof");
});
