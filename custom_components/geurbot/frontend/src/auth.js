
 // Home Assistant-authenticatie voor de GeurBot-frontend.

let accessToken = null;

const homeAssistantOrigin = window.location.origin;
const isEmbedded = window.parent !== window;

let resolveAuthReady;

export const geurbotAuthReady = new Promise((resolve) => {
    resolveAuthReady = resolve;

    if (!isEmbedded) {
        // Ontwikkelomgeving zonder Home Assistant.
        resolve(true);
    }
});

function requestAuthToken() {
    if (!isEmbedded) return;

    window.parent.postMessage(
        {
            type: "geurbot-auth-request"
        },
        homeAssistantOrigin
    );
}

function handleAuthMessage(event) {
    if (
        event.source !== window.parent ||
        event.origin !== homeAssistantOrigin ||
        event.data?.type !== "geurbot-auth" ||
        typeof event.data.token !== "string" ||
        !event.data.token
    ) {
        return;
    }

    // Het actuele token altijd overschrijven.

    accessToken = event.data.token;

    console.log("[GeurBot Auth] Token ontvangen door iframe:", {
    lengte: accessToken.length,
    laatsteTekens: accessToken.slice(-6)});


    resolveAuthReady(true);
}

if (isEmbedded) {
    window.addEventListener("message", handleAuthMessage);

    // Vraag expliciet om het actuele token.
    requestAuthToken();
}

// Bewaar de oorspronkelijke fetch-functie.

console.log("[GeurBot Auth] Token gebruikt voor request:", {
    lengte: accessToken?.length,
    laatsteTekens: accessToken?.slice(-6)
});
const originalFetch = window.fetch.bind(window);

// Authenticatie toevoegen aan Home Assistant-aanvragen.
window.fetch = async (input, init = {}) => {
    const requestUrl = input instanceof Request
        ? input.url
        : String(input);

    const url = new URL(requestUrl, window.location.href);

    // Andere origins niet aanpassen.
    if (url.origin !== homeAssistantOrigin) {
        return originalFetch(input, init);
    }

    // Headers uit de bestaande Request behouden.
    const headers = new Headers(
        input instanceof Request
            ? input.headers
            : undefined
    );

    // Headers uit fetch-opties overnemen.
    if (init.headers) {
        new Headers(init.headers).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    // Alleen het HA-token toevoegen als het beschikbaar is.
    if (accessToken) {
        headers.set(
            "Authorization",
            `Bearer ${accessToken}`
        );
    } else {
        console.warn(
            "[GeurBot Auth] HA-token ontbreekt voor:",
            url.pathname
        );
    }

    const fetchOptions = {
        ...init,
        headers,
        credentials: init.credentials ?? "same-origin"
    };

    const response = await originalFetch(
        input,
        fetchOptions
    );

    // Veilige diagnostiek, zonder token te loggen.
    if (
        response.status === 401 ||
        response.status === 403
    ) {
        console.error(
            "[GeurBot Auth] HTTP-authenticatiefout:",
            {
                status: response.status,
                url: url.pathname,
                tokenAvailable: Boolean(accessToken)
            }
        );
    }

    return response;
};
