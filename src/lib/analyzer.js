import { averageScore, clampScore, scoreFromPenalty } from "./score.js";

const GENERIC_PHRASES = [
  "in today's fast-paced",
  "it is important to note",
  "delve into",
  "leverage",
  "unlock the power",
  "game-changer",
  "digital landscape",
  "seamlessly",
  "robust solution",
  "cutting-edge",
  "transform your business",
  "synergy",
  "empower",
  "thought leader",
  "streamline",
  "value proposition",
  "best-in-class",
  "next-generation",
  "future-proof",
  "drive growth",
  "elevate your",
  "at scale",
  "holistic approach",
  "actionable insights",
  "mission-critical",
  "industry-leading"
];

const ABSTRACT_TERMS = [
  "optimization",
  "innovation",
  "transformation",
  "performance",
  "efficiency",
  "value",
  "solution",
  "capabilities",
  "strategy",
  "growth",
  "success"
];

const CATEGORY_WEIGHT = {
  rhythm: 1.1,
  predictability: 1.15,
  structure: 1,
  specificity: 1.25,
  voice: 1
};

export function analyzeBlocks(blocks) {
  const issues = [];
  const heatmap = [];
  const penalties = {
    rhythm: 0,
    predictability: 0,
    structure: 0,
    specificity: 0,
    voice: 0
  };

  blocks.forEach((block) => {
    const beforeCount = issues.length;
    const sentences = splitSentences(block.text);

    pushIssue(issues, penalties, detectUniformRhythm(block, sentences));
    for (const issue of detectGenericPhrases(block)) {
      pushIssue(issues, penalties, issue);
    }
    pushIssue(issues, penalties, detectRepeatedStarts(block, sentences));
    pushIssue(issues, penalties, detectLowSpecificity(block));

    const blockIssues = issues.slice(beforeCount);
    heatmap.push(createHeatmapEntry(block, blockIssues));
  });

  pushIssue(issues, penalties, detectBulletSymmetry(blocks));

  const rhythmScore = scoreFromPenalty(penalties.rhythm);
  const predictabilityScore = scoreFromPenalty(penalties.predictability);
  const structureScore = scoreFromPenalty(penalties.structure);
  const specificityScore = scoreFromPenalty(penalties.specificity);
  const voiceScore = scoreFromPenalty(penalties.voice);
  const fixPriority = rankFixes(issues);
  const specificityBoosters = createSpecificityBoosters(issues);

  return {
    overallScore: averageScore([
      rhythmScore,
      predictabilityScore,
      structureScore,
      specificityScore,
      voiceScore
    ]),
    rhythmScore,
    predictabilityScore,
    structureScore,
    specificityScore,
    voiceScore,
    issues,
    heatmap,
    fixPriority,
    specificityBoosters
  };
}

export function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]+/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pushIssue(issues, penalties, issue) {
  if (!issue) {
    return;
  }

  issues.push(issue);
  penalties[issue.category] += severityPenalty(issue.severity) * (CATEGORY_WEIGHT[issue.category] ?? 1);
}

function detectUniformRhythm(block, sentences) {
  if (sentences.length < 4) {
    return null;
  }

  const lengths = sentences.map((sentence) => sentence.split(/\s+/).length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);

  if (max - min > 3) {
    return null;
  }

  return {
    id: `rhythm-${block.index}`,
    severity: "medium",
    category: "rhythm",
    label: "Repeated sentence shape",
    blockIndex: block.index,
    excerpt: block.text,
    message: "Several nearby sentences have nearly identical length, which can make the paragraph feel mechanical.",
    suggestion: "Vary the rhythm by combining one idea, shortening another, and adding one concrete detail.",
    boosterQuestion: "Which sentence can become shorter, sharper, or more specific?"
  };
}

function detectGenericPhrases(block) {
  const lower = block.text.toLowerCase();
  return GENERIC_PHRASES.filter((phrase) => lower.includes(phrase)).map((phrase, index) => ({
    id: `predictability-${block.index}-${index}`,
    severity: phrase === "leverage" ? "low" : "medium",
    category: "predictability",
    label: "Generic phrase",
    blockIndex: block.index,
    sentence: findSentenceContaining(block.text, phrase),
    message: `The phrase "${phrase}" is common in generic marketing copy.`,
    suggestion: "Replace it with a specific, plain-language phrase that matches the actual point.",
    boosterQuestion: "What would your target reader say instead of this phrase?"
  }));
}

