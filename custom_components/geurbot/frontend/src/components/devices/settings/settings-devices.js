
import {
    fetchDeviceFragrances,
    fetchFragrance,
    fetchFragranceTotalSprays,
    fetchFragranceUptime,
    fetchFragranceFirmwareVersion,
    fetchFragranceEmptyBottleValue,
    fetchFragranceSprayLog,
    setFragranceEstimatedSprays,
    setFragranceEmptyBottleThreshold,
    renameFragrance
} from "../../../services/device-fragrance.js";

import { formatUptime } from "./settings-utils.js";

/* ========================================
   FEEDBACK MELDINGEN
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
   TEMPLATE
======================================== */

export function createDevicesTemplate() {
    return `
        <style>
            .fragrance-settings-layout {
                display: grid;
                grid-template-columns: minmax(190px, .75fr) minmax(0, 2fr);
                gap: 20px;
                min-height: 460px;
            }

            .fragrance-settings-sidebar,
            .fragrance-settings-detail {
                min-width: 0;
                padding: 16px;
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
            }

            .fragrance-settings-sidebar h4,
            .fragrance-settings-detail h4 {
                margin: 0 0 14px;
            }

            .fragrance-settings-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .fragrance-settings-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
                width: 100%;
                padding: 12px;
                color: inherit;
                text-align: left;
                background: transparent;
                border: 1px solid var(--border-color, #333);
                border-radius: 9px;
                cursor: pointer;
                transition: background .2s, border-color .2s;
            }

            .fragrance-settings-item:hover,
            .fragrance-settings-item.selected {
                background: var(--settings-hover-background, rgba(100, 100, 100, .12));
                border-color: var(--accent-color, #6b9cff);
            }

            .fragrance-settings-item strong {
                font-size: 14px;
            }

            .fragrance-settings-item span {
                font-size: 12px;
                opacity: .65;
                overflow-wrap: anywhere;
            }

            .fragrance-settings-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
            }

            .fragrance-settings-status::before {
                content: "";
                width: 7px;
                height: 7px;
                flex-shrink: 0;
                border-radius: 50%;
                background: #22c55e;
            }

            .fragrance-settings-status.offline::before {
                background: #ef4444;
            }

            .fragrance-settings-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 20px;
            }

            .fragrance-settings-detail-header h3 {
                margin: 0 0 5px;
            }

            .fragrance-settings-detail-header p {
                margin: 0;
                font-size: 12px;
                opacity: .65;
                overflow-wrap: anywhere;
            }

            .fragrance-settings-section {
                margin-top: 22px;
            }

            .fragrance-settings-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
                gap: 10px;
            }

            .fragrance-settings-stat {
                min-width: 0;
                padding: 14px;
                border-radius: 10px;
                background: var(--settings-hover-background, rgba(100, 100, 100, .10));
            }

            .fragrance-settings-stat span {
                display: block;
                margin-bottom: 7px;
                font-size: 12px;
                opacity: .65;
            }

            .fragrance-settings-stat strong {
                font-size: 21px;
                overflow-wrap: anywhere;
            }

            .fragrance-settings-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
                margin-bottom: 14px;
            }

            .fragrance-settings-field label {
                font-size: 13px;
                font-weight: 600;
            }

            .fragrance-settings-field input {
                box-sizing: border-box;
                width: 100%;
                padding: 10px 12px;
                color: inherit;
                background: transparent;
                border: 1px solid var(--border-color, #444);
                border-radius: 8px;
            }

            .fragrance-settings-range {
                padding: 14px;
                margin-bottom: 10px;
                border-radius: 10px;
                background: var(--settings-hover-background, rgba(100, 100, 100, .10));
            }

            .fragrance-settings-range-header {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
                font-size: 13px;
            }

            .fragrance-settings-range input[type="range"] {
                width: 100%;
                accent-color: var(--accent-color, #6b9cff);
                cursor: pointer;
            }

            .fragrance-settings-range small {
                display: block;
                margin-top: 7px;
                font-size: 11px;
                opacity: .6;
            }

            .fragrance-settings-note {
                margin: 10px 0;
                font-size: 12px;
                line-height: 1.5;
                opacity: .65;
            }

            .fragrance-settings-progress {
                height: 10px;
                margin-top: 12px;
                overflow: hidden;
                border-radius: 20px;
                background: var(--border-color, #444);
            }

            .fragrance-settings-progress div {
                height: 100%;
                border-radius: inherit;
                background: #22c55e;
                transition: width .2s;
            }

            .fragrance-settings-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
                margin-top: 16px;
            }

            .fragrance-settings-actions button,
            .fragrance-settings-save {
                padding: 9px 13px;
                color: inherit;
                background: transparent;
                border: 1px solid var(--border-color, #444);
                border-radius: 8px;
                cursor: pointer;
            }

            .fragrance-settings-save {
                color: white;
                background: var(--accent-color, #3978d6);
                border: none;
            }

            .fragrance-settings-actions button:disabled,
            .fragrance-settings-save:disabled {
                opacity: .45;
                cursor: not-allowed;
            }

            .fragrance-settings-empty {
                padding: 25px 10px;
                text-align: center;
                opacity: .65;
            }

            .fragrance-history-modal {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(0, 0, 0, .65);
            }

            .fragrance-history-dialog {
                width: min(600px, 100%);
                max-height: 80vh;
                padding: 20px;
                overflow: auto;
                background: var(--settings-modal-background, #202124);
                border: 1px solid var(--border-color, #444);
                border-radius: 12px;
            }

            .fragrance-history-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .fragrance-history-header h3 {
                margin: 0;
            }

            .fragrance-history-dialog p {
                font-size: 13px;
                opacity: .7;
            }

            @media (max-width: 650px) {
                .fragrance-settings-layout {
                    grid-template-columns: 1fr;
                }

                .fragrance-settings-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                }
            }
        </style>

        <section class="settings-card">
            <div class="settings-card-title">
                <span>🔌</span>
                <h3>Aangesloten geuren</h3>
                <span class="settings-refresh" id="settings-fragrances-loading" hidden>Laden...</span>
            </div>

            <div id="settings-fragrances">
                <p class="settings-description">Geen geuren geladen.</p>
            </div>
        </section>
    `;
}

