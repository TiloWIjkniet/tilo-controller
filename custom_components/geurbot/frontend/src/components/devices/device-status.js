
import { getConnectionStatus } from "../../utils/network-status.js";
import { updateDeviceFragrance } from "./device-fragrance.js";

export async function updateDeviceStatus(card, deviceId) {
    const connection = card.querySelector(".device-status");
    if (!connection) return;

    try {
        const response = await fetch(`/api/geurbot/devices/${encodeURIComponent(deviceId)}/network/status`);

        if (!response.ok) throw new Error(`Network API: ${response.status}`);

        const status = await response.json();
        const result = getConnectionStatus(status);

        connection.textContent = result.label;
        connection.className = `device-status ${result.class}`;

        updateDeviceFragrance(card, status, status.connected);

    } catch (error) {
        connection.textContent = "Offline";
        connection.className = "device-status offline";

        updateDeviceFragrance(card, null, false);

        console.error("Fout bij ophalen netwerkstatus:", error);
    }
}
