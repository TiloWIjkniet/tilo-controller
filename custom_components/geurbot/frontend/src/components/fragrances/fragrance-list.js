
import { createFragranceCard } from "./fragrance-card.js";
import { updateDeviceStatus } from "../devices/device-status.js";
import { updateDeviceFirmware } from "../devices/device-firmware.js";
import { createDeviceSettings } from "../devices/settings/device-settings.js";
import { devices } from "../devices/device-list.js";
import { updateDeviceFragranceStatus } from "../devices/device-card.js";


import {
    sprayFragrance,
    resetFragranceCounter,
    setFragranceEnabled,
    fetchDeviceFragrances,
    updateBackendDeviceFragrances,
    deleteBackendDeviceFragrance
} from "../../services/device-fragrance.js";

let selectedDevice = null;
let fragranceRefreshInterval = null;
let fragranceRefreshInProgress = false;

const expandedFragrances = new Set();
let allFragrancesExpanded = false;


/* ========================================
   DEVICE HELPERS
======================================== */

function getDevice(deviceId) {
    return devices.find(device =>
        String(device.id) === String(deviceId)
    );
}

function isDeviceOffline(deviceId) {
    return getDevice(deviceId)?.unreachable === true;
}

function setDeviceOffline(app, deviceId, unreachable) {
    const device = getDevice(deviceId);
    if (!device) return;

    device.unreachable = unreachable;
    notifyScheduleFragranceUpdated(deviceId);
    if (String(selectedDevice?.id) !== String(deviceId))
        return;

    const header = app.querySelector(".fragrance-header");
    const content = app.querySelector(".fragrance-list");

    header?.classList.toggle("device-unreachable", unreachable);
    content?.classList.toggle("device-unreachable", unreachable);

    if (unreachable) {
        const hostname = header?.querySelector(".device-hostname");
        const connection = header?.querySelector(".device-status");
        const signal = header?.querySelector(".device-signal");

        if (hostname) hostname.textContent = "Niet bereikbaar";

        if (connection) {
            connection.textContent = "Offline";
            connection.className = "device-status offline";
        }

        if (signal)
            signal.textContent = "WiFi-signaal niet beschikbaar";
    }

    renderFragrances(app);
}

function notifyScheduleFragranceUpdated(deviceId, fragranceMac = null) {
    document.dispatchEvent(new CustomEvent(
        "geurbot:fragrance-updated",
        {
            detail: {
                deviceId,
                fragranceMac
            }
        }
    ));
}

function updateDeviceOfflineState(app, device) {
    const offline = device?.unreachable === true;

    app.querySelector(".fragrance-header")
        ?.classList.toggle("device-unreachable", offline);

    app.querySelector(".fragrance-list")
        ?.classList.toggle("device-unreachable", offline);
}

/* ========================================
   FRAGRANCE HEADER
======================================== */

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

                    <button class="reset-all-counters"
                            data-action="reset-all-counters"
                            type="button">
                        Alle spraytellers resetten
                    </button>


                    <button class="toggle-all-fragrance-details"
                            data-action="toggle-all-details"
                            type="button">
                        Alles uitklappen
                    </button>
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
            </div>
        </header>
    `;
}

document.addEventListener("click", async event => {
    const button = event.target.closest(".firmware-update-button");
    if (!button || button.disabled) return;

    event.stopPropagation();

    const deviceId = selectedDevice?.id;

    if (!deviceId) {
        console.error("[FIRMWARE] Geen apparaat geselecteerd");
        return;
    }

    button.disabled = true;
    button.textContent = "Update starten...";

    try {
        const response = await fetch(
            `/api/geurbot/devices/${encodeURIComponent(deviceId)}/firmware/esp/update`,
            {
                method: "POST",
                credentials: "same-origin"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success)
            throw new Error(result.message || result.error || "Firmware-update starten mislukt");

        button.textContent = "Update gestart";

    } catch (error) {
        console.error("[FIRMWARE] Update mislukt:", error);

        button.disabled = false;
        button.textContent = "Firmware bijwerken";

        alert(error.message);
    }
});

export function createFragranceContent(device = null) {
    return `
        <div class="fragrance-list">
            <div class="fragrance-items">
                ${(device?.fragrances ?? []).map(createFragranceCard).join("")}
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

/* ========================================
   FRAGRANCE SELECTION
======================================== */

