import { devices } from "../devices/device-list.js";
import { updateWeekdays } from "./schedule-list.js";
import { updateBackendDeviceFragrances } from "../../services/device-fragrance.js";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

let scheduleEvents = [];
let editingEventId = null;
let selectedDeviceId = null;
let selectedScheduleDay = (new Date().getDay() + 6) % 7;
let selectedScheduleView = "week";


function showFragranceFeedback(title, message, type = "success") {
    document.querySelector(".fragrance-feedback")?.remove();

    const icons = {
        success: "✓",
        error: "!",
        loading: "↻"
    };

    const feedback = document.createElement("div");
    feedback.className = `fragrance-feedback ${type}`;

    feedback.innerHTML = `
        <div class="fragrance-feedback-icon">
            ${icons[type] || "!"}
        </div>
        <div class="fragrance-feedback-content">
            <strong></strong>
            <span></span>
        </div>
    `;

    feedback.querySelector("strong").textContent = title;
    feedback.querySelector("span").textContent = message;

    document.body.append(feedback);

    let timeout = null;

    if (type !== "loading") {
        timeout = setTimeout(() => feedback.remove(), 4000);
    }

    return {
        remove() {
            if (timeout) clearTimeout(timeout);
            feedback.remove();
        }
    };
}

function getDevice(deviceId) {
    return devices.find(device => String(device.id) === String(deviceId));
}

function getSelectedDeviceId() {
    return document.querySelector(".device-card.selected")?.dataset.deviceId ?? null;
}

function loadScheduleEvents() {
    scheduleEvents = devices.flatMap(device =>
        (device.fragrances ?? []).flatMap(fragrance =>
            (fragrance.schedule ?? []).map(event => ({
                ...event,
                deviceId: String(device.id),
                deviceName: device.name,
                fragranceMac: fragrance.mac_address,
                fragranceName: fragrance.name
            }))
        )
    );

}


async function saveScheduleEvents(deviceId = selectedDeviceId) {
    const device = getDevice(deviceId);

    if (!device) {
        throw new Error("Geen apparaat geselecteerd");
    }

    if (!Array.isArray(device.fragrances)) {
        throw new Error("De geurgegevens van dit apparaat ontbreken");
    }

    // Maak eerst een kopie, zodat we de bestaande gegevens
    // niet aanpassen voordat de opslag gelukt is.
    const updatedFragrances = device.fragrances.map(fragrance => ({
        ...fragrance,
        schedule: scheduleEvents
            .filter(event =>
                String(event.deviceId) === String(device.id) &&
                String(event.fragranceMac) === String(fragrance.mac_address)
            )
            .map(({ id, time, sprays, days }) => ({
                id,
                time,
                sprays,
                days: [...days]
            }))
    }));

    try {
        const result = await updateBackendDeviceFragrances(
            device.id,
            updatedFragrances
        );

        if (!result || result.success !== true) {
            throw new Error(
                result?.error || "Backend heeft de planning niet opgeslagen"
            );
        }

        // Pas de lokale gegevens pas aan na succesvolle opslag.
        device.fragrances = updatedFragrances;

        console.info("[SCHEDULE] Planning succesvol opgeslagen");

        return true;

    } catch (error) {
        console.error("[SCHEDULE] Opslaan mislukt:", error);
        throw error;
    }
}

function getEventDays(event) {
    return Array.isArray(event.days) ? event.days : ALL_DAYS;
}

