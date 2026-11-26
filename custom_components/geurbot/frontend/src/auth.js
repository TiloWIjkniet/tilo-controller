
 // Home Assistant authenticatiemanager voor GeurBot.

const AUTH_TIMEOUT = 10000;
const REFRESH_TIMEOUT = 10000;

const homeAssistantOrigin = window.location.origin;
const isEmbedded = window.parent !== window;

let accessToken = null;
let tokenVersion = 0;

let resolveAuthReady;
let initialAuthTimer = null;

let refreshPromise = null;
let refreshResolve = null;
let refreshRequestId = null;
let refreshTimer = null;

let requestCounter = 0;

// --------------------------------------------------
// Eerste authenticatie
// --------------------------------------------------

export const geurbotAuthReady = new Promise((resolve) => {
    resolveAuthReady = resolve;

    if (!isEmbedded) {
        resolve(true);
        return;
    }

    initialAuthTimer = setTimeout(() => {
        console.error("[GeurBot Auth] Eerste authenticatie timeout.");
        resolveAuthReady(false);
    }, AUTH_TIMEOUT);
});

// --------------------------------------------------
// Token opvragen
// --------------------------------------------------

function requestAuthToken(requestId = null) {
    if (!isEmbedded) return;

    window.parent.postMessage(
        {
            type: "geurbot-auth-request",
            requestId
        },
        homeAssistantOrigin
    );
}

// --------------------------------------------------
// Vernieuwingsaanvraag afronden
// --------------------------------------------------

function finishRefresh(success) {
    if (!refreshResolve) return;

    clearTimeout(refreshTimer);

    const resolve = refreshResolve;

    refreshPromise = null;
    refreshResolve = null;
    refreshRequestId = null;
    refreshTimer = null;

    resolve(success);
}

// --------------------------------------------------
// Nieuw token ontvangen
// --------------------------------------------------

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

    const newToken = event.data.token;
    const tokenChanged = newToken !== accessToken;

    if (tokenChanged) {
        accessToken = newToken;
        tokenVersion++;

        console.info("[GeurBot Auth] Token bijgewerkt:", {
            version: tokenVersion,
            length: accessToken.length
        });
    }

    // Eerste authenticatie afronden.
    if (initialAuthTimer) {
        clearTimeout(initialAuthTimer);
        initialAuthTimer = null;
        resolveAuthReady(true);
    }

    // Vernieuwingsaanvraag beantwoorden.
    if (refreshResolve) {
        if (tokenChanged) {
            finishRefresh(true);
        } else if (
            event.data.requestId === refreshRequestId
        ) {
            finishRefresh(false);
        }
    }
}

// --------------------------------------------------
// Listener initialiseren
// --------------------------------------------------

if (isEmbedded) {
    window.addEventListener("message", handleAuthMessage);
    requestAuthToken();
}

// --------------------------------------------------
// Token vernieuwen
// --------------------------------------------------

function refreshAuthToken() {
    if (!isEmbedded) {
        return Promise.resolve(false);
    }

    // Meerdere requests delen dezelfde vernieuwingsaanvraag.
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = new Promise((resolve) => {
        refreshResolve = resolve;

        refreshRequestId =
            `geurbot-${Date.now()}-${++requestCounter}`;

        refreshTimer = setTimeout(() => {
            console.warn("[GeurBot Auth] Tokenvernieuwing timeout.");
            finishRefresh(false);
        }, REFRESH_TIMEOUT);

        requestAuthToken(refreshRequestId);
    });

    return refreshPromise;
}

// --------------------------------------------------
// Oorspronkelijke fetch bewaren
// --------------------------------------------------

const originalFetch = window.fetch.bind(window);

// --------------------------------------------------
// Gecontroleerde API-request
// --------------------------------------------------

async function sendRequest(input, init, token) {
    const headers = new Headers(
        input instanceof Request
            ? input.headers
            : undefined
    );

    if (init.headers) {
        new Headers(init.headers).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    headers.set("Authorization", `Bearer ${token}`);

    return originalFetch(
        input instanceof Request ? input.clone() : input,
        {
            ...init,
            headers,
            credentials: init.credentials ?? "same-origin"
        }
    );
}

// --------------------------------------------------
// Fetch-wrapper
// --------------------------------------------------

window.fetch = async (input, init = {}) => {
    const requestUrl = input instanceof Request
        ? input.url
        : String(input);

    const url = new URL(requestUrl, window.location.href);

    const isApiRequest =
        url.origin === homeAssistantOrigin &&
        (
            url.pathname === "/api" ||
            url.pathname.startsWith("/api/")
        );

    if (!isApiRequest) {
        return originalFetch(input, init);
    }

    // Wacht op eerste authenticatie.
    const ready = await geurbotAuthReady;

    if (!ready || !accessToken) {
        throw new Error(
            `[GeurBot Auth] Authenticatie niet beschikbaar: ${url.pathname}`
        );
    }

    const method = (
        init.method ||
        (input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    const usedTokenVersion = tokenVersion;
    const usedToken = accessToken;

    console.debug("[GeurBot Auth] Request:", {
        method,
        url: url.pathname,
        tokenVersion: usedTokenVersion
    });

    let response = await sendRequest(input, init, usedToken);

    if (response.status !== 401) {
        return response;
    }

    console.warn("[GeurBot Auth] HTTP 401:", {
        url: url.pathname,
        method,
        tokenVersion: usedTokenVersion
    });

    // Alleen veilige requests mogen opnieuw worden uitgevoerd.
    if (method !== "GET" && method !== "HEAD") {
        console.error(
            "[GeurBot Auth] Geen automatische retry voor:",
            method
        );

        return response;
    }

    // Misschien is het token ondertussen al bijgewerkt.
    let tokenUpdated = tokenVersion !== usedTokenVersion;

    // Anders één gecontroleerde vernieuwingsaanvraag.
    if (!tokenUpdated) {
        tokenUpdated = await refreshAuthToken();
    }

    // Geen nieuw token? Niet opnieuw proberen.
    if (!tokenUpdated || tokenVersion === usedTokenVersion) {
        console.error(
            "[GeurBot Auth] Geen nieuw token ontvangen. Retry geannuleerd."
        );

        return response;
    }

    console.info("[GeurBot Auth] Eenmalige retry met nieuw token:", {
        oldVersion: usedTokenVersion,
        newVersion: tokenVersion,
        url: url.pathname
    });

    // Exact één nieuwe poging.
    response = await sendRequest(input, init, accessToken);

    if (response.status === 401 || response.status === 403) {
        console.error("[GeurBot Auth] Retry mislukt:", {
            status: response.status,
            url: url.pathname,
            tokenVersion
        });
    }

    return response;
};
