import { getFirmwareStatus } from "../../utils/firmware-status.js";
import { fetchDeviceFirmwareInfo } from "../../services/services.js";

export async function updateDeviceFirmware(card, deviceId) {
    const update = card.querySelector(".device-update, .firmware-update");
    if (!update) return;

    try {
        const firmware = await fetchDeviceFirmwareInfo(deviceId);
        const status = getFirmwareStatus(firmware);

        const label = update.querySelector(".device-update-label, .firmware-update-label");
        const percentage = update.querySelector(".device-update-percentage, .firmware-update-percentage");
        const progress = update.querySelector(".device-update-progress, .firmware-update-progress");
        const progressBar = update.querySelector(".device-update-progress-bar, .firmware-update-progress-bar");
        const button = update.querySelector(".firmware-update-button");

        const running = firmware.running ?? false;

        update.hidden = !status.available && !running;

        if (update.hidden) return { ...status, running };

        if (running) {
            label.textContent = firmware.state === "INSTALLING"
                ? "Installeren..."
                : firmware.state === "REBOOTING"
                    ? "Herstarten..."
                    : "Downloaden...";

            if (percentage) percentage.textContent = `${firmware.progress ?? 0}%`;
            if (progress) progress.hidden = false;
            if (progressBar) progressBar.style.width = `${firmware.progress ?? 0}%`;
            if (button) button.hidden = true;
        } else {
            label.textContent = "Update beschikbaar";
            if (percentage) percentage.textContent = "";
            if (progress) progress.hidden = true;
            if (button) button.hidden = false;
        }

        return { ...status, running, progress: firmware.progress, state: firmware.state };

    } catch (error) {
        update.hidden = true;
        console.error("Fout bij ophalen firmwarestatus:", error);
        return null;
    }
}