export function setupFragranceSelection(app) {
    setupFragranceActions(app);

    if (app.dataset.fragranceSelectionBound === "true")
        return;

    app.dataset.fragranceSelectionBound = "true";

    if (!fragranceRefreshInterval) {
        fragranceRefreshInterval = setInterval(async () => {
            const deviceId = selectedDevice?.id;

            if (!deviceId || fragranceRefreshInProgress)
                return;

            const panel = app.querySelector(".fragrance-header");
            if (!panel) return;

            fragranceRefreshInProgress = true;

            try {
                // Controleer altijd eerst de netwerkstatus.
                await updateDeviceStatus(panel, deviceId);

                // Haal alleen geuren op wanneer het apparaat online is.
                if (!isDeviceOffline(deviceId))
                    await refreshFragrances(app, deviceId);

            } catch (error) {
                console.warn("Automatisch verversen mislukt:", error);
            } finally {
                fragranceRefreshInProgress = false;
            }
        }, 30000);
    }

app.addEventListener("device-selected", async event => {
    const selected = event.detail;

    if (!selected) return;

    selectedDevice = selected;

    const panel = app.querySelector(".fragrance-header");
    if (!panel) return;

    panel.dataset.deviceId = selected.id;

    const device = getDevice(selected.id);
    if (!device) return;

     

    const title = panel.querySelector("#fragrance-title");
    if (title) title.textContent = selected.name;

    // Firmwarestatus direct verversen bij apparaatselectie.
    document.dispatchEvent(new CustomEvent("geurbot:firmware-update-started", {
        detail: { deviceId: selected.id }
    }));

    renderFragrances(app);

        try {
            // Eerst controleren of het apparaat bereikbaar is.
            await updateDeviceStatus(panel, selected.id);

            // Alleen gegevens ophalen als het apparaat online is.
            if (!isDeviceOffline(selected.id)) {
                await refreshFragrances(app, selected.id);
                await updateDeviceFirmware(panel, selected.id);
            }
        } catch (error) {
            console.warn("Apparaat initialiseren mislukt:", error);
        }
    });

    document.addEventListener("geurbot:device-network-status-updated", event => {
        const { deviceId, unreachable, status } = event.detail;

        if (String(selectedDevice?.id) !== String(deviceId))
            return;

        const device = getDevice(deviceId);
        if (!device) return;

        // Netwerkstatus opslaan op het apparaat.
        device.unreachable = unreachable === true;
        notifyScheduleFragranceUpdated(deviceId);
        const header = app.querySelector(".fragrance-header");
        if (!header) return;

        const hostname = header.querySelector(".device-hostname");
        const connection = header.querySelector(".device-status");
        const signal = header.querySelector(".device-signal");

        if (device.unreachable || !status) {
            if (hostname) hostname.textContent = "Niet bereikbaar";

            if (connection) {
                connection.textContent = "Offline";
                connection.className = "device-status offline";
            }

            if (signal)
                signal.textContent = "WiFi-signaal niet beschikbaar";

        } else {
            if (hostname)
                hostname.textContent = status.hostname || "";

            if (connection) {
                connection.textContent = status.connected
                    ? "Verbonden"
                    : "Niet verbonden";

                connection.className =
                    `device-status ${status.class || ""}`;
            }

            if (signal) {
                signal.textContent = status.rssi !== null &&
                    status.rssi !== undefined
                    ? `WiFi: ${status.label} (${status.rssi} dBm) · ${status.ssid}`
                    : "WiFi-signaal onbekend";
            }
        }

        renderFragrances(app);
    });
}

/* ========================================
   RENDER FRAGRANCES
======================================== */


function renderFragrances(app) {
    if (!selectedDevice) return;

    const device = getDevice(selectedDevice.id);
    const items = app.querySelector(".fragrance-items");

    if (!items || !device) return;

    updateDeviceOfflineState(app, device);

    items.innerHTML = (device.fragrances ?? [])
        .map(fragrance => {
            const expanded = allFragrancesExpanded ||
                expandedFragrances.has(String(fragrance.mac_address));

            return createFragranceCard(fragrance, expanded);
        })
        .join("");

    const allExpanded = (device.fragrances ?? []).length > 0 &&
        (device.fragrances ?? []).every(fragrance =>
            allFragrancesExpanded ||
            expandedFragrances.has(String(fragrance.mac_address))
        );

    const expandButton = app.querySelector(".toggle-all-fragrance-details");

    if (expandButton) {
        expandButton.textContent = allExpanded
            ? "Alles inklappen"
            : "Alles uitklappen";
    }

    updateDeviceFragranceStatus(app, device);
}


/* ========================================
   CLEAR FRAGRANCE DATA
======================================== */

