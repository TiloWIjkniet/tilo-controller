
import "./styles/main.css";
import "./styles/layout.css";
import "./styles/devices.css";
import "./styles/discovery.css";
import "./styles/fragrance.css";
import "./styles/device-settings.css";
import "./styles/performance.css";

import { createApp } from "./app/app.js";
import { updateDeviceStatus } from "./components/devices/device-status.js";
import { updateDeviceFirmware } from "./components/devices/device-firmware.js";
import { refreshDeviceFragrance } from "./components/devices/device-fragrance.js";
import { setupDeviceSelection } from "./components/devices/device-selection.js";
import { setupDiscoveryModal } from "./components/discovery/discovery-modal.js";
import { setupFragranceSelection } from "./components/fragrances/fragrance-list.js";
import { devices, loadDevices } from "./components/devices/device-list.js";
import { createDeviceSettings, setupDeviceSettings } from "./components/devices/settings/device-settings.js";

await loadDevices();

const app = document.querySelector("#app");
app.innerHTML = createApp();

setupDeviceSelection(app);
setupDiscoveryModal(app);
setupFragranceSelection(app);
setupDeviceSettings(app);

function refreshNetworkStatus() {
    app.querySelectorAll(".device-card").forEach(card => {
        updateDeviceStatus(card, card.dataset.deviceId);
    });
}

async function refreshFirmwareStatus() {
    const results = await Promise.all(
        [...app.querySelectorAll(".device-card")].map(async card => {
            return updateDeviceFirmware(card, card.dataset.deviceId);
        })
    );

    return results.some(status => status?.running);
}

function refreshFragranceStatus() {
    app.querySelectorAll(".device-card").forEach(card => {
        refreshDeviceFragrance(card, card.dataset.deviceId);
    });
}

refreshNetworkStatus();
refreshFirmwareStatus();
refreshFragranceStatus();

setInterval(refreshNetworkStatus, 10000);
setInterval(refreshFragranceStatus, 10000);

let firmwareInterval;

async function pollFirmwareStatus() {
    const updating = await refreshFirmwareStatus();

    clearInterval(firmwareInterval);

    firmwareInterval = setInterval(
        pollFirmwareStatus,
        updating ? 1000 : 5 * 60 * 1000
    );
}

pollFirmwareStatus();
