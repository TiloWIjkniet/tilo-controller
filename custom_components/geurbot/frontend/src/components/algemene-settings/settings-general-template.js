
import { createNotificationsTemplate } from "./settings-notifications-template.js";
import { createSystemSettingsTemplate } from "./settings-system-template.js";

export function createGeneralSettingsTemplate() {
    return `
        <div class="general-settings-overlay" id="general-settings-overlay" hidden>
            <section class="general-settings-modal" role="dialog"
                aria-modal="true" aria-labelledby="general-settings-title">

                <header class="settings-header">
                    <div>
                        <p class="settings-eyebrow">DASHBOARDINSTELLINGEN</p>
                        <h2 id="general-settings-title">Algemene instellingen</h2>
                        <p>Beheer je dashboard en GeurBot-integratie.</p>
                    </div>

                    <button class="settings-close" id="close-general-settings"
                        type="button" aria-label="Venster sluiten">×</button>
                </header>

                <div class="settings-tabs">
                    <button class="settings-tab active" type="button"
                        data-general-tab="notifications">
                        <i data-lucide="bell"></i>
                        Notificaties
                    </button>

                    <button class="settings-tab" type="button"
                        data-general-tab="system">
                        <i data-lucide="settings"></i>
                        Systeembeheer
                    </button>
                </div>

                <div class="settings-content">
                    <div class="settings-panel active"
                        data-general-panel="notifications">
                        ${createNotificationsTemplate()}
                    </div>

                    <div class="settings-panel"
                        data-general-panel="system">
                        ${createSystemSettingsTemplate()}
                    </div>
                </div>

                <footer class="settings-footer">
                    <span>GeurBot Dashboard</span>
                </footer>
            </section>
        </div>
    `;
}

export function setupGeneralSettings(app) {
    const overlay = app.querySelector("#general-settings-overlay");
    const openButton = app.querySelector(".general-settings-button");
    const closeButton = app.querySelector("#close-general-settings");

    if (!overlay || !openButton || !closeButton) {
        console.error("[SETTINGS] Algemene instellingen niet gevonden");
        return;
    }

    openButton.addEventListener("click", () => {
        overlay.hidden = false;
    });

    closeButton.addEventListener("click", () => {
        overlay.hidden = true;
    });

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) overlay.hidden = true;
    });

    setupGeneralTabs(app);
    setupNotificationSettings(app);
    setupSystemSettings(app);
}

function setupGeneralTabs(app) {
    const tabs = app.querySelectorAll("[data-general-tab]");
    const panels = app.querySelectorAll("[data-general-panel]");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const selected = tab.dataset.generalTab;

            tabs.forEach(item =>
                item.classList.toggle("active", item === tab)
            );

            panels.forEach(panel => {
                panel.classList.toggle(
                    "active",
                    panel.dataset.generalPanel === selected
                );
            });

            if (selected === "system") {
                loadSystemStatus(app);
            }
        });
    });
}

export function setupNotificationSettings(app) {
    const predictionDays = app.querySelector("#notification-prediction-days");
    const predictionValue = app.querySelector("#notification-prediction-value");

    if (!predictionDays || !predictionValue) {
        console.error("[NOTIFICATIONS] Prediction slider niet gevonden");
        return;
    }

    const updatePredictionValue = () => {
        predictionValue.textContent = `${predictionDays.value} dagen`;
    };

    predictionDays.addEventListener("input", updatePredictionValue);
    updatePredictionValue();
}

async function systemRequest(path, options = {}) {
    const response = await fetch(`/api/geurbot-system/${path}`, {
        ...options,
        credentials: "same-origin",
        headers: {
            ...(options.headers || {}),
            ...(options.body ? { "Content-Type": "application/json" } : {})
        }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        throw new Error(`Ongeldig antwoord van Home Assistant (${response.status})`);
    }

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.error || `HTTP-fout ${response.status}`);
    }

    return result;
}

