
const NOTIFICATIONS_API = "/api/notifications";


// ==================================================
// STANDAARDINSTELLINGEN
// ==================================================

const DEFAULT_NOTIFICATION_SETTINGS = {
    enabled: true,

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
        predictionDays: 3
    },

    schedule: {
        sprayError: true,
        scheduleError: true
    },

    firmware: {
        available: true
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
    "notification-prediction-days": "fragrances.predictionDays",

    "notification-spray-error": "schedule.sprayError",
    "notification-schedule-error": "schedule.scheduleError",

    "notification-firmware-available": "firmware.available"
};


// ==================================================
// INTERNE STATUS
// ==================================================

let notificationSettings =
    structuredClone(DEFAULT_NOTIFICATION_SETTINGS);

let notificationSaveQueue = Promise.resolve();

const initializedApps = new WeakSet();


// ==================================================
// OBJECTEN SAMENVOEGEN
// ==================================================

function mergeNotificationSettings(settings = {}) {
    return {
        ...structuredClone(DEFAULT_NOTIFICATION_SETTINGS),
        ...settings,

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
        }
    };
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

        if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
            throw new Error("Ongeldig antwoord van de notificatie-API");
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

    // Een eerdere mislukte opslag mag de wachtrij niet blokkeren.
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


    // SLIDERWAARDE BIJWERKEN
    const predictionValue = app.querySelector(
        "#notification-prediction-value"
    );

    if (predictionValue) {
        predictionValue.textContent =
            `${settings.fragrances.predictionDays} dagen`;
    }
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
                : element.type === "range"
                    ? Number(element.value)
                    : element.value;

            void updateNotificationSettings(path, value);


            // SLIDERTEKST BIJWERKEN
            if (id === "notification-prediction-days") {
                const output = app.querySelector(
                    "#notification-prediction-value"
                );

                if (output) {
                    output.textContent = `${value} dagen`;
                }
            }
        });
    });

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
        const settings = await loadNotificationSettings();

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