export function createScheduleModal() {
    return `
        <div class="schedule-modal-overlay" id="schedule-modal" hidden>
            <section class="schedule-modal">
                <div class="schedule-modal-main">
                    <div class="schedule-modal-header">
                        <div>
                            <p class="eyebrow">AGENDA</p>
                            <h2>Spraybeurt inplannen</h2>
                            <p id="schedule-modal-device">Geselecteerde GeurBot</p>
                        </div>
                        <button type="button" class="modal-close" data-action="close-schedule">×</button>
                    </div>

                    <form id="schedule-event-form">
                        <label for="schedule-fragrance">Geur</label>
                        <select id="schedule-fragrance" required>
                            <option value="">Selecteer een geur</option>
                        </select>

                        <label>Tijdstip</label>
                        <div class="schedule-time-select">
                            <select id="schedule-hours" required>
                                ${Array.from({ length: 24 }, (_, hour) => `
                                    <option value="${String(hour).padStart(2, "0")}">${String(hour).padStart(2, "0")}</option>
                                `).join("")}
                            </select>
                            <span>:</span>
                            <select id="schedule-minutes" required>
                                ${Array.from({ length: 60 }, (_, minute) => `
                                    <option value="${String(minute).padStart(2, "0")}">${String(minute).padStart(2, "0")}</option>
                                `).join("")}
                            </select>
                        </div>

                        <label>Dagen</label>
                        <div class="schedule-day-options">
                            ${WEEKDAYS.map((day, index) => `
                                <label class="schedule-day-option">
                                    <input type="checkbox"
                                           name="schedule-days"
                                           value="${index}">
                                    <span>${day}</span>
                                </label>
                            `).join("")}
                        </div>

                        <button type="button"
                                class="schedule-all-days-button"
                                data-action="toggle-all-schedule-days">
                            Alle dagen selecteren
                        </button>

                        <label for="schedule-sprays">
                            Aantal sprays
                            <output id="schedule-sprays-value">1</output>
                        </label>
                        <input type="range" id="schedule-sprays" min="1" max="20" value="1">

                        <button type="button" class="schedule-more-info" data-action="toggle-schedule-info">
                            <span>Meer informatie</span>
                            <span class="schedule-info-arrow">›</span>
                        </button>

                        <div class="schedule-modal-actions">
                            <button type="button" class="schedule-cancel-button" data-action="close-schedule">Annuleren</button>
                            <button type="button" class="schedule-remove-button" data-action="delete-editing-schedule" hidden>Verwijderen</button>
                            <button type="submit" class="schedule-save-button">Opslaan</button>
                        </div>
                    </form>
                </div>

                <aside class="schedule-info-panel" id="schedule-info-panel">
                    <div class="schedule-info-header">
                        <div>
                            <p class="eyebrow">GEURINFORMATIE</p>
                            <h3>Details</h3>
                        </div>
                        <button type="button" data-action="toggle-schedule-info">×</button>
                    </div>

                 <div class="schedule-info-content" id="schedule-info-content">
                    <div class="schedule-info-placeholder">
                            <span>ⓘ</span>
                            <strong>Selecteer een geur</strong>
                            <p>Selecteer een geur om de voorraadprognose te bekijken.</p>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    `;
}

function populateFragrances(deviceId, selectedMac = "") {
    const select = document.getElementById("schedule-fragrance");
    const device = getDevice(deviceId);

    if (!select) return;

    select.innerHTML = `<option value="">Selecteer een geur</option>`;

    const fragrances = (device?.fragrances ?? []).filter(fragrance =>
        fragrance.mac_address && fragrance.name
    );

    fragrances.forEach(fragrance => {
        const option = new Option(fragrance.name, fragrance.mac_address);

        if (fragrance.enabled === false) {
            option.textContent += " (uitgeschakeld)";
        } else if (fragrance.unreachable || fragrance.available === false) {
            option.textContent += " (niet beschikbaar)";
        }

        select.add(option);
    });

    select.disabled = fragrances.length === 0;

    if (selectedMac) select.value = selectedMac;
}
function generateScheduleEventId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    // Fallback voor browsers zonder randomUUID().
    return "schedule-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).substring(2, 12);
}
function getFragranceColor(name) {
    const normalized = (name || "").trim().toLowerCase();
    let hash = 0;

    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }

    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}

function removeDeletedFragrances() {
    scheduleEvents = scheduleEvents.filter(event => {
        const device = getDevice(event.deviceId);

        if (!device || device.unreachable || !Array.isArray(device.fragrances)) {
            return true;
        }

        return device.fragrances.some(fragrance =>
            fragrance.mac_address === event.fragranceMac
        );
    });
}

