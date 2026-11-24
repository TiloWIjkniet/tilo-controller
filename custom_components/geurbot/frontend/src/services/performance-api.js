const API_BASE = "/api/geurbot/devices";

export async function fetchDevicePerformance(deviceId) {
    const response = await fetch(
        `${API_BASE}/${encodeURIComponent(deviceId)}/performance`,
        {
            credentials: "same-origin"
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error ?? `Backend HTTP ${response.status}`);
    }

    return result;
}