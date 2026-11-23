// Authentication for the standard Home Assistant Webpage dashboard iframe.
// The iframe is served from the same origin as Home Assistant, so it can read
// the active HA frontend session from the parent's localStorage.
function getHomeAssistantToken() {
  try {
    const storage = window.parent === window
      ? window.localStorage
      : window.parent.localStorage;
    const raw = storage.getItem("hassTokens");
    if (!raw) return null;
    const tokens = JSON.parse(raw);
    return typeof tokens?.access_token === "string" ? tokens.access_token : null;
  } catch (error) {
    console.warn("[GeurBot] Home Assistant-sessie kon niet worden gelezen:", error);
    return null;
  }
}

const isEmbedded = window.parent !== window;
export const geurbotAuthReady = Promise.resolve(!isEmbedded || Boolean(getHomeAssistantToken()));

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  const token = getHomeAssistantToken();
  if (token && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${token}`);
  return originalFetch(input, { ...init, headers, credentials: "same-origin" });
};
