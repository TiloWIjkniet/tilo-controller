const API_BASE = "/api/geurbot/devices";

async function requestJson(deviceId, endpoint, method = "GET") {
    const url = `${API_BASE}/${encodeURIComponent(deviceId)}/logs${endpoint}`;

    const response = await fetch(url, {
        method,
        credentials: "same-origin"
    });

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

const allowedTypes = ["all", "info", "warnings", "errors"];

export function fetchDeviceLogs(deviceId, type = "all") {
    if (!allowedTypes.includes(type)) {
        throw new Error(`Ongeldig logtype: ${type}`);
    }

    const endpoints = {
        all: "",
        info: "/info",
        warnings: "/warnings",
        errors: "/errors"
    };

    return requestJson(deviceId, endpoints[type]);
}

export function clearDeviceErrors(deviceId) {
    return requestJson(deviceId, "/clear", "DELETE");
}

export function clearDeviceLogs(deviceId) {
    return requestJson(deviceId, "/clear-all", "DELETE");
}

export function fetchDeviceErrors(deviceId) {
    return requestJson(deviceId, "/errors");
}