
// Home Assistant authenticatie voor de GeurBot-frontend.

let accessToken = null;

const homeAssistantOrigin = window.location.origin;
const isEmbedded = window.parent !== window;

// Wacht totdat het Home Assistant-token ontvangen is.
export const geurbotAuthReady = new Promise((resolve) => {
    if (!isEmbedded) {
        // Ontwikkelomgeving zonder Home Assistant.
        resolve(true);
        return;
    }

    const handleAuthMessage = (event) => {
        if (
            event.source !== window.parent ||
            event.origin !== homeAssistantOrigin ||
            event.data?.type !== "geurbot-auth" ||
            typeof event.data.token !== "string" ||
            !event.data.token
        ) {
            return;
        }

        // Vervang altijd het oude token door het nieuwste token.
        accessToken = event.data.token;

        console.log("[GeurBot Auth] Home Assistant-token ontvangen.");

        resolve(true);
    };

    window.addEventListener("message", handleAuthMessage);
});

// Bewaar de oorspronkelijke fetch-functie.
const originalFetch = window.fetch.bind(window);

// Voeg automatisch authenticatie toe aan Home Assistant-aanvragen.
window.fetch = (input, init = {}) => {
    const requestUrl = input instanceof Request
        ? input.url
        : String(input);

    const url = new URL(requestUrl, window.location.href);

    // Behoud headers uit zowel Request als fetch-opties.
    const headers = new Headers(
        input instanceof Request ? input.headers : undefined
    );

    new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
    });

    const fetchOptions = {
        ...init,
        headers
    };

    // Alleen Home Assistant-aanvragen voorzien van het HA-token.
    if (url.origin === homeAssistantOrigin) {
        if (accessToken) {
            headers.set(
                "Authorization",
                `Bearer ${accessToken}`
            );
        }

        fetchOptions.credentials = "same-origin";
    }

    return originalFetch(input, fetchOptions);
};
 