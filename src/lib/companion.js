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

// ─── Penwick — vintage fountain pen mascot ────────────────────────────────────
// State mapping: ready/thinking/concerned → penwick states
// strong/watchful → proud   pointing → thinking

const _DEFS = `<defs>
  <radialGradient id="pw-barrel" cx="30%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#FFF4E4"/>
    <stop offset="100%" stop-color="#E8C898"/>
  </radialGradient>
  <radialGradient id="pw-cap" cx="30%" cy="25%" r="70%">
    <stop offset="0%" stop-color="#F0D8A8"/>
    <stop offset="100%" stop-color="#C89850"/>
  </radialGradient>
</defs>`;

function _eyes(cy = 84, { irisY = cy, irisColor = "#8A5018", irisRx = 3, irisRy = 3.5, scleraRx = 5, scleraRy = 6 } = {}) {
  const lx = 33, rx = 43, hdy = -1.6;
  return `
  <ellipse cx="${lx}" cy="${cy}" rx="${scleraRx}" ry="${scleraRy}" fill="#FFF8F0"/>
  <ellipse cx="${rx}" cy="${cy}" rx="${scleraRx}" ry="${scleraRy}" fill="#FFF8F0"/>
  <ellipse cx="${lx}" cy="${cy}" rx="${scleraRx - .5}" ry="${scleraRy - .5}" fill="none" stroke="#D4A030" stroke-width=".8"/>
  <ellipse cx="${rx}" cy="${cy}" rx="${scleraRx - .5}" ry="${scleraRy - .5}" fill="none" stroke="#D4A030" stroke-width=".8"/>
  <ellipse cx="${lx}" cy="${irisY}" rx="${irisRx}" ry="${irisRy}" fill="${irisColor}"/>
  <ellipse cx="${rx}" cy="${irisY}" rx="${irisRx}" ry="${irisRy}" fill="${irisColor}"/>
  <ellipse cx="${lx}" cy="${irisY}" rx="${irisRx * .53}" ry="${irisRy * .51}" fill="#1A0800"/>
  <ellipse cx="${rx}" cy="${irisY}" rx="${irisRx * .53}" ry="${irisRy * .51}" fill="#1A0800"/>
  <ellipse cx="${lx - 1.2}" cy="${irisY + hdy}" rx="1.1" ry=".9" fill="rgba(255,255,255,.95)"/>
  <ellipse cx="${rx - 1.2}" cy="${irisY + hdy}" rx="1.1" ry=".9" fill="rgba(255,255,255,.95)"/>`;
}

function _penBody({ capFill = "url(#pw-cap)", barrelFill = "url(#pw-barrel)", eyeGroup = _eyes(84),
  cheekFill = "rgba(228,120,80,.30)", cheekRx = "5.5",
  mouthPath = "M31 102 Q38 108 45 102", mouthWidth = "2", mouthColor = "#C87828",
  inkAccent = `<ellipse cx="38" cy="151" rx="2" ry="2.8" fill="#2A3A7A"/>`,
  extraBody = "" } = {}) {
  return `
  <ellipse cx="38" cy="154" rx="14" ry="3.5" fill="rgba(180,140,90,.22)"/>
  <ellipse cx="38" cy="18" rx="6" ry="7" fill="${capFill}"/>
  <ellipse cx="38" cy="18" rx="5" ry="5.5" fill="#D4A838"/>
  <ellipse cx="38" cy="18" rx="3" ry="3.5" fill="#E8C050"/>
  <rect x="27" y="18" width="22" height="42" fill="${capFill}"/>
  <rect x="27" y="18" width="8" height="42" fill="rgba(255,255,255,.28)"/>
  <ellipse cx="38" cy="18" rx="11" ry="4" fill="#D4A838"/>
  <rect x="48" y="22" width="4" height="35" rx="2" fill="#C89030"/>
  <rect x="48" y="20" width="5" height="7" rx="2" fill="#E8B840"/>
  <rect x="48" y="52" width="4" height="5" rx="1.5" fill="#E8B840"/>
  <ellipse cx="38" cy="60" rx="11" ry="3.5" fill="#C89030"/>
  <rect x="27" y="60" width="22" height="58" fill="${barrelFill}"/>
  <rect x="27" y="60" width="8" height="58" fill="rgba(255,255,255,.28)"/>
  <ellipse cx="38" cy="62" rx="11" ry="4" fill="#F5E8CC"/>
  <ellipse cx="38" cy="118" rx="11" ry="4" fill="#D4A030"/>
  ${extraBody}
  ${eyeGroup}
  <ellipse cx="28" cy="96" rx="${cheekRx}" ry="3.5" fill="${cheekFill}"/>
  <ellipse cx="48" cy="96" rx="${cheekRx}" ry="3.5" fill="${cheekFill}"/>
  <path d="${mouthPath}" stroke="${mouthColor}" stroke-width="${mouthWidth}" fill="none" stroke-linecap="round"/>
  <rect x="27" y="118" width="22" height="12" rx="3" fill="#D4A040"/>
  <polygon points="30,130 46,130 44,143 38,150 32,143" fill="#C87828"/>
  <polygon points="32,141 38,150 44,141 42,134 34,134" fill="#D4A838"/>
  <line x1="38" y1="134" x2="38" y2="150" stroke="#C87020" stroke-width=".8"/>
  ${inkAccent}`;
}

