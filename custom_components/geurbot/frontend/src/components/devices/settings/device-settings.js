
import { devices } from "../device-list.js";
import { createSettingsTemplate } from "./settings-template.js";
import { setupGeneralSettings } from "./settings-general.js";
import { setupDevicesSettings } from "./settings-devices.js";
import { setupLogsSettings } from "./settings-logs.js";
import { setupMaintenanceSettings } from "./settings-maintenance.js";
import { setupApiTerminal } from "./api-terminal/api-terminal.js";
import { setupPerformanceSettings } from "./settings-performance.js";

export function createDeviceSettings() {
    return createSettingsTemplate();
}

/* ========================================
   SETTINGS FEEDBACK
======================================== */

function showSettingsFeedback(title, message, type = "success") {
    document.querySelector(".fragrance-feedback")?.remove();

    const icons = {
        success: "✓",
        error: "!",
        loading: "↻"
    };

    const feedback = document.createElement("div");
    feedback.className = `fragrance-feedback ${type}`;

    feedback.innerHTML = `
        <div class="fragrance-feedback-icon">
            ${icons[type] || "!"}
        </div>

        <div class="fragrance-feedback-content">
            <strong></strong>
            <span></span>
        </div>
    `;

    feedback.querySelector("strong").textContent = title;
    feedback.querySelector("span").textContent = message;

    document.body.append(feedback);

    let timeout = null;

    if (type !== "loading") {
        timeout = setTimeout(() => feedback.remove(), 4000);
    }

    return {
        remove() {
            if (timeout)
                clearTimeout(timeout);

            feedback.remove();
        }
    };
}

/* ========================================
   DEVICE SETTINGS
======================================== */

export function setupDeviceSettings(app) {
    const overlay = app.querySelector("#device-settings-overlay");
    const openButton = app.querySelector(".device-settings");
    const closeButton = app.querySelector("#close-device-settings");
    const saveButton = app.querySelector("#save-device-name");

    if (!overlay || !openButton || !closeButton || !saveButton) {
        console.error("Device settings: benodigde elementen ontbreken.");
        return;
    }

    let selectedDevice = null;
    let settingsRefreshInterval = null;

    const getSelectedDevice = () => selectedDevice;

    setupApiTerminal({ overlay, getSelectedDevice });

    const general = setupGeneralSettings({
        overlay,
        getSelectedDevice
    });

    const devicesSettings = setupDevicesSettings({
        overlay,
        getSelectedDevice
    });

    const logs = setupLogsSettings({
        overlay,
        getSelectedDevice
    });

    const maintenance = setupMaintenanceSettings({
        overlay,
        getSelectedDevice
    });

    const performance = setupPerformanceSettings({
        overlay,
        getSelectedDevice
    });

    /* ========================================
       TABS
    ======================================== */

    function showTab(tabName) {
        overlay.querySelectorAll(".settings-tab").forEach(tab => {
            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );
        });

        overlay.querySelectorAll(".settings-panel").forEach(panel => {
            const active = panel.dataset.panel === tabName;

            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });

        if (tabName === "logs") {
            logs.load();
            logs.startRefresh();
        } else {
            logs.stopRefresh();
        }

        if (tabName === "performance") {
            performance.load();
            performance.startRefresh();
        } else {
            performance.stopRefresh();
        }
    }

    /* ========================================
       SETTINGS REFRESH
    ======================================== */

    async function refreshSettings() {
        if (overlay.hidden || !selectedDevice)
            return;

        await general.refresh();
    }

    function startSettingsRefresh() {
        stopSettingsRefresh();

        settingsRefreshInterval = setInterval(
            refreshSettings,
            30000
        );
    }

    function stopSettingsRefresh() {
        clearInterval(settingsRefreshInterval);
        settingsRefreshInterval = null;
    }

    /* ========================================
       OPEN SETTINGS
    ======================================== */

    async function openSettings() {
        if (!selectedDevice)
            return;

        maintenance.reset();

        overlay.querySelector("#settings-device-name").value =
            selectedDevice.name ?? "";

        overlay.hidden = false;

        logs.reset();

        showTab("general");

        devicesSettings.load();

        await refreshSettings();

        startSettingsRefresh();
    }

    /* ========================================
       CLOSE SETTINGS
    ======================================== */

    function closeSettings() {
        overlay.hidden = true;

        stopSettingsRefresh();
        logs.stopRefresh();

        general.reset();
        performance.stopRefresh();
    }

    /* ========================================
       SAVE DEVICE NAME
    ======================================== */

    async function saveDeviceName() {
        if (!selectedDevice)
            return;

        const input = overlay.querySelector("#settings-device-name");
        const name = input.value.trim();

        if (!name) {
            showSettingsFeedback(
                "Naam ontbreekt",
                "Vul eerst een apparaatnaam in.",
                "error"
            );

            input.focus();
            return;
        }

        const originalText = saveButton.textContent;

        saveButton.disabled = true;
        saveButton.textContent = "Opslaan...";

        const loadingFeedback = showSettingsFeedback(
            "Naam opslaan",
            "De apparaatnaam wordt opgeslagen...",
            "loading"
        );

        try {
            const response = await fetch(
                `/api/geurbot/devices/${encodeURIComponent(selectedDevice.id)}/name`,
                {
                    method: "PATCH",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name })
                }
            );

            const responseText = await response.text();

            let result;

            try {
                result = JSON.parse(responseText);
            } catch {
                throw new Error(
                    "De server gaf een ongeldig antwoord terug."
                );
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || "Naam wijzigen mislukt."
                );
            }

            const device = devices.find(item =>
                String(item.id) === String(selectedDevice.id)
            );

            if (!device)
                throw new Error("Apparaat niet gevonden.");

            device.name = result.name;
            selectedDevice.name = result.name;

            const card = app.querySelector(
                `[data-device-id="${CSS.escape(String(device.id))}"]`
            );

            const cardName = card?.querySelector(".device-card-left h3");

            if (cardName)
                cardName.textContent = result.name;

            const title = app.querySelector("#fragrance-title");

            if (title)
                title.textContent = result.name;

            loadingFeedback.remove();

            showSettingsFeedback(
                "Naam opgeslagen",
                `De apparaatnaam is gewijzigd naar ${result.name}.`,
                "success"
            );

            closeSettings();

        } catch (error) {
            loadingFeedback.remove();

            console.error(
                "[SETTINGS] Apparaatnaam wijzigen mislukt:",
                error
            );

            showSettingsFeedback(
                "Opslaan mislukt",
                error.message || "De apparaatnaam kon niet worden opgeslagen.",
                "error"
            );

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    }

    /* ========================================
       EVENT LISTENERS
    ======================================== */

    app.addEventListener("device-selected", event => {
        selectedDevice = event.detail;
    });

    openButton.addEventListener("click", openSettings);

    closeButton.addEventListener("click", closeSettings);

    saveButton.addEventListener("click", saveDeviceName);

    overlay.addEventListener("click", event => {
        if (event.target === overlay)
            closeSettings();
    });

    overlay.querySelectorAll(".settings-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            showTab(tab.dataset.tab);
        });
    });
}
