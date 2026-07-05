import { isGoogleDocsDocumentUrl } from "./lib/document-id.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

chrome.tabs.onUpdated.addListener(async (tabId, _info, tab) => {
  await updateSidePanel(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await updateSidePanel(tabId, tab.url);
});

async function updateSidePanel(tabId, url) {
  const enabled = isGoogleDocsDocumentUrl(url ?? "");
  await chrome.sidePanel.setOptions({
    tabId,
    path: "src/sidepanel.html",
    enabled
  });
}