function showSystemMessage(app, message, error = false) {
    const element = app.querySelector("#system-action-message");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", error);
}

async function loadSystemStatus(app) {
    const element = app.querySelector("#geurbot-system-status");

    if (!element) return;

    element.textContent = "Status wordt geladen...";

    try {
        const result = await systemRequest("status");

        element.textContent =
            `Integratie actief · ${result.device_count} gekoppelde apparaten`;
    } catch (error) {
        element.textContent = `Status niet beschikbaar: ${error.message}`;
    }
}

function setupSystemSettings(app) {
    const refreshButton = app.querySelector("#system-refresh-status");
    const reloadButton = app.querySelector("#system-reload");
    const backupButton = app.querySelector("#system-backup");

    const resetButton = app.querySelector("#system-factory-reset");
    const resetPanel = app.querySelector("#system-reset-confirmation");
    const resetInput = app.querySelector("#system-reset-input");
    const resetConfirm = app.querySelector("#system-reset-confirm");
    const resetCancel = app.querySelector("#system-reset-cancel");

    refreshButton?.addEventListener("click", () => loadSystemStatus(app));

    reloadButton?.addEventListener("click", async () => {
        if (!confirm("Weet je zeker dat je de GeurBot-integratie wilt herladen?")) {
            return;
        }

        reloadButton.disabled = true;
        showSystemMessage(app, "De GeurBot-integratie wordt herladen...");

        try {
            await systemRequest("reload", { method: "POST" });
            showSystemMessage(app, "Herladen gestart. Vernieuw het dashboard over enkele seconden.");
        } catch (error) {
            showSystemMessage(app, error.message, true);
        } finally {
            reloadButton.disabled = false;
        }
    });

    backupButton?.addEventListener("click", async () => {
        backupButton.disabled = true;
        showSystemMessage(app, "Back-up wordt gemaakt...");

        try {
            const response = await fetch("/api/geurbot-system/backup", {
                credentials: "same-origin"
            });

            if (!response.ok) {
                let message = "Back-up maken mislukt.";

                try {
                    const result = await response.json();
                    message = result.error || message;
                } catch {}

                throw new Error(message);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "geurbot-backup.json";
            link.click();

            URL.revokeObjectURL(url);
            showSystemMessage(app, "Back-up gedownload.");
        } catch (error) {
            showSystemMessage(app, error.message, true);
        } finally {
            backupButton.disabled = false;
        }
    });

    resetButton?.addEventListener("click", () => {
        resetPanel.hidden = false;
        resetInput.value = "";
        resetConfirm.disabled = true;
        resetInput.focus();
    });

    resetInput?.addEventListener("input", () => {
        resetConfirm.disabled = resetInput.value !== "RESET";
    });

    resetCancel?.addEventListener("click", () => {
        resetPanel.hidden = true;
        resetInput.value = "";
        resetConfirm.disabled = true;
    });

    resetConfirm?.addEventListener("click", async () => {
        if (resetInput.value !== "RESET") return;

        if (!confirm(
            "Laatste bevestiging: alle ESP32-koppelingen en GeurBot-gegevens worden verwijderd. Doorgaan?"
        )) {
            return;
        }

        resetConfirm.disabled = true;
        resetCancel.disabled = true;
        resetInput.disabled = true;

        showSystemMessage(app, "Apparaten worden één voor één ontkoppeld...");

        try {
            await systemRequest("factory-reset", {
                method: "POST",
                body: JSON.stringify({ confirmation: "RESET" })
            });

            showSystemMessage(app, "Fabrieksreset uitgevoerd. De integratie wordt opnieuw geladen.");
            resetPanel.hidden = true;
        } catch (error) {
            showSystemMessage(app, error.message, true);
        } finally {
            resetConfirm.disabled = false;
            resetCancel.disabled = false;
            resetInput.disabled = false;
        }
    });
}
