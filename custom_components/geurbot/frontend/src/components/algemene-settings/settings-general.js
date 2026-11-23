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

    setupNotificationSettings(app);
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

