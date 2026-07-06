export const DEFAULT_QUIET_MODE = false;

export const CADENCE_MESSAGES = {
  ready: "Open a draft. I will help pick the next useful edit.",
  thinking: "Reading rhythm, repeated wording, and concrete detail.",
  strong: "Clean pass. A few small edits may still help.",
  watchful: "Good base. Start with the next edit below.",
  concerned: "Start with the next edit. Make one clear improvement first.",
  pointing: "Marked in the draft. Make the edit, then come back."
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
