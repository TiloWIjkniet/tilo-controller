
const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export function createScheduleHeader() {
    return `
        <header class="panel-header schedule-header">
            <div class="panel-header-title">
                <h2>Agenda</h2>
                <p id="schedule-device-label">Geen apparaat geselecteerd</p>
            </div>

            <button class="schedule-add-button"
                    type="button"
                    data-action="add-schedule-event">
                + Inplannen
            </button>
        </header>
    `;
}

export function createScheduleContent() {
    const today = (new Date().getDay() + 6) % 7;

    return `
        <div class="schedule-content week-view" id="schedule-content"
             data-selected-day="${today}">

            <div class="schedule-view-toolbar">
                <div class="schedule-view-toggle">
                    <button type="button"
                            class="schedule-view-button"
                            data-action="set-schedule-view"
                            data-view="day">
                        Dag
                    </button>

                    <button type="button"
                            class="schedule-view-button active"
                            data-action="set-schedule-view"
                            data-view="week">
                        Hele week
                    </button>
                </div>

                <div class="schedule-day-tabs" hidden>
                    ${WEEKDAYS.map((day, index) => `
                        <button type="button"
                                class="schedule-weekday ${index === today ? "active" : ""}"
                                data-action="select-schedule-day"
                                data-day="${index}">
                            ${day}
                        </button>
                    `).join("")}
                </div>
            </div>

            <div class="schedule-toolbar">
                <h3 id="schedule-day-title">Weekplanning</h3>
            </div>

            <div class="schedule-weekdays" id="schedule-weekdays" hidden>
                <div class="schedule-weekdays-spacer"></div>

                ${WEEKDAYS.map((day, index) => `
                    <div class="schedule-weekday ${index === today ? "active" : ""}">
                        ${day}
                    </div>
                `).join("")}
            </div>

            <div class="schedule-timeline">
                <div class="schedule-timeline-inner">

                    <div class="schedule-hours">
                        ${Array.from({ length: 25 }, (_, hour) => `
                            <div class="schedule-hour">
                                ${String(hour).padStart(2, "0")}:00
                            </div>
                        `).join("")}
                    </div>

                    <div class="schedule-week-grid">
                        ${WEEKDAYS.map((day, index) => `
                            <div class="schedule-day-column ${index === today ? "selected-day" : ""}"
                                 data-day="${index}">

                                <div class="schedule-grid">
                                    ${Array.from({ length: 24 }, (_, hour) => `
                                        <div class="schedule-hour-row" data-hour="${hour}"></div>
                                    `).join("")}

                                    <div class="schedule-events" data-day="${index}">
                                        <div class="schedule-current-time">
                                            <span class="schedule-current-time-label"></span>
                                            <span class="schedule-current-time-line"></span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        `).join("")}
                    </div>

                </div>
            </div>
        </div>
    `;
}

export function startScheduleClock() {
    function updateViewControls() {
        const content = document.getElementById("schedule-content");
        if (!content) return;

        const isDayView = content.classList.contains("day-view");
        const weekdays = document.getElementById("schedule-weekdays");
        const dayTabs = content.querySelector(".schedule-day-tabs");

        if (weekdays) weekdays.hidden = isDayView;
        if (dayTabs) dayTabs.hidden = !isDayView;

        dayTabs?.querySelectorAll("[data-day]").forEach(button => {
            button.classList.toggle(
                "active",
                Number(button.dataset.day) === Number(content.dataset.selectedDay)
            );
        });
    }

    function updateTime() {
        const now = new Date();
        const today = (now.getDay() + 6) % 7;
        const content = document.getElementById("schedule-content");

        if (!content) return;
       
        const isDayView = content.classList.contains("day-view");

        updateViewControls();

        document.querySelectorAll(".schedule-current-time").forEach(indicator => {
            const dayColumn = indicator.closest(".schedule-day-column");
            const day = Number(dayColumn?.dataset.day);

            const visible = isDayView
                ? day === Number(content.dataset.selectedDay)
                : day === today;

            indicator.hidden = !visible;

            if (!visible) return;

            const grid = indicator.closest(".schedule-grid");
            const label = indicator.querySelector(".schedule-current-time-label");

            if (!grid || !label) return;

            const minutes = now.getHours() * 60 + now.getMinutes();
            const hourHeight = grid.clientHeight / 24;

            indicator.style.top = `${(minutes / 60) * hourHeight}px`;

            label.textContent = now.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit"
            });
        });
    }

    updateTime();

    setInterval(updateTime, 10000);
    window.addEventListener("resize", updateTime);

    document.getElementById("schedule-content")?.addEventListener("click", event => {
        const viewButton = event.target.closest('[data-action="set-schedule-view"]');
        const dayButton = event.target.closest('[data-action="select-schedule-day"]');

        if (dayButton) {
            const content = document.getElementById("schedule-content");
            content.dataset.selectedDay = dayButton.dataset.day;
        }

        if (viewButton || dayButton) {
            requestAnimationFrame(updateTime);
        }
    });
}


export function updateWeekdays() {
    const content = document.getElementById("schedule-content");
    const weekdays = document.getElementById("schedule-weekdays");

    if (!content || !weekdays) return;

    const isDayView = content.classList.contains("day-view");
    weekdays.hidden = isDayView;
}