const _PENWICK_SVG = {
  ready() {
    return `<svg width="76" height="160" viewBox="0 0 76 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  ${_DEFS}${_penBody({ eyeGroup: _eyes(84), mouthPath: "M31 102 Q38 108 45 102" })}
</svg>`;
  },
  thinking() {
    return `<svg width="76" height="160" viewBox="0 0 76 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  ${_DEFS}
  <g transform="rotate(-13 38 90)">
  ${_penBody({ capFill: "#DBBA6A", barrelFill: "#F5E8CC", eyeGroup: _eyes(82, { irisY: 79 }), mouthPath: "M31 100 Q38 104 45 100", inkAccent: "" })}
  </g>
  <circle cx="58" cy="36" r="5" fill="#E8F0FF" stroke="#B8C8F0" stroke-width=".8"><animate attributeName="r" values="4;6;4" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values=".5;1;.5" dur="1.1s" repeatCount="indefinite"/></circle>
  <circle cx="65" cy="24" r="3.5" fill="#D8E8FF" stroke="#A8B8E8" stroke-width=".7"><animate attributeName="r" values="3;4.5;3" dur="1.1s" begin=".38s" repeatCount="indefinite"/><animate attributeName="opacity" values=".4;.9;.4" dur="1.1s" begin=".38s" repeatCount="indefinite"/></circle>
  <circle cx="70" cy="14" r="2.5" fill="#C8D8FF"><animate attributeName="r" values="2;3;2" dur="1.1s" begin=".76s" repeatCount="indefinite"/><animate attributeName="opacity" values=".3;.8;.3" dur="1.1s" begin=".76s" repeatCount="indefinite"/></circle>
</svg>`;
  },
  worried() {
    return `<svg width="76" height="160" viewBox="0 0 76 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  ${_DEFS}${_penBody({ capFill: "#DBBA6A", barrelFill: "#F5E8CC",
      extraBody: `<path d="M26 76 Q33 70 37 75" stroke="#C06010" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M39 75 Q43 70 50 76" stroke="#C06010" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      eyeGroup: _eyes(84, { irisColor: "#C83818", scleraRx: 5.5, scleraRy: 6.5, irisRx: 3.5, irisRy: 4 }),
      cheekFill: "rgba(228,120,80,.40)", cheekRx: "6.5",
      mouthPath: "M31 104 Q38 98 45 104", mouthWidth: "2.2", mouthColor: "#C05010",
      inkAccent: `<ellipse cx="38" cy="152" rx="3" ry="4" fill="#2A3A7A"/><ellipse cx="32" cy="156" rx="2.2" ry="3" fill="#2A3A7A" opacity=".75"/><ellipse cx="44" cy="156" rx="2.2" ry="3" fill="#2A3A7A" opacity=".75"/><ellipse cx="27" cy="158" rx="1.8" ry="2.5" fill="#2A3A7A" opacity=".45"/><ellipse cx="49" cy="158" rx="1.8" ry="2.5" fill="#2A3A7A" opacity=".45"/>` })}
