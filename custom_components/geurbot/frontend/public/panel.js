class GeurBotPanel extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._iframe = null;
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
                display: block;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            iframe {
                display: block;
                width: 100%;
                height: 100%;
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
