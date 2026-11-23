console.log("[GeurBot Panel] panel.js wordt geladen");

class GeurBotPanel extends HTMLElement {
  constructor() {
    super();

    console.log("[GeurBot Panel] Constructor gestart");

    try {
      this.style.display = "block";
      this.style.height = "100%";

      this._hass = null;

      console.log("[GeurBot Panel] Iframe aanmaken");

      this._iframe = document.createElement("iframe");
      this._iframe.src = "/geurbot_static/index.html";
      this._iframe.title = "GeurBot";
      this._iframe.style.cssText =
        "border:0;width:100%;height:100%;display:block;background:var(--primary-background-color)";

      this._iframe.addEventListener("load", () => {
        console.log("[GeurBot Panel] Iframe geladen");
        this._sendAuth();
      });

      this._iframe.addEventListener("error", (error) => {
        console.error("[GeurBot Panel] Iframe fout:", error);
      });

      this.append(this._iframe);

      console.log("[GeurBot Panel] Constructor succesvol afgerond");
    } catch (error) {
      console.error("[GeurBot Panel] Constructor mislukt:", error);
      throw error;
    }
  }

  set hass(value) {
    console.log("[GeurBot Panel] hass ontvangen");

    this._hass = value;
    this._sendAuth();
  }

  get hass() {
    return this._hass;
  }

  _sendAuth() {
    const token = this._hass?.auth?.data?.access_token;

    if (!token) {
      console.warn("[GeurBot Panel] Geen access token beschikbaar");
      return;
    }

    if (!this._iframe?.contentWindow) {
      console.warn("[GeurBot Panel] Iframe window nog niet beschikbaar");
      return;
    }

    console.log("[GeurBot Panel] Authenticatie naar iframe versturen");

    this._iframe.contentWindow.postMessage(
      { type: "geurbot-auth", token },
      window.location.origin
    );
  }
}

if (!customElements.get("ha-panel-geurbot")) {
  console.log("[GeurBot Panel] Custom element registreren");
  customElements.define("ha-panel-geurbot", GeurBotPanel);
} else {
  console.warn("[GeurBot Panel] Custom element was al geregistreerd");
}