export function clearFragranceData(deviceId) {
    if (selectedDevice && String(selectedDevice.id) === String(deviceId))
        selectedDevice = null;

    if (!selectedDevice) {
        const items = document.querySelector(".fragrance-items");
        if (items) items.innerHTML = "";

        const title = document.querySelector("#fragrance-title");
        if (title) title.textContent = "Geen apparaat geselecteerd";

        const hostname = document.querySelector(".device-hostname");
        if (hostname) hostname.textContent = "";

        const status = document.querySelector(".device-status");
        if (status) {
            status.textContent = "Niet verbonden";
            status.className = "device-status";
        }

        const signal = document.querySelector(".device-signal");
        if (signal) signal.textContent = "";

        document.querySelector(".fragrance-header")
            ?.classList.remove("device-unreachable");

        document.querySelector(".fragrance-list")
            ?.classList.remove("device-unreachable");
    }
}

/* ========================================
   FRAGRANCE FEEDBACK
======================================== */

function showFragranceFeedback(title, message, type = "success") {
    document.querySelector(".fragrance-feedback")?.remove();

    const icons = {
        success: "✓",
        error: "!",
        loading: "↻"
    };

    const feedback = document.createElement("div");
    feedback.className = `fragrance-feedback ${type}`;

    feedback.innerHTML = `
        <div class="fragrance-feedback-icon">${icons[type] || "!"}</div>

        <div class="fragrance-feedback-content">
            <strong></strong>
            <span></span>
        </div>
    `;

    feedback.querySelector("strong").textContent = title;
    feedback.querySelector("span").textContent = message;

    document.body.append(feedback);

    let timeout = null;

    if (type !== "loading")
        timeout = setTimeout(() => feedback.remove(), 4000);

    return {
        remove() {
            if (timeout) clearTimeout(timeout);
            feedback.remove();
        }
    };
}

/* ========================================
   FRAGRANCE RESET CONFIRMATION
======================================== */

function showFragranceResetConfirm(fragrance, onConfirm) {
    const confirmOverlay = document.createElement("div");
    confirmOverlay.className = "maintenance-confirm-overlay";

    confirmOverlay.innerHTML = `
        <div class="maintenance-confirm">
            <div class="maintenance-confirm-icon">↻</div>

            <h3>Sprayteller resetten</h3>

            <p>
                Weet je zeker dat je de sprayteller van
                <strong></strong> wilt resetten?
            </p>

            <div class="fragrance-reset-info">
                <span>Huidige tellerstand</span>
                <strong>${Number(fragrance.total_sprays) || 0} sprays</strong>
            </div>

            <div class="maintenance-confirm-actions">
                <button class="maintenance-confirm-cancel" type="button">
                    Annuleren
                </button>

                <button class="maintenance-confirm-submit" type="button">
                    Teller resetten
                </button>
            </div>
        </div>
    `;

    confirmOverlay.querySelector("p strong").textContent = fragrance.name;

    document.body.append(confirmOverlay);

    const cancelButton = confirmOverlay.querySelector(".maintenance-confirm-cancel");
    const submitButton = confirmOverlay.querySelector(".maintenance-confirm-submit");

    const close = () => confirmOverlay.remove();

    cancelButton.addEventListener("click", close);

    confirmOverlay.addEventListener("click", event => {
        if (event.target === confirmOverlay)
            close();
    });

    submitButton.addEventListener("click", async () => {
        submitButton.disabled = true;
        cancelButton.disabled = true;
        submitButton.textContent = "Bezig...";

        try {
            await onConfirm();
            close();
        } catch (error) {
            submitButton.disabled = false;
            cancelButton.disabled = false;
            submitButton.textContent = "Opnieuw proberen";
        }
    });
}

/* ========================================
   FRAGRANCE ACTIONS
======================================== */

