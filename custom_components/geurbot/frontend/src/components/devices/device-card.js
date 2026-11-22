
export function createDeviceCard(device) {
    console.log("[DEVICE CARD] Apparaatgegevens:", JSON.stringify(device, null, 2));

   const fragrances = device.fragrances ?? [];

    const hasMissingFragrance = fragrances.some(
        fragrance => !fragrance.available && fragrance.enabled && fragrance.unreachable
    );

    const hasEmptyFragrance = fragrances.some(
        fragrance => !fragrance.available && fragrance.enabled && !fragrance.unreachable
    );

    const fragranceStatus = hasMissingFragrance
        ? "error"
        : hasEmptyFragrance
            ? "empty"
            : "available";
    return `
        <article class="device-card" data-device-id="${escapeHtml(device.id)}" role="button" tabindex="0">
            <div class="device-card-left">
                <h3>${escapeHtml(device.name)}</h3>
                <span class="device-ip">${escapeHtml(device.hostname ?? "Geen hostname")}</span>
            </div>

            <div class="device-card-right">
                <span class="device-status loading">Controleren...</span>
                <span class="device-fragrance-status ${fragranceStatus}">
                    ${{
                        available: "Geuren OK",
                        empty: "Geur op",
                        error: "Geur verdwenen"
                    }[fragranceStatus]}
                </span>
              
            </div>

            <div class="device-update" hidden>
                <div class="device-update-info">
                    <span class="device-update-label"></span>
                    <span class="device-update-percentage"></span>
                </div>

                <div class="device-update-progress" hidden>
                    <div class="device-update-progress-bar"></div>
                </div>
            </div>
        </article>
    `;
}
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}


export function updateDeviceFragranceStatus(app, device) {
    const card = [...app.querySelectorAll(".device-card")]
        .find(card => card.dataset.deviceId === String(device.id));

    if (!card) return;

    const fragrances = device.fragrances ?? [];

    const hasMissingFragrance = fragrances.some(
        fragrance => fragrance.unreachable
    );

    const hasEmptyFragrance = fragrances.some(
        fragrance => fragrance.enabled && !fragrance.available && !fragrance.unreachable
    );

    const status = hasMissingFragrance
        ? "error"
        : hasEmptyFragrance
            ? "empty"
            : "available";

    const badge = card.querySelector(".device-fragrance-status");
    if (!badge) return;

    badge.className = `device-fragrance-status ${status}`;
    badge.textContent = {
        available: "Geuren OK",
        empty: "Geur op",
        error: "Geur verdwenen"
    }[status];
}