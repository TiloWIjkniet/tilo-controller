
import { sendDeviceApiRequest } from "../../../../services/api-terminal-api.js";

export async function sendApiRequest({
    deviceId,
    method,
    url,
    params,
    headers,
    body
}) {
    if (!deviceId) {
        throw new Error("Geen apparaat geselecteerd.");
    }

    if (!url.trim()) {
        throw new Error("Geen endpoint ingevuld.");
    }

    const start = performance.now();

    try {
        const result = await sendDeviceApiRequest(deviceId, {
            method,
            url,
            params,
            headers,
            body
        });

        return {
            ...result,
            duration: result.duration ?? Math.round(performance.now() - start)
        };
    } catch (error) {
        console.error("API Terminal request error:", error);
        throw error;
    }
}