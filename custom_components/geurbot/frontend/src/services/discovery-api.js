export async function scanDevices() {
    const response = await fetch("/api/geurbot/discovery");
    if (!response.ok) throw new Error(`Scannen van GeurBots mislukt (${response.status})`);
    const result = await response.json();
    return result.devices ?? [];
}
