
class GeurBotPanel extends HTMLElement {
    constructor() {
        super();

        this._hass = null;
        this._iframe = null;
        this._resizeObserver = null;

        this.attachShadow({ mode: "open" });
    }

    set hass(hass) {
        this._hass = hass;
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
        iframe.addEventListener("load", () => this._sendAuth());

        this.shadowRoot.append(style, iframe);
        this._iframe = iframe;

        this._fixPanelHeight();

        this._resizeObserver = new ResizeObserver(() => {
            this._fixPanelHeight();
        });

        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
    }

    _findElement(root, selector) {
        if (!root) return null;

        const found = root.querySelector?.(selector);
        if (found) return found;

        for (const element of root.querySelectorAll?.("*") ?? []) {
            if (element.shadowRoot) {
                const result = this._findElement(element.shadowRoot, selector);
                if (result) return result;
            }
        }

        return null;
    }

    _fixPanelHeight() {
        const panel = this._findElement(
            this.ownerDocument,
            "ha-panel-custom"
        );

        if (!panel) {
            console.warn("[GeurBot] ha-panel-custom niet gevonden");
            return;
        }

        panel.style.setProperty("height", "100%", "important");
        panel.style.setProperty("min-height", "0", "important");

        console.log(
            "[GeurBot] Paneelhoogte:",
            panel.getBoundingClientRect().height
        );
    }

    _sendAuth() {
        const token = this._hass?.auth?.data?.access_token;
        if (!token || !this._iframe?.contentWindow) return;

        this._iframe.contentWindow.postMessage(
            { type: "geurbot-auth", token },
            window.location.origin
        );
    }
}

if (!customElements.get("ha-panel-geurbot")) {
    customElements.define("ha-panel-geurbot", GeurBotPanel);
}
