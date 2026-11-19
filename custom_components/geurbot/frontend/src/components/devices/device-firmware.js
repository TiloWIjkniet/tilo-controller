import { getFirmwareStatus } from "../../utils/firmware-status.js";

export async function updateDeviceFirmware(card, deviceId) {
    const update = card.querySelector(".device-update");
    if (!update) return;

    try {
        const response = await fetch(`/api/geurbot/devices/${encodeURIComponent(deviceId)}/firmware/esp/info`);
        if (!response.ok) throw new Error(`Firmware API: ${response.status}`);

        const firmware = await response.json();
        const status = getFirmwareStatus(firmware);

        update.textContent = status.label;
        update.hidden = !status.available;

        return status;

    } catch (error) {
        update.hidden = true;
        console.error("Fout bij ophalen firmwarestatus:", error);
        return null;
    }
}