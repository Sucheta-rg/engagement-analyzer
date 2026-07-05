# Inklet Writing Companion Design

## Purpose

Inklet turns the extension from a static writing report into a companion for writers working alone in Google Docs. The goal is to make the product feel encouraging, memorable, and useful without becoming childish, noisy, or derivative.

Inklet is not a generic quill mascot. It is a small feather-nib writing companion with an ink-drop mouth, expressive eyes, and restrained editorial styling. It reacts to draft quality, guides the user toward priority fixes, and offers light motivation during idle moments.

## Product Role

Inklet should support three jobs:

- Make analysis feel more human and less like a dashboard.
- Help writers decide what to fix first.
- Encourage writers during long thinking pauses without interrupting their work.

Inklet should not become a chat bot, pop-up spammer, or cartoon layer that competes with the document.

## Visual Identity

Inklet uses an old-style feather pen concept but should avoid looking like a stock quill icon.

Visual traits:

- Feather-nib hybrid silhouette.
- One expressive eye on the feather curve and one near the nib stem.
- Small ink-drop mouth.
- Premium editorial colors: ink blue, teal, warm gold, off-white.
- Simple CSS/SVG construction, no external image dependency.
- Small, polished animations: blink, tilt, breathe, point, celebrate.

The character lives primarily in the side panel header. A mini version appears inside the Google Docs suggestion overlay only after the user clicks a Focus action.

## Companion States

Inklet has these states:

- `ready`: calm idle state before analysis.
- `thinking`: while analysis is running.
- `strong`: high draft health score, confident expression.
- `watchful`: medium score, thoughtful expression.
- `concerned`: low score or high-priority issues, concerned expression.
- `pointing`: user clicked Focus and Inklet is directing attention to a document location.
- `idle-nudge`: user has not typed or clicked for a while in Google Docs.

State messages:

- `ready`: "Open a draft. I will help you spot what readers may skip."
- `thinking`: "Reading rhythm, patterns, and proof points."
- `strong`: "This draft has a strong pulse."
- `watchful`: "Good base. A few lines need sharper proof."
- `concerned`: "Start with the red signals. They are costing clarity."
- `pointing`: "This is the section to tighten first."
- `idle-nudge`: short rotating messages listed below.

## Idle Motivation

Idle behavior should be helpful, not annoying.

Detection:

- The content script listens to local `keydown`, `mousedown`, and `visibilitychange` events in the Google Docs tab.
- If the user has not interacted for 90 seconds while the tab is visible, Inklet can show one small encouragement bubble.
- After showing an idle nudge, wait at least 5 minutes before another one.
- Do not show idle nudges while an analysis suggestion overlay is already visible.
- Do not send idle data anywhere.

Idle nudge examples:

- "Still thinking? Try writing the rough version first."
- "One concrete example can unlock this section."
- "If the line feels stuck, name the reader and the consequence."
- "You do not need perfect. You need the next clear sentence."
- "A sharper claim usually starts with a specific detail."

Controls:

- Add a side panel toggle: `Coach nudges`.
- Default: on for local testing.
- Store preference in `chrome.storage.local`.
- If disabled, no idle bubble appears.

## Side Panel UX

Add an Inklet companion card above the score summary:

- Character on the left.
- Current reaction message on the right.
- Small `Coach nudges` toggle.
- Animation state updates after analysis.

After analysis:

- Score >= 88: state `strong`.
- Score 70-87: state `watchful`.
- Score < 70: state `concerned`.
- If a Focus button is clicked, temporarily switch to `pointing`.

The rest of the panel remains functional and compact. Inklet should support the workflow, not replace the issue cards.

## Google Docs Overlay UX

When user clicks Focus:

- Existing content script tries to locate/select matching document text.
- Overlay appears near the upper-right of the document.
- Add a mini Inklet illustration inside the overlay.
- Overlay includes:
  - focus status
  - issue label
  - diagnostic message
  - suggestion
  - one Inklet line

Example:

Inklet line: "Add proof here: number, example, or consequence."

## Architecture

New files:

- `src/lib/companion.js`: companion state rules and message selection.
- `tests/companion.test.js`: deterministic state/message tests.

Modified files:

- `manifest.json`: add `storage` permission for nudge preference.
- `src/sidepanel.html`: add companion card.
- `src/sidepanel.css`: add Inklet SVG/CSS styling and animations.
- `src/sidepanel.js`: render companion state, toggle nudges, send preference to content script.
- `src/content-script.js`: render mini Inklet in overlay and manage idle nudges.

## Privacy

Idle detection stays local in the browser. It tracks only recent interaction time in memory and a local boolean preference. It does not store document content, keystrokes, or behavioral history.

## Testing

Unit tests:

- Score to companion state mapping.
- Message selection returns a non-empty message for every state.
- Idle nudge cooldown logic.

Manual tests:

- Side panel loads with ready Inklet state.
- Analyze switches Inklet to strong/watchful/concerned based on result.
- Focus shows mini Inklet in the Google Docs overlay.
- Idle nudge appears only after the configured delay.
- Turning off `Coach nudges` prevents idle nudge bubbles.

## Market Fit

Inklet makes the extension more distinctive because it addresses the writer's emotional workflow, not only the text quality workflow. Writers often work alone and pause to think. Subtle encouragement and targeted next steps make the tool feel like an editor sitting beside them rather than another scorecard.
