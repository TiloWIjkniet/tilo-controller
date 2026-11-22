import { fetchDeviceFragranceStatus } from "../../services/device-fragrance.js";

export function updateDeviceFragrance(card, fragrances, connected) {
    const icon = card.querySelector(".device-fragrance");
    if (!icon) return;

    icon.setAttribute("class", "device-fragrance");

    if (!connected)
        icon.classList.add("error");
    else if (!fragrances?.length || fragrances.some(fragrance => !fragrance.available))
        icon.classList.add("warning");
    else
        icon.classList.add("good");
}
export async function refreshDeviceFragrance(card, device) {
    try {
        const result = await fetchDeviceFragranceStatus(device.id);
        updateDeviceFragrance(card, device.fragrances, true);
    } catch (error) {
        updateDeviceFragrance(card, null, false);
        console.error("Fout bij ophalen geurstatus:", error);
    }
}