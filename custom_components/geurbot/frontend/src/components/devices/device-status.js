
import { getConnectionStatus } from "../../utils/network-status.js";
import { updateDeviceFragrance } from "./device-fragrance.js";

export async function updateDeviceStatus(card, deviceId) {
    const connection = card.querySelector(".device-status");
    if (!connection) return;

    try {
        const response = await fetch(`/api/geurbot/devices/${encodeURIComponent(deviceId)}/network/status`);

        const raw = await response.text();

        if (!response.ok) throw new Error(`Network API: ${response.status} - ${raw}`);

        const status = JSON.parse(raw);
        const result = getConnectionStatus(status);

        connection.textContent = result.label;
        connection.className = `device-status ${result.class}`;


    } catch (error) {
        connection.textContent = "Offline";
        connection.className = "device-status offline";
        
        console.error("Fout bij ophalen netwerkstatus:", error);
    }
}
