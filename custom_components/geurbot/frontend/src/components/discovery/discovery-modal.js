
import { scanDevices } from "../../services/discovery-api.js";
import { addDiscoveredDevice } from "../../services/device-api.js";
import { escapeHtml } from "../../utils/html.js";
import { devices, renderDevices, refreshDevices } from "../devices/device-list.js";

export function setupDiscoveryModal(app) {
    const overlay = app.querySelector("#add-device-overlay");
    const modal = overlay?.querySelector(".add-device-modal");
    const openButton = app.querySelector("#add-device");
    const closeButton = app.querySelector("#close-add-device");
    const scanButton = app.querySelector("#scan-devices");
    const discoveredDevices = app.querySelector("#discovered-devices");
    const loading = app.querySelector("#discovery-loading");
    const count = app.querySelector("#discovery-count");

    openButton?.addEventListener("click", () => {
        overlay.hidden = false;
    });

    closeButton?.addEventListener("click", () => {
        overlay.hidden = true;
    });

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
            const discovered = await scanDevices();

            // Filter apparaten die al zijn toegevoegd.
            const availableDevices = discovered.filter(device =>
                !devices.some(existing => existing.id === device.device_id)
            );

            count.textContent = `${availableDevices.length} gevonden`;

            if (!availableDevices.length) {
                discoveredDevices.innerHTML = emptyState(
                    "Geen nieuwe GeurBots gevonden.",
                    "Er zijn geen beschikbare apparaten gevonden."
                );
                return;
            }

            discoveredDevices.innerHTML = availableDevices
                .map(createDiscoveredDevice)
                .join("");

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

    discoveredDevices?.addEventListener("click", event => {
        const button = event.target.closest(".add-discovered-device");
        if (!button || button.disabled) return;

        const deviceId = button.dataset.deviceId;
        const device = window.__geurbotDiscoveredDevices?.[deviceId];

        if (!device || !modal) return;

        showAddDevicePopup(modal, device, button);
    });
}

function showAddDevicePopup(modal, device, originalButton) {
    modal.querySelector(".device-form-overlay")?.remove();

    const popup = document.createElement("div");
    popup.className = "device-form-overlay";

    popup.innerHTML = `
        <div class="device-form-modal">
            <div class="device-form-header">
                <div>
                    <h3>Apparaat toevoegen</h3>
                    <p>Vul de gegevens van je GeurBot in.</p>
                </div>

                <button type="button" class="modal-close device-form-close">&times;</button>
            </div>

            <div class="device-form-device">
                <div class="discovered-device-icon">⌁</div>
                <div>
                    <strong>${escapeHtml(device.name || device.device_id)}</strong>
                    <span>${escapeHtml(device.ip || "Onbekend IP-adres")} · ${escapeHtml(device.device_id)}</span>
                </div>
            </div>

            <form class="device-add-form">
                <div class="device-form-field">
                    <label for="device-name">Naam van het apparaat</label>
                    <input
                        id="device-name"
                        name="name"
                        type="text"
                        value="${escapeHtml(device.name || "Mijn GeurBot")}"
                        placeholder="Bijvoorbeeld: GeurBot woonkamer"
                        required
                        maxlength="64"
                    >
                </div>

                <p class="device-form-error" hidden></p>

                <div class="device-form-actions">
                    <button type="button" class="device-form-cancel">
                        Annuleren
                    </button>

                    <button type="submit" class="device-form-submit">
                        Apparaat toevoegen
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(popup);

    const form = popup.querySelector(".device-add-form");
    const nameInput = popup.querySelector("#device-name");
    const submitButton = popup.querySelector(".device-form-submit");
    const errorMessage = popup.querySelector(".device-form-error");

    const closePopup = () => popup.remove();

    popup.querySelector(".device-form-close").addEventListener("click", closePopup);
    popup.querySelector(".device-form-cancel").addEventListener("click", closePopup);

    popup.addEventListener("click", event => {
        if (event.target === popup) closePopup();
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const name = nameInput.value.trim();

        if (!name) {
            errorMessage.textContent = "Vul een naam in.";
            errorMessage.hidden = false;
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Koppelen...";
        errorMessage.hidden = true;

        try {
            await addDiscoveredDevice(device.device_id, name);

            const existingDevice = devices.some(
                item => item.id === device.device_id
            );

            if (!existingDevice) {
                devices.push({
                    ...device,
                    id: device.device_id,
                    name: name,
                    fragrances: [],
                    unreachable: false
                });
            }

            renderDevices(document);

            await refreshDevices();

            originalButton.disabled = true;
            originalButton.textContent = "Toegevoegd";
            originalButton.classList.add("added");

            console.log("GeurBot toegevoegd:", device.device_id);

            popup.innerHTML = `
                <div class="device-form-modal device-form-success">
                    <div class="success-icon">✓</div>
                    <h3>Apparaat toegevoegd!</h3>
                    <p>${escapeHtml(name)} is succesvol toegevoegd aan je GeurBot-controller.</p>
                    <button type="button" class="device-form-submit device-success-close">
                        Gereed
                    </button>
                </div>
            `;

            popup.querySelector(".device-success-close")
                .addEventListener("click", closePopup);

        } catch (error) {
            submitButton.disabled = false;
            submitButton.textContent = "Opnieuw proberen";

            errorMessage.textContent = error.message || "Toevoegen mislukt.";
            errorMessage.hidden = false;

            console.error("Toevoegen mislukt:", error);
        }
    });

    nameInput.focus();
    nameInput.select();
}

function createDiscoveredDevice(device) {
    window.__geurbotDiscoveredDevices ??= {};
    window.__geurbotDiscoveredDevices[device.device_id] = device;

    return `
        <article class="discovered-device">
            <div class="discovered-device-icon">⌁</div>

            <div class="discovered-device-info">
                <strong>${escapeHtml(device.name || device.device_id)}</strong>
                <span>${escapeHtml(device.ip || "Onbekend IP-adres")} · ${escapeHtml(device.device_id)}</span>
            </div>

            <button class="add-discovered-device" data-device-id="${escapeHtml(device.device_id)}">
                Toevoegen
            </button>
        </article>
    `;
}

function emptyState(title, description) {
    return `
        <div class="discovery-empty">
            <span>⌕</span>
            <p>${escapeHtml(title)}</p>
            <small>${escapeHtml(description)}</small>
        </div>
    `;
}
