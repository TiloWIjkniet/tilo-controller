
import { getConnectionStatus } from "../../../utils/network-status.js";
import { getFirmwareStatus } from "../../../utils/firmware-status.js";
import {
    fetchDeviceNetworkStatus,
    fetchDeviceFirmwareInfo,
    fetchDeviceDiagnostics
} from "../../../services/device-settings-api.js";
import {
    formatBytes,
    formatUptime,
    setText,
    updateDeviceNameInFrontend
} from "./settings-utils.js";

export function createGeneralTemplate() {
    return `
        <section class="settings-card">
            <div class="settings-card-title">
                <span>🤖</span><h3>Apparaatgegevens</h3>
                <span class="settings-status offline" id="settings-device-status">Offline</span>
            </div>
            <div class="settings-field">
                <label for="settings-device-name">Apparaatnaam</label>
                <div class="settings-name-input">
                    <input id="settings-device-name" type="text" maxlength="32" placeholder="Geef je GeurBot een naam">
                    <button id="save-device-name" type="button">Opslaan</button>
                </div>
            </div>
            <div class="settings-field">
                <label>Hostname</label>
                <div class="settings-readonly" id="settings-hostname">-</div>
            </div>
        </section>

        <section class="settings-card">
            <div class="settings-card-title">
                <span>📡</span><h3>Netwerkverbinding</h3>
                <span class="settings-refresh" id="settings-network-loading" hidden>Laden...</span>
            </div>
            <div class="settings-info-grid">
                <div class="settings-info-item"><span>Wi-Fi netwerk</span><strong id="settings-ssid">-</strong></div>
                <div class="settings-info-item"><span>IP-adres</span><strong id="settings-ip">-</strong></div>
                <div class="settings-info-item"><span>Signaalsterkte</span><strong id="settings-rssi">-</strong></div>
                <div class="settings-info-item"><span>Internetverbinding</span><strong id="settings-internet">-</strong></div>
            </div>
        </section>

        <section class="settings-card">
            <div class="settings-card-title">
                <span>🔄</span><h3>Firmware</h3>
                <span class="settings-refresh" id="settings-firmware-loading" hidden>Laden...</span>
            </div>
            <div class="settings-info-grid">
                <div class="settings-info-item"><span>Versie</span><strong id="settings-firmware-version">-</strong></div>
                <div class="settings-info-item"><span>Update status</span><strong id="settings-firmware-status">-</strong></div>
                <div class="settings-info-item"><span>Builddatum</span><strong id="settings-firmware-date">-</strong></div>
                <div class="settings-info-item"><span>Buildtijd</span><strong id="settings-firmware-time">-</strong></div>
            </div>
            <div class="settings-firmware-progress" id="settings-firmware-progress" hidden>
                <div class="settings-firmware-progress-info">
                    <span id="settings-firmware-state">Bijwerken...</span>
                    <strong id="settings-firmware-percentage">0%</strong>
                </div>
                <div class="settings-firmware-progress-track">
                    <div id="settings-firmware-progress-bar"></div>
                </div>
            </div>
            <p class="settings-firmware-error" id="settings-firmware-error" hidden></p>
        </section>

        <section class="settings-card">
            <div class="settings-card-title">
                <span>📊</span><h3>Systeeminformatie</h3>
                <span class="settings-refresh" id="settings-system-loading" hidden>Laden...</span>
            </div>
            <div class="settings-info-grid">
                <div class="settings-info-item"><span>Uptime</span><strong id="settings-system-uptime">-</strong></div>
                <div class="settings-info-item"><span>Geheugen</span><strong id="settings-system-memory">-</strong></div>
                <div class="settings-info-item"><span>Opslag</span><strong id="settings-system-storage">-</strong></div>
                <div class="settings-info-item"><span>Laatste reset</span><strong id="settings-system-reset">-</strong></div>
            </div>
        </section>
    `;
}

