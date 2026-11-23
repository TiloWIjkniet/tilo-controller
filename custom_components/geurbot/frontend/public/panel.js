
class GeurBotPanel extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        height: 100%;
      }
    `;

    this._hass = null;

    this._iframe = document.createElement("iframe");
    this._iframe.src = "/geurbot_static/index.html";
    this._iframe.title = "GeurBot";
    this._iframe.style.cssText =
      "border:0;width:100%;height:100%;display:block;background:var(--primary-background-color)";

    this.shadowRoot.append(style, this._iframe);

    this._iframe.addEventListener("load", () => this._sendAuth());
  }

  set hass(value) {
    this._hass = value;
    this._sendAuth();
  }

  get hass() {
    return this._hass;
  }

  _sendAuth() {
    const token = this._hass?.auth?.data?.access_token;

    if (token && this._iframe.contentWindow) {
      this._iframe.contentWindow.postMessage(
        { type: "geurbot-auth", token },
        window.location.origin
      );
    }
  }
}

if (!customElements.get("ha-panel-geurbot")) {
  customElements.define("ha-panel-geurbot", GeurBotPanel);
}
