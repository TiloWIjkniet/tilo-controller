export function formatBytes(bytes) {
    if (typeof bytes !== "number" || !Number.isFinite(bytes)) return "-";

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }

    return `${value.toFixed(2)} ${units[unit]}`;
}

export function formatUptime(seconds) {
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "-";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${days} dagen, ${hours} uur, ${minutes} min, ${remainingSeconds} sec`;
}

export function setText(root, selector, value) {
    const element = root.querySelector(selector);
    if (element) element.textContent = value ?? "-";
}
