import { createDeviceCard } from "./device-card.js";
import { updateDeviceStatus } from "./device-status.js";
import { updateDeviceFirmware } from "./device-firmware.js";
import { refreshDeviceFragrance } from "./device-fragrance.js";
import { clearFragranceData } from "../fragrances/fragrance-list.js";


export const devices = [];

document.addEventListener("geurbot:device-removed", event => {
    removeDeviceFromDashboard(event.detail?.deviceId);
});

export function createDeviceHeader() {
    return `
        <header class="panel-header device-list-header">
            <div class="panel-header-title">
                <h2>Apparaten</h2>
                <p>Beheer je gekoppelde GeurBots</p>
            </div>

            <div class="device-header">
                <input type="search" id="device-search" class="device-search"
                    placeholder="Zoek apparaat..." aria-label="Zoek apparaat">
                <button id="add-device" class="add-device-button"
                    aria-label="GeurBot toevoegen">+</button>
            </div>
        </header>
    `;
}

export function createDeviceContent() {
    return `
        <div class="device-list">
            <div class="device-items">
                ${devices.map(createDeviceCard).join("")}
            </div>
        </div>
    `;
}

export function createDiscoveryModal() {
    return `
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

                <button id="scan-devices" class="scan-button">
                    <span>↻</span> Scannen naar apparaten
                </button>
            </section>
        </div>
    `;
}

export function createDeviceList() {
    return `
        ${createDeviceHeader()}
        ${createDeviceContent()}
        ${createDiscoveryModal()}
    `;
}

function refreshNetworkStatus(container) {
    devices.forEach(device => {
        const card = container.querySelector(`[data-device-id="${device.id}"]`);
        if (card) updateDeviceStatus(card, device.id);
    });
}

function refreshFirmwareStatus(container) {
    devices.forEach(device => {
        const card = container.querySelector(`[data-device-id="${device.id}"]`);
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

// ==================================================
// APPARAAT VOLLEDIG VERWIJDEREN
// ==================================================

export function removeDeviceFromDashboard(deviceId) {
    if (!deviceId) return;

    const id = String(deviceId);

    // Apparaat uit de apparatenlijst verwijderen
    const index = devices.findIndex(device => String(device.id) === id);

    if (index !== -1) {
        devices.splice(index, 1);
    }

    // Alle apparaatgerelateerde HTML verwijderen
    document.querySelectorAll("[data-device-id]").forEach(element => {
        if (element.dataset.deviceId === id) {
            element.remove();
        }
    });

    // Gegevens en selectie van geuren verwijderen
    clearFragranceData(id);

    // Instellingenvenster sluiten
    const settingsOverlay = document.getElementById("device-settings-overlay");

    if (settingsOverlay) {
        settingsOverlay.hidden = true;
    }

    // Instellingentabbladen resetten
    document.querySelectorAll(".settings-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".settings-panel").forEach(panel => {
        panel.classList.remove("active");
        panel.hidden = true;
    });

    // Terug naar het standaardtabblad
    const generalTab = document.querySelector('.settings-tab[data-tab="general"]');
    const generalPanel = document.querySelector('.settings-panel[data-panel="general"]');

    generalTab?.classList.add("active");

    if (generalPanel) {
        generalPanel.classList.add("active");
        generalPanel.hidden = false;
    }

    // Discoveryvenster sluiten indien geopend
    const discoveryOverlay = document.getElementById("add-device-overlay");

    if (discoveryOverlay) {
        discoveryOverlay.hidden = true;
    }

    // Andere onderdelen informeren dat de selectie is gewist
    document.dispatchEvent(new CustomEvent("geurbot:device-selection-cleared", {
        detail: { deviceId: id }
    }));
}


export async function loadDevices() {
    try {
        const response = await fetch("/api/devices");

        if (!response.ok)
            throw new Error("Could not retrieve devices");

        const result = await response.json();

        if (!result.success)
            throw new Error("Could not load devices");

        devices.splice(0, devices.length, ...result.devices.map(device => ({
            ...device,
            id: device.device_id,
            name: device.name || device.hostname
        })));

        return devices;

    } catch (error) {
        console.error("Failed to load devices:", error);
        return [];
    }
}