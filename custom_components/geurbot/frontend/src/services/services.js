const API_BASE = "/api/geurbot/devices";


async function requestJson(deviceId, endpoint) {
    const url = `${API_BASE}/${encodeURIComponent(deviceId)}${endpoint}`;

    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: {
            "Accept": "application/json"
        }
    });

    const raw = await response.text();

    let data;

    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        throw new Error(
            `Ongeldige JSON van ${url}: HTTP ${response.status}: ${raw}`
        );
    }

    if (!response.ok) {
        throw new Error(
            `API HTTP ${response.status}: ${data.message || data.error || raw}`
        );
    }

    return data;
}


export function fetchDeviceNetworkStatus(deviceId) {
    return requestJson(deviceId, "/network/status");
}

export function fetchDeviceFirmwareInfo(deviceId) {
    return requestJson(deviceId, "/firmware/esp/info");
}

export function fetchDeviceFragranceStatus(deviceId) {
    return requestJson(deviceId, "/fragrance/status");
}

export function fetchDeviceDiagnostics(deviceId, endpoint) {
    const allowedEndpoints = ["uptime", "memory", "storage", "reset"];

    if (!allowedEndpoints.includes(endpoint)) {
        throw new Error(`Ongeldig diagnostics endpoint: ${endpoint}`);
    }

    return requestJson(deviceId, `/diagnostics/${endpoint}`);
}