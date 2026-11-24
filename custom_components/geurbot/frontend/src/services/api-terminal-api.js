const API_BASE = "/api/geurbot/devices";

export async function sendDeviceApiRequest(deviceId, request) {
    const url = `${API_BASE}/${encodeURIComponent(deviceId)}/api-terminal/request`;

    let response;

    try {
        response = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });
    } catch (error) {
        console.error("API Terminal fetch error:", error);
        throw new Error(`Verbindingsfout: ${error.message}`);
    }

    const responseText = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    let result;

    try {
        result = responseText ? JSON.parse(responseText) : null;
    } catch {
        result = responseText;
    }

    if (!response.ok) {
        const error = new Error(
            typeof result === "string"
                ? result
                : result?.error ?? result?.message ?? `Backend HTTP ${response.status}`
        );

        error.status = response.status;
        error.statusText = response.statusText;
        error.response = responseText;
        error.headers = headers;

        throw error;
    }

    return result;
}

export async function addDiscoveredDevice(deviceId, name, hostname, pairingCode) {
    const response = await fetch("/api/devices/add", {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        },
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