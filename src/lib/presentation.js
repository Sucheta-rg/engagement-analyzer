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
    return "Start with the proof gaps before polishing style.";
  }
  if (score < 88) {
    return "Good base. A few passages need sharper proof.";
  }
  return "Strong draft. Use the marked notes for final polish.";
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
    return "No major writing signals found.";
  }
  if (count === 1) {
    return "One note is worth reviewing first.";
  }
  return `${countToWord(count)} notes are worth reviewing first.`;
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