/* ========================================
   DEVICE SETTINGS
======================================== */

export function setupDevicesSettings({ overlay, getSelectedDevice }) {
    const container = overlay.querySelector("#settings-fragrances");
    const loading = overlay.querySelector("#settings-fragrances-loading");

    let fragrances = [];
    let selectedMac = null;
    let uptimeInterval = null;

    // ==================================================
    // HULPFUNCTIES
    // ==================================================

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getSelectedFragrance() {
        return fragrances.find(item => item.mac_address === selectedMac);
    }

    function getStatus(fragrance, device) {
        if (device?.unreachable) return "Apparaat niet bereikbaar";
        if (fragrance?.unreachable) return "Geur verloren";
        return fragrance.available ? "Beschikbaar" : "Geen geur beschikbaar";
    }

    function isOffline(fragrance, device) {
        return device?.unreachable === true ||
            fragrance?.unreachable === true ||
            !fragrance.available;
    }

    // ==================================================
    // TEMPLATE VAN GESELECTEERDE GEUR
    // ==================================================

    function renderFragranceDetails(fragrance, device) {
        if (!fragrance) return `
            <p class="fragrance-settings-empty">
                Selecteer links een geur om de instellingen te bekijken.
            </p>
        `;

        const estimated = Math.max(1, Number(fragrance.estimated_sprays ?? 500));
        const sprays = Math.max(0, Number(fragrance.total_sprays ?? 0));

        const emptyValue = Number(
            fragrance.empty_bottle_value ??
            fragrance.emtybottel_value ??
            0
        );

        const emptyThreshold = Number(
            fragrance.empty_bottle_threshold ??
            fragrance.emtybottel_trachold ??
            0
        );

        const progress = Math.min(100, sprays / estimated * 100);
        const disabled = (
            device?.unreachable ||
            fragrance?.unreachable
        ) ? "disabled" : "";

        return `
            <div class="fragrance-settings-detail-header">
                <div>
                    <h3>${escapeHtml(fragrance.name)}</h3>
                    <p>${escapeHtml(fragrance.mac_address)}</p>
                </div>

                <span class="fragrance-settings-status ${isOffline(fragrance, device) ? "offline" : ""}">
                    ${escapeHtml(getStatus(fragrance, device))}
                </span>
            </div>

            <div class="fragrance-settings-stats">
                <div class="fragrance-settings-stat">
                    <span>Totaal sprays</span>
                    <strong data-total-sprays>${sprays}</strong>
                </div>

                <div class="fragrance-settings-stat">
                    <span>Geschat maximum</span>
                    <strong data-estimated-value>${estimated}</strong>
                </div>

                <div class="fragrance-settings-stat">
                    <span>Uptime</span>
                    <strong data-uptime>--</strong>
                </div>

                <div class="fragrance-settings-stat">
                    <span>Firmware</span>
                    <strong data-firmware-version>
                        ${escapeHtml(fragrance.firmware_version ?? "--")}
                    </strong>
                </div>
            </div>

            <div class="fragrance-settings-section">
                <h4>Algemene instellingen</h4>

                <div class="fragrance-settings-field">
                    <label for="fragrance-name-input">Naam van de geur</label>

                    <input id="fragrance-name-input"
                           type="text"
                           value="${escapeHtml(fragrance.name)}"
                           maxlength="64"
                           ${disabled}>
                </div>

                <div class="fragrance-settings-actions">
                    <button type="button"
                            class="fragrance-settings-save"
                            data-action="save-name"
                            ${disabled}>
                        Naam opslaan
                    </button>
                </div>
            </div>

            <div class="fragrance-settings-section">
                <h4>Verbruik</h4>

                <div class="fragrance-settings-range">
                    <div class="fragrance-settings-range-header">
                        <span>Geschat aantal sprays</span>
                        <strong data-estimated-label>${estimated}</strong>
                    </div>

                    <input type="range"
                           min="1"
                           max="500"
                           step="1"
                           value="${estimated}"
                           data-estimated-slider
                           ${disabled}>

                    <div class="fragrance-settings-progress">
                        <div data-usage-progress style="width:${progress}%"></div>
                    </div>

                    <small data-usage-label>
                        ${sprays} van ${estimated} sprays gebruikt
                    </small>

                    <p class="fragrance-settings-note">
                        Dit is het verwachte aantal sprays dat uit een volle fles
                        gehaald kan worden. Deze schatting wordt gebruikt om het
                        verbruik en de resterende hoeveelheid te berekenen.
                        Het is geen harde limiet.
                    </p>

                    <button type="button"
                            class="fragrance-settings-save"
                            data-action="save-estimated"
                            ${disabled}>
                        Geschat aantal opslaan
                    </button>
                </div>
            </div>

            <div class="fragrance-settings-section">
                <h4>Lege-flesdetectie</h4>

                <div class="fragrance-settings-range">
                    <div class="fragrance-settings-range-header">
                        <span>Lege-fleswaarde</span>
                        <strong data-empty-bottle-value>${emptyValue}</strong>
                    </div>

                    <div class="fragrance-settings-stat">
                        <span>Gemeten sensorwaarde</span>
                        <strong data-empty-bottle-value>${emptyValue}</strong>
                    </div>

                    <p class="fragrance-settings-note">
                        Dit is de sensorwaarde die bij een lege fles hoort.
                        Deze waarde wordt automatisch bepaald en kan niet
                        handmatig worden aangepast.
                    </p>
                </div>

                <div class="fragrance-settings-range">
                    <div class="fragrance-settings-range-header">
                        <span>Lege-fles-threshold</span>
                        <strong data-empty-threshold-label>${emptyThreshold}</strong>
                    </div>

                    <input type="range"
                           min="0"
                           max="100"
                           step="1"
                           value="${emptyThreshold}"
                           data-empty-threshold-slider
                           ${disabled}>

                    <p class="fragrance-settings-note">
                        De threshold bepaalt hoeveel afwijking van de
                        sensorwaarde wordt toegestaan voordat de fles als
                        leeg wordt beschouwd. Een verkeerde instelling kan
                        leiden tot een onjuiste detectie.
                    </p>

                    <button type="button"
                            class="fragrance-settings-save"
                            data-action="save-threshold"
                            ${disabled}>
                        Threshold opslaan
                    </button>
                </div>
            </div>

            <div class="fragrance-settings-actions">
                <button type="button" data-action="show-history">
                    Geschiedenis bekijken
                </button>

                <button type="button"
                        data-action="refresh"
                        ${disabled}>
                    Gegevens vernieuwen
                </button>
            </div>
        `;
    }

    // ==================================================
    // LAYOUT RENDEREN
    // ==================================================

    function renderLayout() {
        const device = getSelectedDevice();

        container.innerHTML = `
            <div class="fragrance-settings-layout">
                <aside class="fragrance-settings-sidebar">
                    <h4>Geuren</h4>

                    <div class="fragrance-settings-list">
                        ${fragrances.map(fragrance => `
                            <button type="button"
                                    class="fragrance-settings-item ${fragrance.mac_address === selectedMac ? "selected" : ""}"
                                    data-select-fragrance="${escapeHtml(fragrance.mac_address)}">

                                <strong>${escapeHtml(fragrance.name)}</strong>

                                <span>${escapeHtml(fragrance.mac_address)}</span>

                                <span class="fragrance-settings-status ${isOffline(fragrance, device) ? "offline" : ""}">
                                    ${escapeHtml(getStatus(fragrance, device))}
                                </span>
                            </button>
                        `).join("")}
                    </div>
                </aside>

                <section class="fragrance-settings-detail" id="fragrance-settings-detail">
                    ${renderFragranceDetails(getSelectedFragrance(), device)}
                </section>
            </div>
        `;
    }

    // ==================================================
    // SLIDERS BIJWERKEN
    // ==================================================

    function updateSliderPreview(detail) {
        if (!detail) return;

        const estimatedSlider = detail.querySelector("[data-estimated-slider]");
        const thresholdSlider = detail.querySelector("[data-empty-threshold-slider]");

        if (estimatedSlider) {
            const estimated = Math.max(1, Number(estimatedSlider.value));
            const sprays = Number(detail.querySelector("[data-total-sprays]")?.textContent ?? 0);
            const progress = Math.min(100, sprays / estimated * 100);

            detail.querySelector("[data-estimated-label]").textContent = estimated;
            detail.querySelector("[data-estimated-value]").textContent = estimated;
            detail.querySelector("[data-usage-progress]").style.width = `${progress}%`;

            detail.querySelector("[data-usage-label]").textContent =
                `${sprays} van ${estimated} sprays gebruikt`;
        }

        if (thresholdSlider) {
            detail.querySelector("[data-empty-threshold-label]").textContent =
                thresholdSlider.value;
        }
    }

    // ==================================================
    // THRESHOLD WAARSCHUWING
    // ==================================================

    function showThresholdWarning() {
        return new Promise(resolve => {
            const modal = document.createElement("div");
            modal.className = "fragrance-history-modal";

            modal.innerHTML = `
                <div class="fragrance-history-dialog">
                    <div class="fragrance-history-header">
                        <h3>⚠️ Threshold aanpassen</h3>
                    </div>

                    <p>
                        Je staat op het punt de threshold voor
                        lege-flesdetectie te veranderen.
                    </p>

                    <p><strong>Let op:</strong> een verkeerde instelling kan ervoor zorgen dat:</p>

                    <ul>
                        <li>Een fles onterecht als leeg wordt beschouwd.</li>
                        <li>Een lege fles niet op tijd wordt herkend.</li>
                        <li>De beschikbaarheidsstatus van de geur niet klopt.</li>
                    </ul>

                    <p>
                        Pas deze waarde alleen aan als je weet hoe de sensor
                        en de detectie werken.
                    </p>

                    <div class="fragrance-settings-actions">
                        <button type="button" data-cancel>
                            Annuleren
                        </button>

                        <button type="button"
                                class="fragrance-settings-save"
                                data-confirm>
                            Ik begrijp de risico's
                        </button>
                    </div>
                </div>
            `;

            function close(result) {
                modal.remove();
                resolve(result);
            }

            modal.querySelector("[data-cancel]")
                .addEventListener("click", () => close(false));

            modal.querySelector("[data-confirm]")
                .addEventListener("click", () => close(true));

            modal.addEventListener("click", event => {
                if (event.target === modal)
                    close(false);
            });

            document.body.appendChild(modal);
        });
    }

    // ==================================================
    // SPRAYGESCHIEDENIS POPUP
    // ==================================================

    async function showHistory() {
        const fragrance = getSelectedFragrance();
        const device = getSelectedDevice();

        if (!fragrance || !device || device.unreachable) return;

        const modal = document.createElement("div");
        modal.className = "fragrance-history-modal";

        modal.innerHTML = `
            <div class="fragrance-history-dialog">
                <div class="fragrance-history-header">
                    <h3>Spraygeschiedenis</h3>
                    <button type="button" data-close-history>Sluiten</button>
                </div>

                <p>${escapeHtml(fragrance.name)}</p>

                <div data-spray-history class="fragrance-settings-empty">
                    Geschiedenis ophalen...
                </div>
            </div>
        `;

        modal.addEventListener("click", event => {
            if (event.target === modal || event.target.closest("[data-close-history]"))
                modal.remove();
        });

        document.body.appendChild(modal);

        try {
            const result = await fetchFragranceSprayLog(
                device.id,
                fragrance.mac_address
            );

            if (!modal.isConnected) return;

            const history = result.spray_log ?? [];

            const historyContainer = modal.querySelector("[data-spray-history]");

            if (!history.length) {
                historyContainer.textContent = "Er zijn nog geen sprays geregistreerd.";
                return;
            }

            historyContainer.className = "";

            historyContainer.innerHTML = history.map(entry => {
                const timestamp = Number(entry.timestamp ?? 0);

                const date = timestamp
                    ? new Date(timestamp * 1000).toLocaleString("nl-NL")
                    : "Onbekend tijdstip";

                return `
                    <div class="fragrance-settings-stat">
                        <span>${escapeHtml(date)}</span>
                        <strong>Spray uitgevoerd</strong>
                    </div>
                `;
            }).join("");
        } catch (error) {
            console.error("Spraygeschiedenis ophalen mislukt:", error);

            if (modal.isConnected) {
                modal.querySelector("[data-spray-history]").textContent =
                    "De spraygeschiedenis kon niet worden opgehaald.";
            }
        }
    }

    // ==================================================
    // GEGEVENS OPHALEN
    // ==================================================

    async function loadFragranceData(mac) {
        const device = getSelectedDevice();
        const fragrance = fragrances.find(item => item.mac_address === mac);

        if (
            !device ||
            device.unreachable ||
            fragrance?.unreachable ||
            mac !== selectedMac
        ) return;

        const detail = container.querySelector("#fragrance-settings-detail");
        if (!detail) return;

        const totalSprays = detail.querySelector("[data-total-sprays]");
        const uptime = detail.querySelector("[data-uptime]");
        const firmware = detail.querySelector("[data-firmware-version]");

        const results = await Promise.allSettled([
            fetchFragrance(device.id, mac),
            fetchFragranceTotalSprays(device.id, mac),
            fetchFragranceUptime(device.id, mac),
            fetchFragranceFirmwareVersion(device.id, mac),
            fetchFragranceEmptyBottleValue(device.id, mac)
        ]);

        if (mac !== selectedMac) return;

        const [general, total, uptimeResult, firmwareResult, emptyValueResult] = results;

        if (general.status === "fulfilled") {
            const data = general.value.fragrance ?? general.value;
            const index = fragrances.findIndex(item => item.mac_address === mac);

            if (index !== -1)
                fragrances[index] = { ...fragrances[index], ...data };
        }

        if (total.status === "fulfilled") {
            const value = total.value.total_sprays ?? total.value.total ?? 0;

            if (totalSprays)
                totalSprays.textContent = value;

            const selected = getSelectedFragrance();

            if (selected)
                selected.total_sprays = value;
        } else if (totalSprays) {
            totalSprays.textContent = "Niet beschikbaar";
        }

        if (emptyValueResult.status === "fulfilled") {
            const value = emptyValueResult.value.empty_bottle_value;

            const selected = getSelectedFragrance();

            if (selected)
                selected.empty_bottle_value = value;

            const emptyValueElement = detail.querySelector("[data-empty-bottle-value]");

            if (emptyValueElement)
                emptyValueElement.textContent = value;
        }

        if (uptimeResult.status === "fulfilled") {
            const seconds = Number(
                uptimeResult.value.seconds ?? uptimeResult.value.uptime ?? 0
            );

            uptime.textContent = formatUptime(seconds);
            uptime.dataset.seconds = seconds;
            uptime.dataset.updated = Date.now();
        } else {
            uptime.textContent = "Niet beschikbaar";
        }

        if (firmwareResult.status === "fulfilled") {
            firmware.textContent = firmwareResult.value.version ?? "-";
        } else {
            firmware.textContent = "Niet beschikbaar";
        }
    }

    // ==================================================
    // UPTIME COUNTER
    // ==================================================

    function startUptimeCounter() {
        clearInterval(uptimeInterval);

        uptimeInterval = setInterval(() => {
            const uptime = container.querySelector("[data-uptime]");
            if (!uptime?.dataset.updated) return;

            const seconds = Number(uptime.dataset.seconds);
            const elapsed = Math.floor(
                (Date.now() - Number(uptime.dataset.updated)) / 1000
            );

            uptime.textContent = formatUptime(seconds + elapsed);
        }, 1000);
    }

    // ==================================================
    // GEUREN LADEN
    // ==================================================

    async function loadFragrances() {
        const device = getSelectedDevice();
        if (!device) return;

        loading.hidden = false;
        clearInterval(uptimeInterval);

        try {
            fragrances = device.fragrances ?? [];

            if (!fragrances.length) {
                selectedMac = null;

                container.innerHTML = device.unreachable
                    ? "<p>Apparaat niet bereikbaar. Geen opgeslagen geurgegevens gevonden.</p>"
                    : "<p>Geen aangesloten geuren gevonden.</p>";

                return;
            }

            if (!fragrances.some(item => item.mac_address === selectedMac))
                selectedMac = fragrances[0].mac_address;

            renderLayout();

            const selectedFragrance = fragrances.find(
                item => item.mac_address === selectedMac
            );

            if (!device.unreachable && !selectedFragrance?.unreachable) {
                await loadFragranceData(selectedMac);
                startUptimeCounter();
            }
        } catch (error) {
            console.error("Fout bij ophalen geuren:", error);
            container.innerHTML = "<p>Geurgegevens konden niet worden opgehaald.</p>";
        } finally {
            loading.hidden = true;
        }
    }

    // ==================================================
    // INTERACTIES
    // ==================================================

    container.addEventListener("input", event => {
        if (
            event.target.matches("[data-estimated-slider]") ||
            event.target.matches("[data-empty-threshold-slider]")
        ) {
            updateSliderPreview(
                container.querySelector("#fragrance-settings-detail")
            );
        }
    });

    container.addEventListener("click", async event => {
        const selectButton = event.target.closest("[data-select-fragrance]");

        if (selectButton) {
            selectedMac = selectButton.dataset.selectFragrance;
            clearInterval(uptimeInterval);
            renderLayout();

            const device = getSelectedDevice();
            const fragrance = getSelectedFragrance();

            if (!device?.unreachable && !fragrance?.unreachable) {
                await loadFragranceData(selectedMac);
                startUptimeCounter();
            }

            return;
        }

        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;

        const device = getSelectedDevice();
        const fragrance = getSelectedFragrance();

        if (!device || !fragrance) return;

        const action = actionButton.dataset.action;

        if (action === "show-history") {
            showHistory();
            return;
        }

        if (device.unreachable || fragrance.unreachable) {
            showSettingsFeedback(
                "Niet beschikbaar",
                device.unreachable
                    ? "Dit apparaat is niet bereikbaar. Instellingen kunnen niet worden aangepast."
                    : "Deze geur is verloren. Instellingen kunnen niet worden aangepast.",
                "error"
            );

            return;
        }

        // ==================================================
        // GEGEVENS VERVERSEN
        // ==================================================

        if (action === "refresh") {
            actionButton.disabled = true;

            const feedback = showSettingsFeedback(
                "Gegevens verversen",
                "De gegevens worden opnieuw opgehaald...",
                "loading"
            );

            try {
                await loadFragranceData(selectedMac);

                feedback.remove();

                showSettingsFeedback(
                    "Gegevens bijgewerkt",
                    "De geurinstellingen zijn vernieuwd.",
                    "success"
                );
            } catch (error) {
                feedback.remove();

                showSettingsFeedback(
                    "Verversen mislukt",
                    error.message || "De gegevens konden niet worden opgehaald.",
                    "error"
                );
            } finally {
                actionButton.disabled = false;
            }

            return;
        }

        // ==================================================
        // NAAM OPSLAAN
        // ==================================================

        if (action === "save-name") {
            const input = container.querySelector("#fragrance-name-input");
            const name = input.value.trim();

            if (!name) {
                showSettingsFeedback(
                    "Naam ontbreekt",
                    "Vul eerst een naam in.",
                    "error"
                );

                input.focus();
                return;
            }

            if (name === fragrance.name) {
                showSettingsFeedback(
                    "Geen wijzigingen",
                    "De naam is niet veranderd.",
                    "error"
                );

                return;
            }

            actionButton.disabled = true;

            const feedback = showSettingsFeedback(
                "Naam opslaan",
                "De nieuwe geurnaam wordt opgeslagen...",
                "loading"
            );

            try {
                await renameFragrance(device.id, selectedMac, name);

                fragrance.name = name;

                const dashboardCard = [...document.querySelectorAll(".fragrance-card")]
                    .find(card => card.dataset.fragranceId === selectedMac);

                const heading = dashboardCard?.querySelector("h3");

                if (heading)
                    heading.textContent = name;

                renderLayout();

                await loadFragranceData(selectedMac);

                feedback.remove();

                showSettingsFeedback(
                    "Naam opgeslagen",
                    `De geur heet nu ${name}.`,
                    "success"
                );

            } catch (error) {
                feedback.remove();

                console.error("Naam wijzigen mislukt:", error);

                showSettingsFeedback(
                    "Naam wijzigen mislukt",
                    error.message || "De naam kon niet worden gewijzigd.",
                    "error"
                );

            } finally {
                actionButton.disabled = false;
            }

            return;
        }

        // ==================================================
        // GESCHAT AANTAL SPRAYS OPSLAAN
        // ==================================================

        if (action === "save-estimated") {
            const slider = container.querySelector("[data-estimated-slider]");
            const value = Number(slider.value);

            if (!Number.isInteger(value) || value < 1) {
                showSettingsFeedback(
                    "Ongeldige waarde",
                    "Het aantal sprays moet minimaal 1 zijn.",
                    "error"
                );

                return;
            }

            actionButton.disabled = true;

            const feedback = showSettingsFeedback(
                "Verbruik opslaan",
                "Het geschatte aantal sprays wordt opgeslagen...",
                "loading"
            );

            try {
                await setFragranceEstimatedSprays(
                    device.id,
                    selectedMac,
                    value
                );

                fragrance.estimated_sprays = value;

                updateSliderPreview(
                    container.querySelector("#fragrance-settings-detail")
                );

                feedback.remove();

                showSettingsFeedback(
                    "Verbruik opgeslagen",
                    `Het geschatte aantal is ingesteld op ${value} sprays.`,
                    "success"
                );

            } catch (error) {
                feedback.remove();

                console.error("Geschat aantal sprays opslaan mislukt:", error);

                showSettingsFeedback(
                    "Opslaan mislukt",
                    error.message || "Het geschatte aantal sprays kon niet worden opgeslagen.",
                    "error"
                );

            } finally {
                actionButton.disabled = false;
            }

            return;
        }

        // ==================================================
        // THRESHOLD OPSLAAN
        // ==================================================

        if (action === "save-threshold") {
            const confirmed = await showThresholdWarning();

            if (!confirmed)
                return;

            const slider = container.querySelector("[data-empty-threshold-slider]");
            const value = Number(slider.value);

            if (!Number.isInteger(value) || value < 0) {
                showSettingsFeedback(
                    "Ongeldige waarde",
                    "De threshold moet minimaal 0 zijn.",
                    "error"
                );

                return;
            }

            actionButton.disabled = true;

            const feedback = showSettingsFeedback(
                "Threshold opslaan",
                "De lege-fles-threshold wordt opgeslagen...",
                "loading"
            );

            try {
                await setFragranceEmptyBottleThreshold(
                    device.id,
                    selectedMac,
                    value
                );

                fragrance.empty_bottle_threshold = value;

                feedback.remove();

                showSettingsFeedback(
                    "Threshold opgeslagen",
                    `De lege-fles-threshold is ingesteld op ${value}.`,
                    "success"
                );

            } catch (error) {
                feedback.remove();

                console.error("Threshold opslaan mislukt:", error);

                showSettingsFeedback(
                    "Opslaan mislukt",
                    error.message || "De lege-fles-threshold kon niet worden opgeslagen.",
                    "error"
                );

            } finally {
                actionButton.disabled = false;
            }

            return;
        }
    });

    return { load: loadFragrances };
}
