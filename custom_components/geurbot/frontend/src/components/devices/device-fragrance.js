

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
    const icon = card.querySelector(".device-fragrance");
    if (!icon) return;

    try {
        const response = await fetch(
            `/api/geurbot/devices/${encodeURIComponent(deviceId)}/fragrance/status`
        );

        if (!response.ok) throw new Error(`Fragrance API: ${response.status}`);

        const status = await response.json();

        updateDeviceFragrance(card, status, true);

    } catch (error) {
        updateDeviceFragrance(card, null, false);
        console.error("Fout bij ophalen geurstatus:", error);
    }
}