function setupFragranceActions(app) {
    if (app.dataset.fragranceActionsBound === "true")
        return;

    app.dataset.fragranceActionsBound = "true";

    app.addEventListener("click", async event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;


    if (![
        "spray",
        "reset-counter",
        "toggle",
        "reset-all-counters",
        "toggle-details",
        "toggle-all-details"
    ].includes(action))
        return;

    // Uitklappen en inklappen mag ook wanneer het apparaat offline is.

    if (action === "toggle-details") {
        const macAddress = button.dataset.fragranceId;
        if (!macAddress) return;

        const key = String(macAddress);
        const device = getDevice(selectedDevice?.id);
        const fragrances = device?.fragrances ?? [];

        if (allFragrancesExpanded) {
            allFragrancesExpanded = false;
            expandedFragrances.clear();

            for (const fragrance of fragrances) {
                const otherKey = String(fragrance.mac_address);

                if (otherKey !== key)
                    expandedFragrances.add(otherKey);
            }
        } else if (expandedFragrances.has(key)) {
            expandedFragrances.delete(key);
        } else {
            expandedFragrances.add(key);
        }

        renderFragrances(app);
        return;
    }

    if (action === "toggle-all-details") {
        const device = getDevice(selectedDevice?.id);
        const fragrances = device?.fragrances ?? [];

        const allExpanded = fragrances.length > 0 &&
            fragrances.every(fragrance =>
                allFragrancesExpanded ||
                expandedFragrances.has(String(fragrance.mac_address))
            );

        allFragrancesExpanded = !allExpanded;
        expandedFragrances.clear();

        renderFragrances(app);
        return;
    }


        const deviceId = selectedDevice?.id;

        if (!deviceId || button.disabled)
            return;

        // Geen acties uitvoeren als het apparaat offline is.
        if (isDeviceOffline(deviceId)) {
            showFragranceFeedback(
                "Apparaat niet bereikbaar",
                "Deze actie is niet mogelijk zolang het apparaat offline is.",
                "error"
            );
            return;
        }

                if (action === "reset-all-counters") {
            const device = getDevice(deviceId);
            const fragrances = device?.fragrances ?? [];

            if (!fragrances.length) return;

            showResetAllCountersConfirm(fragrances.length, async () => {
                button.disabled = true;
                button.textContent = "Tellers resetten...";

                try {
                    for (const fragrance of fragrances) {
                        await resetFragranceCounter(deviceId, fragrance.mac_address);
                    }

                    showFragranceFeedback(
                        "Alle tellers gereset",
                        `De spraytellers van ${fragrances.length} geuren zijn gereset.`,
                        "success"
                    );

                    await refreshFragrances(app, deviceId);

                } catch (error) {
                    console.error("Alle spraytellers resetten mislukt:", error);

                    showFragranceFeedback(
                        "Reset mislukt",
                        error.message || "Niet alle spraytellers konden worden gereset.",
                        "error"
                    );

                    throw error;

                } finally {
                    button.disabled = false;
                    button.textContent = "Alle spraytellers resetten";
                }
            });

            return;
        }
        const macAddress = button.dataset.fragranceId;
        if (!macAddress) return;

        const device = getDevice(deviceId);

        const fragrance = device?.fragrances?.find(fragrance =>
            fragrance.mac_address === macAddress
        );

        if (!fragrance || fragrance.unreachable || !fragrance.available)
            return;

        if (action === "toggle") {
            button.disabled = true;

            try {
                await setFragranceEnabled(
                    deviceId,
                    macAddress,
                    !fragrance.enabled
                );

                await refreshFragrances(app, deviceId);

                notifyScheduleFragranceUpdated(deviceId);

            } catch (error) {
                console.error("Fragrance toggle failed:", error);

                showFragranceFeedback(
                    "Wijzigen mislukt",
                    error.message || "De instelling kon niet worden gewijzigd.",
                    "error"
                );

            } finally {
                button.disabled = false;
            }

            return;
        }

        if (action === "reset-counter") {
            showFragranceResetConfirm(fragrance, async () => {
                try {
                    await resetFragranceCounter(deviceId, macAddress);

                    showFragranceFeedback(
                        "Teller gereset",
                        `De sprayteller van ${fragrance.name} is teruggezet.`,
                        "success"
                    );

                    await refreshFragrances(app, deviceId);

                } catch (error) {
                    console.error("Fragrance counter reset failed:", error);

                    showFragranceFeedback(
                        "Reset mislukt",
                        error.message || "De sprayteller kon niet worden gereset.",
                        "error"
                    );

                    throw error;
                }
            });

            return;
        }

        if (action === "spray") {
            button.disabled = true;
            button.textContent = "Sprayen...";

            const loadingFeedback = showFragranceFeedback(
                "Spray uitvoeren",
                `Bezig met sprayen van ${fragrance.name}...`,
                "loading"
            );

            try {
                await sprayFragrance(deviceId, macAddress);

                loadingFeedback.remove();

                showFragranceFeedback(
                    "Spray succesvol",
                    `De geur ${fragrance.name} is succesvol gesprayd.`,
                    "success"
                );

                await refreshFragrances(app, deviceId);

            } catch (error) {
                loadingFeedback.remove();

                console.error("Fragrance spray failed:", error);

                showFragranceFeedback(
                    "Spray mislukt",
                    error.message || "Het sprayen is niet gelukt. Probeer het opnieuw.",
                    "error"
                );

            } finally {
                button.disabled = false;
                button.textContent = "Sprayen";
            }
        }
    });
}

