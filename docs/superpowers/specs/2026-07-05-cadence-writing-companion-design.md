# Cadence Writing Companion Design

## Purpose

Cadence turns the extension from a static writing report into a calm real-time writing companion for Google Docs. The goal is to help writers notice robotic rhythm, generic phrasing, and weak proof while they write, without making the product feel like a toy, mascot, or AI pet.

The previous feather-pen idea was reviewed from brand, writer UX, product, and technical angles. The strongest recommendation was to avoid a cute full mascot and instead build **Cadence**: a subtle editorial signal tied directly to the product's core insight, writing rhythm.

## Product Role

Cadence supports three jobs:

- Make analysis feel less cold without weakening professional trust.
- Guide writers toward the next useful fix.
- Prepare the product for real-time paragraph-level feedback.

Cadence should not become a chat bot, gamified writing scorekeeper, or persistent animation over the document.

## Brand Direction

Cadence is a living editorial mark, not a character mascot.

Visual traits:

- Feather-nib inspired, but not a generic quill.
- Small rhythm pulse or proofing mark around the nib.
- Premium editorial colors: ink blue, teal, warm gold, off-white.
- Simple CSS/SVG construction, no external image dependency.
- Subtle motion only: blink, tilt, breathe, pulse, point.

Brand line:

> Cadence catches robotic rhythm before readers do.

## MVP: Cadence Lite

The first implementation should be restrained.

Cadence Lite includes:

- Side panel companion card.
- Small animated feather-nib/rhythm mark.
- Score-based state message after analysis.
- Mini Cadence mark inside the existing Google Docs Focus overlay.
- `Quiet mode` toggle in the side panel.

Cadence Lite does not include automatic motivational popups over the article by default.

## Companion States

Cadence has these states:

- `ready`: calm idle state before analysis.
- `thinking`: while analysis is running.
- `strong`: high draft health score.
- `watchful`: medium score.
- `concerned`: low score or high-priority issues.
- `pointing`: user clicked Focus and Cadence is directing attention to a document location.

State messages:

- `ready`: "Open a draft. I will watch for rhythm, repetition, and proof gaps."
- `thinking`: "Reading rhythm, patterns, and proof points."
- `strong`: "This draft has a strong pulse."
- `watchful`: "Good base. A few lines need sharper proof."
- `concerned`: "Start with the red signals. They are costing clarity."
- `pointing`: "This is the section to tighten first."

## Quiet Mode

Writers need focus, so companion behavior must be controllable.

Add a `Quiet mode` toggle:

- Default: off, so Cadence Lite appears in the panel.
- When on: hide companion animation and suppress future ambient nudges.
- Store preference in `chrome.storage.local`.
- The analyzer, map, and issue cards continue working normally.

## Google Docs Overlay

When the user clicks Focus:

- Existing content script tries to locate/select matching document text.
- Existing overlay appears near the upper-right of the document.
- Add a mini Cadence mark inside that overlay.
- Overlay includes:
  - focus status
  - issue label
  - diagnostic message
  - suggestion
  - one Cadence line

Example Cadence line:

> Add proof here: number, example, or consequence.

The mini mark must stay inside the existing overlay. Do not anchor it to document text or inject permanent highlights into Google Docs.

## Real-Time Paragraph Watch Roadmap

The user's desired end state is real-time guidance while writing. Cadence Lite should prepare for that, but the real-time mode should be a second implementation step after the companion shell is stable.

Future real-time model:

1. Writer types in Google Docs.
2. Extension waits until the writer pauses for 2-4 seconds.
3. Extension analyzes only the changed paragraph when technically possible.
4. If a high-confidence issue exists, Cadence offers a small non-blocking suggestion.
5. User can choose Focus, Dismiss, or Quiet mode.
6. Side panel keeps the full map and priority list.

Guardrails:

- No popup on every sentence.
- No score changes while actively typing.
- No guilt, urgency, or gamified pressure.
- No document text sent to a server.
- No behavior history stored.

## Optional Idle Nudges

Idle nudges are not part of Cadence Lite.

If added later:

- Default should be off or introduced through explicit onboarding.
- Delay should be 3-5 minutes, not 90 seconds.
- Cooldown should be at least 5 minutes after a nudge.
- Do not show while suggestions are visible.
- Do not persist activity timestamps.

Example nudge copy:

- "Still thinking? Try writing the rough version first."
- "One concrete example can unlock this section."
- "If the line feels stuck, name the reader and the consequence."
- "You do not need perfect. You need the next clear sentence."

## Architecture

New files:

- `src/lib/companion.js`: companion state rules and message selection.
- `tests/companion.test.js`: deterministic state/message tests.

Modified files:

- `manifest.json`: add `storage` permission for Quiet mode preference.
- `src/sidepanel.html`: add Cadence companion card.
- `src/sidepanel.css`: add Cadence SVG/CSS styling and animations.
- `src/sidepanel.js`: render Cadence state, Quiet mode toggle, and Focus state.
- `src/content-script.js`: render mini Cadence in the existing Focus overlay.

## Privacy

Cadence Lite stores only a local Quiet mode preference. It does not store document content, keystrokes, pause history, or writing behavior.

## Testing

Unit tests:

- Score to companion state mapping.
- Message selection returns a non-empty message for every state.
- Quiet mode helper defaults.

Manual tests:

- Side panel loads with ready Cadence state.
- Analyze switches Cadence to strong/watchful/concerned based on result.
- Quiet mode hides the companion card but leaves analyzer features intact.
- Focus shows mini Cadence in the Google Docs overlay.

## Market Fit

Cadence makes the extension more distinctive because it connects directly to the product's actual category: robotic rhythm and content engagement. It gives the product personality without making it look copied, childish, or unserious.
