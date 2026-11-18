export function createDeviceCard(device) {
    return `
        <article class="device-card" data-device-id="${escapeHtml(device.id)}" role="button" tabindex="0">
            <div class="device-card-left">
                <h3>${escapeHtml(device.name)}</h3>
                <span class="device-ip">${escapeHtml(device.connection?.host ?? "Geen IP-adres")}</span>
            </div>
            <div class="device-card-right">
                <span class="device-status loading">Controleren...</span>
                <svg class="device-fragrance loading" viewBox="0 0 24 24" aria-label="Geurstatus" fill="currentColor">
                    <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/>
                </svg>
                <span class="device-update" hidden></span>
            </div>
        </article>
    `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}
