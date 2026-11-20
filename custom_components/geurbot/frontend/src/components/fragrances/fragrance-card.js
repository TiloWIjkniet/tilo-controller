export function createFragranceCard(fragrance) {
    return `
        <div class="fragrance-card" data-fragrance-id="${fragrance.id}">
            <div class="fragrance-info">
                <h3>${fragrance.name}</h3>
                <p>${fragrance.description ?? ""}</p>
            </div>

            <div class="fragrance-status">
            <span class="fragrance-connection ${fragrance.reachable ? "connected" : "disconnected"}">
                ${fragrance.reachable ? "Bereikbaar" : "Niet bereikbaar"}
            </span>

                <svg class="device-fragrance ${fragrance.good ? "good" : "bad"}"
                     viewBox="0 0 24 24"
                     aria-label="${fragrance.good ? "Voldoende geur" : "Geur op"}"
                     title="${fragrance.good ? "Voldoende geur" : "Geur op"}"
                     fill="currentColor">
                    <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/>
                </svg>
            </div>
        </div>
    `;
}