
export function createFragranceCard(fragrance) {
    return `
        <div class="fragrance-card" data-fragrance-id="${fragrance.id}">
            <div class="fragrance-info">
                <h3>${fragrance.name}</h3>
                <p>${fragrance.description ?? ""}</p>
            </div>
        </div>
    `;
}
