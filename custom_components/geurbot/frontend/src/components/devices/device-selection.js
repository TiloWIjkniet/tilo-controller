export function setupDeviceSelection(app) {
    app.addEventListener("click", event => {
        const card = event.target.closest(".device-card");
        if (!card) return;
        selectCard(app, card);
    });

    app.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const card = event.target.closest(".device-card");
        if (!card) return;
        event.preventDefault();
        selectCard(app, card);
    });

    const search = app.querySelector("#device-search");
    search?.addEventListener("input", () => {
        const query = search.value.toLowerCase().trim();
        app.querySelectorAll(".device-card").forEach(card => {
            const name = card.querySelector("h3")?.textContent.toLowerCase() ?? "";
            card.hidden = !name.includes(query);
        });
    });
}

function selectCard(app, card) {
    app.querySelectorAll(".device-card").forEach(item => item.classList.remove("selected"));
    card.classList.add("selected");
    console.log("Geselecteerde GeurBot:", card.dataset.deviceId);
}
