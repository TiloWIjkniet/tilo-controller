
import { LitElement, html, css } from "lit";

class ScheduleEditor extends LitElement {

    static properties = {
        fragrances: { type: Array },
        schedule: { type: Array },
        editingId: { type: String },
        formFragrance: { type: String },
        formTime: { type: String },
        formAmount: { type: Number },
        formDays: { type: Array },
        selectedDay: { type: String },
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            color: var(--primary-text-color);
        }

        h3 {
            margin: 0 0 12px;
            font-size: 18px;
            font-weight: 700;
        }

        .add-button, .action-button {
            width: 100%;
            padding: 10px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #343e4b;
            color: #e1e1e1;
            cursor: pointer;
            font-size: 13px;
        }

        .add-button:hover, .action-button:hover {
            background: #405064;
        }

        .day-filter {
            display: flex;
            gap: 4px;
            margin-top: 12px;
            margin-bottom: 8px;
        }

        .day-filter button {
            flex: 1;
            min-width: 0;
            padding: 7px 2px;
            border: 1px solid #3a3f48;
            border-radius: 6px;
            background: #292d35;
            color: #aeb6c2;
            font-size: 11px;
            cursor: pointer;
        }

        .day-filter button.selected {
            background: #344b60;
            border-color: #2196f3;
            color: white;
        }

