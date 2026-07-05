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
    Rhythm: "Vary sentence length so the draft feels less mechanical.",
    Predictability: "Expected phrasing is pulling the draft down.",
    Structure: "Group related ideas so the reader can follow the argument.",
    Specificity: "Add concrete examples where claims feel broad."
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
