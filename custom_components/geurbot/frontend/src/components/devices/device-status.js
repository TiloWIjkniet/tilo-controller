
import { getConnectionStatus } from "../../utils/network-status.js";
import { fetchDeviceNetworkStatus } from "../../services/services.js";

function updateReachability(deviceId, unreachable, status = null) {
    document.dispatchEvent(new CustomEvent(
        "geurbot:device-network-status-updated",
        {
            detail: {
                deviceId,
                unreachable,
                status
            }
        }
    ));
}

export async function updateDeviceStatus(card, deviceId) {
    const connection = card.querySelector(".device-status");
    const hostname = card.querySelector(".device-hostname");
    const signal = card.querySelector(".device-signal");

    if (!connection) return null;

    try {
        const rawStatus = await fetchDeviceNetworkStatus(deviceId);
        const status = getConnectionStatus(rawStatus);

        connection.textContent = status.connected
            ? "Verbonden"
            : "Niet verbonden";

        connection.className = `device-status ${status.class}`;

        if (hostname) {
            hostname.textContent = status.connected
                ? status.hostname
                : "Niet bereikbaar";
        }

        if (signal) {
            signal.textContent = status.connected && status.rssi !== null
                ? `WiFi: ${status.label} (${status.rssi} dBm) · ${status.ssid}`
                : "WiFi-signaal niet beschikbaar";
        }

        updateReachability(deviceId, !status.connected, status);

        return status;

    } catch (error) {
        connection.textContent = "Offline";
        connection.className = "device-status offline";

        if (hostname)
            hostname.textContent = "Niet bereikbaar";

        if (signal)
            signal.textContent = "WiFi-signaal niet beschikbaar";

        // Status bestaat hier niet meer uit het try-blok.
        // Geef daarom null door.
        updateReachability(deviceId, true, null);

        console.error("Fout bij ophalen netwerkstatus:", error);

        return null;
    }
}
