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
    const general = setupGeneralSettings({ overlay, getSelectedDevice });
    const devicesSettings = setupDevicesSettings({ overlay, getSelectedDevice });
    const logs = setupLogsSettings({ overlay, getSelectedDevice });
    setupMaintenanceSettings({ overlay, getSelectedDevice });
    const performance = setupPerformanceSettings({ overlay, getSelectedDevice });
    const maintenance = setupMaintenanceSettings({ overlay, getSelectedDevice });
    
    function showTab(tabName) {
        overlay.querySelectorAll(".settings-tab").forEach(tab => {
            tab.classList.toggle("active", tab.dataset.tab === tabName);
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

    async function refreshSettings() {
        if (overlay.hidden || !selectedDevice) return;
        await general.refresh();
    }

    function startSettingsRefresh() {
        stopSettingsRefresh();
        settingsRefreshInterval = setInterval(refreshSettings, 30000);
    }

    function stopSettingsRefresh() {
        clearInterval(settingsRefreshInterval);
        settingsRefreshInterval = null;
    }

    async function openSettings() {
        if (!selectedDevice) return;
        maintenance.reset();
        overlay.querySelector("#settings-device-name").value = selectedDevice.name ?? "";
        overlay.hidden = false;
        logs.reset();
        showTab("general");
        devicesSettings.load();
        await refreshSettings();
        startSettingsRefresh();
    }

    function closeSettings() {
        overlay.hidden = true;
        stopSettingsRefresh();
        logs.stopRefresh();
        general.reset();
        performance.stopRefresh();
    }

async function saveDeviceName() {
    if (!selectedDevice) return;

    const input = overlay.querySelector("#settings-device-name");
    const name = input.value.trim();

    if (!name) {
        input.focus();
        return;
    }

    try {
        const response = await fetch(`/api/geurbot/devices/${encodeURIComponent(selectedDevice.id)}/name`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });

        const responseText = await response.text();

        console.log("Status:", response.status);
        console.log("Response headers:", [...response.headers.entries()]);
        console.log("Response body:", responseText);

        const result = JSON.parse(responseText);

        if (!response.ok || !result.success)
            throw new Error(result.error || "Naam wijzigen mislukt");

        const device = devices.find(item => item.id === selectedDevice.id);
        if (!device) return;

        device.name = result.name;
        selectedDevice.name = result.name;

        const card = app.querySelector(`[data-device-id="${CSS.escape(device.id)}"]`);
        const cardName = card?.querySelector(".device-card-left h3");
        if (cardName) cardName.textContent = result.name;

        const title = app.querySelector("#fragrance-title");
        if (title) title.textContent = result.name;

        closeSettings();
    } catch (error) {
        console.error("Failed to update device name:", error);
    }
}

    app.addEventListener("device-selected", event => {
        selectedDevice = event.detail;
    });

    openButton.addEventListener("click", openSettings);
    closeButton.addEventListener("click", closeSettings);
    saveButton.addEventListener("click", saveDeviceName);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeSettings();
    });

    overlay.querySelectorAll(".settings-tab").forEach(tab => {
        tab.addEventListener("click", () => showTab(tab.dataset.tab));
    });
}
