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
    return "Fix the concrete-detail notes first. Style can wait.";
  }
  if (score < 88) {
    return "Start with the next edit, then re-check the draft.";
  }
  return "Strong draft. Clean the marked notes and ship it.";
}

export function getMetricFocus(label, score) {
  if (score >= 88) {
    return strongMetricCopy(label);
  }

  const copy = {
    Rhythm: "Mix one short sentence with one longer detail sentence.",
    Predictability: "Replace the most familiar phrase with plain language.",
    Structure: "Move the strongest point before the supporting detail.",
    Specificity: "Add one number, example, customer, or consequence."
  };

  return copy[label] ?? "Review the marked passages before shipping.";
}

export function getReviewIntro(count) {
  if (count === 0) {
    return "No major edits needed. Do a final read-through.";
  }
  if (count === 1) {
    return "Make this edit first.";
  }
  return `Work through ${countToWord(count).toLowerCase()} useful edits, one at a time.`;
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
    return "Needs detail";
  }
  if (level === "yellow") {
    return "Polish";
  }
  return issueCount > 0 ? "Clear" : "";
}

export function getIssueAction(issue) {
  const actions = {
    rhythm: "Break up the sentence pattern",
    predictability: "Replace this familiar phrase",
    structure: "Vary this list",
    specificity: "Add one concrete detail",
    voice: "Change the sentence opening"
  };

  return actions[issue?.category] ?? "Tighten this line";
}

export function getIssueReason(issue) {
  const reasons = {
    rhythm: "Several nearby sentences use a similar shape, so the paragraph can feel too even.",
    predictability: "This wording is familiar, so it may feel chosen too quickly.",
    structure: "The section has a repeated shape. Varying it helps the reader keep track.",
    specificity: "The claim is broad. One concrete detail will make it easier to trust.",
    voice: "The opening repeats a nearby pattern. A fresher start will feel more intentional."
  };

  return reasons[issue?.category] ?? "A small rewrite here will make the draft easier to read.";
}

export function getEditPrompt(issue) {
  if (issue?.suggestion) {
    return issue.suggestion;
  }

  const prompts = {
    rhythm: "Split one sentence or add a short follow-up sentence.",
    predictability: "Swap the phrase for the plainest version you would say to a client.",
    structure: "Move the strongest point first, then keep the support detail after it.",
    specificity: "Add one number, example, customer type, consequence, or named scenario.",
    voice: "Start the sentence with the actor, result, or tension instead."
  };

  return prompts[issue?.category] ?? "Rewrite the line with a clearer subject and one concrete detail.";
}

export function getNextQueueIndex(items, currentIndex, statuses = {}) {
  if (!items.length) {
    return -1;
  }

  for (let offset = 1; offset <= items.length; offset += 1) {
    const candidateIndex = (currentIndex + offset) % items.length;
    const candidate = items[candidateIndex];
    const status = statuses[candidate.id ?? String(candidateIndex)];
    if (status !== "done" && status !== "skipped") {
      return candidateIndex;
    }
  }

  return -1;
}

function strongMetricCopy(label) {
  const copy = {
    Rhythm: "Sentence rhythm feels varied and easy to follow.",
    Predictability: "The draft avoids overly expected phrasing.",
    Structure: "The structure is clear enough to scan.",
    Specificity: "The draft has enough detail to feel grounded."
  };

  return copy[label] ?? "This part is working well.";
}

function countToWord(count) {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five"];
  return words[count] ?? String(count);
}
