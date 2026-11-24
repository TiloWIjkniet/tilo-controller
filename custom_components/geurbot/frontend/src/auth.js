
// Authentication bridge between Home Assistant and GeurBot.
let accessToken = null;

const isEmbedded = window.parent !== window;
const homeAssistantOrigin = window.location.origin;

export const geurbotAuthReady = new Promise((resolve) => {
    if (!isEmbedded) {
        resolve(true);
        return;
    }

    window.addEventListener("message", (event) => {
        if (
            event.source !== window.parent ||
            event.origin !== homeAssistantOrigin ||
            event.data?.type !== "geurbot-auth" ||
            typeof event.data.token !== "string" ||
            !event.data.token
        ) {
            return;
        }

        // Always accept the newest token from Home Assistant.
        accessToken = event.data.token;
        resolve(true);
    });
});

const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
    const requestUrl = input instanceof Request
        ? input.url
        : String(input);

    const url = new URL(requestUrl, window.location.href);

    // Preserve headers from both Request and fetch options.
    const headers = new Headers(
        input instanceof Request ? input.headers : undefined
    );

    new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
    });

    // Only attach the Home Assistant token to same-origin requests.
    if (url.origin === homeAssistantOrigin && accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return originalFetch(input, {
        ...init,
        headers,
        credentials: url.origin === homeAssistantOrigin
            ? "same-origin"
            : init.credentials
    });
};
