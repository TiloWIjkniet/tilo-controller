import { scanDevices } from "../../services/discovery-api.js";
import { addDiscoveredDevice } from "../../services/device-api.js";
import { escapeHtml } from "../../utils/html.js";

export function setupDiscoveryModal(app) {
    const overlay = app.querySelector("#add-device-overlay");
    const openButton = app.querySelector("#add-device");
    const closeButton = app.querySelector("#close-add-device");
    const scanButton = app.querySelector("#scan-devices");
    const discoveredDevices = app.querySelector("#discovered-devices");
    const loading = app.querySelector("#discovery-loading");
    const count = app.querySelector("#discovery-count");

    openButton?.addEventListener("click", () => { overlay.hidden = false; });
    closeButton?.addEventListener("click", () => { overlay.hidden = true; });
    overlay?.addEventListener("click", event => {
        if (event.target === overlay) overlay.hidden = true;
    });

    scanButton?.addEventListener("click", async () => {
        scanButton.disabled = true;
        scanButton.innerHTML = "<span>↻</span> Scannen...";
        discoveredDevices.innerHTML = "";
        loading.hidden = false;
        count.textContent = "Scannen...";

        try {
            const devices = await scanDevices();
            count.textContent = `${devices.length} gevonden`;
            if (!devices.length) {
                discoveredDevices.innerHTML = emptyState("Geen GeurBots gevonden.", "Controleer of je apparaten verbonden zijn met het netwerk.");
                return;
            }
            discoveredDevices.innerHTML = devices.map(createDiscoveredDevice).join("");
        } catch (error) {
            count.textContent = "Scan mislukt";
            discoveredDevices.textContent = "Er ging iets mis tijdens het scannen.";
            console.error("Discovery error:", error);
        } finally {
            loading.hidden = true;
            scanButton.disabled = false;
            scanButton.innerHTML = "<span>↻</span> Opnieuw scannen";
        }
    });

    discoveredDevices?.addEventListener("click", async event => {
        const button = event.target.closest(".add-discovered-device");
        if (!button) return;

        const deviceId = button.dataset.deviceId;
        const device = window.__geurbotDiscoveredDevices?.[deviceId];
        if (!device) return;

        const name = window.prompt(`Geef ${device.hostname || deviceId} een naam:`, device.hostname || "Mijn GeurBot");
        if (name === null) return;
        const pairingCode = window.prompt("Voer de pairingcode van de GeurBot in:");
        if (pairingCode === null) return;

        button.disabled = true;
        button.textContent = "Koppelen...";
        try {
            await addDiscoveredDevice(deviceId, name.trim(), pairingCode.trim());
            button.textContent = "Toegevoegd";
            button.classList.add("added");
            console.log("GeurBot toegevoegd:", deviceId);
        } catch (error) {
            button.disabled = false;
            button.textContent = "Opnieuw proberen";
            console.error("Toevoegen mislukt:", error);
            window.alert(error.message || "Toevoegen mislukt");
        }
    });
}

function createDiscoveredDevice(device) {
    window.__geurbotDiscoveredDevices ??= {};
    window.__geurbotDiscoveredDevices[device.device_id] = device;
    return `
        <article class="discovered-device">
            <div class="discovered-device-icon">⌁</div>
            <div class="discovered-device-info">
                <strong>${escapeHtml(device.hostname || device.device_id)}</strong>
                <span>${escapeHtml(device.host || "Onbekend IP-adres")} · ${escapeHtml(device.device_id)}</span>
            </div>
            <button class="add-discovered-device" data-device-id="${escapeHtml(device.device_id)}">Toevoegen</button>
        </article>
    `;
}

function emptyState(title, description) {
    return `<div class="discovery-empty"><span>⌕</span><p>${escapeHtml(title)}</p><small>${escapeHtml(description)}</small></div>`;
}
