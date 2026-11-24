
import {
    restartDevice,
    unpairDevice,
    factoryResetDevice
} from "../../../services/device-settings-api.js";

const maintenanceInstances = new WeakMap();

export function createMaintenanceTemplate() {
    return `
        <section class="settings-card">
            <div class="settings-card-title">
                <span>🔄</span>
                <h3>Apparaat herstarten</h3>
            </div>

            <p>Start de GeurBot opnieuw op. Je instellingen en gegevens blijven behouden.</p>

            <button class="maintenance-button" id="maintenance-restart" type="button">
                Herstart apparaat
            </button>
        </section>

        <section class="settings-card">
            <div class="settings-card-title">
                <span>🔗</span>
                <h3>Home Assistant ontkoppelen</h3>
            </div>

            <p>Verbreek de koppeling met Home Assistant. Je Wi-Fi-instellingen blijven behouden.</p>

            <button class="maintenance-button maintenance-button-warning" id="maintenance-unpair" type="button">
                Ontkoppelen
            </button>
        </section>

        <section class="settings-card">
            <div class="settings-card-title">
                <span>⚠️</span>
                <h3>Fabrieksinstellingen herstellen</h3>
            </div>

            <p>Verwijder de opgeslagen instellingen, Home Assistant-koppeling en verbindingsgeschiedenis.</p>

            <button class="maintenance-button maintenance-button-danger" id="maintenance-factory-reset" type="button">
                Fabrieksinstellingen herstellen
            </button>
        </section>

        <p class="maintenance-status" id="maintenance-status" hidden></p>
    `;
}

export function setupMaintenanceSettings({ overlay, getSelectedDevice }) {
    const existing = maintenanceInstances.get(overlay);
    if (existing) return existing;

    const restartButton = overlay.querySelector("#maintenance-restart");
    const unpairButton = overlay.querySelector("#maintenance-unpair");
    const resetButton = overlay.querySelector("#maintenance-factory-reset");
    const statusElement = overlay.querySelector("#maintenance-status");

    let busy = false;

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
    // BEVESTIGINGSPOP-UP
    // ==================================================

    function showMaintenanceConfirm({
        title,
        message,
        confirmText,
        onConfirm
    }) {
        const confirmOverlay = document.createElement("div");
        confirmOverlay.className = "maintenance-confirm-overlay";

        const confirmBox = document.createElement("div");
        confirmBox.className = "maintenance-confirm";

        const icon = document.createElement("div");
        icon.className = "maintenance-confirm-icon";
        icon.textContent = "⚠️";

        const heading = document.createElement("h3");
        heading.textContent = title;

        const description = document.createElement("p");
        description.textContent = message;

        const actions = document.createElement("div");
        actions.className = "maintenance-confirm-actions";

        const cancelButton = document.createElement("button");
        cancelButton.className = "maintenance-confirm-cancel";
        cancelButton.type = "button";
        cancelButton.textContent = "Annuleren";

        const submitButton = document.createElement("button");
        submitButton.className = "maintenance-confirm-submit";
        submitButton.type = "button";
        submitButton.textContent = confirmText;

        actions.append(cancelButton, submitButton);
        confirmBox.append(icon, heading, description, actions);
        confirmOverlay.appendChild(confirmBox);

        document.body.append(confirmOverlay);

        const close = () => confirmOverlay.remove();

        cancelButton.addEventListener("click", close);

        submitButton.addEventListener("click", () => {
            close();
            onConfirm();
        });

        confirmOverlay.addEventListener("click", event => {
            if (event.target === confirmOverlay) {
                close();
            }
        });
    }

    // ==================================================
    // STATUSMELDING
    // ==================================================

    function setStatus(message, type = "info") {
        statusElement.textContent = message;
        statusElement.className = `maintenance-status ${type}`;
        statusElement.hidden = false;
    }

    // ==================================================
    // BEZIG-STATUS
    // ==================================================

    function setBusy(value) {
        busy = value;

        [
            restartButton,
            unpairButton,
            resetButton
        ].forEach(button => {
            button.disabled = value;
        });
    }

    // ==================================================
    // ONDERHOUDSACTIE UITVOEREN
    // ==================================================

    async function executeAction(action, successMessage, removeDevice = false) {
        const device = getSelectedDevice();

        if (!device || busy) return;

        setBusy(true);

        setStatus("Bezig met uitvoeren...", "loading");

        const actionTitle = removeDevice
            ? "Apparaatinstellingen wijzigen"
            : "Apparaat herstarten";

        const loadingFeedback = showFeedback(
            actionTitle,
            "De opdracht wordt naar de GeurBot verstuurd...",
            "loading"
        );

        try {
            await action(device.id);

            if (removeDevice) {
                document.dispatchEvent(
                    new CustomEvent("geurbot:device-removed", {
                        detail: {
                            deviceId: device.id
                        }
                    })
                );
            }

            setStatus(successMessage, "success");

            loadingFeedback.remove();

            showFeedback(
                "Actie uitgevoerd",
                successMessage,
                "success"
            );

        } catch (error) {
            console.error("Onderhoudsactie mislukt:", error);

            const errorMessage =
                error.message || "De actie is mislukt.";

            setStatus(errorMessage, "error");

            loadingFeedback.remove();

            showFeedback(
                "Actie mislukt",
                errorMessage,
                "error"
            );

        } finally {
            setBusy(false);
        }
    }

    // ==================================================
    // APPARAAT HERSTARTEN
    // ==================================================

    restartButton.addEventListener("click", () => {
        showMaintenanceConfirm({
            title: "GeurBot herstarten",

            message:
                "Weet je zeker dat je de GeurBot opnieuw wilt opstarten?",

            confirmText: "Herstarten",

            onConfirm: () => executeAction(
                restartDevice,
                "Het herstartverzoek is verstuurd. De GeurBot start opnieuw op."
            )
        });
    });

    // ==================================================
    // HOME ASSISTANT ONTKOPPELEN
    // ==================================================

    unpairButton.addEventListener("click", () => {
        showMaintenanceConfirm({
            title: "Home Assistant ontkoppelen",

            message:
                "Weet je zeker dat je de GeurBot wilt ontkoppelen van Home Assistant? Je Wi-Fi-instellingen blijven behouden.",

            confirmText: "Ontkoppelen",

            onConfirm: () => executeAction(
                unpairDevice,
                "De Home Assistant-koppeling is verwijderd.",
                true
            )
        });
    });

    // ==================================================
    // FABRIEKSRESET
    // ==================================================

    resetButton.addEventListener("click", () => {
        showMaintenanceConfirm({
            title: "Fabrieksinstellingen herstellen",

            message:
                "LET OP: hiermee worden de Wi-Fi-instellingen, Home Assistant-koppeling en geschiedenis verwijderd. Dit kan niet ongedaan worden gemaakt.",

            confirmText: "Fabrieksreset uitvoeren",

            onConfirm: () => executeAction(
                factoryResetDevice,
                "De fabrieksreset is gestart.",
                true
            )
        });
    });

    // ==================================================
    // RESET
    // ==================================================

    function reset() {
        if (busy) return;

        statusElement.hidden = true;
        statusElement.textContent = "";
    }

    const instance = { reset };

    maintenanceInstances.set(overlay, instance);

    return instance;
}
