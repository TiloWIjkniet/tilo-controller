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

// --------------------------------------------------
// Back-off helper tegen overbelasting en IP-bans
// --------------------------------------------------

function createBackoff(baseErrorDelay = 30 * 1000, maxErrorDelay = 5 * 60 * 1000) {
    let errorCount = 0;

    return {
        recordSuccess() {
            errorCount = 0;
        },
        recordError() {
            errorCount++;
            return Math.min(baseErrorDelay * Math.pow(2, errorCount - 1), maxErrorDelay);
        },
        reset() {
            errorCount = 0;
        }
    };
}

// --------------------------------------------------
// 1. Netwerkstatus polling (elke 60s)
// --------------------------------------------------

const networkBackoff = createBackoff(30 * 1000, 5 * 60 * 1000);
let networkTimer = null;

async function pollNetworkStatus() {
    let hasError = false;

    const cards = [...app.querySelectorAll(".device-card")];

    await Promise.all(
        cards.map(async (card) => {
            try {
                await updateDeviceStatus(card, card.dataset.deviceId);
            } catch (error) {
                hasError = true;
                console.error(`[NETWORK] Status ophalen mislukt ${card.dataset.deviceId}:`, error);
            }
        })
    );

    const nextDelay = hasError ? networkBackoff.recordError() : 60 * 1000;
    if (!hasError) networkBackoff.recordSuccess();

    clearTimeout(networkTimer);
    networkTimer = setTimeout(pollNetworkStatus, nextDelay);
}

// --------------------------------------------------
// 2. Geurstatus polling (elke 30s)
// --------------------------------------------------

function updateFragranceIcons() {
    app.querySelectorAll(".device-card").forEach(card => {
        const device = devices.find(device => device.id === card.dataset.deviceId);

        if (device)
            updateDeviceFragrance(card, device.fragrances, !device.unreachable);
    });
}

const fragranceBackoff = createBackoff(30 * 1000, 5 * 60 * 1000);
let fragranceTimer = null;

async function pollFragranceStatus() {
    let nextDelay = 30 * 1000;

    try {
        await refreshDevices();
        updateFragranceIcons();
        fragranceBackoff.recordSuccess();
    } catch (error) {
        console.error("[FRAGRANCE] Status ophalen mislukt:", error);
        nextDelay = fragranceBackoff.recordError();
    }

    clearTimeout(fragranceTimer);
    fragranceTimer = setTimeout(pollFragranceStatus, nextDelay);
}

// --------------------------------------------------
// 3. Firmwarestatus polling (elke 2s, of 10m bij update)
// --------------------------------------------------

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

    let hasError = false;

    const results = await Promise.all(
        [...grouped.entries()].map(async ([deviceId, elements]) => {
            try {
                const firmware = await fetchDeviceFirmwareInfo(deviceId);

                return elements.map(({ element }) =>
                    updateDeviceFirmware(element, deviceId, firmware)
                );
            } catch (error) {
                hasError = true;
                console.error(`[FIRMWARE] Status ophalen mislukt ${deviceId}:`, error);
                return [];
            }
        })
    );

    const running = results.flat().some(status => status?.running);
    return { running, hasError };
}

const firmwareBackoff = createBackoff(30 * 1000, 5 * 60 * 1000);
let firmwareInterval = null;
let firmwarePolling = false;
let firmwareStartPending = false;

async function pollFirmwareStatus() {
    if (firmwarePolling) return;

    firmwarePolling = true;

    let updating = false;
    let hasError = false;

    try {
        const result = await refreshFirmwareStatus();
        updating = result.running;
        hasError = result.hasError;
    } catch (error) {
        hasError = true;
        console.error("[FIRMWARE] Status ophalen mislukt:", error);
    } finally {
        firmwarePolling = false;
    }

    if (updating)
        firmwareStartPending = false;

    clearTimeout(firmwareInterval);

    let nextDelay;
    if (hasError) {
        nextDelay = firmwareBackoff.recordError();
    } else {
        firmwareBackoff.recordSuccess();
        nextDelay = updating || firmwareStartPending ? 10 * 60 * 1000 : 2000;
    }

    firmwareInterval = setTimeout(pollFirmwareStatus, nextDelay);
}

document.addEventListener("geurbot:firmware-update-started", () => {
    firmwareStartPending = true;
    firmwareBackoff.reset();
    clearTimeout(firmwareInterval);
    pollFirmwareStatus();
});

// --------------------------------------------------
// Initialisatie
// --------------------------------------------------

initializeScheduleEvents();
startScheduleClock();
updateFragranceIcons();

pollNetworkStatus();
pollFragranceStatus();
pollFirmwareStatus();
