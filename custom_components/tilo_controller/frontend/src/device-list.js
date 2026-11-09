
import { LitElement, html, css } from "lit";

class DeviceList extends LitElement {

    static properties = {
        fragrances: { type: Array },
        selectedFragrance: { type: String },
        espName: { type: String },
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }

        h3 {
            margin: 0 0 12px;
            font-size: 18px;
            font-weight: 700;
        }

        .esp-name-input {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 20px;
            padding: 11px 12px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #292d35;
            color: #e1e1e1;
            font-size: 17px;
            font-weight: 600;
            font-family: inherit;
        }

        .fragrance-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding-right: 6px;
            scrollbar-width: thin;
            scrollbar-color: #555b66 transparent;
        }

        .fragrance-card {
            width: 100%;
            box-sizing: border-box;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #30343d;
            background: #292d35;
            color: #e1e1e1;
            text-align: left;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            flex-shrink: 0;
        }

        .fragrance-card:hover {
            background: #343943;
        }

        .fragrance-card.selected {
            background: #343e4b;
            border-color: #03a9f4;
        }

        .fragrance-name {
            font-size: 15px;
            font-weight: 500;
        }

        .fragrance-status {
            margin-top: 5px;
            font-size: 12px;
            color: #9da5b0;
        }
    `;

    constructor() {
        super();
        this.fragrances = [];
        this.selectedFragrance = null;
        this.espName = "";
    }

    render() {
        return html`\

      
            <h3>Geuren</h3>

            <input
                class="esp-name-input"
                type="text"
                .value=${this.espName}
                @change=${e => this.changeEspName(e.target.value)}
            >

            

            <div class="fragrance-list">
                ${this.fragrances.map(fragrance => html`
                    <button
                        class="fragrance-card ${
                            this.selectedFragrance === fragrance.id
                                ? "selected"
                                : ""
                        }"
                        @click=${() => this.selectFragrance(fragrance.id)}
                    >
                        <div class="fragrance-name">
                            ${fragrance.name}
                        </div>

                        <div class="fragrance-status">
                            ${fragrance.enabled
                                ? "Ingeschakeld"
                                : "Uitgeschakeld"}
                        </div>
                    </button>
                `)}

                ${this.fragrances.length === 0
                    ? html`<p>Deze controller heeft nog geen geuren.</p>`
                    : ""}
            </div>
        `;
    }

    changeEspName(name) {
        this.dispatchEvent(new CustomEvent("esp-name-changed", {
            detail: { name },
            bubbles: true,
            composed: true,
        }));
    }

    selectFragrance(fragranceId) {
        this.dispatchEvent(new CustomEvent("fragrance-selected", {
            detail: { fragranceId },
            bubbles: true,
            composed: true,
        }));
    }
}

customElements.define("device-list", DeviceList);