function detectRepeatedStarts(block, sentences) {
  if (sentences.length < 3) {
    return null;
  }

  const starts = sentences.map((sentence) =>
    sentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).slice(0, 2).join(" ")
  );

  const counts = new Map();
  starts.forEach((start) => counts.set(start, (counts.get(start) ?? 0) + 1));
  const repeated = [...counts.entries()].find(([start, count]) => start && count >= 3);

  if (!repeated) {
    return null;
  }

  return {
    id: `voice-${block.index}`,
    severity: "medium",
    category: "voice",
    label: "Flat cadence",
    blockIndex: block.index,
    excerpt: block.text,
    message: `Multiple sentences start with "${repeated[0]}", creating a repetitive cadence.`,
    suggestion: "Change the sentence openings so each idea enters from a different angle.",
    boosterQuestion: "Can one sentence start with the outcome, tension, or example instead?"
  };
}

function detectLowSpecificity(block) {
  if (block.kind === "heading" || block.text.split(/\s+/).length < 8) {
    return null;
  }

  const lower = block.text.toLowerCase();
  const abstractHits = ABSTRACT_TERMS.filter((term) => lower.includes(term)).length;
  const hasNumber = /\d/.test(block.text);
  const hasExampleMarker = /\b(for example|such as|including)\b/i.test(block.text);

  if (abstractHits < 4 || hasNumber || hasExampleMarker) {
    return null;
  }

  return {
    id: `specificity-${block.index}`,
    severity: "high",
    category: "specificity",
    label: "Specificity gap",
    blockIndex: block.index,
    excerpt: block.text,
    message: "This block leans on abstract claims without concrete proof or examples.",
    suggestion: "Add a named example, number, customer detail, or observable outcome.",
    boosterQuestion: "Can you add a number, named audience, example, or consequence?"
  };
}

function detectBulletSymmetry(blocks) {
  const bullets = blocks.filter((block) => block.kind === "bullet");
  if (bullets.length < 4) {
    return null;
  }

  const lengths = bullets.map((block) => block.text.split(/\s+/).length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);

  if (max - min > 3) {
    return null;
  }

  return {
    id: "structure-bullets",
    severity: "medium",
    category: "structure",
    label: "Symmetrical list",
    blockIndex: bullets[0].index,
    excerpt: bullets[0].text,
    message: "The bullet list has very similar item lengths, which can read like a generated outline.",
    suggestion: "Make one bullet more specific, merge a weak item, and vary the syntax of the list.",
    boosterQuestion: "Which bullet deserves a proof point, caveat, or concrete example?"
  };
}

function createHeatmapEntry(block, issues) {
  const penalty = issues.reduce((sum, issue) => sum + severityPenalty(issue.severity), 0);
  const score = clampScore(100 - penalty);
  const level = score < 70 ? "red" : score < 88 ? "yellow" : "green";

  return {
    blockIndex: block.index,
    kind: block.kind,
    score,
    level,
    preview: block.text.slice(0, 130),
    issueCount: issues.length
  };
}

function rankFixes(issues) {
  return dedupeIssues(issues)
    .sort((a, b) => severityPenalty(b.severity) - severityPenalty(a.severity))
    .slice(0, 5);
}

function dedupeIssues(issues) {
  const seen = new Set();

  return issues.filter((issue) => {
    const key = `${issue.category}:${issue.label}:${issue.message}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createSpecificityBoosters(issues) {
  return issues
    .filter((issue) => issue.category === "specificity" || issue.category === "predictability")
    .slice(0, 4)
    .map((issue) => ({
      id: `booster-${issue.id}`,
      blockIndex: issue.blockIndex,
      question: issue.boosterQuestion,
      suggestion: issue.suggestion
    }));
}

function findSentenceContaining(text, phrase) {
  return splitSentences(text).find((sentence) => sentence.toLowerCase().includes(phrase)) ?? text;
}

function severityPenalty(severity) {
  if (severity === "high") {
    return 24;
  }
  if (severity === "medium") {
    return 14;
  }
  return 7;
}