export function setupGeneralSettings({ overlay, getSelectedDevice }) {
    let uptimeSeconds = 0;
    let uptimeInterval = null;

    // ==================================================
    // FEEDBACKMELDING
    // ==================================================

    function showFeedback(title, message, type = "success") {
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
                if (timeout) clearTimeout(timeout);
                feedback.remove();
            }
        };
    }

    // ==================================================
    // UPTIME
    // ==================================================

    function stopUptime() {
        clearInterval(uptimeInterval);
        uptimeInterval = null;
    }

    function updateUptime() {
        setText(
            overlay,
            "#settings-system-uptime",
            formatUptime(uptimeSeconds)
        );
    }

    function startUptime(seconds) {
        stopUptime();

        uptimeSeconds = Number(seconds) || 0;
        updateUptime();

        uptimeInterval = setInterval(() => {
            uptimeSeconds++;
            updateUptime();
        }, 1000);
    }

    // ==================================================
    // NETWERKSTATUS
    // ==================================================

    async function loadNetworkStatus(deviceId) {
        const loading = overlay.querySelector("#settings-network-loading");
        loading.hidden = false;

        try {
            const response = await fetchDeviceNetworkStatus(deviceId);
            const status = getConnectionStatus(response);

            const statusElement = overlay.querySelector("#settings-device-status");

            setText(
                overlay,
                "#settings-device-status",
                status.connected ? "Online" : "Offline"
            );

            statusElement.className = `settings-status ${status.class}`;

            setText(overlay, "#settings-hostname", status.hostname);
            setText(overlay, "#settings-ssid", status.ssid);
            setText(overlay, "#settings-ip", status.ip);

            setText(
                overlay,
                "#settings-rssi",
                status.rssi !== null
                    ? `${status.rssi} dBm (${status.label})`
                    : "-"
            );

            setText(
                overlay,
                "#settings-internet",
                status.internetAvailable
                    ? "Beschikbaar"
                    : "Niet beschikbaar"
            );

        } catch (error) {
            console.error("Fout bij ophalen netwerkstatus:", error);

            const statusElement = overlay.querySelector("#settings-device-status");

            statusElement.className = "settings-status offline";

            setText(
                overlay,
                "#settings-device-status",
                "Offline"
            );

        } finally {
            loading.hidden = true;
        }
    }

    // ==================================================
    // FIRMWARESTATUS
    // ==================================================

    async function loadFirmwareStatus(deviceId) {
        const loading = overlay.querySelector("#settings-firmware-loading");
        const errorElement = overlay.querySelector("#settings-firmware-error");

        loading.hidden = false;

        try {
            const firmware = await fetchDeviceFirmwareInfo(deviceId);
            const status = getFirmwareStatus(firmware);

            setText(overlay, "#settings-firmware-version", firmware.version);
            setText(overlay, "#settings-firmware-date", firmware.build_date);
            setText(overlay, "#settings-firmware-time", firmware.build_time);

            setText(
                overlay,
                "#settings-firmware-status",
                firmware.running
                    ? "Update bezig"
                    : status.available
                        ? "Update beschikbaar"
                        : "Up-to-date"
            );

            const progress = overlay.querySelector("#settings-firmware-progress");
            progress.hidden = !firmware.running;

            if (firmware.running) {
                const percentage = firmware.progress ?? 0;

                setText(
                    overlay,
                    "#settings-firmware-state",
                    firmware.state === "INSTALLING"
                        ? "Installeren..."
                        : firmware.state === "REBOOTING"
                            ? "Herstarten..."
                            : "Downloaden..."
                );

                setText(
                    overlay,
                    "#settings-firmware-percentage",
                    `${percentage}%`
                );

                overlay.querySelector(
                    "#settings-firmware-progress-bar"
                ).style.width = `${percentage}%`;
            }

            errorElement.textContent = firmware.error ?? "";
            errorElement.hidden = !firmware.error;

        } catch (error) {
            console.error("Fout bij ophalen firmwarestatus:", error);

            errorElement.textContent =
                "Firmwaregegevens konden niet worden opgehaald.";

            errorElement.hidden = false;

        } finally {
            loading.hidden = true;
        }
    }

    // ==================================================
    // SYSTEEMINFORMATIE
    // ==================================================

    async function loadSystemInfo(deviceId) {
        const loading = overlay.querySelector("#settings-system-loading");
        loading.hidden = false;

        const resetReasons = {
            unknown: "Onbekend",
            power_on: "Ingeschakeld",
            external_reset: "Externe reset",
            software_reset: "Softwarematige reset",
            panic: "Panic / crash",
            interrupt_watchdog: "Interrupt watchdog",
            task_watchdog: "Task watchdog",
            watchdog: "Watchdog",
            deep_sleep: "Deep sleep",
            brownout: "Te lage voedingsspanning",
            sdio: "SDIO-reset",
            other: "Overig"
        };

        try {
            const endpoints = [
                "uptime",
                "memory",
                "storage",
                "reset"
            ];

            const results = await Promise.all(
                endpoints.map(async endpoint => {
                    try {
                        return await fetchDeviceDiagnostics(
                            deviceId,
                            endpoint
                        );
                    } catch (error) {
                        console.error(`Fout bij ophalen ${endpoint}:`, error);
                        return null;
                    }
                })
            );

            const [uptime, memory, storage, reset] = results;

            if (uptime) {
                startUptime(uptime.seconds);
            } else {
                stopUptime();

                setText(
                    overlay,
                    "#settings-system-uptime",
                    "Niet beschikbaar"
                );
            }

            if (memory) {
                setText(
                    overlay,
                    "#settings-system-memory",
                    `${formatBytes(memory.heap_free)} vrij / ${formatBytes(memory.heap_total)}`
                );
            }

            if (storage) {
                setText(
                    overlay,
                    "#settings-system-storage",
                    `${formatBytes(storage.used_bytes)} gebruikt / ${formatBytes(storage.total_bytes)}`
                );
            }

            if (reset) {
                setText(
                    overlay,
                    "#settings-system-reset",
                    resetReasons[reset.reason] ?? reset.reason ?? "Onbekend"
                );
            }

        } finally {
            loading.hidden = true;
        }
    }

    // ==================================================
    // ALLE GEGEVENS VERVERSEN
    // ==================================================

    async function refresh() {
        const device = getSelectedDevice();

        if (!device) return;

        await Promise.all([
            loadNetworkStatus(device.id),
            loadFirmwareStatus(device.id),
            loadSystemInfo(device.id)
        ]);
    }

    // ==================================================
    // APPARAATNAAM OPSLAAN
    // ==================================================

    async function saveDeviceName() {
        const device = getSelectedDevice();

        if (!device) return;

        const input = overlay.querySelector("#settings-device-name");
        const saveButton = overlay.querySelector("#save-device-name");

        const name = input.value.trim();

        if (!name) {
            input.focus();

            showFeedback(
                "Ongeldige naam",
                "Vul eerst een apparaatnaam in.",
                "error"
            );

            return;
        }

        if (name === device.name) {
            showFeedback(
                "Geen wijzigingen",
                "De apparaatnaam is niet veranderd.",
                "error"
            );

            return;
        }

        saveButton.disabled = true;

        const loadingFeedback = showFeedback(
            "Naam opslaan",
            "De apparaatnaam wordt bijgewerkt...",
            "loading"
        );

        try {
            const response = await fetch(
                `/api/geurbot/devices/${encodeURIComponent(device.id)}/name`,
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
                throw new Error("De server gaf een ongeldig antwoord.");
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || "Naam wijzigen mislukt."
                );
            }
            device.name = result.name;
            input.value = result.name;
          
            updateDeviceNameInFrontend(device);
            loadingFeedback.remove();

            showFeedback(
                "Naam opgeslagen",
                `De apparaatnaam is gewijzigd naar ${result.name}.`,
                "success"
            );

        } catch (error) {
            console.error("Naam wijzigen mislukt:", error);

            loadingFeedback.remove();

            showFeedback(
                "Opslaan mislukt",
                error.message || "De apparaatnaam kon niet worden opgeslagen.",
                "error"
            );

        } finally {
            saveButton.disabled = false;
        }
    }

    // ==================================================
    // RESET
    // ==================================================

    function reset() {
        stopUptime();

        setText(overlay, "#settings-device-status", "Offline");
        setText(overlay, "#settings-hostname", "-");
        setText(overlay, "#settings-ssid", "-");
        setText(overlay, "#settings-ip", "-");
        setText(overlay, "#settings-rssi", "-");
        setText(overlay, "#settings-internet", "-");
    }

    // ==================================================
    // EVENT LISTENERS
    // ==================================================

    const saveButton = overlay.querySelector("#save-device-name");

    saveButton?.addEventListener("click", saveDeviceName);

    return {
        refresh,
        reset
    };
}