function createClusterDetails(container, events, top) {
    container.querySelectorAll(".schedule-cluster-details").forEach(panel => panel.remove());

    const panel = document.createElement("div");
    panel.className = "schedule-cluster-details";
    const day = Number(container.closest(".schedule-day-column")?.dataset.day);

    if (day >= 5) {
        panel.style.left = "auto";
        panel.style.right = "4px";
    }
    panel.style.top = `${Math.max(4, Math.min(top + 46, container.clientHeight - 280))}px`;

    const header = document.createElement("div");
    header.className = "schedule-cluster-details-header";

    const heading = document.createElement("div");
    heading.innerHTML = `<strong>${events.length} spraybeurten</strong>`;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "schedule-cluster-close";
    close.textContent = "×";
    close.addEventListener("click", () => panel.remove());

    header.append(heading, close);
    panel.appendChild(header);

    events.forEach(event => {
        const row = document.createElement("div");
        row.className = "schedule-cluster-item";

        const color = document.createElement("span");
        color.className = "schedule-cluster-color";
        color.style.background = getFragranceColor(event.fragranceName);

        const info = document.createElement("div");
        info.className = "schedule-cluster-info";

        const name = document.createElement("strong");
        name.textContent = event.fragranceName;

        const sprays = document.createElement("span");
        sprays.textContent = `${event.time} · ${event.sprays} sprays`;

        const status = getEventStatus(event);
        const statusLabel = document.createElement("span");

        statusLabel.className = `schedule-event-status ${status.type}`;
        statusLabel.textContent = status.label;

        info.append(name, sprays, statusLabel);
        row.classList.add(status.type);
        const actions = document.createElement("div");
        actions.className = "schedule-cluster-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.dataset.action = "edit-cluster-event";
        edit.dataset.id = event.id;
        edit.textContent = "Aanpassen";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "schedule-cluster-delete";
        remove.dataset.action = "remove-cluster-event";
        remove.dataset.id = event.id;
        remove.textContent = "Verwijderen";

        actions.append(edit, remove);
        row.append(color, info, actions);
        panel.appendChild(row);
    });

    container.appendChild(panel);
}

