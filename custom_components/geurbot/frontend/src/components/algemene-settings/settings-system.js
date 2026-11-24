
import { setupNotifications } from "./settings-notifications.js";


const SYSTEM_API = "/api/geurbot-system";

const initializedApps = new WeakSet();


// ==================================================
// API COMMUNICATIE
// ==================================================

async function systemRequest(action, options = {}) {
    const response = await fetch(`${SYSTEM_API}/${action}`, {
        credentials: "same-origin",
        ...options
    });

    const contentType = response.headers.get("content-type") || "";

    let result = null;

    if (contentType.includes("application/json")) {
        result = await response.json();
    }

    if (!response.ok) {
        const error = new Error(
            result?.error || `HTTP ${response.status}`
        );

        error.status = response.status;
        error.result = result;

        throw error;
    }

    if (result && result.success === false) {
        throw new Error(result.error || "De actie is mislukt");
    }

    return result;
}


// ==================================================
// MELDINGEN TONEN
// ==================================================

function showSystemMessage(app, message, type = "info") {
    const element = app.querySelector("#system-action-message");

    if (!element) return;

    element.textContent = message;
    element.dataset.state = type;
}


// ==================================================
// STATUS OPHALEN
// ==================================================

export async function loadSystemStatus(app) {
    const element = app.querySelector("#geurbot-system-status");

    if (!element) return;

    element.textContent = "Status wordt opgehaald...";

    try {
        const result = await systemRequest("status", {
            method: "GET",
            cache: "no-store"
        });

        if (!result.loaded) {
            throw new Error("De GeurBot-integratie is niet geladen");
        }

        const deviceCount = Number(result.device_count) || 0;

        element.textContent =
            `Integratie actief · ${deviceCount} gekoppelde ${
                deviceCount === 1 ? "apparaat" : "apparaten"
            }`;

        element.dataset.state = "success";

    } catch (error) {
        console.error("[SYSTEM] Status ophalen mislukt:", error);

        element.textContent =
            `Status niet beschikbaar: ${error.message}`;

        element.dataset.state = "error";
    }
}


// ==================================================
// STATUS VERNIEUWEN
// ==================================================

async function refreshSystemStatus(app, button) {
    button.disabled = true;

    try {
        await loadSystemStatus(app);
    } finally {
        button.disabled = false;
    }
}


// ==================================================
// INTEGRATIE HERSTARTEN
// ==================================================

async function reloadSystem(app, button) {
    const confirmed = window.confirm(
        "Weet je zeker dat je de GeurBot-integratie wilt herstarten?"
    );

    if (!confirmed) return;

    button.disabled = true;

    showSystemMessage(
        app,
        "De GeurBot-integratie wordt herstart...",
        "info"
    );

    try {
        const result = await systemRequest("reload", {
            method: "POST"
        });

        showSystemMessage(
            app,
            result.message || "Herstart van de integratie is ingepland.",
            "success"
        );

    } catch (error) {
        console.error("[SYSTEM] Herstart mislukt:", error);

        showSystemMessage(
            app,
            `Herstart mislukt: ${error.message}`,
            "error"
        );

    } finally {
        button.disabled = false;
    }
}


// ==================================================
// BACK-UP DOWNLOADEN
// ==================================================

async function downloadSystemBackup(app, button) {
    button.disabled = true;

    showSystemMessage(
        app,
        "Back-up wordt aangemaakt...",
        "info"
    );

    try {
        const response = await fetch(`${SYSTEM_API}/backup`, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        const contentType =
            response.headers.get("content-type") || "";

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;

            if (contentType.includes("application/json")) {
                const result = await response.json();
                errorMessage = result.error || errorMessage;
            }

            throw new Error(errorMessage);
        }

        const blob = await response.blob();

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = "geurbot-backup.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(downloadUrl);

        showSystemMessage(
            app,
            "De GeurBot-back-up is gedownload.",
            "success"
        );

    } catch (error) {
        console.error("[SYSTEM] Back-up mislukt:", error);

        showSystemMessage(
            app,
            `Back-up downloaden mislukt: ${error.message}`,
            "error"
        );

    } finally {
        button.disabled = false;
    }
}


// ==================================================
// FABRIEKSRESET BEVESTIGING
// ==================================================

function openFactoryResetConfirmation(app) {
    const confirmation = app.querySelector(
        "#system-reset-confirmation"
    );

    const input = app.querySelector("#system-reset-input");
    const confirmButton = app.querySelector(
        "#system-reset-confirm"
    );

    if (!confirmation || !input || !confirmButton) return;

    confirmation.hidden = false;

    input.value = "";
    confirmButton.disabled = true;

    input.focus();
}


