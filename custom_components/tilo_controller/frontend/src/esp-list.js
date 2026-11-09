
import { LitElement, html, css } from "lit";

class EspList extends LitElement {

    static properties = {
        espList: { type: Array },
        selectedEsp: { type: String },
        searchQuery: { type: String },
    };

    static styles = css`
 :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

        h3 {
            margin: 0 0 16px;
            font-size: 18px;
            font-weight: 500;
        }

.esp-list {
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

        .esp-card {
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

        .esp-card:hover {
            background: #343943;
        }

        .esp-card.selected {
            background: #343e4b;
            border-color: #03a9f4;
        }

        .esp-name {
            font-size: 15px;
            font-weight: 500;
        }

        .esp-id {
            margin-top: 5px;
            color: #9da5b0;
            font-size: 12px;
        }
            .search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    margin-bottom: 12px;

    border: 1px solid #3a3f48;
    border-radius: 9px;

    background: #292d35;
    color: #e1e1e1;
    font: inherit;
    outline: none;
}

.search-input:focus {
    border-color: #03a9f4;
}

.search-input::placeholder {
    color: #9299a4;
}

.search-container {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.search-input {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
}

.add-button {
    padding: 0 14px;
    border: 1px solid #3a3f48;
    border-radius: 9px;
    background: #343e4b;
    color: #e1e1e1;
    cursor: pointer;
    white-space: nowrap;
}

.add-button:hover {
    background: #405064;
}
    `;

constructor() {
    super();
    this.espList = [];
    this.selectedEsp = null;
    this.searchQuery = "";
}

   render() {
    const filteredEspList = this.espList.filter(esp =>
        esp.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        esp.id.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

        return html`
            <h3>ESP-controllers</h3>

     <div class="search-container">
    <input
        class="search-input"
        type="search"
        placeholder="Zoek ESP-controller..."
        .value=${this.searchQuery}
        @input=${e => this.searchQuery = e.target.value}
    >

    <button
        class="add-button"
        @click=${this.addController}
    >
        + Add controller
    </button>
</div>

            <div class="esp-list">
                ${filteredEspList.map(esp => html`
                    <button
                        class="esp-card ${this.selectedEsp === esp.id ? "selected" : ""}"
                        @click=${() => this.selectEsp(esp.id)}
                    >
                        <div class="esp-name">${esp.name}</div>
                        <div class="esp-id">${esp.id}</div>
                    </button>
                `)}

                ${filteredEspList.length === 0 ? html`
                    <p>Geen ESP-controllers gevonden.</p>
                ` : ""}
            </div>
        `;
    }

    selectEsp(espId) {
        this.selectedEsp = espId;

        this.dispatchEvent(new CustomEvent("esp-selected", {
            detail: { espId },
            bubbles: true,
            composed: true,
        }));
    }

    addController() {
    this.dispatchEvent(new CustomEvent("add-controller", {
        bubbles: true,
        composed: true,
    }));
}
}

customElements.define("esp-list", EspList);
