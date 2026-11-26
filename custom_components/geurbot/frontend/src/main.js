import { geurbotAuthReady } from "./auth.js";


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
import { fetchDeviceFirmwareInfo } from "./services/services.js";
import { setupGeneralSettings } from "./components/algemene-settings/settings-general.js";


const authReady = await geurbotAuthReady;
if (!authReady) {
    document.querySelector("#app").innerHTML = `
        <main style="padding:24px;font-family:system-ui,sans-serif">
            <h2>GeurBot kan niet aanmelden bij Home Assistant</h2>
            <p>Open GeurBot via het GeurBot-zijpaneel in Home Assistant en controleer of je bent ingelogd.</p>
        </main>`;
    throw new Error("Home Assistant-authenticatie ontbreekt in het Webpage-dashboard.");
}
await loadDevices();

const app = document.querySelector("#app");
app.innerHTML = createApp();

setupDeviceSelection(app);
setupDiscoveryModal(app);
setupFragranceSelection(app);
setupDeviceSettings(app);
setupGeneralSettings(app);

function refreshNetworkStatus() {
    app.querySelectorAll(".device-card").forEach(card => {
        updateDeviceStatus(card, card.dataset.deviceId);
    });
}

async function refreshFirmwareStatus() {
    const targets = [...app.querySelectorAll(".device-card")].map(card => ({
        element: card,
        deviceId: card.dataset.deviceId
    }));

    const header = app.querySelector(".fragrance-header");
    const selectedId = header?.dataset.deviceId;

    if (header && selectedId) {
        targets.push({
            element: header,
            deviceId: selectedId
        });
    }

    const grouped = new Map();

    for (const target of targets) {
        if (!target.deviceId) continue;

        if (!grouped.has(target.deviceId))
            grouped.set(target.deviceId, []);

        grouped.get(target.deviceId).push(target);
    }

    const results = await Promise.all(
        [...grouped.entries()].map(async ([deviceId, elements]) => {
            try {
                const firmware = await fetchDeviceFirmwareInfo(deviceId);

                return elements.map(({ element }) =>
                    updateDeviceFirmware(element, deviceId, firmware)
                );
            } catch (error) {
                console.error(`[FIRMWARE] Status ophalen mislukt ${deviceId}:`, error);
                return [];
            }
        })
    );

    return results.flat().some(status => status?.running);
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
updateFragranceIcons();

setInterval(refreshNetworkStatus, 60 * 1000);
setInterval(refreshFragranceStatus, 30 * 1000);

let firmwareInterval = null;
let firmwarePolling = false;
let firmwareStartPending = false;

async function pollFirmwareStatus() {
    if (firmwarePolling) return;

    firmwarePolling = true;

    let updating = false;

    try {
        updating = await refreshFirmwareStatus();
    } catch (error) {
        console.error("[FIRMWARE] Status ophalen mislukt:", error);
    } finally {
        firmwarePolling = false;
    }

    if (updating)
        firmwareStartPending = false;

    clearTimeout(firmwareInterval);

    firmwareInterval = setTimeout(
        pollFirmwareStatus,
        updating || firmwareStartPending ?  2000 : 10 * 60 * 1000 ;
    );
}
    document.addEventListener("geurbot:firmware-update-started", () => {
  

    firmwareStartPending = true;
    clearTimeout(firmwareInterval);
    pollFirmwareStatus();
});

pollFirmwareStatus();
