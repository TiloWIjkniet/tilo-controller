class GeurBotPanel extends HTMLElement {
    constructor() {
        super();

        this._hass = null;
        this._iframe = null;
        this._resizeObserver = null;
        this._lastSentToken = null;

        this._authMessageHandler = null;

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
            // Een nieuwe iframe moet het token opnieuw ontvangen,
            // ook wanneer het token zelf niet veranderd is.
            this._sendAuth(true);
        });

        this.shadowRoot.append(style, iframe);
        this._iframe = iframe;

        this._fixPanelHeight();

        this._resizeObserver = new ResizeObserver(() => {
            this._fixPanelHeight();
        });

        this._resizeObserver.observe(this);


        _sendAuth(force = false, requestId = null) {
            const token = this._hass?.auth?.data?.access_token;

            if (
                typeof token !== "string" ||
                !token ||
                !this._iframe?.contentWindow
            ) {
                console.warn("[GeurBot Auth] Geen HA-token beschikbaar.");
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

    // Stuurt het nieuwste beschikbare Home Assistant-token naar de iframe.
   _sendAuth(force = false) {
        const token = this._hass?.auth?.data?.access_token;

        if (
            typeof token !== "string" ||
            !token ||
            !this._iframe?.contentWindow
        ) {
            return;
        }

        // Alleen overslaan als we hetzelfde token al hebben
        // verstuurd en er geen expliciet verzoek is.
        if (!force && token === this._lastSentToken) {
            return;
        }

        console.log("[GeurBot Auth] Token vanuit HA:", {
            lengte: token.length,
            laatsteTekens: token.slice(-6)
        });
        this._iframe.contentWindow.postMessage(
            {
                type: "geurbot-auth",
                token
            },
            window.location.origin
        );

        this._lastSentToken = token;

        console.info(
            "[GeurBot] Home Assistant-token verstuurd."
        );
    }


}

if (!customElements.get("ha-panel-geurbot")) {
    customElements.define(
        "ha-panel-geurbot",
        GeurBotPanel
    );
}
