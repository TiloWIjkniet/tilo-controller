
import { getFirmwareStatus } from "../../utils/firmware-status.js";
import { fetchDeviceFirmwareInfo } from "../../services/services.js";

const displayedProgress = new WeakMap();
const animationFrames = new WeakMap();

function stopFirmwareAnimation(bar) {
    const frame = animationFrames.get(bar);

    if (frame !== undefined) {
        cancelAnimationFrame(frame);
        animationFrames.delete(bar);
    }
}

function animateFirmwareProgress(bar, percentageElement, target) {
    const current = displayedProgress.get(bar) ?? 0;
    const next = Math.max(current, target);

    stopFirmwareAnimation(bar);

    const start = performance.now();
    const duration = 1800;

    function animate(now) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);

        const value = current + (next - current) * eased;
        const rounded = Math.round(value);

        bar.style.width = `${value}%`;

        if (percentageElement) {
            percentageElement.textContent = `${rounded}%`;
        }

        if (elapsed < 1) {
            animationFrames.set(bar, requestAnimationFrame(animate));
        } else {
            displayedProgress.set(bar, next);
            animationFrames.delete(bar);
        }
    }

    animationFrames.set(bar, requestAnimationFrame(animate));
}

export async function updateDeviceFirmware(card, deviceId, firmwareData = null) {
    const update = card.querySelector(".device-update, .firmware-update");

    if (!update) return;

    const progressBar = update.querySelector(
        ".device-update-progress-bar, .firmware-update-progress-bar"
    );

    try {
        const firmware = firmwareData ?? await fetchDeviceFirmwareInfo(deviceId);
        const status = getFirmwareStatus(firmware);

        const label = update.querySelector(
            ".device-update-label, .firmware-update-label"
        );

        const percentage = update.querySelector(
            ".device-update-percentage, .firmware-update-percentage"
        );

        const progress = update.querySelector(
            ".device-update-progress, .firmware-update-progress"
        );

        const button = update.querySelector(".firmware-update-button");

        const running = firmware.running ?? false;

        update.hidden = !status.available && !running;

        if (update.hidden) {
            if (progressBar) {
                stopFirmwareAnimation(progressBar);
                displayedProgress.delete(progressBar);
            }

            return { ...status, running };
        }

        if (!label) {
            console.error("Firmwarestatus: label-element ontbreekt.");
            return { ...status, running };
        }

        if (running) {
            label.textContent = firmware.state === "INSTALLING"
                ? "Installeren..."
                : firmware.state === "REBOOTING"
                    ? "Herstarten..."
                    : "Downloaden...";

            if (progress) {
                progress.hidden = false;
            }

            if (progressBar) {
                const target = Math.min(
                    100,
                    Math.max(0, Number(firmware.progress) || 0)
                );

                animateFirmwareProgress(
                    progressBar,
                    percentage,
                    target
                );
            }

            if (button) {
                button.hidden = true;
            }
        } else {
            label.textContent = "Update beschikbaar";

            if (percentage) {
                percentage.textContent = "";
            }

            if (progress) {
                progress.hidden = true;
            }

            if (button) {
                button.hidden = false;
            }

            if (progressBar) {
                stopFirmwareAnimation(progressBar);
                displayedProgress.delete(progressBar);
                progressBar.style.width = "0%";
            }
        }

        return {
            ...status,
            running,
            progress: firmware.progress,
            state: firmware.state
        };

    } catch (error) {
        console.error("Fout bij ophalen firmwarestatus:", error);

        // Verberg de update niet automatisch bij een tijdelijke API-fout.
        return null;
    }
}
