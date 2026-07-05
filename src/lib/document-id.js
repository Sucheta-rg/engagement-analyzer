const DOC_URL_PATTERN = /^https:\/\/docs\.google\.com\/document\/d\/([^/]+)/;

export function isGoogleDocsDocumentUrl(url) {
  return extractDocumentId(url) !== null;
}

export function extractDocumentId(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(DOC_URL_PATTERN);
  return match ? decodeURIComponent(match[1]) : null;
}
