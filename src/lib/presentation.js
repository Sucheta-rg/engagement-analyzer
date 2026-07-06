export function getScoreTone(score) {
  if (score < 70) {
    return "danger";
  }
  if (score < 88) {
    return "warning";
  }
  return "strong";
}

export function getScoreInsight(score) {
  if (score < 70) {
    return "Do the proof-gap edits first. Style can wait.";
  }
  if (score < 88) {
    return "Start with one proof gap, then re-check the draft.";
  }
  return "Strong draft. Clean the marked notes and ship it.";
}

export function getMetricFocus(label, score) {
  if (score >= 88) {
    return strongMetricCopy(label);
  }

  const copy = {
    Rhythm: "Mix one short sentence with one longer proof sentence.",
    Predictability: "Replace the most familiar phrase with plain language.",
    Structure: "Move the strongest point before the supporting detail.",
    Specificity: "Add one number, example, customer, or consequence."
  };

  return copy[label] ?? "Review the marked passages for reader friction.";
}

export function getReviewIntro(count) {
  if (count === 0) {
    return "No major edits needed. Do a final read-through.";
  }
  if (count === 1) {
    return "Make this one edit first.";
  }
  return `Start with the first of ${countToWord(count).toLowerCase()} edits.`;
}

export function getMascotState({ isAnalyzing, score }) {
  if (isAnalyzing) {
    return "writing";
  }
  if (typeof score !== "number") {
    return "ready";
  }
  if (score >= 88) {
    return "bright";
  }
  if (score >= 70) {
    return "focused";
  }
  return "supportive";
}

export function getStatusLabel(level, issueCount) {
  if (level === "red") {
    return "Needs proof";
  }
  if (level === "yellow") {
    return "Polish";
  }
  return issueCount > 0 ? "Clear" : "";
}

function strongMetricCopy(label) {
  const copy = {
    Rhythm: "Sentence rhythm feels varied and easy to follow.",
    Predictability: "The draft avoids overly expected phrasing.",
    Structure: "The structure is clear enough to scan.",
    Specificity: "The draft has enough proof to feel grounded."
  };

  return copy[label] ?? "This part is working well.";
}

function countToWord(count) {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five"];
  return words[count] ?? String(count);
}
