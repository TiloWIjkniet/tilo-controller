
const NOTIFICATIONS_API = "/api/notifications";
const NOTIFICATION_TARGETS_API = "/api/notifications/targets";


// ==================================================
// STANDAARDINSTELLINGEN
// ==================================================

const DEFAULT_NOTIFICATION_SETTINGS = {
    enabled: true,

    // Algemene notificatiebestemmingen.
    destinations: [],

    general: {
        sound: false,

        quietHours: {
            enabled: false,
            start: "22:00",
            end: "08:00"
        }
    },

    devices: {
        errors: true,
        offline: true,
        online: true,
        sensorErrors: true
    },

    fragrances: {
        empty: true,
        predictedEmpty: true,
        unavailable: true,
        available: true,
        predictionDays: 3
    },

    schedule: {
        sprayError: true,
        scheduleError: true
    },

    firmware: {
        available: true
    },

    buffer: {
        enabled: true,
        delaySeconds: 10
    },

    repeat: {
        enabled: true,
        intervalMinutes: 360
    }
};


// ==================================================
// HTML-ELEMENTEN KOPPELEN AAN INSTELLINGEN
// ==================================================

const NOTIFICATION_ELEMENTS = {
    "notifications-enabled": "enabled",

    "notification-sound": "general.sound",
    "notification-quiet-hours": "general.quietHours.enabled",
    "notification-quiet-start": "general.quietHours.start",
    "notification-quiet-end": "general.quietHours.end",

    "notification-device-errors": "devices.errors",
    "notification-device-offline": "devices.offline",
    "notification-device-online": "devices.online",
    "notification-sensor-errors": "devices.sensorErrors",

    "notification-empty-fragrance": "fragrances.empty",
    "notification-predicted-empty": "fragrances.predictedEmpty",
    "notification-fragrance-unavailable": "fragrances.unavailable",
    "notification-fragrance-available": "fragrances.available",
    "notification-prediction-days": "fragrances.predictionDays",

    "notification-spray-error": "schedule.sprayError",
    "notification-schedule-error": "schedule.scheduleError",

    "notification-firmware-available": "firmware.available",

    "notification-buffer-enabled": "buffer.enabled",
    "notification-buffer-delay": "buffer.delaySeconds",

    "notification-repeat-enabled": "repeat.enabled",
    "notification-repeat-interval": "repeat.intervalMinutes"
};


// ==================================================
// INTERNE STATUS
// ==================================================

let notificationSettings =
    structuredClone(DEFAULT_NOTIFICATION_SETTINGS);

let notificationTargets = [];

let notificationSaveQueue = Promise.resolve();

const initializedApps = new WeakSet();


// ==================================================
// OBJECTEN SAMENVOEGEN
// ==================================================

function mergeNotificationSettings(settings = {}) {
    return {
        ...structuredClone(DEFAULT_NOTIFICATION_SETTINGS),
        ...settings,

        destinations: Array.isArray(settings.destinations)
            ? [...new Set(settings.destinations.filter(
                value => typeof value === "string"
            ))]
            : [],

        general: {
            ...DEFAULT_NOTIFICATION_SETTINGS.general,
            ...settings.general,

            quietHours: {
                ...DEFAULT_NOTIFICATION_SETTINGS.general.quietHours,
                ...settings.general?.quietHours
            }
        },

        devices: {
            ...DEFAULT_NOTIFICATION_SETTINGS.devices,
            ...settings.devices
        },

        fragrances: {
            ...DEFAULT_NOTIFICATION_SETTINGS.fragrances,
            ...settings.fragrances
        },

        schedule: {
            ...DEFAULT_NOTIFICATION_SETTINGS.schedule,
            ...settings.schedule
        },

        firmware: {
            ...DEFAULT_NOTIFICATION_SETTINGS.firmware,
            ...settings.firmware
        },

        buffer: {
            ...DEFAULT_NOTIFICATION_SETTINGS.buffer,
            ...settings.buffer
        },

        repeat: {
            ...DEFAULT_NOTIFICATION_SETTINGS.repeat,
            ...settings.repeat
        }
    };
}


