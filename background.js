// Tracks which windows are "armed" (ephemeral)
const ephemeralWindows = new Set(); // windowId -> armed
// Tracks origins visited per window and when arming started
const perWindow = new Map(); // windowId -> { since:number, origins:Set<string> }

function ensureEntry(windowId) {
  if (!perWindow.has(windowId)) {
    perWindow.set(windowId, { since: Date.now(), origins: new Set() });
  }
}

chrome.windows.onRemoved.addListener((windowId) => {
  // Only wipe if this window was armed
  if (!ephemeralWindows.has(windowId)) {
    perWindow.delete(windowId);
    return;
  }
  const entry = perWindow.get(windowId);
  ephemeralWindows.delete(windowId);
  if (!entry) return;

  const origins = Array.from(entry.origins);
  if (origins.length === 0) { perWindow.delete(windowId); return; }

  const since = entry.since || Date.now() - 1000;

  // Wipe cookies + site storage for the visited origins
  chrome.browsingData.remove(
    { origins, since },
    {
      cookies: true,
      cache: true,
      cacheStorage: true,
      indexedDB: true,
      localStorage: true,
      serviceWorkers: true,
      webSQL: true,
      fileSystems: true
    },
    () => {
      perWindow.delete(windowId);
    }
  );
});

// Track top-level navigations to gather origins and inject the auto-consent script
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return; // top-level only
  const tab = await chrome.tabs.get(details.tabId).catch(() => null);
  if (!tab) return;

  const windowId = tab.windowId;
  ensureEntry(windowId);

  try {
    const url = new URL(details.url);
    perWindow.get(windowId).origins.add(url.origin);
  } catch (_) {}

  if (ephemeralWindows.has(windowId)) {
    // Inject the auto-accept script into the page (all frames to catch iframes/CMPs)
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content.js']
    }).catch(() => {});
  }
});

// Popup messages for Arm/Disarm
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'SET_WINDOW_ARMED') {
    const { windowId, armed } = msg;
    if (armed) {
      ephemeralWindows.add(windowId);
      // Reset the clock & origins for a fresh "jar"
      perWindow.set(windowId, { since: Date.now(), origins: new Set() });
    } else {
      ephemeralWindows.delete(windowId);
    }
    sendResponse({ ok: true, armed: ephemeralWindows.has(windowId) });
    return true;
  }
  if (msg?.type === 'GET_WINDOW_ARMED') {
    const { windowId } = msg;
    sendResponse({ armed: ephemeralWindows.has(windowId) });
    return true;
  }
});
