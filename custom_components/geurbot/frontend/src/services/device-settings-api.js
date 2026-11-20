
const API_BASE = "/api/geurbot/devices";

async function requestJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`API HTTP ${response.status}: ${message}`);
    }

    return response.json();
}

export function fetchDeviceNetworkStatus(deviceId) {
    return requestJson(
        `${API_BASE}/${encodeURIComponent(deviceId)}/network/status`
    );
}

export function fetchDeviceFirmwareInfo(deviceId) {
    return requestJson(
        `${API_BASE}/${encodeURIComponent(deviceId)}/firmware/esp/info`
    );
}


export function fetchDeviceDiagnostics(deviceId, endpoint) {
    const allowedEndpoints = ["uptime", "memory", "storage", "reset"];

    if (!allowedEndpoints.includes(endpoint)) {
        throw new Error(`Ongeldig diagnostics endpoint: ${endpoint}`);
    }

    const url = `${API_BASE}/${encodeURIComponent(deviceId)}/diagnostics/${endpoint}`;

    console.log("Diagnostics API URL:", url);

    return requestJson(url);
}

export async function fetchDevicePerformance(deviceId) {
    const response = await fetch(
        `/api/geurbot/devices/${encodeURIComponent(deviceId)}/performance`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error ?? `HTTP ${response.status}`);
    }

    return result;
}


async function postDeviceAction(deviceId, action) {
    const url = `${API_BASE}/${encodeURIComponent(deviceId)}/${action}`;

    const response = await fetch(url, { method: "POST" });
    const text = await response.text();

    let result;

    try {
        result = JSON.parse(text);
    } catch (error) {
        console.error("Ongeldige API-response:", {
            url,
            status: response.status,
            response: text
        });

        throw new Error("De server stuurde geen geldige JSON terug.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.error ?? `HTTP ${response.status}`);
    }

    return result;
}


export function restartDevice(deviceId) {
    return postDeviceAction(deviceId, "restart");
}

export function unpairDevice(deviceId) {
    return postDeviceAction(deviceId, "unpair");
}

export function factoryResetDevice(deviceId) {
    return postDeviceAction(deviceId, "factory-reset");
}