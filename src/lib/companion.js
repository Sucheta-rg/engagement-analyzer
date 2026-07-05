export const DEFAULT_QUIET_MODE = false;

export const CADENCE_MESSAGES = {
  ready: "Open a draft. I will mark rhythm, repetition, and proof gaps.",
  thinking: "Reading rhythm, patterns, and proof points.",
  strong: "This draft is moving well. Polish the marked passages.",
  watchful: "Good base. A few lines need sharper proof.",
  concerned: "Start with the proof gaps. They are costing clarity.",
  pointing: "I marked the passage in your draft."
};

export function getCadenceState({ isAnalyzing, score, isPointing = false }) {
  if (isPointing) {
    return "pointing";
  }

  if (isAnalyzing) {
    return "thinking";
  }

  if (typeof score !== "number") {
    return "ready";
  }

  if (score >= 88) {
    return "strong";
  }

  if (score >= 70) {
    return "watchful";
  }

  return "concerned";
}

export function getCadenceMessage(state) {
  return CADENCE_MESSAGES[state] ?? CADENCE_MESSAGES.ready;
}