        .timeline {
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        .timeline-content {
            position: relative;
            height: 100%;
            min-height: 0;
        }

        .hours {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-rows: repeat(24, minmax(0, 1fr));
        }

        .hour {
            display: grid;
            grid-template-columns: 55px 1fr;
            min-height: 0;
        }

        .hour-label {
            color: #aeb6c2;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 0 0 3px;
        }

        .hour-line {
            border-top: 1px solid #59616e;
            margin-top: 5px;
        }

        .events {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 55px;
            right: 0;
            pointer-events: none;
        }

.event-group {
    position: absolute;
    display: flex;
    gap: 5px;
    pointer-events: auto;
    box-sizing: border-box;
}

        .event {
            flex: 1;
            min-width: 0;
            height: 28px;
            box-sizing: border-box;
            padding: 3px 6px;
            border: 1px solid;
            border-radius: 6px;
            color: white;
            text-align: left;
            cursor: pointer;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 11px;
            font-weight: 600;
        }
        .event:hover {
            filter: brightness(1.15);
        }

        .empty {
            color: var(--secondary-text-color);
            font-size: 12px;
        }

        .overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.65);
        }

        .popup {
            width: 100%;
            max-width: 400px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 22px;
            border: 1px solid var(--divider-color);
            border-radius: 12px;
            background: var(--card-background-color);
            box-sizing: border-box;
        }

        .popup {
            background: #202630;
            border: 1px solid #505b6b;
            border-radius: 10px;
        }

        .field {
            margin-bottom: 18px;
        }

        .field label {
            display: block;
            margin-bottom: 7px;
            font-size: 13px;
            font-weight: 600;
        }

        .field select,
        .field input[type="time"],
        .field input[type="number"] {
            width: 100%;
            box-sizing: border-box;
            padding: 11px;
            border: 1px solid #505b6b;
            border-radius: 5px;
            background-color: #343e4b;
            color: #ffffff;
            opacity: 1;
            font: inherit;
            color-scheme: dark;
        }

        .days {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        .day {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
        }

        .day input {
            accent-color: #2196f3;
        }

        .popup-actions {
            display: flex;
            gap: 8px;
            margin-top: 20px;
        }

        .popup-actions button {
            flex: 1;
        }

        .delete-button {
            background: #b83232;
            border-color: transparent;
        }
    `;

    constructor() {
        super();

        this.fragrances = [];
        this.schedule = [];
        this.editingId = null;
        this.formFragrance = "";
        this.formTime = "09:00";
        this.formAmount = 1;
        this.formDays = [];
        this.selectedDay = "Maandag";
        this.timelineHeight = 0;
        this.resizeObserver = null;
        this.observedEvents = null;
    }

    updated() {
    const events = this.renderRoot.querySelector(".events");

    if (!events) return;

    if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(entries => {
            const height = entries[0].contentRect.height;

            if (Math.abs(height - this.timelineHeight) > 0.5) {
                this.timelineHeight = height;
                this.requestUpdate();
            }
        });
    }

    if (this.observedEvents !== events) {
        this.resizeObserver.disconnect();
        this.resizeObserver.observe(events);
        this.observedEvents = events;
    }
}

disconnectedCallback() {
    super.disconnectedCallback();

    this.resizeObserver?.disconnect();
    this.observedEvents = null;
}

get positionedSchedule() {
    const blockHeight = 28;
    const gap = 5;

    // Bereken de exacte pixelpositie van ieder spraymoment.
    const groups = this.groupedSchedule.map(group => ({
        ...group,
        top: (this.timeToMinutes(group.time) / 1440) * this.timelineHeight,
    }));

    // Verdeel overlappende blokken in aparte clusters.
    const clusters = [];

    for (const group of groups) {
        const lastCluster = clusters[clusters.length - 1];

        if (!lastCluster || group.top >= lastCluster.bottom) {
            clusters.push({
                groups: [group],
                bottom: group.top + blockHeight + gap,
            });
        } else {
            lastCluster.groups.push(group);

            lastCluster.bottom = Math.max(
                lastCluster.bottom,
                group.top + blockHeight + gap
            );
        }
    }

    // Geef alleen overlappende blokken een aparte horizontale baan.
    return clusters.flatMap(cluster => {
        const laneEnds = [];

        const placed = cluster.groups.map(group => {
            let lane = laneEnds.findIndex(end => end <= group.top);

            if (lane === -1) {
                lane = laneEnds.length;
            }

            laneEnds[lane] = group.top + blockHeight + gap;

            return {
                ...group,
                lane,
            };
        });

        const laneCount = laneEnds.length;

        return placed.map(group => ({
            ...group,
            left: (group.lane / laneCount) * 100,
            width: 100 / laneCount,
        }));
    });
}

    get days() {
        return [
            "Maandag",
            "Dinsdag",
            "Woensdag",
            "Donderdag",
            "Vrijdag",
            "Zaterdag",
            "Zondag",
        ];
    }

    get groupedSchedule() {
        const groups = {};

        const filtered = this.schedule.filter(item =>
            (item.days ?? this.days).includes(this.selectedDay)
        );

        for (const item of filtered) {
            if (!groups[item.time]) {
                groups[item.time] = [];
            }

            groups[item.time].push(item);
        }

        return Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([time, items]) => ({ time, items }));
    }

    get fragranceColors() {
        return [
            "#2878b5",
            "#26845c",
            "#a66b22",
            "#8755b5",
            "#bd4d62",
            "#238c91",
            "#777d35",
            "#b15e35",
        ];
    }

    getFragranceColor(id) {
        const hash = [...String(id)].reduce(
            (total, char) => total + char.charCodeAt(0),
            0
        );

        return this.fragranceColors[
            hash % this.fragranceColors.length
        ];
    }

    render() {
        return html`
            <h3>Sprayplanning</h3>

            <button class="add-button" @click=${this.openAddPopup}>
                + Spraymoment toevoegen
            </button>

            <div class="day-filter">
                ${this.days.map(day => html`
                    <button
                        class="${this.selectedDay === day ? "selected" : ""}"
                        @click=${() => this.selectedDay = day}
                    >
                        ${day.substring(0, 2)}
                    </button>
                `)}
            </div>

            <div class="timeline">
                <div class="timeline-content">

                    <div class="hours">
                        ${Array.from({ length: 24 }, (_, hour) => html`
                            <div class="hour">
                                <div class="hour-label">
                                    ${String(hour).padStart(2, "0")}:00
                                </div>
                                <div class="hour-line"></div>
                            </div>
                        `)}
                    </div>

                    <div class="events">
                        ${this.positionedSchedule.map(group => html`
                         <div
                                    class="event-group"
                                    style="
                                        top: ${group.top}px;
                                        left: ${group.left}%;
                                        width: ${group.width}%;
                                    "
                                >
                                ${group.items.map(item => {
                                    const fragrance = this.fragrances.find(
                                        f => f.id === item.fragranceId
                                    );

                                    const color = this.getFragranceColor(
                                        item.fragranceId
                                    );

                                    return html`
                                        <button
                                            class="event"
                                            style="background: ${color}; border-color: ${color}"
                                            @click=${() => this.openEditPopup(item)}
                                        >
                                            ${fragrance?.name ?? "Onbekende geur"}
                                            · ${item.amountOfSprays ?? 1}x
                                        </button>
                                    `;
                                })}
                            </div>
                        `)}
                    </div>
                </div>
            </div>

            ${this.groupedSchedule.length === 0
                ? html`<p class="empty">Geen sprays gepland voor ${this.selectedDay.toLowerCase()}.</p>`
                : ""}

            ${this.editingId !== null ? this.renderPopup() : ""}
        `;
    }

    renderPopup() {
        const isEditing = this.editingId !== "new";

        return html`
            <div class="overlay" @click=${this.closePopup}>
                <div class="popup" @click=${e => e.stopPropagation()}>
                    <h3>
                        ${isEditing
                            ? "Spraymoment bewerken"
                            : "Spraymoment toevoegen"}
                    </h3>

                    <div class="field">
                        <label>Geur</label>
                        <select
                            .value=${this.formFragrance}
                            @change=${e => this.formFragrance = e.target.value}
                        >
                            ${this.fragrances.map(fragrance => html`
                                <option value=${fragrance.id}>
                                    ${fragrance.name}
                                </option>
                            `)}
                        </select>
                    </div>

                    <div class="field">
                        <label>Tijdstip</label>
                        <input
                            type="time"
                            .value=${this.formTime}
                            @change=${e => this.formTime = e.target.value}
                        >
                    </div>

                    <div class="field">
                        <label>Aantal sprays</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            .value=${String(this.formAmount)}
                            @input=${e => this.formAmount = Number(e.target.value)}
                        >
                    </div>

                    <div class="field">
                        <label>Dagen</label>
                        <div class="days">
                            ${this.days.map(day => html`
                                <label class="day">
                                    <input
                                        type="checkbox"
                                        .checked=${this.formDays.includes(day)}
                                        @change=${e => this.toggleDay(
                                            day,
                                            e.target.checked
                                        )}
                                    >
                                    ${day.substring(0, 2)}
                                </label>
                            `)}
                        </div>
                    </div>

                    <div class="popup-actions">
                        <button
                            class="action-button"
                            @click=${this.closePopup}
                        >
                            Annuleren
                        </button>

                        ${isEditing ? html`
                            <button
                                class="action-button delete-button"
                                @click=${this.deleteSchedule}
                            >
                                Verwijderen
                            </button>
                        ` : ""}

                        <button
                            class="action-button"
                            @click=${this.saveSchedule}
                        >
                            ${isEditing ? "Opslaan" : "Toevoegen"}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    timeToMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }

    openAddPopup() {
        if (this.fragrances.length === 0) return;

        this.editingId = "new";
        this.formFragrance = this.fragrances[0].id;
        this.formTime = "09:00";
        this.formAmount = 1;
        this.formDays = [...this.days];
    }

    openEditPopup(item) {
        this.editingId = item.id;
        this.formFragrance = item.fragranceId;
        this.formTime = item.time;
        this.formAmount = item.amountOfSprays ?? 1;
        this.formDays = [...(item.days ?? this.days)];
    }

    closePopup() {
        this.editingId = null;
    }

    toggleDay(day, checked) {
        this.formDays = checked
            ? [...this.formDays, day]
            : this.formDays.filter(d => d !== day);
    }

    saveSchedule() {
        const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(this.formTime);

        if (
            !this.formFragrance ||
            !validTime ||
            this.formDays.length === 0 ||
            !Number.isInteger(this.formAmount) ||
            this.formAmount < 1 ||
            this.formAmount > 100
        ) {
            return;
        }

        const item = {
            id: this.editingId === "new"
                ? crypto.randomUUID()
                : this.editingId,
            fragranceId: this.formFragrance,
            time: this.formTime,
            amountOfSprays: this.formAmount,
            days: [...this.formDays],
        };

        const updatedSchedule = this.editingId === "new"
            ? [...this.schedule, item]
            : this.schedule.map(existing =>
                existing.id === item.id ? item : existing
            );

        this.dispatchSchedule(updatedSchedule);
        this.closePopup();
    }

    deleteSchedule() {
        const updatedSchedule = this.schedule.filter(
            item => item.id !== this.editingId
        );

        this.dispatchSchedule(updatedSchedule);
        this.closePopup();
    }

    dispatchSchedule(schedule) {
        this.dispatchEvent(new CustomEvent("schedule-changed", {
            detail: { schedule },
            bubbles: true,
            composed: true,
        }));
    }
}

customElements.define("schedule-editor", ScheduleEditor);
