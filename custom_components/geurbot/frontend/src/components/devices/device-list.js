import { createDeviceCard } from "./device-card.js";

// Zet TEST_MODE op false zodra de echte apparatenlijst vanuit Home Assistant wordt aangeleverd.
const TEST_MODE = true;
const testDevices = [
  //  {
    //     id: "4CE750B2F180",
    //     name: "GeurBot keuken",
    //     connection: {
    //         host: "192.168.2.4"
    //     }
    // },
    // { id: "geurbot_002", name: "GeurBot woonkamer", connection: { host: "192.168.1.101" } },
    // { id: "geurbot_003", name: "GeurBot slaapkamer", connection: { host: "192.168.1.102" } },
    // { id: "geurbot_004", name: "GeurBot badkamer", connection: { host: "192.168.1.103" } }
];

export function createDeviceList(devices = []) {
    const visibleDevices = TEST_MODE ? testDevices : devices;
    return `
        <div class="device-list">
            <div class="device-header">
                <input type="search" id="device-search" class="device-search" placeholder="Zoek apparaat..." aria-label="Zoek apparaat">
                <button id="add-device" class="add-device-button" aria-label="GeurBot toevoegen">+</button>
            </div>
            <div class="device-items">
                ${visibleDevices.map(createDeviceCard).join("")}
            </div>
        </div>
        <div class="add-device-overlay" id="add-device-overlay" hidden>
            <section class="add-device-modal" role="dialog" aria-modal="true" aria-labelledby="discovery-title">
                <div class="add-device-header">
                    <div>
                        <p class="eyebrow">APPARAAT KOPPELEN</p>
                        <h2 id="discovery-title">GeurBot toevoegen</h2>
                        <p>Zoek GeurBots op je lokale netwerk en koppel ze aan Home Assistant.</p>
                    </div>
                    <button id="close-add-device" class="modal-close" aria-label="Venster sluiten">×</button>
                </div>
                <div class="discovery-heading">
                    <h3>Beschikbare apparaten</h3>
                    <span id="discovery-count" class="discovery-count">Nog niet gescand</span>
                </div>
                <div id="discovery-loading" class="discovery-loading" hidden>
                    <span class="loading-spinner"></span> Apparaten zoeken...
                </div>
                <div id="discovered-devices" class="discovered-devices">
                    <div class="discovery-empty">
                        <span>⌕</span>
                        <p>Nog geen apparaten gezocht.</p>
                        <small>Start een scan om GeurBots te vinden.</small>
                    </div>
                </div>
                <button id="scan-devices" class="scan-button"><span>↻</span> Scannen naar apparaten</button>
            </section>
        </div>
    `;
}
