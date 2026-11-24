
import { setupSystemSettings } from "./settings-system.js";
import { setupNotifications } from "./settings-notifications.js";

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

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.hidden = true;
        }
    });

    setupGeneralTabs(app);

    void setupNotifications(app);
    setupSystemSettings(app);
}

function setupGeneralTabs(app) {
    const tabs = app.querySelectorAll("[data-general-tab]");
    const panels = app.querySelectorAll("[data-general-panel]");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const selected = tab.dataset.generalTab;

            tabs.forEach(item => {
                item.classList.toggle("active", item === tab);
            });

            panels.forEach(panel => {
                panel.classList.toggle(
                    "active",
                    panel.dataset.generalPanel === selected
                );
            });
        });
    });
}
