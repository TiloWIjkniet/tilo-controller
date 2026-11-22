
import "./styles/main.css";
import "./styles/layout.css";
import "./styles/devices.css";
import "./styles/discovery.css";
import "./styles/fragrance.css";
import "./styles/device-settings.css";
import "./styles/performance.css";
import "./styles/schedule.css";

import { createApp } from "./app/app.js";
import { updateDeviceStatus } from "./components/devices/device-status.js";
import { updateDeviceFirmware } from "./components/devices/device-firmware.js";
import { updateDeviceFragrance } from "./components/devices/device-fragrance.js";
import { setupDeviceSelection } from "./components/devices/device-selection.js";
import { setupDiscoveryModal } from "./components/discovery/discovery-modal.js";
import { setupFragranceSelection } from "./components/fragrances/fragrance-list.js";
import { devices, loadDevices, refreshDevices } from "./components/devices/device-list.js";
import { setupDeviceSettings } from "./components/devices/settings/device-settings.js";
import { startScheduleClock } from "./components/schedule/schedule-list.js";
import { initializeScheduleEvents } from "./components/schedule/schedule-events.js";
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

function updateFragranceIcons() {
    app.querySelectorAll(".device-card").forEach(card => {
        const device = devices.find(device => device.id === card.dataset.deviceId);

        if (device)
            updateDeviceFragrance(card, device.fragrances, !device.unreachable);
    });
}

async function refreshFragranceStatus() {
    await refreshDevices();
    updateFragranceIcons();
}

// De gegevens zijn al opgehaald door loadDevices().
initializeScheduleEvents();
startScheduleClock();
refreshNetworkStatus();
refreshFirmwareStatus();
updateFragranceIcons();

setInterval(refreshNetworkStatus, 10000);
setInterval(refreshFragranceStatus, 30000);

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