// ==================================================
// NOTIFICATIEBESTEMMINGEN OPHALEN
// ==================================================

export async function loadNotificationTargets() {
    try {
        const response = await fetch(NOTIFICATION_TARGETS_API, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.targets)) {
            throw new Error(
                "Ongeldig antwoord van de notificatiebestemmingen-API"
            );
        }

        notificationTargets = data.targets.filter(target =>
            target &&
            typeof target.entity_id === "string" &&
            typeof target.name === "string"
        );

        return [...notificationTargets];

    } catch (error) {
        console.error(
            "[NOTIFICATIONS] Bestemmingen ophalen mislukt:",
            error
        );

        throw error;
    }
}


// ==================================================
// NOTIFICATIEBESTEMMINGEN OP FRONTEND WEERGEVEN
// ==================================================

export function applyNotificationTargets(app) {
    if (!app) return;

    const container = app.querySelector(
        "#notification-destinations"
    );

    if (!container) return;

    if (notificationTargets.length === 0) {
        container.innerHTML = `
            <p class="notification-empty-targets">
                Geen notificatiebestemmingen gevonden.
            </p>
        `;
        return;
    }

    const selectedDestinations = notificationSettings.destinations;

    container.innerHTML = notificationTargets.map(target => {
        const selected = selectedDestinations.includes(
            target.entity_id
        );

        const available = target.available !== false;

        return `
            <label class="notification-destination-option
                ${available ? "" : "unavailable"}">

                <input
                    type="checkbox"
                    class="notification-destination-checkbox"
                    value="${escapeNotificationHTML(target.entity_id)}"
                    ${selected ? "checked" : ""}
                    ${available ? "" : "disabled"}>

                <span class="notification-destination-info">
                    <span class="notification-destination-name">
                        ${escapeNotificationHTML(target.name)}
                    </span>

                    <small>
                        ${escapeNotificationHTML(target.entity_id)}
                        ${available ? "" : " · Niet beschikbaar"}
                    </small>
                </span>

            </label>
        `;
    }).join("");
}


// ==================================================
// HTML-TEKST VEILIG MAKEN
// ==================================================

function escapeNotificationHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// ==================================================
// INSTELLINGEN OPHALEN (GET)
// ==================================================

