import { getFirmwareStatus } from "../../utils/firmware-status.js";
import { fetchDeviceFirmwareInfo } from "../../services/services.js";


const displayedProgress = new WeakMap();
const animationFrames = new WeakMap();

function animateFirmwareProgress(bar, percentageElement, target) {
    const current = displayedProgress.get(bar) ?? 0;
    const next = Math.max(current, target);

    cancelAnimationFrame(animationFrames.get(bar));

    const start = performance.now();
    const duration = 1800;

    function animate(now) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);

        const value = current + (next - current) * eased;
        const rounded = Math.round(value);

        bar.style.width = `${value}%`;

        if (percentageElement)
            percentageElement.textContent = `${rounded}%`;

        if (elapsed < 1) {
            animationFrames.set(bar, requestAnimationFrame(animate));
        } else {
            displayedProgress.set(bar, next);
        }
    }

    animationFrames.set(bar, requestAnimationFrame(animate));
}

export async function updateDeviceFirmware(card, deviceId, firmwareData = null) {
    const update = card.querySelector(".device-update, .firmware-update");
    if (!update) return;

    try {
        const firmware = firmwareData ?? await fetchDeviceFirmwareInfo(deviceId);
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

            if (progress) progress.hidden = false;

            if (progressBar) {
                animateFirmwareProgress(
                    progressBar,
                    percentage,
                    Math.min(100, Math.max(0, Number(firmware.progress) || 0))
                );
            }
            if (button) button.hidden = true;
        } else {
            label.textContent = "Update beschikbaar";
            if (percentage) percentage.textContent = "";
            if (progress) progress.hidden = true;
            if (button) button.hidden = false;

            if (progressBar) {
                cancelAnimationFrame(animationFrames.get(progressBar));
                animationFrames.delete(progressBar);
                displayedProgress.delete(progressBar);
                progressBar.style.width = "0%";
            }
            }

        return { ...status, running, progress: firmware.progress, state: firmware.state };

    } catch (error) {
        update.hidden = true;
        console.error("Fout bij ophalen firmwarestatus:", error);
        return null;
    }
}