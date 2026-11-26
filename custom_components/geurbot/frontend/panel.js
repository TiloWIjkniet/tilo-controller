
class GeurBotPanel extends HTMLElement {
    constructor() {
        super();

        this._hass = null;
        this._iframe = null;
        this._resizeObserver = null;
        this._lastSentToken = null;
        this._authMessageHandler = null;
        this._refreshPromise = null;


        this.attachShadow({ mode: "open" });
    }

    // Home Assistant levert hier zijn actuele frontend-object aan.
    set hass(hass) {
        const oldToken = this._hass?.auth?.data?.access_token;
        const newToken = hass?.auth?.data?.access_token;

        this._hass = hass;

        if (oldToken !== newToken) {
            console.info(
                "[GeurBot] HA-token is veranderd:",
                Boolean(oldToken),
                "->",
                Boolean(newToken)
            );
        }

        this._sendAuth();
    }

    get hass() {
        return this._hass;
    }

    connectedCallback() {
        if (this._iframe) return;

        const style = document.createElement("style");

        style.textContent = `
            :host {
                display: block !important;
                width: 100% !important;
                height: 100% !important;
                min-height: 0 !important;
                overflow: hidden;
            }

            iframe {
                display: block;
                width: 100%;
                height: 100%;
                min-height: 0;
                border: 0;
                background: var(--primary-background-color, #fff);
            }
        `;

        const iframe = document.createElement("iframe");

        iframe.title = "GeurBot";
        iframe.src = "/geurbot_static/index.html";

        iframe.addEventListener("load", () => {
            this._sendAuth(true);
        });

        this.shadowRoot.append(style, iframe);
        this._iframe = iframe;

        this._fixPanelHeight();

        this._resizeObserver = new ResizeObserver(() => {
            this._fixPanelHeight();
        });

        this._resizeObserver.observe(this);

        // Luistert naar authenticatieverzoeken vanuit het iframe.
         this._authMessageHandler = (event) => {
            if (
                event.origin !== window.location.origin ||
                event.source !== this._iframe?.contentWindow ||
                event.data?.type !== "geurbot-auth-request"
            ) {
                return;
            }

            console.info("[GeurBot] Iframe vraagt om HA-token.");

            this._sendAuth(true, event.data.requestId ?? null, true);
        };


        window.addEventListener(
            "message",
            this._authMessageHandler
        );
    }

    disconnectedCallback() {
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;

        if (this._authMessageHandler) {
            window.removeEventListener(
                "message",
                this._authMessageHandler
            );

            this._authMessageHandler = null;
        }

        this._iframe = null;
        this._lastSentToken = null;
    }

    // Zoekt ook binnen Shadow DOM-elementen.
    _findElement(root, selector) {
        if (!root) return null;

        const found = root.querySelector?.(selector);

        if (found) return found;

        for (const element of root.querySelectorAll?.("*") ?? []) {
            if (!element.shadowRoot) continue;

            const result = this._findElement(
                element.shadowRoot,
                selector
            );

            if (result) return result;
        }

        return null;
    }

    // Zorgt dat het Home Assistant-paneel de volledige hoogte gebruikt.
    _fixPanelHeight() {
        const panel = this._findElement(
            this.ownerDocument,
            "ha-panel-custom"
        );

        if (!panel) {
            console.warn(
                "[GeurBot] ha-panel-custom niet gevonden"
            );
            return;
        }

        panel.style.setProperty("height", "100%", "important");
        panel.style.setProperty("min-height", "0", "important");
    }

    // Stuurt het actuele HA-token naar de iframe.
    // Stuurt het actuele (en indien nodig ververste) HA-token naar de iframe.
    async _sendAuth(force = false, requestId = null, forceRefresh = false) {
        const auth = this._hass?.auth;

        if (!auth || !this._iframe?.contentWindow) {
            console.warn("[GeurBot Auth] Geen HA-auth of iframe beschikbaar.");
            return false;
        }

        // Ververs het token als het verlopen is of als de iframe expliciet om een nieuw token vraagt
        if (forceRefresh || auth.expired) {
            try {
                this._refreshPromise ??= auth.refreshAccessToken();
                await this._refreshPromise;
            } catch (err) {
                console.error("[GeurBot Auth] Token verversen mislukt:", err);
                return false;
            } finally {
                this._refreshPromise = null;
            }
        }

        const token = auth.data?.access_token;

        if (typeof token !== "string" || !token) {
            console.warn("[GeurBot Auth] Geen geldig HA-token beschikbaar.");
            return false;
        }

        if (!force && token === this._lastSentToken) {
            return false;
        }

        this._iframe.contentWindow.postMessage(
            {
                type: "geurbot-auth",
                token,
                requestId
            },
            window.location.origin
        );

        this._lastSentToken = token;

        console.info("[GeurBot Auth] Token verstuurd:", {
            length: token.length,
            requestId: Boolean(requestId)
        });

        return true;
    }

}

if (!customElements.get("ha-panel-geurbot")) {
    customElements.define(
        "ha-panel-geurbot",
        GeurBotPanel
    );
}
