import { fetchDeviceFragranceStatus } from "../../services/services.js";

export function updateDeviceFragrance(card, status, connected) {
    const icon = card.querySelector(".device-fragrance");
    if (!icon) return;

    icon.setAttribute("class", "device-fragrance");

    if (!connected || !status) icon.classList.add("error");
    else if (!status.all_devices_connected) icon.classList.add("error");
    else if (!status.all_fragrances_filled) icon.classList.add("warning");
    else icon.classList.add("good");
}

export async function refreshDeviceFragrance(card, deviceId) {
    try {
        const status = await fetchDeviceFragranceStatus(deviceId);
        updateDeviceFragrance(card, status, true);
    } catch (error) {
        updateDeviceFragrance(card, null, false);
        console.error("Fout bij ophalen geurstatus:", error);
    }
}