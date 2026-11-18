
export function getConnectionStatus(status) 
{
    if (!status?.success || !status.connected) 
    {
        return {
            label: "Offline",
            class: "offline",
            connected: false,
            internetAvailable: false,
            ssid: "",
            ip: "",
            rssi: null,
            hostname: status?.hostname ?? ""
        };
    }

    const rssi = typeof status.rssi === "number" ? status.rssi : null;

    let label = "Online";
    let cssClass = "online";

    if (rssi !== null) {
        if (rssi >= -55) {
            label = "Sterk";
            cssClass = "online";
        } else if (rssi >= -65) {
            label = "Goed";
            cssClass = "good";
        } else if (rssi >= -75) {
            label = "Stabiel";
            cssClass = "stable";
        } else if (rssi >= -85) {
            label = "Zwak";
            cssClass = "warning";
        } else {
            label = "Slecht";
            cssClass = "offline";
        }
    }

    return {
        label,
        class: cssClass,
        connected: true,
        internetAvailable: status.internet_available ?? false,
        ssid: status.ssid ?? "",
        ip: status.ip ?? "",
        rssi,
        hostname: status.hostname ?? ""
    };
}
