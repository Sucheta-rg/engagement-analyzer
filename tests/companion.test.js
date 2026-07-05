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
