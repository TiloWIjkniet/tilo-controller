import { API } from "./api-config.js";

export async function addDiscoveredDevice(deviceId, name, pairingCode) {
    const response = await fetch(API.addDevice, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            device_id: deviceId,
            name,
            pairing_code: pairingCode
        })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || result.error || "Toevoegen mislukt");
    }

    return result.device;
}