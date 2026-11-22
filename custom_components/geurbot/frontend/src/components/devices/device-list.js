
import { createDeviceCard } from "./device-card.js";
import { updateDeviceStatus } from "./device-status.js";
import { updateDeviceFirmware } from "./device-firmware.js";
import {updateDeviceFragrance } from "./device-fragrance.js";
import { clearFragranceData } from "../fragrances/fragrance-list.js";
import {fetchDeviceFragranceStatus,fetchDeviceFragrances
} from "../../services/device-fragrance.js";
export const devices = [];



document.addEventListener("geurbot:device-network-status-updated", event => {
    const { deviceId, unreachable } = event.detail;

    const device = devices.find(device =>
        String(device.id) === String(deviceId)
    );

    if (!device) return;

    device.unreachable = unreachable;

    const card = document.querySelector(`[data-device-id="${deviceId}"]`);

    if (card)
        updateDeviceFragrance(card, device.fragrances, !unreachable);
});


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

export function renderDevices(container) {
    const deviceItems = container.querySelector(".device-items");
    if (!deviceItems) return;

    deviceItems.innerHTML = devices.map(createDeviceCard).join("");

    refreshNetworkStatus(container);
    refreshFirmwareStatus(container);

    devices.forEach(device => {
        const card = container.querySelector(`[data-device-id="${device.id}"]`);
        if (card)
            updateDeviceFragrance(card, device.fragrances, !device.unreachable);
    });
}

// ==================================================
// APPARAAT VOLLEDIG VERWIJDEREN
// ==================================================

export function removeDeviceFromDashboard(deviceId) {
    if (!deviceId) return;

    const id = String(deviceId);
    const index = devices.findIndex(device => String(device.id) === id);

    if (index !== -1)
        devices.splice(index, 1);

    document.querySelectorAll("[data-device-id]").forEach(element => {
        if (element.dataset.deviceId === id)
            element.remove();
    });

    clearFragranceData(id);

    const settingsOverlay = document.getElementById("device-settings-overlay");

    if (settingsOverlay)
        settingsOverlay.hidden = true;

    document.querySelectorAll(".settings-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".settings-panel").forEach(panel => {
        panel.classList.remove("active");
        panel.hidden = true;
    });

    const generalTab = document.querySelector('.settings-tab[data-tab="general"]');
    const generalPanel = document.querySelector('.settings-panel[data-panel="general"]');

    generalTab?.classList.add("active");

    if (generalPanel) {
        generalPanel.classList.add("active");
        generalPanel.hidden = false;
    }

    const discoveryOverlay = document.getElementById("add-device-overlay");

    if (discoveryOverlay)
        discoveryOverlay.hidden = true;

    document.dispatchEvent(new CustomEvent("geurbot:device-selection-cleared", {
        detail: { deviceId: id }
    }));
}

// ==================================================
// APPARATEN OPHALEN
// ==================================================


export async function loadDevices() {
    try {
        const response = await fetch("/api/devices");
        if (!response.ok)
            throw new Error("Could not retrieve devices");

        const result = await response.json();
        if (!result.success)
            throw new Error("Could not load devices");

        const oldDevices = new Map(devices.map(device => [device.id, device]));

        devices.splice(0, devices.length, ...result.devices.map(device => {
            const oldDevice = oldDevices.get(device.device_id);

            return {
                ...device,
                id: device.device_id,
                name: device.name || device.hostname,
                fragrances: oldDevice?.fragrances ?? [],
                unreachable: oldDevice?.unreachable ?? false
            };
        }));

        await refreshDevices();

        return devices;
    } catch (error) {
        console.error("Failed to load devices:", error);
        return [];
    }
}
// ==================================================
// APPARATEN EN FRAGRANCES VERNIEUWEN
// ==================================================

export async function refreshDevices() {
    await Promise.all(devices.map(async device => {
        try {
            const oldFragrances = (device.fragrances ?? []).filter(fragrance =>
                fragrance?.mac_address && fragrance?.name
            );

            const [status, result] = await Promise.all([
                fetchDeviceFragranceStatus(device.id),
                fetchDeviceFragrances(device.id)
            ]);

            if (!result?.success || !Array.isArray(result.fragrances))
                throw new Error("Ongeldig geurresultaat ontvangen van API");

            const newFragrances = result.fragrances.filter(fragrance =>
                fragrance?.mac_address && fragrance?.name
            );

            const oldByMac = new Map(
                oldFragrances.map(fragrance => [fragrance.mac_address, fragrance])
            );

            const newMacAddresses = new Set(
                newFragrances.map(fragrance => fragrance.mac_address)
            );

            const updatedFragrances = [
                ...newFragrances.map(fragrance => ({
                    ...oldByMac.get(fragrance.mac_address),
                    ...fragrance,
                    unreachable: false
                })),

                ...oldFragrances
                    .filter(fragrance => !newMacAddresses.has(fragrance.mac_address))
                    .map(fragrance => ({
                        ...fragrance,
                        unreachable: true
                    }))
            ];

            device.fragrances = updatedFragrances;
            device.status = status;
            device.unreachable = false;

            document.dispatchEvent(new CustomEvent("geurbot:fragrances-updated", {
                detail: { deviceId: device.id }
            }));

        } catch (error) {
            console.error(`Fout bij ophalen geuren van ${device.name}:`, error);
            return;
        }

        const card = document.querySelector(`[data-device-id="${device.id}"]`);

        if (card)
            updateDeviceFragrance(card, device.fragrances, true);
    }));
}
