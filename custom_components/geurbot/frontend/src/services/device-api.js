export async function addDiscoveredDevice(deviceId, name, hostname, pairingCode) {
    const response = await fetch("/api/devices/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            device_id: deviceId,
            name,
            hostname,
            pairing_code: pairingCode
        })
    });

    const raw = await response.text();

    console.log("HTTP status:", response.status);
    console.log("Raw response:", JSON.stringify(raw));

    let result;

    try {
        result = JSON.parse(raw);
    } catch (error) {
        throw new Error(`Ongeldige backend-response: ${raw}`);
    }

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Apparaat koppelen mislukt.");
    }

    return result;
}