import { createDeviceCard } from "./device-card.js";
import { updateDeviceStatus } from "./device-status.js";
import { updateDeviceFirmware } from "./device-firmware.js";
import { refreshDeviceFragrance } from "./device-fragrance.js";
export const devices = [];

export function createDeviceList() {
    return `
        <div class="device-list">
            <div class="device-header">
                <input type="search" id="device-search" class="device-search" placeholder="Zoek apparaat..." aria-label="Zoek apparaat">
                <button id="add-device" class="add-device-button" aria-label="GeurBot toevoegen">+</button>
            </div>
            <div class="device-items">
                ${devices.map(createDeviceCard).join("")}
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


function refreshNetworkStatus(container) {
    devices.forEach(device => {
        const card = container.querySelector(
            `[data-device-id="${device.id}"]`
        );

        if (card) updateDeviceStatus(card, device.id);
    });
}

function refreshFirmwareStatus(container) {
    devices.forEach(device => {
        const card = container.querySelector(
            `[data-device-id="${device.id}"]`
        );

        if (card) updateDeviceFirmware(card, device.id);
    });
}

function refreshFragranceStatus(container) {
    devices.forEach(device => {
        const card = container.querySelector(`[data-device-id="${device.id}"]`);
        if (card) refreshDeviceFragrance(card, device.id);
    });
}

export function renderDevices(container) {
    const deviceItems = container.querySelector(".device-items");
    if (!deviceItems) return;

    deviceItems.innerHTML = devices.map(createDeviceCard).join("");

    refreshNetworkStatus(container);
    refreshFirmwareStatus(container);
    refreshFragranceStatus(container);
}