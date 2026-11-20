
import { createFragranceCard } from "./fragrance-card.js";
import { updateDeviceStatus } from "../devices/device-status.js";
import { updateDeviceFirmware } from "../devices/device-firmware.js";
import { createDeviceSettings, setupDeviceSettings } from "../devices/settings/device-settings.js";
export const fragrances = [];

export function createFragranceHeader() {
    return `
        <header class="panel-header fragrance-header">
            <div class="fragrance-header-top">
                <div class="panel-header-title fragrance-device-info">
                    <h2 id="fragrance-title">Geen apparaat geselecteerd</h2>
                    <p class="device-hostname"></p>

                    <div class="device-network-info">
                        <p class="device-status">Niet verbonden</p>
                        <p class="device-signal"></p>
                    </div>
                </div>

                <div class="fragrance-actions">
                    <button class="device-settings" type="button">
                        Instellingen
                    </button>
                </div>
            </div>

            <div class="firmware-update" hidden>
                <div class="firmware-update-info">
                    <span class="firmware-update-label">Update beschikbaar</span>
                    <span class="firmware-update-percentage"></span>
                </div>

                <div class="firmware-update-progress" hidden>
                    <div class="firmware-update-progress-bar"></div>
                </div>

                <button class="firmware-update-button" type="button">
                    Firmware bijwerken
                </button>
            </div>
            ${createDeviceSettings()}
        </header>
    `;
}

export function createFragranceContent() {
    return `
        <div class="fragrance-list">
            <div class="fragrance-items">
                ${fragrances.map(createFragranceCard).join("")}
            </div>
        </div>
    `;
}

export function createFragranceList() {
    return `
        ${createFragranceHeader()}
        ${createFragranceContent()}
    `;
}

export function setupFragranceSelection(app) {
    app.addEventListener("device-selected", async event => {
        const device = event.detail;
        const panel = app.querySelector(".fragrance-header");

        if (!panel) return;

        const title = panel.querySelector("#fragrance-title");
        if (title) title.textContent = device.name;

        await updateDeviceStatus(panel, device.id);
        await updateDeviceFirmware(panel, device.id);
    });
}


export function clearFragranceData(deviceId) {
    fragrances.length = 0;

    const items = document.querySelector(".fragrance-items");
    if (items) items.innerHTML = "";

    const title = document.querySelector("#fragrance-title");
    if (title) title.textContent = "Geen apparaat geselecteerd";

    const hostname = document.querySelector(".device-hostname");
    if (hostname) hostname.textContent = "";

    const status = document.querySelector(".device-status");
    if (status) status.textContent = "Niet verbonden";

    const signal = document.querySelector(".device-signal");
    if (signal) signal.textContent = "";
}