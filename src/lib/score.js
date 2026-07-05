export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreFromPenalty(penalty) {
  return clampScore(100 - penalty);
}

export function averageScore(scores) {
  if (!scores.length) {
    return 100;
  }

  return clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}