/* ========================================
   REFRESH FRAGRANCES
======================================== */



async function refreshFragrances(app, deviceId) {
    const device = getDevice(deviceId);

    if (!device || device.unreachable)
        return;

    try {
        const result = await fetchDeviceFragrances(deviceId);

        const oldFragrances = device.fragrances ?? [];
        const newFragrances = result.fragrances ?? [];

        const newFragranceMap = new Map(
            newFragrances.map(fragrance => [
                fragrance.mac_address,
                fragrance
            ])
        );

        // Bestaande geuren vergelijken met de nieuwe payload.
        const updatedFragrances = oldFragrances.map(oldFragrance => {
            const newFragrance = newFragranceMap.get(
                oldFragrance.mac_address
            );

            // Geur ontbreekt in de payload.
            if (!newFragrance) {
                return {
                    ...oldFragrance,
                    unreachable: true
                };
            }

            // Geur is weer aanwezig.
            newFragranceMap.delete(oldFragrance.mac_address);

            return {
                ...oldFragrance,
                ...newFragrance,
                unreachable: newFragrance.unreachable ?? false
            };
        });

        // Nieuwe geuren toevoegen die nog niet in de frontend stonden.
        for (const fragrance of newFragranceMap.values()) {
            updatedFragrances.push({
                ...fragrance,
                unreachable: fragrance.unreachable ?? false
            });
        }

        device.fragrances = updatedFragrances;
        notifyScheduleFragranceUpdated(deviceId);
       

        try 
        {
            await updateBackendDeviceFragrances(device.id, device.fragrances);
           
        } catch (error) 
        {
            console.error("[FRAGRANCES] Backend opslaan mislukt:", error);
        }

        if (selectedDevice && String(selectedDevice.id) === String(deviceId))
            selectedDevice.fragrances = updatedFragrances;

        renderFragrances(app);

    } catch (error) {
        console.error("Geuren verversen mislukt:", error);

        setDeviceOffline(app, deviceId, true);

        throw error;
    }
}

function showResetAllCountersConfirm(count, onConfirm) {
    const confirmOverlay = document.createElement("div");
    confirmOverlay.className = "maintenance-confirm-overlay";

    confirmOverlay.innerHTML = `
        <div class="maintenance-confirm">
            <div class="maintenance-confirm-icon">⚠️</div>

            <h3>Alle spraytellers resetten</h3>

            <p>
                Weet je zeker dat je de spraytellers van alle
                <strong>${count}</strong> geuren wilt resetten?
                Dit kan niet ongedaan worden gemaakt.
            </p>

            <div class="maintenance-confirm-actions">
                <button class="maintenance-confirm-cancel" type="button">
                    Annuleren
                </button>

                <button class="maintenance-confirm-submit" type="button">
                    Alle tellers resetten
                </button>
            </div>
        </div>
    `;

    document.body.append(confirmOverlay);

    const cancelButton = confirmOverlay.querySelector(".maintenance-confirm-cancel");
    const submitButton = confirmOverlay.querySelector(".maintenance-confirm-submit");

    const close = () => confirmOverlay.remove();

    cancelButton.addEventListener("click", close);

    confirmOverlay.addEventListener("click", event => {
        if (event.target === confirmOverlay)
            close();
    });

    submitButton.addEventListener("click", async () => {
        submitButton.disabled = true;
        cancelButton.disabled = true;
        submitButton.textContent = "Bezig...";

        try {
            await onConfirm();
            close();
        } catch (error) {
            submitButton.disabled = false;
            cancelButton.disabled = false;
            submitButton.textContent = "Opnieuw proberen";
        }
    });
}

app.addEventListener("click", async event => {
    const button = event.target.closest(".remove-fragrance-button");

    if (!button)
        return;

    const macAddress = button.dataset.fragranceId;
    const device = getDevice(selectedDevice?.id);

    if (!device || !macAddress)
        return;

    button.disabled = true;

    try {
        await deleteBackendDeviceFragrance(device.id, macAddress);

        device.fragrances = device.fragrances.filter(
            fragrance => fragrance.mac_address !== macAddress
        );

        selectedDevice.fragrances = device.fragrances;

        console.log(`[FRAGRANCES] Geur ${macAddress} verwijderd uit frontend`);

        renderFragrances(app);

    } catch (error) {
        console.error("[FRAGRANCES] Verwijderen mislukt:", error);
        button.disabled = false;
    }
});