export async function loadNotificationSettings() {
    try {
        const response = await fetch(NOTIFICATIONS_API, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const settings = await response.json();

        if (
            !settings ||
            typeof settings !== "object" ||
            Array.isArray(settings)
        ) {
            throw new Error(
                "Ongeldig antwoord van de notificatie-API"
            );
        }

        notificationSettings =
            mergeNotificationSettings(settings);

        return structuredClone(notificationSettings);

    } catch (error) {
        console.error(
            "[NOTIFICATIONS] Instellingen ophalen mislukt:",
            error
        );

        throw error;
    }
}


// ==================================================
// INSTELLINGEN OPSLAAN (PUT)
// ==================================================

async function saveNotificationSettings() {
    const settings = structuredClone(notificationSettings);

    notificationSaveQueue = notificationSaveQueue
        .catch(() => {})
        .then(async () => {
            const response = await fetch(NOTIFICATIONS_API, {
                method: "PUT",
                credentials: "same-origin",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        });

    try {
        await notificationSaveQueue;

    } catch (error) {
        console.error(
            "[NOTIFICATIONS] Instellingen opslaan mislukt:",
            error
        );
    }
}


// ==================================================
// INSTELLING WIJZIGEN
// ==================================================

export function updateNotificationSettings(path, value) {
    const keys = path.split(".");
    let target = notificationSettings;

    for (let i = 0; i < keys.length - 1; i++) {
        if (
            !target[keys[i]] ||
            typeof target[keys[i]] !== "object"
        ) {
            console.error(
                `[NOTIFICATIONS] Ongeldig instellingenpad: ${path}`
            );

            return Promise.resolve();
        }

        target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;

    return saveNotificationSettings();
}


// ==================================================
// NOTIFICATIEBESTEMMING WIJZIGEN
// ==================================================

async function updateNotificationDestinations(app) {
    const checkboxes = app.querySelectorAll(
        ".notification-destination-checkbox"
    );

    notificationSettings.destinations = [
        ...checkboxes
    ]
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    await saveNotificationSettings();

    console.info(
        "[NOTIFICATIONS] Bestemmingen opgeslagen:",
        notificationSettings.destinations
    );
}


// ==================================================
// FRONTEND BIJWERKEN
// ==================================================

export function applyNotificationSettings(settings, app) {
    if (!app || !settings) return;

    Object.entries(NOTIFICATION_ELEMENTS).forEach(([id, path]) => {
        const element = app.querySelector(`#${id}`);

        if (!element) return;

        const value = path.split(".").reduce(
            (object, key) => object?.[key],
            settings
        );

        if (element.type === "checkbox") {
            element.checked = Boolean(value);

        } else if (value !== undefined && value !== null) {
            element.value = value;
        }
    });

    // SLIDERWAARDEN BIJWERKEN

    const outputElements = {
        "notification-prediction-value": {
            value: settings.fragrances.predictionDays,
            suffix: " dagen"
        },

        "notification-buffer-delay-value": {
            value: settings.buffer.delaySeconds,
            suffix: " seconden"
        },

        "notification-repeat-interval-value": {
            value: settings.repeat.intervalMinutes,
            suffix: " minuten"
        }
    };

    Object.entries(outputElements).forEach(([id, data]) => {
        const element = app.querySelector(`#${id}`);

        if (element) {
            element.textContent = `${data.value}${data.suffix}`;
        }
    });

    applyNotificationTargets(app);
}


// ==================================================
// FRONTEND EVENTS
// ==================================================

export function setupNotificationListeners(app) {
    if (!app || initializedApps.has(app)) return;

    Object.entries(NOTIFICATION_ELEMENTS).forEach(([id, path]) => {
        const element = app.querySelector(`#${id}`);

        if (!element) return;

        element.addEventListener("change", () => {
            const value = element.type === "checkbox"
                ? element.checked
                : element.type === "range" ||
                  element.type === "number"
                    ? Number(element.value)
                    : element.value;

            void updateNotificationSettings(path, value);

            const outputs = {
                "notification-prediction-days": {
                    id: "notification-prediction-value",
                    suffix: " dagen"
                },

                "notification-buffer-delay": {
                    id: "notification-buffer-delay-value",
                    suffix: " seconden"
                },

                "notification-repeat-interval": {
                    id: "notification-repeat-interval-value",
                    suffix: " minuten"
                }
            };

            const output = outputs[id];

            if (output) {
                const outputElement = app.querySelector(
                    `#${output.id}`
                );

                if (outputElement) {
                    outputElement.textContent =
                        `${value}${output.suffix}`;
                }
            }
        });
    });

    // Algemene notificatiebestemmingen.
    const destinationContainer = app.querySelector(
        "#notification-destinations"
    );

    if (destinationContainer) {
        destinationContainer.addEventListener("change", event => {
            if (
                event.target.matches(
                    ".notification-destination-checkbox"
                )
            ) {
                void updateNotificationDestinations(app);
            }
        });
    }

    initializedApps.add(app);
}


// ==================================================
// NOTIFICATIES INITIALISEREN
// ==================================================

export async function setupNotifications(app) {
    if (!app) {
        console.error(
            "[NOTIFICATIONS] App-element ontbreekt"
        );

        return;
    }

    try {
        const [settings] = await Promise.all([
            loadNotificationSettings(),
            loadNotificationTargets()
        ]);

        applyNotificationSettings(settings, app);

        setupNotificationListeners(app);

        console.info(
            "[NOTIFICATIONS] Instellingen geïnitialiseerd"
        );

    } catch (error) {
        console.error(
            "[NOTIFICATIONS] Initialisatie mislukt:",
            error
        );
    }
}
