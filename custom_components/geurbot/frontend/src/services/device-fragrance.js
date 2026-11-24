async function requestFragranceApi(deviceId, endpoint, data = null, method = null) {
    const options = {
        method: method ?? (data === null ? "GET" : "POST"),
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (data !== null)
        options.body = JSON.stringify(data);

    const response = await fetch(
        `/api/geurbot/devices/${encodeURIComponent(deviceId)}/fragrance/${endpoint}`,
        options
    );

    const result = await response.json();

    if (!response.ok || !result.success)
        throw new Error(result.error || "Fragrance API request failed");

    return result;
}

export async function fetchDeviceFragranceStatus(deviceId) {
    return requestFragranceApi(deviceId, "status");
}

export async function fetchDeviceFragrances(deviceId) {
    return requestFragranceApi(deviceId, "get-all");
}

export async function fetchFragrance(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "get", {
        mac_address: macAddress
    });
}

export async function sprayFragrance(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "spray", {
        mac_address: macAddress
    });
}

export async function renameFragrance(deviceId, macAddress, name) {
    return requestFragranceApi(deviceId, "rename", {
        mac_address: macAddress,
        name
    });
}

export async function setFragranceEnabled(deviceId, macAddress, enabled) {
    return requestFragranceApi(deviceId, "set-enabled", {
        mac_address: macAddress,
        enabled
    });
}

export async function fetchFragranceStats(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "stats", {
        mac_address: macAddress
    });
}

export async function fetchFragranceTotalSprays(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "total-sprays", {
        mac_address: macAddress
    });
}

export async function fetchFragranceUptime(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "uptime", {
        mac_address: macAddress
    });
}

export async function fetchFragranceFirmwareVersion(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "firmware-version", {
        mac_address: macAddress
    });
}

// Spray teller resetten
export async function resetFragranceCounter(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "reset-counter", {
        mac_address: macAddress
    });
}

// Geschat aantal sprays instellen
export async function setFragranceEstimatedSprays(deviceId, macAddress, estimatedSprays) {
    return requestFragranceApi(deviceId, "estimated-sprays", {
        mac_address: macAddress,
        estimated_sprays: estimatedSprays
    }, "PUT");
}

// Lege-fleswaarde ophalen
export async function fetchFragranceEmptyBottleValue(deviceId, macAddress) {
    return requestFragranceApi(deviceId, "empty-bottle-value", {
        mac_address: macAddress
    });
}

// Lege-fles-threshold instellen
export async function setFragranceEmptyBottleThreshold(deviceId, macAddress, threshold) {
    return requestFragranceApi(deviceId, "empty-bottle-threshold", {
        mac_address: macAddress,
        empty_bottle_threshold: threshold
    }, "PUT");
}

// Spraygeschiedenis ophalen
export async function fetchFragranceSprayLog(deviceId, macAddress) {
    return requestFragranceApi(
        deviceId,
        `spray-log?mac_address=${encodeURIComponent(macAddress)}`
    );
}

export async function updateBackendDeviceFragrances(deviceId, fragrances) {
    console.log(`[BACKEND] Geuren opslaan voor ${deviceId}:`, fragrances);

    const response = await fetch(
        `/api/geurbot/devices/${encodeURIComponent(deviceId)}/fragrance/backend/update`,
        {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fragrances })
        }
    );

    const rawResponse = await response.text();

    console.log("[BACKEND] HTTP status:", response.status);
    console.log("[BACKEND] Ruwe response:", rawResponse);

    let result;

    try {
        result = JSON.parse(rawResponse);
    } catch (error) {
        console.error("[BACKEND] Response is geen geldige JSON:", error);
        throw error;
    }

    if (!response.ok) {
        console.error("[BACKEND] Opslaan mislukt:", result);
        throw new Error(result.error || "Backend fragrances opslaan mislukt");
    }

    console.log(`[BACKEND] Geuren succesvol opgeslagen voor ${deviceId}:`, result);

    return result;
}

export async function deleteBackendDeviceFragrance(deviceId, macAddress) {
    console.log(`[BACKEND] Geur verwijderen: ${macAddress}`);

    const response = await fetch(
        `/api/geurbot/devices/${encodeURIComponent(deviceId)}/fragrance/backend/${encodeURIComponent(macAddress)}`,
        {
            method: "DELETE",
            credentials: "same-origin"
        }
    );

    const result = await response.json();

    if (!response.ok)
        throw new Error(result.error || "Geur verwijderen mislukt");

    console.log(`[BACKEND] Geur ${macAddress} verwijderd`);

    return result;
}