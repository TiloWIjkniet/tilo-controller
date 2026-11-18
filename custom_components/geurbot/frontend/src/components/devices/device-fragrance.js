export function updateDeviceFragrance(card, status, connected) {
    const icon = card.querySelector(".device-fragrance");
    if (!icon) return;

    icon.setAttribute("class", "device-fragrance");
    if (!connected || !status) icon.classList.add("loading");
    else if (!status.working || !status.has_fragrance) icon.classList.add("error");
    else if (status.low_fragrance) icon.classList.add("warning");
    else icon.classList.add("good");
}
