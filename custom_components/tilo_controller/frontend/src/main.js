
import { LitElement, html, css } from "lit";

import "./esp-list.js";
import "./device-list.js";
import "./fragrance-editor.js";
import "./schedule-editor.js";

class TiloController extends LitElement {

    static properties = {
        espList: { type: Array },
        selectedEsp: { type: String },
        selectedFragrance: { type: String },
    };

    static styles = css`
        :host {
            display: block;
            min-height: 100vh;
            padding: 20px;
            box-sizing: border-box;
            background: #111318;
            color: #e1e1e1;
            font-family: Roboto, Arial, sans-serif;
        }

        .layout {
            display: grid;
            grid-template-columns: 0.67fr 0.67fr 0.67fr 1.5fr;
            gap: 16px;
        }

        .section {
            height: calc(100vh - 40px);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-height: 0;
        }

        @media (max-width: 800px) {
            .layout {
                grid-template-columns: 1fr;
            }

            .section {
                height: auto;
                min-height: 300px;
            }
        }
    `;

    constructor() {
        super();

        this.espList = [
            {
                id: "esp1",
                name: "Woonkamer-controller",
                schedule: [],
                fragrances: [
                    {
                        id: "fragrance1",
                        name: "Lavendel",
                        enabled: true,
                        stockLevel: 80,
                        maxSprays: 200,
                        sprayCount: 124,
                        enoughFragrance: true,
                    },
                    {
                        id: "fragrance2",
                        name: "Citrus",
                        enabled: true,
                        stockLevel: 35,
                        maxSprays: 200,
                        sprayCount: 58,
                        enoughFragrance: true,
                    },
                ],
            },
            {
                id: "esp2",
                name: "Keuken-controller",
                schedule: [],
                fragrances: [
                    {
                        id: "fragrance3",
                        name: "Vanille",
                        enabled: false,
                        stockLevel: 10,
                        maxSprays: 200,
                        sprayCount: 210,
                        enoughFragrance: false,
                    },
                ],
            },
        ];

        this.selectedEsp = "esp1";
        this.selectedFragrance = "fragrance1";
    }

    get selectedEspData() {
        return this.espList.find(
            esp => esp.id === this.selectedEsp
        );
    }

    get selectedFragrances() {
        return this.selectedEspData?.fragrances ?? [];
    }

    get selectedFragranceData() {
        return this.selectedFragrances.find(
            fragrance => fragrance.id === this.selectedFragrance
        );
    }

    updateFragrance(updatedFragrance) {
        this.espList = this.espList.map(esp => {
            if (esp.id !== this.selectedEsp) return esp;

            return {
                ...esp,
                fragrances: esp.fragrances.map(fragrance =>
                    fragrance.id === updatedFragrance.id
                        ? updatedFragrance
                        : fragrance
                ),
            };
        });
    }

    render() {
        return html`
            <div class="layout">

                <div class="section">
                    <esp-list
                        .espList=${this.espList}
                        .selectedEsp=${this.selectedEsp}
                        @esp-selected=${e => {
                            this.selectedEsp = e.detail.espId;

                            const fragrances =
                                this.espList.find(
                                    esp => esp.id === this.selectedEsp
                                )?.fragrances ?? [];

                            this.selectedFragrance =
                                fragrances[0]?.id ?? null;
                        }}
                        @esp-name-changed=${e => {
                            this.espList = this.espList.map(esp =>
                                esp.id === e.detail.espId
                                    ? { ...esp, name: e.detail.name }
                                    : esp
                            );
                        }}
                    ></esp-list>
                </div>

                <div class="section">
                    <device-list
                        .fragrances=${this.selectedFragrances}
                        .selectedFragrance=${this.selectedFragrance}
                        .espName=${this.selectedEspData?.name ?? ""}
                        @fragrance-selected=${e => {
                            this.selectedFragrance = e.detail.fragranceId;
                        }}
                        @esp-name-changed=${e => {
                            this.espList = this.espList.map(esp =>
                                esp.id === this.selectedEsp
                                    ? { ...esp, name: e.detail.name }
                                    : esp
                            );
                        }}
                    ></device-list>
                </div>

                <div class="section">
                    <fragrance-editor
                        .fragrance=${this.selectedFragranceData}
                        @fragrance-settings-changed=${e => {
                            this.updateFragrance(e.detail.fragrance);
                        }}
                        @manual-spray=${e => {
                            console.log(
                                "Handmatig sprayen:",
                                e.detail.fragranceId
                            );
                        }}
                    ></fragrance-editor>
                </div>

                <div class="section">
                    <schedule-editor
                        .fragrances=${this.selectedFragrances}
                        .schedule=${this.selectedEspData?.schedule ?? []}
                        @schedule-changed=${e => {
                            this.espList = this.espList.map(esp =>
                                esp.id === this.selectedEsp
                                    ? { ...esp, schedule: e.detail.schedule }
                                    : esp
                            );
                        }}
                    ></schedule-editor>
                </div>

            </div>
        `;
    }
}

console.log("Tilo Controller component geladen!");

customElements.define("tilo-controller", TiloController);
