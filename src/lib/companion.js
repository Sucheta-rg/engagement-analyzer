export const DEFAULT_QUIET_MODE = false;

export const CADENCE_MESSAGES = {
  ready: "Open a draft. I will watch for rhythm, repetition, and proof gaps.",
  thinking: "Reading rhythm, patterns, and proof points.",
  strong: "This draft has a strong pulse.",
  watchful: "Good base. A few lines need sharper proof.",
  concerned: "Start with the red signals. They are costing clarity.",
  pointing: "This is the section to tighten first."
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
