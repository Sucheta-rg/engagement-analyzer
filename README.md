# Engagement Analyzer

Chrome extension MVP for analyzing Google Docs writing quality from a side panel.

## What It Does

- Opens a Chrome side panel on Google Docs.
- Reads the current document through Google Docs API after user consent.
- Runs local analysis for robotic rhythm, predictable phrasing, structure, specificity, and voice.
- Shows a paragraph heatmap, top-priority fixes, and specificity booster guidance.

It does not claim that text is AI-written or human-written.

## Local Test

```powershell
npm test
```

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project folder.
5. Open a Google Doc.
6. Click the extension toolbar icon.

## Google OAuth

The manifest contains a development client ID sentinel. Replace it with your Chrome extension OAuth client ID before testing live Google Docs API access. See `docs/google-oauth-setup.md`.
