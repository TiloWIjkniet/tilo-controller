console.log("[GeurBot] panel.js geladen");

class GeurBotPanel extends HTMLElement {
  constructor() {
    super();
    console.log("[GeurBot] Constructor uitgevoerd");
  }
}

customElements.define("ha-panel-geurbot", GeurBotPanel);

console.log("[GeurBot] Custom element geregistreerd");