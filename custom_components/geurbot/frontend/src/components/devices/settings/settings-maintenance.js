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



    function showMaintenanceConfirm({title,message,confirmText,onConfirm}) {
        const overlay = document.createElement("div");
        overlay.className = "maintenance-confirm-overlay";

        overlay.innerHTML = `
            <div class="maintenance-confirm">
                <div class="maintenance-confirm-icon">⚠️</div>
                <h3>${title}</h3>
                <p>${message}</p>

                <div class="maintenance-confirm-actions">
                    <button class="maintenance-confirm-cancel" type="button">
                        Annuleren
                    </button>
                    <button class="maintenance-confirm-submit" type="button">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        document.body.append(overlay);

        const close = () => overlay.remove();

        overlay.querySelector(".maintenance-confirm-cancel")
            .addEventListener("click", close);

        overlay.querySelector(".maintenance-confirm-submit")
            .addEventListener("click", () => {
                close();
                onConfirm();
            });

        overlay.addEventListener("click", event => {
            if (event.target === overlay) close();
        });
    }

    
    function setStatus(message, type = "info") {
        statusElement.textContent = message;
        statusElement.className = `maintenance-status ${type}`;
        statusElement.hidden = false;
    }

    function setBusy(value) {
        busy = value;

        [restartButton, unpairButton, resetButton].forEach(button => {
            button.disabled = value;
        });
    }

        async function executeAction(action, successMessage, removeDevice = false) {
        const device = getSelectedDevice();

        if (!device || busy) return;

        setBusy(true);
        setStatus("Bezig met uitvoeren...", "loading");

        try {
            await action(device.id);

            if (removeDevice) {
                document.dispatchEvent(new CustomEvent("geurbot:device-removed", {
                    detail: { deviceId: device.id }
                }));
            }

            setStatus(successMessage, "success");
        } catch (error) {
            console.error("Onderhoudsactie mislukt:", error);
            setStatus(error.message || "De actie is mislukt.", "error");
        } finally {
            setBusy(false);
        }
    }

    restartButton.addEventListener("click", () => {
        showMaintenanceConfirm({
            title: "GeurBot herstarten",
            message: "Weet je zeker dat je de GeurBot opnieuw wilt opstarten?",
            confirmText: "Herstarten",
            onConfirm: () => executeAction(
                restartDevice,
                "Het herstartverzoek is verstuurd. De GeurBot start opnieuw op."
            )
        });
    });

    unpairButton.addEventListener("click", () => {
        showMaintenanceConfirm({
            title: "Home Assistant ontkoppelen",
            message: "Weet je zeker dat je de GeurBot wilt ontkoppelen van Home Assistant? Je Wi-Fi-instellingen blijven behouden.",
            confirmText: "Ontkoppelen",
            onConfirm: () => executeAction(
                unpairDevice,
                "De Home Assistant-koppeling is verwijderd.",
                true
            )
        });
    });

    resetButton.addEventListener("click", () => {
        showMaintenanceConfirm({
            title: "Fabrieksinstellingen herstellen",
            message: "LET OP: hiermee worden de Wi-Fi-instellingen, Home Assistant-koppeling en geschiedenis verwijderd. Dit kan niet ongedaan worden gemaakt.",
            confirmText: "Fabrieksreset uitvoeren",
            onConfirm: () => executeAction(
                factoryResetDevice,
                "De fabrieksreset is gestart.",
                true
            )
        });
    });

    function reset() {
        if (busy) return;

        statusElement.hidden = true;
        statusElement.textContent = "";
    }

    const instance = { reset };
    maintenanceInstances.set(overlay, instance);

    return instance;
}