function closeFactoryResetConfirmation(app) {
    const confirmation = app.querySelector(
        "#system-reset-confirmation"
    );

    const input = app.querySelector("#system-reset-input");
    const confirmButton = app.querySelector(
        "#system-reset-confirm"
    );

    if (!confirmation || !input || !confirmButton) return;

    confirmation.hidden = true;

    input.value = "";
    confirmButton.disabled = true;
}


// ==================================================
// RESET INVOER CONTROLEREN
// ==================================================

function setupFactoryResetInput(app) {
    const input = app.querySelector("#system-reset-input");

    const confirmButton = app.querySelector(
        "#system-reset-confirm"
    );

    if (!input || !confirmButton) return;

    input.addEventListener("input", () => {
        confirmButton.disabled =
            input.value.trim().toUpperCase() !== "RESET";
    });
}


// ==================================================
// FABRIEKSRESET UITVOEREN
// ==================================================

async function executeFactoryReset(app, button) {
    const input = app.querySelector("#system-reset-input");

    if (!input || input.value.trim().toUpperCase() !== "RESET") {
        showSystemMessage(
            app,
            "Typ RESET om de fabrieksreset te bevestigen.",
            "error"
        );

        return;
    }

    const confirmed = window.confirm(
        "LET OP: alle gekoppelde ESP32-apparaten worden ontkoppeld " +
        "en de lokale GeurBot-configuratie wordt verwijderd.\n\n" +
        "Weet je zeker dat je wilt doorgaan?"
    );

    if (!confirmed) return;

    button.disabled = true;

    const cancelButton = app.querySelector(
        "#system-reset-cancel"
    );

    if (cancelButton) {
        cancelButton.disabled = true;
    }

    input.disabled = true;

    showSystemMessage(
        app,
        "Fabrieksreset wordt uitgevoerd. Apparaten worden ontkoppeld...",
        "info"
    );

    try {
        const result = await systemRequest("factory-reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                confirmation: "RESET"
            })
        });

        closeFactoryResetConfirmation(app);

        showSystemMessage(
            app,
            `Fabrieksreset geslaagd. ${
                result.unpaired_devices ?? 0
            } ESP32-apparaten zijn ontkoppeld. De integratie wordt herstart.`,
            "success"
        );

        const status = app.querySelector("#geurbot-system-status");

        if (status) {
            status.textContent =
                "Fabrieksreset uitgevoerd. Integratie wordt herstart...";

            status.dataset.state = "success";
        }

    } catch (error) {
        console.error("[SYSTEM] Fabrieksreset mislukt:", error);

        let message = `Fabrieksreset mislukt: ${error.message}`;

        const failedDevices =
            error.result?.failed_devices;

        if (Array.isArray(failedDevices) && failedDevices.length > 0) {
            message += "\n\nNiet ontkoppelde apparaten:";

            failedDevices.forEach(device => {
                message +=
                    `\n- ${device.device_id}: ${device.error}`;
            });

            message +=
                "\n\nDe lokale configuratie is behouden.";
        }

        showSystemMessage(app, message, "error");

    } finally {
        button.disabled = false;

        if (cancelButton) {
            cancelButton.disabled = false;
        }

        input.disabled = false;
    }
}


// ==================================================
// EVENTLISTENERS
// ==================================================

export function setupSystemSettings(app) {
    if (!app) {
        console.error("[SYSTEM] App-element ontbreekt");
        return;
    }

    if (initializedApps.has(app)) return;

    initializedApps.add(app);

    const refreshButton = app.querySelector(
        "#system-refresh-status"
    );

    const reloadButton = app.querySelector(
        "#system-reload"
    );

    const backupButton = app.querySelector(
        "#system-backup"
    );

    const resetButton = app.querySelector(
        "#system-factory-reset"
    );

    const cancelButton = app.querySelector(
        "#system-reset-cancel"
    );

    const confirmButton = app.querySelector(
        "#system-reset-confirm"
    );

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            void refreshSystemStatus(app, refreshButton);
        });
    }

    if (reloadButton) {
        reloadButton.addEventListener("click", () => {
            void reloadSystem(app, reloadButton);
        });
    }

    if (backupButton) {
        backupButton.addEventListener("click", () => {
            void downloadSystemBackup(app, backupButton);
        });
    }

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            openFactoryResetConfirmation(app);
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            closeFactoryResetConfirmation(app);

            showSystemMessage(app, "");
        });
    }

    if (confirmButton) {
        confirmButton.addEventListener("click", () => {
            void executeFactoryReset(app, confirmButton);
        });
    }

    setupFactoryResetInput(app);

    // Status direct ophalen bij initialisatie.
    void loadSystemStatus(app);

    console.info("[SYSTEM] Systeembeheer geïnitialiseerd");
}
