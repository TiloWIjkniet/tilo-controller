
const API_BASE = "/api/geurbot/devices";

async function requestJson(deviceId, endpoint) {
    const url = `${API_BASE}/${encodeURIComponent(deviceId)}${endpoint}`;

    const response = await fetch(url);
    const raw = await response.text();

    let data;

    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        throw new Error(`Ongeldige JSON van ${url}: ${raw}`);
    }

    if (!response.ok) {
        throw new Error(`API HTTP ${response.status}: ${raw}`);
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


export async function loadDevices() {
    try {
        const response = await fetch("/api/geurbot/devices");

        if (!response.ok)
            throw new Error("Could not retrieve devices");

        const result = await response.json();

        if (!result.success)
            throw new Error("Could not load devices");

        devices.splice(0, devices.length, ...result.devices);

        return devices;

    } catch (error) {
        console.error("Failed to load devices:", error);
        return [];
    }
}