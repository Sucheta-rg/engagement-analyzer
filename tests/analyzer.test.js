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
  assert.equal(result.fixPriority.length > 0, true);
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
  assert.equal(result.heatmap[0].level !== "green", true);
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
  assert.equal(result.specificityBoosters.length, 1);
});

test("flags symmetrical bullet structure", () => {
  const result = analyzeBlocks([
    { id: "block-0", kind: "bullet", index: 0, text: "Improve draft clarity now" },
    { id: "block-1", kind: "bullet", index: 1, text: "Improve reader trust fast" },
    { id: "block-2", kind: "bullet", index: 2, text: "Improve content flow today" },
    { id: "block-3", kind: "bullet", index: 3, text: "Improve message quality quickly" }
  ]);

  assert.equal(result.issues.some((issue) => issue.category === "structure"), true);
});
