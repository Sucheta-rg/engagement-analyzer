const DOCS_GET_URL = "https://docs.googleapis.com/v1/documents";

export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

export async function requestDocsToken() {
  const result = await chrome.identity.getAuthToken({ interactive: true });
  const token = typeof result === "string" ? result : result.token;

  if (!token) {
    throw new Error("Google authorization did not return an access token.");
  }

  return token;
}

export async function fetchGoogleDocument(documentId, token) {
  const response = await fetch(`${DOCS_GET_URL}/${encodeURIComponent(documentId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google Docs API returned ${response.status}.`);
  }

  return response.json();
}
