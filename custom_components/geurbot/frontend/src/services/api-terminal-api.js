
const API_BASE = "/api/geurbot/devices";

export async function sendDeviceApiRequest(deviceId, request) {
    const url = `${API_BASE}/${encodeURIComponent(deviceId)}/api-terminal/request`;

    let response;

    try {
        response = await fetch(url, {
            method: "POST",
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
