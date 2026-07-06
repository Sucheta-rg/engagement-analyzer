const OVERLAY_ID = "engagement-analyzer-suggestion";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "EA_FOCUS_TEXT") {
    return false;
  }

  const found = focusText(message.text);
  showSuggestionOverlay({
    found,
    label: message.label,
    message: message.message,
    suggestion: message.suggestion
  });
  sendResponse({ found });
  return true;
});

function focusText(text) {
  const normalized = normalizeSearchText(text);
  if (!normalized) {
    return false;
  }

  window.getSelection()?.removeAllRanges();

  for (const candidate of buildSearchCandidates(normalized)) {
    if (window.find(candidate, false, false, true, false, true, false)) {
      return true;
    }
  }

  return false;
}

function buildSearchCandidates(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const candidates = [text];

  if (words.length > 16) {
    candidates.push(words.slice(0, 16).join(" "));
  }

  if (words.length > 9) {
    candidates.push(words.slice(0, 9).join(" "));
  }

  return [...new Set(candidates)];
}

function normalizeSearchText(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
}

function showSuggestionOverlay(details) {
  document.getElementById(OVERLAY_ID)?.remove();

  const overlay = document.createElement("aside");
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = `
    <button class="ea-close" type="button" aria-label="Close">x</button>
    <div class="ea-note-rail" aria-hidden="true"></div>
    <div class="ea-overlay-head">
      <div class="ea-editorial-mark" aria-hidden="true">
        <span class="ea-feather"></span>
        <span class="ea-nib"></span>
      </div>
      <div>
        <div class="ea-kicker">${escapeHtml(details.found ? "Marked in draft" : "Find this line manually")}</div>
        <div class="ea-title">${escapeHtml(details.label ?? "Make this edit")}</div>
      </div>
    </div>
    <p>${escapeHtml(details.message ?? "Review this part of the draft.")}</p>
    <div class="ea-suggestion">
      <span>Edit prompt</span>
      ${escapeHtml(details.suggestion ?? "Add a concrete detail or rewrite for clearer rhythm.")}
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      right: 28px;
      top: 92px;
      z-index: 2147483647;
      width: min(370px, calc(100vw - 56px));
      padding: 14px 14px 14px 18px;
      border: 1px solid #EBDCCD;
      border-radius: 8px;
      background: #FFF8EF;
      box-shadow: 0 18px 50px rgba(68, 49, 39, 0.22);
      color: #27222A;
      font: 13px/1.45 "Segoe UI", "Aptos", "Inter", system-ui, sans-serif;
    }

    #${OVERLAY_ID} .ea-note-rail {
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 4px;
      border-radius: 0 4px 4px 0;
      background: linear-gradient(180deg, #E1796F, #B9DFF7);
    }

    #${OVERLAY_ID} .ea-close {
      position: absolute;
      right: 8px;
      top: 8px;
      width: 24px;
      height: 24px;
      min-height: 0;
      border: 0;
      border-radius: 50%;
      background: #FFF0F6;
      color: #514852;
      cursor: pointer;
      font-size: 14px;
      line-height: 20px;
    }

    #${OVERLAY_ID} .ea-overlay-head {
      display: grid;
      grid-template-columns: 34px 1fr;
      gap: 10px;
      align-items: center;
      margin-bottom: 9px;
    }

    #${OVERLAY_ID} .ea-editorial-mark {
      position: relative;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #FFE8E3;
    }

    #${OVERLAY_ID} .ea-feather {
      position: absolute;
      left: 11px;
      top: 5px;
      width: 10px;
      height: 21px;
      border-radius: 80% 12% 80% 12%;
      background: linear-gradient(155deg, #E1796F 0%, #FFD8E8 58%, #E9B85E 100%);
      transform: rotate(-25deg);
    }

    #${OVERLAY_ID} .ea-feather::after {
      content: "";
      position: absolute;
      left: 5px;
      top: 3px;
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.72);
    }

    #${OVERLAY_ID} .ea-nib {
      position: absolute;
      left: 16px;
      top: 21px;
      width: 4px;
      height: 8px;
      border-radius: 1px 1px 5px 5px;
      background: #27222A;
      transform: rotate(-25deg);
    }

    #${OVERLAY_ID} .ea-kicker {
      margin-bottom: 4px;
      color: #B85D55;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    #${OVERLAY_ID} .ea-title {
      margin-right: 28px;
      font-size: 15px;
      font-weight: 700;
    }

    #${OVERLAY_ID} p {
      margin: 0 0 10px;
      color: #514852;
    }

    #${OVERLAY_ID} .ea-suggestion {
      display: grid;
      gap: 4px;
      padding: 10px;
      border: 1px solid #B9DFF7;
      border-radius: 8px;
      background: #EEF8FF;
      color: #27222A;
      font-weight: 700;
    }

    #${OVERLAY_ID} .ea-suggestion span {
      color: #3F7896;
      font-size: 11px;
      text-transform: uppercase;
    }
  `;

  overlay.append(style);
  document.body.append(overlay);
  overlay.querySelector(".ea-close").addEventListener("click", () => overlay.remove());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
