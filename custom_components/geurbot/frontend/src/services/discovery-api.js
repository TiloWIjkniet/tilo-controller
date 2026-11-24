import { API } from "./api-config.js";

export async function scanDevices() {
    const response = await fetch(API.discovery, {
        method: "POST",
        credentials: "same-origin"
    });

    if (!response.ok) {
        throw new Error(`Scannen mislukt (${response.status})`);
    }

    const result = await response.json();
    return result.devices ?? [];
}