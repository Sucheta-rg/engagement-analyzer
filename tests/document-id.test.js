import test from "node:test";
import assert from "node:assert/strict";
import { extractDocumentId, isGoogleDocsDocumentUrl } from "../src/lib/document-id.js";

test("detects Google Docs document URLs", () => {
  assert.equal(isGoogleDocsDocumentUrl("https://docs.google.com/document/d/abc123/edit"), true);
  assert.equal(isGoogleDocsDocumentUrl("https://docs.google.com/spreadsheets/d/abc123/edit"), false);
  assert.equal(isGoogleDocsDocumentUrl("https://example.com/document/d/abc123/edit"), false);
});

test("extracts document ID from edit URL", () => {
  assert.equal(
    extractDocumentId("https://docs.google.com/document/d/1A2B-_-xyz/edit"),
    "1A2B-_-xyz"
  );
});

test("extracts document ID from URL with query string", () => {
  assert.equal(
    extractDocumentId("https://docs.google.com/document/d/doc987/edit?tab=t.0"),
    "doc987"
  );
});

test("returns null for unsupported URLs", () => {
  assert.equal(extractDocumentId("https://docs.google.com/document/u/0/"), null);
  assert.equal(extractDocumentId("not a url"), null);
});