function renderDayEvents(day) {
    const container = document.querySelector(`.schedule-events[data-day="${day}"]`);
    const grid = container?.closest(".schedule-grid");

    if (!container || !grid) return;

    container.querySelectorAll(".schedule-event-card, .schedule-cluster-details").forEach(element => element.remove());

    const events = scheduleEvents
        .filter(event =>
            String(event.deviceId) === String(selectedDeviceId) &&
            getEventDays(event).includes(day)
        )
        .sort((a, b) => a.time.localeCompare(b.time));

    const cardHeight = 42;
    let displayItems;

    if (selectedScheduleView === "week") {
        const groups = [];

        events.forEach(event => {
            const [hours, minutes] = event.time.split(":").map(Number);
            const top = ((hours * 60 + minutes) / 1440) * grid.clientHeight;

            const lastGroup = groups[groups.length - 1];

            if (lastGroup && top < lastGroup.bottom) {
                lastGroup.events.push(event);
                lastGroup.bottom = Math.max(lastGroup.bottom, top + cardHeight);
            } else {
                groups.push({
                    events: [event],
                    bottom: top + cardHeight
                });
            }
        });

        displayItems = groups.map(group => ({
            time: group.events[0].time,
            events: group.events
        }));
    } else {
        displayItems = events.map(event => ({
            time: event.time,
            events: [event]
        }));
    }
    const positioned = [];

    displayItems.forEach(item => {
        const [hours, minutes] = item.time.split(":").map(Number);
        const top = ((hours * 60 + minutes) / 1440) * grid.clientHeight;

        let lane = 0;

        while (positioned.some(other =>
            other.lane === lane &&
            top < other.bottom &&
            top + cardHeight > other.top
        )) {
            lane++;
        }

        positioned.push({
            top,
            bottom: top + cardHeight,
            lane,
            ...item
        });
    });

    const groups = [];

    positioned.forEach(item => {
        let group = groups.find(group =>
            group.some(other => item.top < other.bottom && item.bottom > other.top)
        );

        if (!group) {
            group = [];
            groups.push(group);
        }

        group.push(item);
    });

    positioned.forEach(item => {
        const group = groups.find(group => group.includes(item));
        const laneCount = Math.max(...group.map(other => other.lane)) + 1;
        const width = 100 / laneCount;
        const isCluster = item.events.length > 1;

const card = document.createElement("div");
card.className = `schedule-event-card${isCluster ? " schedule-cluster-card" : ""}`;

card.style.left = `calc(${item.lane * width}% + 3px)`;
card.style.width = `calc(${width}% - 6px)`;

if (!isCluster) {
    card.dataset.id = item.events[0].id;
    card.style.top = `${item.top}px`;
} else {
    const sortedEvents = [...item.events].sort((a, b) =>
        a.time.localeCompare(b.time)
    );

    const firstTime = sortedEvents[0].time;
    const lastTime = sortedEvents[sortedEvents.length - 1].time;

    const [firstHours, firstMinutes] = firstTime.split(":").map(Number);
    const [lastHours, lastMinutes] = lastTime.split(":").map(Number);

    const firstPosition = ((firstHours * 60 + firstMinutes) / 1440) * grid.clientHeight;
    const lastPosition = ((lastHours * 60 + lastMinutes) / 1440) * grid.clientHeight;

    card.style.top = `${firstPosition}px`;
    card.style.height = `${Math.max(cardHeight, lastPosition - firstPosition + cardHeight + (15 / 1440) * grid.clientHeight)}px`;

    card.dataset.action = "open-schedule-cluster";
}

    const title = document.createElement("strong");
    const details = document.createElement("span");

    if (isCluster) {
        const sortedEvents = [...item.events].sort((a, b) =>
            a.time.localeCompare(b.time)
        );

        const firstTime = sortedEvents[0].time;
        const lastTime = sortedEvents[sortedEvents.length - 1].time;

        title.textContent = firstTime === lastTime
            ? firstTime
            : `${firstTime} – ${lastTime}`;

        details.textContent = `${item.events.length} spraybeurten`;

        const indicators = document.createElement("div");
        indicators.className = "schedule-cluster-indicators";

        item.events.forEach(event => {
            const dot = document.createElement("span");
            dot.style.background = getFragranceColor(event.fragranceName);
            indicators.appendChild(dot);
        });

        card.append(title, details, indicators);
    }else {
            const event = item.events[0];
            const device = getDevice(event.deviceId);
            const fragrance = device?.fragrances?.find(item =>
                item.mac_address === event.fragranceMac
            );

            const unavailable = !device || device.unreachable ||
                !fragrance || fragrance.available === false || fragrance.unreachable;

            const disabled = fragrance?.enabled === false;

            card.style.setProperty("--event-color", getFragranceColor(event.fragranceName));
            card.classList.toggle("unavailable", Boolean(unavailable));
            card.classList.toggle("disabled", Boolean(disabled));

            title.textContent = event.fragranceName;
            details.textContent = `${event.time} · ${event.sprays} sprays`;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.dataset.action = "remove-schedule";
            remove.dataset.id = event.id;
            remove.setAttribute("aria-label", "Planning verwijderen");
            remove.textContent = "×";

            card.append(title, details, remove);
        }

        container.appendChild(card);

        if (isCluster) {
            card.addEventListener("click", () => {
                const existing = container.querySelector(".schedule-cluster-details");

                if (existing?.dataset.time === item.time) {
                    existing.remove();
                    return;
                }

                createClusterDetails(container, item.events, item.top);
                container.querySelector(".schedule-cluster-details").dataset.time = item.time;
            });
        }
    });
}

function renderScheduleEvents() {
    removeDeletedFragrances();

    document.querySelectorAll(".schedule-events").forEach(container => {
        container.querySelectorAll(".schedule-event-card, .schedule-cluster-details").forEach(element => element.remove());
    });

    const days = selectedScheduleView === "week"
        ? ALL_DAYS
        : [selectedScheduleDay];

    days.forEach(renderDayEvents);
}

