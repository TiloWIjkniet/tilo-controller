// Authentication bridge between the Home Assistant sidebar panel and GeurBot.
let accessToken = null;
const isEmbedded = window.parent !== window;

export const geurbotAuthReady = new Promise((resolve) => {
    if (!isEmbedded) {
        // Allow the Vite development server to run without Home Assistant.
        resolve(true);
        return;
    }

    const handleAuthMessage = (event) => {
        if (
            event.source !== window.parent ||
            event.origin !== window.location.origin ||
            event.data?.type !== "geurbot-auth" ||
            typeof event.data.token !== "string" ||
            !event.data.token
        ) {
            return;
        }

        accessToken = event.data.token;
        resolve(true);
    };

    window.addEventListener("message", handleAuthMessage);
});

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return originalFetch(input, {
        ...init,
        headers,
        credentials: "same-origin",
    });
};
