import test from "node:test";
import assert from "node:assert/strict";
import { extractTextBlocks } from "../src/lib/docs-text.js";

const sampleDoc = {
  body: {
    content: [
      {
        paragraph: {
          paragraphStyle: { namedStyleType: "HEADING_1" },
          elements: [{ textRun: { content: "Launch Plan\n" } }]
        }
      },
      {
        paragraph: {
          elements: [
            { textRun: { content: "This is a clear first sentence. " } },
            { textRun: { content: "This is a second sentence.\n" } }
          ]
        }
      },
      {
        paragraph: {
          bullet: { listId: "kix.list" },
          elements: [{ textRun: { content: "A bullet point\n" } }]
        }
      },
      {
        table: {}
      }
    ]
  }
};

test("extracts headings, paragraphs, and bullets", () => {
  assert.deepEqual(extractTextBlocks(sampleDoc), [
    { id: "block-0", kind: "heading", text: "Launch Plan", index: 0 },
    {
      id: "block-1",
      kind: "paragraph",
      text: "This is a clear first sentence. This is a second sentence.",
      index: 1
    },
    { id: "block-2", kind: "bullet", text: "A bullet point", index: 2 }
  ]);
});

test("returns empty array for missing content", () => {
  assert.deepEqual(extractTextBlocks({}), []);
});
