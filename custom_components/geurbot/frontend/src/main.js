import "./styles/main.css";
import "./styles/layout.css";
import "./styles/devices.css";
import "./styles/discovery.css";

import { createApp } from "./app/app.js";
import { updateDeviceStatus } from "./components/devices/device-status.js";
import { updateDeviceFirmware } from "./components/devices/device-firmware.js";
import { setupDeviceSelection } from "./components/devices/device-selection.js";
import { setupDiscoveryModal } from "./components/discovery/discovery-modal.js";

const app = document.querySelector("#app");
app.innerHTML = createApp();

setupDeviceSelection(app);
setupDiscoveryModal(app);

function refreshNetworkStatus() {
    app.querySelectorAll(".device-card").forEach(card => {
        updateDeviceStatus(card, card.dataset.deviceId);
    });
}

function refreshFirmwareStatus() {
    app.querySelectorAll(".device-card").forEach(card => {
        updateDeviceFirmware(card, card.dataset.deviceId);
    });
}

refreshNetworkStatus();
refreshFirmwareStatus();

setInterval(refreshNetworkStatus, 30000);
setInterval(refreshFirmwareStatus, 5 * 60 * 1000);
