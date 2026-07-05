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
    <div class="ea-overlay-head">
      <div class="ea-cadence" aria-hidden="true">
        <span class="ea-feather"></span>
        <span class="ea-nib"></span>
      </div>
      <div>
        <div class="ea-kicker">${escapeHtml(details.found ? "Focused in document" : "Text not visible")}</div>
        <div class="ea-title">${escapeHtml(details.label ?? "Writing signal")}</div>
      </div>
    </div>
    <p>${escapeHtml(details.message ?? "Review this part of the draft.")}</p>
    <div class="ea-suggestion">${escapeHtml(details.suggestion ?? "Add a concrete detail or rewrite for clearer rhythm.")}</div>
    <div class="ea-line">Cadence: Add proof here: number, example, or consequence.</div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      right: 28px;
      top: 92px;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 56px));
      padding: 14px;
      border: 1px solid #bfdbfe;
      border-left: 5px solid #0f766e;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
      color: #172033;
      font: 13px/1.45 Arial, Helvetica, sans-serif;
    }

    #${OVERLAY_ID} .ea-close {
      position: absolute;
      right: 8px;
      top: 8px;
      width: 24px;
      height: 24px;
      border: 0;
      border-radius: 50%;
      background: #eef2f7;
      color: #334155;
      cursor: pointer;
      font-size: 14px;
      line-height: 20px;
    }

    #${OVERLAY_ID} .ea-overlay-head {
      display: grid;
      grid-template-columns: 38px 1fr;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }

    #${OVERLAY_ID} .ea-cadence {
      position: relative;
      width: 34px;
      height: 34px;
    }

    #${OVERLAY_ID} .ea-feather {
      position: absolute;
      left: 7px;
      top: 1px;
      width: 18px;
      height: 27px;
      border-radius: 80% 10% 80% 10%;
      background: linear-gradient(135deg, #0f766e, #164e63 58%, #f2b84b);
      transform: rotate(-22deg);
    }

    #${OVERLAY_ID} .ea-feather::before {
      content: "";
      position: absolute;
      left: 5px;
      top: 8px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 7px 2px 0 #ffffff;
    }

    #${OVERLAY_ID} .ea-nib {
      position: absolute;
      left: 17px;
      top: 22px;
      width: 6px;
      height: 12px;
      border-radius: 2px 2px 7px 7px;
      background: #172033;
      transform: rotate(-22deg);
    }

    #${OVERLAY_ID} .ea-kicker {
      margin-bottom: 5px;
      color: #0f766e;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    #${OVERLAY_ID} .ea-title {
      margin-right: 26px;
      margin-bottom: 7px;
      font-size: 15px;
      font-weight: 700;
    }

    #${OVERLAY_ID} p {
      margin: 0 0 10px;
      color: #475569;
    }

    #${OVERLAY_ID} .ea-suggestion {
      padding: 10px;
      border-radius: 8px;
      background: #ecfdf5;
      color: #134e4a;
      font-weight: 700;
    }

    #${OVERLAY_ID} .ea-line {
      margin-top: 8px;
      color: #0f766e;
      font-weight: 700;
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
