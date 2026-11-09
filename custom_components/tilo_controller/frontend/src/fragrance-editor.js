
import { LitElement, html, css } from "lit";

class FragranceEditor extends LitElement {

    static properties = {
        fragrance: { type: Object },
    };

    static styles = css`
            :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            color: var(--primary-text-color);
        }

        h3 {
            margin: 0 0 16px;
            font-size: 18px;
            font-weight: 700;
        }

        .name-input {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 20px;
            padding: 11px 12px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #292d35;
            color: #e1e1e1;
            font-size: 17px;
            font-family: inherit;
        }

        .setting {
            margin-bottom: 22px;
        }

        .setting-title {
            margin-bottom: 8px;
            font-weight: 700;
        }

        .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .stock-bar {
            height: 9px;
            margin-top: 10px;
            overflow: hidden;
            border-radius: 6px;
            background: #3a3f48;
        }

            .stock-fill {
                height: 100%;
                transition: width 0.2s, background 0.2s;
            }

            .enough-yes {
                color: #4caf50;
                font-weight: 700;
            }

            .enough-no {
                color: #f44336;
                font-weight: 700;
            }
        .manual-spray-button {
            width: 100%;
            margin-top: 12px;
            padding: 11px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #343e4b;
            color: #e1e1e1;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }

        .manual-spray-button:hover {
            background: #405064;
        }

        .manual-spray-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #03a9f4;
        }

        .empty {
            color: #9da5b0;
        }
    `;

    constructor() {
        super();
        this.fragrance = null;
    }

    render() {
        if (!this.fragrance) {
            return html`
                <h3>Geurinstellingen</h3>
                <p class="empty">Selecteer eerst een geur.</p>
            `;
        }

        const fragrance = this.fragrance;
       
        const stockPercentage = Math.max(
            0,
            Math.min(100, fragrance.stockLevel ?? 0)
        );
         const stockColor = `hsl(${stockPercentage * 1.2}, 85%, 45%)`;
        const remainingSprays = Math.max(
            0,
            (fragrance.maxSprays ?? 0) - (fragrance.sprayCount ?? 0)
        );

        return html`
            <h3>Geurinstellingen</h3>

            <input
                class="name-input"
                type="text"
                .value=${fragrance.name ?? ""}
                @change=${e => this.updateFragrance({
                    name: e.target.value
                })}
            >

            <div class="setting">
                <div class="setting-row">
                    <span>Geur ingeschakeld</span>
                    <input
                        type="checkbox"
                        .checked=${fragrance.enabled}
                        @change=${e => this.updateFragrance({
                            enabled: e.target.checked
                        })}
                    >
                </div>
            </div>

            <div class="setting">
                <div class="setting-title">Geschatte geurvoorraad</div>
                <div>${stockPercentage}%</div>

                <div class="stock-bar">
                    <div
                        class="stock-fill"
                        style="width: ${stockPercentage}%; background: ${stockColor}"
                    ></div>
                </div>

                <p>Geschat aantal resterende sprays: ${remainingSprays}</p>
            </div>

            <div class="setting">
                <div class="setting-title">Spraystatus</div>

                <div class="setting-row">
                    <span>Genoeg geur om te sprayen</span>
                    <span class="${fragrance.enoughFragrance ? "enough-yes" : "enough-no"}">
                    ${fragrance.enoughFragrance ? "Ja" : "Nee"}
</span>
                </div>

                <p>Sprays sinds bijvullen: ${fragrance.sprayCount ?? 0}</p>
            </div>

            <button
                class="manual-spray-button"
                ?disabled=${!fragrance.enabled ||
                    !fragrance.enoughFragrance}
                @click=${this.manualSpray}
            >
                Handmatig sprayen
            </button>
        `;
    }

    updateFragrance(changes) {
        const updatedFragrance = {
            ...this.fragrance,
            ...changes,
        };

        this.dispatchEvent(new CustomEvent(
            "fragrance-settings-changed",
            {
                detail: { fragrance: updatedFragrance },
                bubbles: true,
                composed: true,
            }
        ));
    }

    manualSpray() {
        this.dispatchEvent(new CustomEvent("manual-spray", {
            detail: {
                fragranceId: this.fragrance.id
            },
            bubbles: true,
            composed: true,
        }));
    }
}

customElements.define("fragrance-editor", FragranceEditor);
