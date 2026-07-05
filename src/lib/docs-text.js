export function extractTextBlocks(document) {
  const content = document?.body?.content;
  if (!Array.isArray(content)) {
    return [];
  }

  const blocks = [];

  for (const item of content) {
    if (!item.paragraph) {
      continue;
    }

    const text = extractParagraphText(item.paragraph);
    if (!text) {
      continue;
    }

    blocks.push({
      id: `block-${blocks.length}`,
      kind: getParagraphKind(item.paragraph),
      text,
      index: blocks.length
    });
  }

  return blocks;
}

function extractParagraphText(paragraph) {
  return (paragraph.elements ?? [])
    .map((element) => element.textRun?.content ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function getParagraphKind(paragraph) {
  if (paragraph.bullet) {
    return "bullet";
  }

  const style = paragraph.paragraphStyle?.namedStyleType ?? "";
  if (style.startsWith("HEADING")) {
    return "heading";
  }

  return "paragraph";
}
