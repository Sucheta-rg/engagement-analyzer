# Google OAuth Setup

The extension uses `chrome.identity.getAuthToken()` and the read-only scope:

`https://www.googleapis.com/auth/documents.readonly`

## Steps

1. Open Google Cloud Console.
2. Create or select a project.
3. Enable Google Docs API.
4. Configure the OAuth consent screen.
5. Create an OAuth Client ID for a Chrome Extension.
6. Load the extension once in Chrome and copy its extension ID from `chrome://extensions`.
7. Use that extension ID when creating the Chrome Extension OAuth client.
8. Put the generated OAuth client ID into `manifest.json` under `oauth2.client_id`.

During private testing, add your Google account as a test user if the consent screen is in testing mode.
