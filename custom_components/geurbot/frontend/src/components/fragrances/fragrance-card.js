import {
    deleteBackendDeviceFragrance
} from "../../services/device-fragrance.js";

function getScheduledSpraysPerWeek(fragranceMac) {
    let scheduleEvents = [];

    try {
        scheduleEvents = JSON.parse(
            localStorage.getItem("geurbot-schedule-events") || "[]"
        );
    } catch {
        return 0;
    }

    return scheduleEvents
        .filter(event => event.fragranceMac === fragranceMac)
        .reduce((total, event) => {
            const days = Array.isArray(event.days) ? event.days.length : 7;
            const sprays = Number(event.sprays) || 0;

            return total + sprays * days;
        }, 0);
}


export function createFragranceCard(fragrance, expanded = false) {
    const mac = escapeHtml(fragrance.mac_address);
    const name = escapeHtml(fragrance.name);

    if (fragrance.unreachable) {
        return `
            <article class="fragrance-card unreachable ${expanded ? "expanded" : "collapsed"}"
                     data-fragrance-id="${mac}">

                <div class="fragrance-card-header"
                     data-action="toggle-details"
                     data-fragrance-id="${mac}">
                    <div class="fragrance-card-left">
                        <h3>⚠️ ${name}</h3>
                        <span class="fragrance-mac">Niet meer bereikbaar</span>
                    </div>
                </div>

                ${expanded ? `
                    <div class="fragrance-card-expanded">
                        <div class="fragrance-unreachable-content">
                            <p>Deze geur is niet meer bereikbaar.</p>

                            <button class="remove-fragrance-button"
                                    data-action="remove"
                                    data-fragrance-id="${mac}"
                                    type="button">
                                Verwijderen
                            </button>
                        </div>
                    </div>
                ` : ""}
            </article>
        `;
    }

    const available = fragrance.available === true;
    const enabled = fragrance.enabled === true;

    const spraysUsed = Number(fragrance.total_sprays) || 0;
    const estimatedTotal = Number(fragrance.estimated_sprays);
    const resetTimestamp = Number(fragrance.counter_reset_timestamp);

    const hasEstimate = Number.isFinite(estimatedTotal) && estimatedTotal > 0;
    const hasTimestamp = Number.isFinite(resetTimestamp) && resetTimestamp > 0;

    const remaining = hasEstimate
        ? Math.max(estimatedTotal - spraysUsed, 0)
        : null;

    const exceeded = hasEstimate && spraysUsed > estimatedTotal;

    const progress = hasEstimate
        ? 100 - (spraysUsed / estimatedTotal) * 100
        : 0;

    const usedPercentage = hasEstimate
        ? Math.max((spraysUsed / estimatedTotal) * 100 - 100, 0)
        : 0;

    const redProgress = Math.min(usedPercentage, 400);
    const darkRedProgress = Math.max(usedPercentage - 400, 0);
    let emptyDate = null;

    if (hasEstimate) {
        if (remaining === 0) {
            emptyDate = new Date();
        } else {
            const weeklySprays = getScheduledSpraysPerWeek(fragrance.mac_address);

            if (weeklySprays > 0) {
                const daysRemaining = Math.ceil((remaining / weeklySprays) * 7);

                emptyDate = new Date();
                emptyDate.setDate(emptyDate.getDate() + daysRemaining);
            }
        }
    }
    return `
        <article class="fragrance-card ${available ? "" : "unavailable"} ${expanded ? "expanded" : "collapsed"}"
                 data-fragrance-id="${mac}">

            <div class="fragrance-card-header"
                 data-action="toggle-details"
                 data-fragrance-id="${mac}">

                <div class="fragrance-card-left">
                    <h3>${name}</h3>
                    <span class="fragrance-mac">${mac}</span>
                </div>

                <div class="fragrance-card-header-actions">
                    ${!expanded ? `
                        <button class="fragrance-spray-button compact-spray-button"
                                type="button"
                                data-action="spray"
                                data-fragrance-id="${mac}"
                                ${available && enabled ? "" : "disabled"}>
                            💨 Handmatig sprayen
                        </button>
                    ` : ""}

                    <button class="fragrance-toggle ${enabled && available ? "enabled" : ""}"
                            type="button"
                            role="switch"
                            aria-checked="${enabled && available}"
                            ${available ? "" : "disabled"}
                            data-action="toggle"
                            data-fragrance-id="${mac}"
                            aria-label="Geur ${name} in- of uitschakelen">
                        <span class="fragrance-toggle-knob"></span>
                    </button>
                </div>
            </div>

            ${!expanded && !available ? `
                <div class="fragrance-unavailable-message">
                    De geur is op. Vervang de geur om verder te gaan.
                </div>
            ` : !expanded && !enabled ? `
                <div class="fragrance-unavailable-message">
                    Deze geur is uitgeschakeld.
                </div>
            ` : ""}

            ${expanded ? `
                <div class="fragrance-card-expanded">

                    <div class="fragrance-progress-section">
                        <div class="fragrance-progress">
                            ${!exceeded ? `
                                <div class="fragrance-progress-bar"
                                     style="width: ${Math.max(progress, 0)}%">
                                </div>
                            ` : `
                                <div class="fragrance-progress-bar exceeded"
                                     style="width: ${Math.min(redProgress / 4, 100)}%">
                                </div>

                                ${darkRedProgress > 0 ? `
                                    <div class="fragrance-progress-bar exceeded-dark"
                                         style="width: ${Math.min(darkRedProgress / 16, 100)}%">
                                    </div>
                                ` : ""}
                            `}
                        </div>

                        <div class="fragrance-progress-label">
                            <span>${escapeHtml(spraysUsed)} / ${hasEstimate ? escapeHtml(estimatedTotal) : "?"} sprays</span>

                            <strong class="${exceeded ? "exceeded" : ""}">
                                ${hasEstimate ? `${Math.round(progress)}%` : "Onbekend"}
                            </strong>
                        </div>
                    </div>

                    <div class="fragrance-card-details">
                        <div class="fragrance-stat">
                            <span>Verwacht leeg op</span>
                            <strong>${emptyDate
                            ? emptyDate.toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })
                            : "Nog onbekend"}</strong>
                        </div>

                        <div class="fragrance-stat">
                            <span>Aantal sprays sinds reset</span>
                            <strong>${escapeHtml(spraysUsed)}</strong>
                        </div>

                        <div class="fragrance-stat">
                            <span>Geschat resterend</span>
                            <strong>${remaining !== null
                                ? `${escapeHtml(remaining)} sprays`
                                : "Nog onbekend"}</strong>
                        </div>
                    </div>

                    ${!available ? `
                        <div class="fragrance-unavailable-message has-tooltip"
                             data-tooltip="De geur is op. Vervang de geur om verder te gaan."
                             tabindex="0">
                            De geur is op. Vervang de geur om verder te gaan.
                        </div>
                    ` : !enabled ? `
                        <div class="fragrance-unavailable-message has-tooltip"
                             data-tooltip="Deze geur is uitgeschakeld. Schakel hem in om weer te gebruiken."
                             tabindex="0">
                            Deze geur is uitgeschakeld
                        </div>
                    ` : `
                        <div class="fragrance-card-actions">
                            <button class="fragrance-spray-button"
                                    type="button"
                                    data-action="spray"
                                    data-fragrance-id="${mac}">
                                💨 Handmatig sprayen
                            </button>

                            <button class="fragrance-reset-button"
                                    type="button"
                                    data-action="reset-counter"
                                    data-fragrance-id="${mac}">
                                ↻ Reset teller
                            </button>
                        </div>
                    `}
                </div>
            ` : ""}
        </article>
    `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


app.addEventListener("click", async event => {
    const button = event.target.closest(".remove-fragrance-button");

    if (!button)
        return;

    const macAddress = button.dataset.fragranceId;
    const device = getDevice(selectedDevice?.id);

    if (!device || !macAddress)
        return;

    button.disabled = true;

    try {
        await deleteBackendDeviceFragrance(device.id, macAddress);

        device.fragrances = device.fragrances.filter(
            fragrance => fragrance.mac_address !== macAddress
        );

        selectedDevice.fragrances = device.fragrances;


        renderFragrances(app);

    } catch (error) {
        console.error("[FRAGRANCES] Verwijderen mislukt:", error);
        button.disabled = false;
    }
});