function updateScheduleView() {
    const content = document.getElementById("schedule-content");
    if (!content) return;

    content.hidden = !selectedDeviceId;
    const schedulePanel = document.querySelector(".extra-panel");
    if (schedulePanel) schedulePanel.hidden = !selectedDeviceId;
    if (!selectedDeviceId) return;

    content.classList.toggle("week-view", selectedScheduleView === "week");
    content.classList.toggle("day-view", selectedScheduleView === "day");

    updateWeekdays();
    content.dataset.selectedDay = selectedScheduleDay;

    document.querySelectorAll(".schedule-view-button").forEach(button => {
        button.classList.toggle("active", button.dataset.view === selectedScheduleView);
    });

    document.querySelectorAll(".schedule-weekday").forEach(button => {
        button.classList.toggle("active", Number(button.dataset.day) === selectedScheduleDay);
    });

    document.querySelectorAll(".schedule-day-column").forEach(column => {
        column.classList.toggle("selected-day", Number(column.dataset.day) === selectedScheduleDay);
    });

    const title = document.getElementById("schedule-day-title");
    if (title) {
        title.textContent = selectedScheduleView === "week"
            ? "Weekplanning"
            : `${WEEKDAYS[selectedScheduleDay]}planning`;
    }

    renderScheduleEvents();
}

function selectScheduleDay(day) {
    selectedScheduleDay = Number(day);
    selectedScheduleView = "day";
    updateScheduleView();
}

function setScheduleView(view) {
    if (view !== "day" && view !== "week") return;

    selectedScheduleView = view;
    updateScheduleView();
}

function updateSelectedDevice(device) {
    selectedDeviceId = device ? String(device.id) : null;

    const label = document.getElementById("schedule-device-label");
    if (label) label.textContent = device?.name ?? "Geen apparaat geselecteerd";

    const modal = document.getElementById("schedule-modal");

    if (modal && !modal.hidden) {
        modal.hidden = true;
        editingEventId = null;
    }

    renderScheduleEvents();
}

function openScheduleModal(eventToEdit = null) {
    const modal = document.getElementById("schedule-modal");
    const form = document.getElementById("schedule-event-form");
    const device = getDevice(selectedDeviceId);

    if (!modal || !form || !device) {
        console.warn("Selecteer eerst een GeurBot.");
        return;
    }

    editingEventId = eventToEdit?.id ?? null;

    populateFragrances(selectedDeviceId, eventToEdit?.fragranceMac ?? "");

    const [hours, minutes] = (eventToEdit?.time ?? "12:00").split(":");

    document.getElementById("schedule-hours").value = hours;
    document.getElementById("schedule-minutes").value = minutes;

    const sprays = document.getElementById("schedule-sprays");
    sprays.value = eventToEdit?.sprays ?? 1;
    document.getElementById("schedule-sprays-value").textContent = sprays.value;

    const selectedDays = getEventDays(eventToEdit ?? {});

    document.querySelectorAll('[name="schedule-days"]').forEach(checkbox => {
        checkbox.checked = selectedDays.includes(Number(checkbox.value));
    });

    document.getElementById("schedule-modal-device").textContent = device.name;

    modal.querySelector("h2").textContent = eventToEdit
        ? "Spraybeurt aanpassen"
        : "Spraybeurt inplannen";

    modal.querySelector(".schedule-save-button").textContent = "Opslaan";
    modal.querySelector('[data-action="delete-editing-schedule"]').hidden = !eventToEdit;

    document.getElementById("schedule-info-panel").classList.remove("open");

    modal.hidden = false;

    updateScheduleInfo();
}

function closeScheduleModal() {
    const modal = document.getElementById("schedule-modal");
    if (modal) modal.hidden = true;

    editingEventId = null;
}

async function deleteScheduleEvent(eventId = editingEventId) {
    if (!eventId) return;

    const previousEvents = [...scheduleEvents];

    const loadingFeedback = showFragranceFeedback(
        "Planning verwijderen",
        "De spraybeurt wordt verwijderd...",
        "loading"
    );

    scheduleEvents = scheduleEvents.filter(item => item.id !== eventId);

    try {
        await saveScheduleEvents();

        loadingFeedback.remove();

        showFragranceFeedback(
            "Planning verwijderd",
            "De spraybeurt is succesvol verwijderd.",
            "success"
        );

        closeScheduleModal();
        renderScheduleEvents();

    } catch (error) {
        scheduleEvents = previousEvents;

        loadingFeedback.remove();

        showFragranceFeedback(
            "Verwijderen mislukt",
            error.message || "De spraybeurt kon niet worden verwijderd.",
            "error"
        );

        renderScheduleEvents();
    }
}

