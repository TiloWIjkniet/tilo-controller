import { getConnectionStatus } from "../../utils/network-status.js";
import { fetchDeviceNetworkStatus } from "../../services/services.js";

export async function updateDeviceStatus(card, deviceId) {
    const connection = card.querySelector(".device-status");
    const hostname = card.querySelector(".device-hostname");
    const signal = card.querySelector(".device-signal");

    if (!connection) return;

    try {
        const status = getConnectionStatus(
            await fetchDeviceNetworkStatus(deviceId)
        );

        connection.textContent = status.connected ? "Verbonden" : "Niet verbonden";
        connection.className = `device-status ${status.class}`;

        if (hostname) hostname.textContent = status.hostname;

        if (signal) {
            signal.textContent = status.rssi !== null
                ? `WiFi: ${status.label} (${status.rssi} dBm) · ${status.ssid}`
                : "WiFi-signaal onbekend";
        }

        return status;

    } catch (error) {
        connection.textContent = "Offline";
        connection.className = "device-status offline";

        if (hostname) hostname.textContent = "";
        if (signal) signal.textContent = "WiFi-signaal niet beschikbaar";

        console.error("Fout bij ophalen netwerkstatus:", error);
        return null;
    }
}