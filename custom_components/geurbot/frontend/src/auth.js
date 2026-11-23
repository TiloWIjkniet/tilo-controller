let accessToken = null;
let resolveReady;
export const geurbotAuthReady = new Promise((resolve) => { resolveReady = resolve; });

if (window.parent === window) {
  resolveReady(); // Vite development outside Home Assistant.
} else {
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== "geurbot-auth") return;
    accessToken = event.data.token;
    resolveReady();
  });
}

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return originalFetch(input, { ...init, headers, credentials: "same-origin" });
};