function toggleAllScheduleDays() {
    const checkboxes = [...document.querySelectorAll('[name="schedule-days"]')];
    const allChecked = checkboxes.every(checkbox => checkbox.checked);

    checkboxes.forEach(checkbox => checkbox.checked = !allChecked);

    updateScheduleInfo();
}
export function initializeScheduleEvents() {
    const modal = document.getElementById("schedule-modal");
    const form = document.getElementById("schedule-event-form");
    const app = document.querySelector("#app");

    if (!modal || !form || modal.dataset.initialized) return;

    modal.dataset.initialized = "true";
    loadScheduleEvents();
    selectedDeviceId = getSelectedDeviceId();

    if (selectedDeviceId) {
        updateSelectedDevice(getDevice(selectedDeviceId));
    }

    app?.addEventListener("device-selected", event => {
        updateSelectedDevice(event.detail);
    });

document.addEventListener("geurbot:fragrance-updated", event => {
    const { deviceId } = event.detail;

    // Alleen de agenda van het geselecteerde apparaat bijwerken.
    if (String(deviceId) !== String(selectedDeviceId))
        return;

    renderScheduleEvents();

    // Als de planningsmodal openstaat, ook de geurlijst verversen.
    const modal = document.getElementById("schedule-modal");

    if (modal && !modal.hidden) {
        const selectedMac = document.getElementById("schedule-fragrance")?.value;

        populateFragrances(selectedDeviceId, selectedMac);
        updateScheduleInfo();
    }

});

    document.addEventListener("click", event => {
        const addButton = event.target.closest('[data-action="add-schedule-event"]');
        const closeButton = event.target.closest('[data-action="close-schedule"]');
        const removeButton = event.target.closest('[data-action="remove-schedule"]');
        const deleteButton = event.target.closest('[data-action="delete-editing-schedule"]');
        const infoButton = event.target.closest('[data-action="toggle-schedule-info"]');
        const dayButton = event.target.closest('[data-action="select-schedule-day"]');
        const viewButton = event.target.closest('[data-action="set-schedule-view"]');
        const allDaysButton = event.target.closest('[data-action="toggle-all-schedule-days"]');
        const clusterEditButton = event.target.closest('[data-action="edit-cluster-event"]');
        const clusterRemoveButton = event.target.closest('[data-action="remove-cluster-event"]');
        const clusterCard = event.target.closest('[data-action="open-schedule-cluster"]');
        const eventCard = event.target.closest(".schedule-event-card");
        
        if (addButton) openScheduleModal();

        if (closeButton || event.target === modal) closeScheduleModal();

        if (infoButton) {
            document.getElementById("schedule-info-panel")?.classList.toggle("open");
        }

        if (dayButton) selectScheduleDay(dayButton.dataset.day);

        if (viewButton) setScheduleView(viewButton.dataset.view);

        if (allDaysButton) toggleAllScheduleDays();

        if (deleteButton) deleteScheduleEvent();

        if (clusterEditButton) {
            const item = scheduleEvents.find(item => item.id === clusterEditButton.dataset.id);
            if (item) openScheduleModal(item);
        }

        if (removeButton || clusterRemoveButton) {
            event.stopPropagation();
            deleteScheduleEvent((removeButton ?? clusterRemoveButton).dataset.id);
            return;
        }

        if (eventCard && !clusterCard && !event.target.closest(".schedule-cluster-details")) {
            const item = scheduleEvents.find(item => item.id === eventCard.dataset.id);
            if (item) openScheduleModal(item);
        }
    });

    document.addEventListener("click", event => {
    const openStack = document.querySelector(".schedule-cluster-details");

    if (!openStack) return;

    // Klik binnen de stack? Dan blijft hij open.
    if (openStack.contains(event.target)) return;

    // Klik op een stackkaart? Dan mag de bestaande handler
    // bepalen of de stack geopend of gesloten wordt.
    if (event.target.closest(".schedule-cluster-card")) return;

    // Alle andere klikken sluiten de stack.
    openStack.remove();
});

    const spraysInput = document.getElementById("schedule-sprays");
    const fragranceSelect = document.getElementById("schedule-fragrance");

    spraysInput.addEventListener("input", event => {
        document.getElementById("schedule-sprays-value").textContent = event.target.value;
        updateScheduleInfo();
    });

    fragranceSelect.addEventListener("change", updateScheduleInfo);

    document.querySelectorAll('[name="schedule-days"]').forEach(checkbox => {
        checkbox.addEventListener("change", updateScheduleInfo);
    });

form.addEventListener("submit", async event => {
    event.preventDefault();

    const device = getDevice(selectedDeviceId);
    const fragranceMac = document.getElementById("schedule-fragrance").value;
    const time = `${document.getElementById("schedule-hours").value}:${document.getElementById("schedule-minutes").value}`;
    const sprays = Number(document.getElementById("schedule-sprays").value);

    const days = [...document.querySelectorAll('[name="schedule-days"]:checked')]
        .map(checkbox => Number(checkbox.value));

    const fragrance = device?.fragrances?.find(item =>
        item.mac_address === fragranceMac
    );

    if (!device || !fragrance || !time || sprays < 1 || days.length === 0) {
        showFragranceFeedback(
            "Controleer de planning",
            "Selecteer een geur en minimaal één dag.",
            "error"
        );
        return;
    }

    const previousEvents = [...scheduleEvents];
    const isEditing = Boolean(editingEventId);

    const eventData = {
        id: editingEventId ?? generateScheduleEventId(),
        deviceId: String(device.id),
        deviceName: device.name,
        fragranceMac,
        fragranceName: fragrance.name,
        time,
        sprays,
        days
    };

    if (isEditing) {
        scheduleEvents = scheduleEvents.map(item =>
            item.id === editingEventId ? eventData : item
        );
    } else {
        scheduleEvents.push(eventData);
    }

    const loadingFeedback = showFragranceFeedback(
        isEditing ? "Planning aanpassen" : "Planning opslaan",
        "De spraybeurt wordt opgeslagen...",
        "loading"
    );

    const saveButton = form.querySelector(".schedule-save-button");
    if (saveButton) saveButton.disabled = true;

    try {
        await saveScheduleEvents(device.id);

        loadingFeedback.remove();

        showFragranceFeedback(
            isEditing ? "Planning aangepast" : "Planning opgeslagen",
            isEditing
                ? "De spraybeurt is succesvol aangepast."
                : "De spraybeurt is succesvol ingepland.",
            "success"
        );

        closeScheduleModal();
        renderScheduleEvents();

    } catch (error) {
        scheduleEvents = previousEvents;

        loadingFeedback.remove();

        showFragranceFeedback(
            "Opslaan mislukt",
            error.message || "De planning kon niet worden opgeslagen.",
            "error"
        );

        renderScheduleEvents();

    } finally {
        if (saveButton) saveButton.disabled = false;
    }
});

    document.addEventListener("geurbot:fragrance-renamed", event => {
        const { deviceId, fragranceMac, name } = event.detail;

        // Alleen gebeurtenissen van het betreffende apparaat aanpassen.
        scheduleEvents.forEach(scheduleEvent => {
            if (
                String(scheduleEvent.deviceId) === String(deviceId) &&
                scheduleEvent.fragranceMac === fragranceMac
            ) {
                scheduleEvent.fragranceName = name;
            }
        });

        // Agenda opnieuw tekenen.
        renderScheduleEvents();

        // Eventuele geopende details van een cluster bijwerken.
        const modal = document.getElementById("schedule-modal");

        if (modal && !modal.hidden) {
            updateScheduleInfo();
        }
    });

    updateScheduleView();

    window.addEventListener("resize", renderScheduleEvents);
}

