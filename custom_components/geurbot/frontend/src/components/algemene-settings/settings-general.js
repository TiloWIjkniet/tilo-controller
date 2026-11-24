
import { setupSystemSettings } from "./settings-system.js";
import { setupNotifications } from "./settings-notifications.js";

const initializedApps = new WeakSet();


// ==================================================
// ALGEMENE INSTELLINGEN INITIALISEREN
// ==================================================

export function setupGeneralSettings(app) {
    if (!app) {
        console.error("[SETTINGS] App-element ontbreekt");
        return;
    }

    if (initializedApps.has(app)) {
        return;
    }

    const overlay = app.querySelector("#general-settings-overlay");
    const openButton = app.querySelector(".general-settings-button");
    const closeButton = app.querySelector("#close-general-settings");

    if (!overlay || !openButton || !closeButton) {
        console.error("[SETTINGS] Algemene instellingen niet gevonden");
        return;
    }


    // ==================================================
    // INSTELLINGEN OPENEN
    // ==================================================

    openButton.addEventListener("click", () => {
        overlay.hidden = false;
    });


    // ==================================================
    // INSTELLINGEN SLUITEN
    // ==================================================

    closeButton.addEventListener("click", () => {
        overlay.hidden = true;
    });


    // Sluiten wanneer buiten het instellingenvenster wordt geklikt.
    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.hidden = true;
        }
    });


    // ==================================================
    // TABS INITIALISEREN
    // ==================================================

    setupGeneralTabs(app);


    // ==================================================
    // NOTIFICATIES INITIALISEREN
    // ==================================================

    void setupNotifications(app);


    // ==================================================
    // SYSTEEMINSTELLINGEN INITIALISEREN
    // ==================================================

    setupSystemSettings(app);


    initializedApps.add(app);

    console.info("[SETTINGS] Algemene instellingen geïnitialiseerd");
}


// ==================================================
// TABS
// ==================================================

function setupGeneralTabs(app) {
    const tabs = app.querySelectorAll("[data-general-tab]");
    const panels = app.querySelectorAll("[data-general-panel]");

    if (!tabs.length || !panels.length) {
        console.warn("[SETTINGS] Geen instellingen-tabs of panelen gevonden");
        return;
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const selected = tab.dataset.generalTab;

            // Actieve tab bijwerken.
            tabs.forEach(item => {
                item.classList.toggle("active", item === tab);
            });

            // Bijbehorend paneel tonen.
            panels.forEach(panel => {
                panel.classList.toggle(
                    "active",
                    panel.dataset.generalPanel === selected
                );
            });
        });
    });
}