</svg>`;
  },
  proud() {
    return `<svg width="76" height="160" viewBox="0 0 76 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  ${_DEFS}${_penBody({ capFill: "#DBBA6A", barrelFill: "#F5E8CC",
      extraBody: `<path d="M26 77 Q33 72 37 76" stroke="#7A3898" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M39 76 Q43 72 50 77" stroke="#7A3898" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      eyeGroup: _eyes(84, { irisY: 82 }),
      cheekFill: "rgba(215,90,150,.42)", cheekRx: "8",
      mouthPath: "M28 104 Q38 116 48 104", mouthWidth: "2.8", mouthColor: "#A04818",
      inkAccent: `<path d="M48 148 Q60 130 68 112 Q74 97 66 84 Q60 74 66 60" stroke="#2A3A7A" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/><path d="M66 60 Q68 50 62 42" stroke="#2A3A7A" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/>` })}
</svg>`;
  },
  celebrate() {
    return `<svg width="76" height="160" viewBox="0 0 76 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  ${_DEFS}
  <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-9;0,0" dur=".48s" repeatCount="indefinite"/>
  ${_penBody({ capFill: "#DBBA6A", barrelFill: "#F5E8CC",
      extraBody: `<path d="M26 76 Q33 70 38 75" stroke="#1A6008" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M38 75 Q43 70 50 76" stroke="#1A6008" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      eyeGroup: _eyes(84, { irisRx: 3.5, irisRy: 4, scleraRx: 5.5, scleraRy: 6.5 }),
      cheekFill: "rgba(220,80,80,.45)", cheekRx: "9.5",
      mouthPath: "M26 105 Q38 122 50 105", mouthWidth: "3.2", mouthColor: "#A04818",
      inkAccent: `<ellipse cx="5" cy="68" rx="4" ry="6" fill="#2A3A7A" transform="rotate(-30,5,68)"><animate attributeName="cy" values="68;58;68" dur=".48s" repeatCount="indefinite"/></ellipse><ellipse cx="71" cy="62" rx="4" ry="6" fill="#2A3A7A" transform="rotate(28,71,62)"><animate attributeName="cy" values="62;52;62" dur=".48s" begin=".12s" repeatCount="indefinite"/></ellipse><circle cx="8" cy="36" r="5" fill="#E8A820"><animate attributeName="cy" values="36;24;36" dur=".48s" repeatCount="indefinite"/></circle><circle cx="68" cy="40" r="4.5" fill="#C83878"><animate attributeName="cy" values="40;28;40" dur=".48s" begin=".16s" repeatCount="indefinite"/></circle><circle cx="3" cy="90" r="4" fill="#2E8A60"><animate attributeName="cy" values="90;78;90" dur=".48s" begin=".08s" repeatCount="indefinite"/></circle><circle cx="73" cy="86" r="3.5" fill="#D4A020"><animate attributeName="cy" values="86;74;86" dur=".48s" begin=".24s" repeatCount="indefinite"/></circle>` })}
  </g>
  <ellipse cx="38" cy="154" rx="14" ry="3.5" fill="rgba(180,140,90,.2)"><animate attributeName="ry" values="3.5;1;3.5" dur=".48s" repeatCount="indefinite"/></ellipse>
</svg>`;
  }
};

// Map existing cadence states → Penwick visual states
const _STATE_TO_PENWICK = {
  ready:     "ready",
  thinking:  "thinking",
  strong:    "proud",
  watchful:  "ready",
  concerned: "worried",
  pointing:  "thinking",
  celebrate: "celebrate"
};

const _PENWICK_LABELS = {
  ready:     "Penwick is ready and waiting.",
  thinking:  "Penwick is thinking…",
  worried:   "Penwick looks concerned — there is work to do.",
  proud:     "Penwick is proud of your writing!",
  celebrate: "Penwick is celebrating — great job!"
};

/**
 * Render Penwick into the #companion element.
 * @param {string} state — cadence state (ready/thinking/strong/watchful/concerned/pointing/celebrate)
 * @param {Element} el   — the #companion DOM element
 * @param {boolean} quietMode
 * @param {string}  message — cadence copy to show below mascot
 */
export function renderPenwick(state, el, quietMode, message) {
  if (!el) return;
  const penwickState = _STATE_TO_PENWICK[state] ?? "ready";
  const svg = (_PENWICK_SVG[penwickState] ?? _PENWICK_SVG.ready)();
  el.classList.toggle("is-quiet", quietMode);
  el.innerHTML = `
    <div class="penwick" aria-label="${_PENWICK_LABELS[penwickState] ?? _PENWICK_LABELS.ready}" role="img">
      ${svg}
    </div>
    <div class="cadenceCopy">
      <div class="cadenceKicker">Penwick</div>
      <div class="cadenceMessage">${message}</div>
    </div>
  `;
}