function getEventStatus(event) {
    const device = getDevice(event.deviceId);
    const fragrance = device?.fragrances?.find(item =>
        item.mac_address === event.fragranceMac
    );

    if (!device || device.unreachable || !fragrance ||
        fragrance.available === false || fragrance.unreachable) {
        return {
            type: "unavailable",
            label: "Niet beschikbaar"
        };
    }

    if (fragrance.enabled === false) {
        return {
            type: "disabled",
            label: "Uitgeschakeld"
        };
    }

    return {
        type: "available",
        label: "Beschikbaar"
    };
}

function getScheduledSpraysPerWeek(fragranceMac) {
    const device = devices.find(device =>
        device.fragrances?.some(fragrance =>
            fragrance.mac_address === fragranceMac
        )
    );

    if (!device) return 0;

    const fragrance = device.fragrances.find(item =>
        item.mac_address === fragranceMac
    );

    return (fragrance.schedule ?? []).reduce((total, event) => {
        const days = Array.isArray(event.days) ? event.days.length : 7;
        const sprays = Number(event.sprays) || 0;

        return total + sprays * days;
    }, 0);
}

function updateScheduleInfo() {
    const content = document.getElementById("schedule-info-content");
    const fragranceMac = document.getElementById("schedule-fragrance")?.value;
    const device = getDevice(selectedDeviceId);

    if (!content) return;

    const fragrance = device?.fragrances?.find(item =>
        item.mac_address === fragranceMac
    );

    if (!fragrance) {
        content.innerHTML = `
            <div class="schedule-info-placeholder">
                <span>ⓘ</span>
                <strong>Selecteer een geur</strong>
                <p>Selecteer een geur om de voorraadprognose te bekijken.</p>
            </div>
        `;
        return;
    }

    const totalSprays = Number(fragrance.estimated_sprays) || 0;
    const usedSprays = Number(fragrance.total_sprays) || 0;
    const remainingSprays = Math.max(0, totalSprays - usedSprays);

    const selectedDays = [
        ...document.querySelectorAll('[name="schedule-days"]:checked')
    ].map(checkbox => Number(checkbox.value));

    const currentSprays = Number(
        document.getElementById("schedule-sprays")?.value
    ) || 0;

    // Bestaande afspraken plus de huidige afspraak in het formulier.
    const weeklySprays =
        getScheduledSpraysPerWeek(fragranceMac) +
        currentSprays * selectedDays.length;

    const dailySprays = weeklySprays / 7;
    const remainingWeeken = dailySprays > 0
        ? remainingSprays / dailySprays
        : null;

    const emptyDate = remainingWeeken !== null
        ? new Date(Date.now() + remainingWeeken * 86400000)
        : null;

    const formattedDate = emptyDate
        ? emptyDate.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
        : null;

    const unavailable = fragrance.available === false ||
        fragrance.unreachable ||
        device?.unreachable;

    const disabled = fragrance.enabled === false;

    content.innerHTML = `
        <div class="schedule-info-stock">
            <span>Geschatte restvoorraad</span>
            <strong>${remainingSprays.toLocaleString("nl-NL")} <small>sprays</small></strong>

            <div class="schedule-info-progress">
                <div style="width: ${totalSprays > 0
                    ? Math.min(100, remainingSprays / totalSprays * 100)
                    : 0}%"></div>
            </div>

            <div class="schedule-info-stock-details">
                <span>${usedSprays} gebruikt</span>
                <span>${totalSprays} totaal</span>
            </div>
        </div>

        <div class="schedule-info-divider"></div>

        <div class="schedule-info-stat">
            <span>Gepland verbruik per week</span>
            <strong>${weeklySprays.toLocaleString("nl-NL")} sprays</strong>
        </div>

        <div class="schedule-info-stat">
            <span>Gemiddeld verbruik per dag</span>
            <strong>${dailySprays.toFixed(1).replace(".", ",")} sprays</strong>
        </div>

        <div class="schedule-info-divider"></div>

        <div class="schedule-info-forecast">
            <span>Verwachte resterende tijd</span>
            <strong>${remainingWeeken !== null
                ? `${Math.ceil(remainingWeeken/ 7)} weeken`
                : "Geen verbruik gepland"}</strong>

            <span>Verwachte leegdatum</span>
            <strong>${formattedDate ?? "Niet te bepalen"}</strong>
        </div>

        ${unavailable || disabled ? `
            <div class="schedule-info-warning">
                ${disabled
                    ? "Deze geur is momenteel uitgeschakeld."
                    : "Deze geur is momenteel niet beschikbaar."}
            </div>
        ` : ""}
    `;
}