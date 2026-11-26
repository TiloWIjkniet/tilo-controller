
const NOTIFICATIONS_API = "/api/notifications";
const NOTIFICATION_TARGETS_API = "/api/notifications/targets";


// ==================================================
// STANDAARDINSTELLINGEN
// ==================================================

const DEFAULT_NOTIFICATION_SETTINGS = {
    enabled: true,
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
            ? [...settings.destinations]
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

        if (
            !data ||
            data.success !== true ||
            !Array.isArray(data.targets)
        ) {
            throw new Error(
                "Ongeldig antwoord van de notificatiebestemmingen-API"
            );
        }

        return data.targets.filter(target =>
            target &&
            typeof target.entity_id === "string" &&
            typeof target.name === "string"
        );

    } catch (error) {
        console.error(
            "[NOTIFICATIONS] Bestemmingen ophalen mislukt:",
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
// NOTIFICATIEBESTEMMINGEN WEERGEVEN
// ==================================================

export function applyNotificationTargets(targets, app) {
    const select = app.querySelector(
        "#notification-destinations"
    );

    if (!select) {
        console.warn(
            "[NOTIFICATIONS] Bestemmingen-element ontbreekt in template"
        );

        return;
    }

    const selectedDestinations =
        notificationSettings.destinations || [];

    select.innerHTML = "";

    // Beschikbare Home Assistant-notificatiedoelen toevoegen.
    targets.forEach(target => {
        const option = document.createElement("option");

        option.value = target.entity_id;
        option.textContent = target.name;

        const available = target.available !== false;

        option.disabled = !available;
        option.selected = selectedDestinations.includes(
            target.entity_id
        );

        if (!available) {
            option.textContent += " (niet beschikbaar)";
        }

        select.appendChild(option);
    });

    // Bewaar geselecteerde bestemmingen die niet meer door HA
    // worden teruggegeven. Zo verdwijnen ze niet stilzwijgend
    // uit de opgeslagen instellingen.
    selectedDestinations.forEach(entityId => {
        const exists = targets.some(
            target => target.entity_id === entityId
        );

        if (exists) return;

        const option = document.createElement("option");

        option.value = entityId;
        option.textContent = `${entityId} (niet gevonden)`;
        option.disabled = true;
        option.selected = true;

        select.appendChild(option);
    });

    updateNotificationDestinationStatus(app);
}


// ==================================================
// STATUS VAN NOTIFICATIEBESTEMMINGEN
// ==================================================

function updateNotificationDestinationStatus(app) {
    const status = app.querySelector(
        "#notification-destinations-status"
    );

    if (!status) return;

    const count = notificationSettings.destinations.length;

    if (count === 0) {
        status.textContent =
            "Er zijn nog geen notificatiebestemmingen geselecteerd.";
    } else if (count === 1) {
        status.textContent = "1 bestemming geselecteerd.";
    } else {
        status.textContent =
            `${count} bestemmingen geselecteerd.`;
    }
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

    // SLIDERTEKSTEN BIJWERKEN

    const outputs = [
        [
            "notification-prediction-value",
            settings.fragrances.predictionDays,
            "dagen"
        ],
        [
            "notification-buffer-delay-value",
            settings.buffer.delaySeconds,
            "seconden"
        ],
        [
            "notification-repeat-interval-value",
            settings.repeat.intervalMinutes,
            "minuten"
        ]
    ];

    outputs.forEach(([id, value, unit]) => {
        const element = app.querySelector(`#${id}`);

        if (element) {
            element.textContent = `${value} ${unit}`;
        }
    });

    updateNotificationDestinationStatus(app);
}


// ==================================================
// FRONTEND EVENTS
// ==================================================

export function setupNotificationListeners(app) {
    if (!app || initializedApps.has(app)) return;

    // Gewone notificatie-instellingen.
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

            // SLIDERTEKST BIJWERKEN

            const outputs = {
                "notification-prediction-days": [
                    "notification-prediction-value",
                    "dagen"
                ],

                "notification-buffer-delay": [
                    "notification-buffer-delay-value",
                    "seconden"
                ],

                "notification-repeat-interval": [
                    "notification-repeat-interval-value",
                    "minuten"
                ]
            };

            const outputConfig = outputs[id];

            if (outputConfig) {
                const [outputId, unit] = outputConfig;
                const output = app.querySelector(`#${outputId}`);

                if (output) {
                    output.textContent = `${value} ${unit}`;
                }
            }
        });
    });

    // Algemene notificatiebestemmingen.
    const destinationSelect = app.querySelector(
        "#notification-destinations"
    );

    if (destinationSelect) {
        destinationSelect.addEventListener("change", () => {
            notificationSettings.destinations = Array.from(
                destinationSelect.selectedOptions,
                option => option.value
            );

            updateNotificationDestinationStatus(app);

            void saveNotificationSettings();
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
        // Eerst de bestaande instellingen ophalen.
        const settings = await loadNotificationSettings();

        applyNotificationSettings(settings, app);

        // Listeners direct installeren.
        setupNotificationListeners(app);

        console.info(
            "[NOTIFICATIONS] Instellingen geïnitialiseerd"
        );

        // Bestemmingen afzonderlijk ophalen.
        // Een fout hierin mag de overige instellingen niet blokkeren.
        try {
            const targets = await loadNotificationTargets();

            applyNotificationTargets(targets, app);

            console.info(
                `[NOTIFICATIONS] ${targets.length} bestemmingen geladen`
            );

        } catch (error) {
            const status = app.querySelector(
                "#notification-destinations-status"
            );

            if (status) {
                status.textContent =
                    "Notificatiebestemmingen konden niet worden geladen.";
            }
        }

    } catch (error) {
        console.error(
            "[NOTIFICATIONS] Initialisatie mislukt:",
            error
        );
    }
}


// ==================================================
// NOTIFICATIE TEMPLATE
// ==================================================

export function createNotificationsTemplate() {
    return `
        <div class="notification-settings">

            <div class="notification-intro">
                <div>
                    <h3>Notificatievoorkeuren</h3>
                    <p>Bepaal welke meldingen je wilt ontvangen.</p>
                </div>

                <label class="notification-toggle notification-master-toggle">
                    <input type="checkbox" id="notifications-enabled" checked>
                    <span class="notification-toggle-slider"></span>
                </label>
            </div>


            <!-- ALGEMENE VOORKEUREN -->

            <section class="notification-general-card">

                <div class="notification-card-heading">
                    <div class="notification-icon general-icon">
                        <i data-lucide="sliders-horizontal"></i>
                    </div>

                    <div>
                        <h4>Algemene voorkeuren</h4>
                        <p>Instellingen voor alle notificaties</p>
                    </div>
                </div>

                <div class="notification-general-options">

                    <!-- NOTIFICATIEBESTEMMINGEN -->

                    <div class="notification-destinations">

                        <div class="notification-row-info">
                            <span>Notificatiebestemmingen</span>
                            <small>
                                Selecteer waar GeurBot notificaties naartoe mag sturen.
                            </small>
                        </div>

         <div class="notification-destinations">
                <select
                    id="notification-destinations"
                    class="notification-destinations-select"
                    multiple
                    size="5"
                    aria-label="Notificatiebestemmingen">
                </select>

                <small
                    id="notification-destinations-status"
                    class="notification-destinations-status">
                    Bestemmingen laden...
                </small>

                <small class="notification-destinations-hint">
                    Houd Ctrl ingedrukt (of Command op Mac) om meerdere
                    bestemmingen te selecteren.
                </small>
            </div>

                    </div>


                    <div class="notification-row">
                        <div class="notification-row-info">
                            <span>Geluid</span>
                            <small>Een geluid afspelen bij nieuwe meldingen</small>
                        </div>

                        <label class="notification-toggle">
                            <input type="checkbox" id="notification-sound">
                            <span class="notification-toggle-slider"></span>
                        </label>
                    </div>

                    <div class="notification-row notification-quiet-row">
                        <div class="notification-row-info">
                            <span>Stille uren</span>
                            <small>Geen notificaties tijdens ingestelde uren</small>
                        </div>

                        <label class="notification-toggle">
                            <input type="checkbox" id="notification-quiet-hours">
                            <span class="notification-toggle-slider"></span>
                        </label>
                    </div>

                    <div class="notification-quiet-settings">

                        <div class="notification-time-field">
                            <label for="notification-quiet-start">Starttijd</label>
                            <input type="time" id="notification-quiet-start" value="22:00">
                        </div>

                        <div class="notification-time-field">
                            <label for="notification-quiet-end">Eindtijd</label>
                            <input type="time" id="notification-quiet-end" value="08:00">
                        </div>

                    </div>

                </div>
            </section>


            <!-- CATEGORIEËN -->

            <div class="notification-section-heading">
                <div>
                    <h4>Notificatiecategorieën</h4>
                    <p>Klik op een categorie om de meldingen te beheren.</p>
                </div>
            </div>


            <div class="notification-categories">


                <!-- APPARATEN -->

                <details class="notification-category">

                    <summary class="notification-category-header">

                        <div class="notification-category-icon device-icon">
                            <i data-lucide="cpu"></i>
                        </div>

                        <div class="notification-category-info">
                            <span>Apparaatmeldingen</span>
                            <small>Verbinding en technische problemen</small>
                        </div>

                        <div class="notification-category-meta">
                            <span>4 opties</span>
                            <i data-lucide="chevron-down" class="notification-chevron"></i>
                        </div>

                    </summary>

                    <div class="notification-category-content">

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Apparaatfouten</span>
                                <small>Technische fouten van een apparaat</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-device-errors" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Apparaat offline</span>
                                <small>Wanneer een GeurBot niet meer bereikbaar is</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-device-offline" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Verbinding hersteld</span>
                                <small>Wanneer een GeurBot weer online komt</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-device-online" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Sensorfouten</span>
                                <small>Wanneer een sensor niet goed functioneert</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-sensor-errors" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                    </div>
                </details>


                <!-- GEURFLACONS -->

                <details class="notification-category">

                    <summary class="notification-category-header">

                        <div class="notification-category-icon fragrance-icon">
                            <i data-lucide="flask-conical"></i>
                        </div>

                        <div class="notification-category-info">
                            <span>Geurflacons</span>
                            <small>Beschikbaarheid, voorraad en voorspellingen</small>
                        </div>

                        <div class="notification-category-meta">
                            <span>4 opties</span>
                            <i data-lucide="chevron-down" class="notification-chevron"></i>
                        </div>

                    </summary>

                    <div class="notification-category-content">

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Flacon leeg</span>
                                <small>Wanneer een geurflacon leeg is</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-empty-fragrance" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Flacon bijna leeg</span>
                                <small>Waarschuw wanneer een flacon bijna leeg raakt</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-predicted-empty" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Geurmodule niet bereikbaar</span>
                                <small>Wanneer een geurmodule niet meer gevonden wordt</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-fragrance-unavailable" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Geurmodule weer beschikbaar</span>
                                <small>Wanneer een geurmodule weer bereikbaar is</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-fragrance-available" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>


                        <!-- VOORSPELLINGSTERMIJN -->

                        <div class="notification-prediction-settings">

                            <div class="notification-slider-heading">
                                <div>
                                    <small>Hoeveel dagen voordat de flacon leeg raakt?</small>
                                </div>

                                <strong id="notification-prediction-value">3 dagen</strong>
                            </div>

                            <input
                                type="range"
                                id="notification-prediction-days"
                                min="1"
                                max="14"
                                value="3"
                                step="1">

                            <div class="notification-slider-labels">
                                <span>1 dag</span>
                                <span>14 dagen</span>
                            </div>

                        </div>

                    </div>
                </details>


                <!-- PLANNING -->

                <details class="notification-category">

                    <summary class="notification-category-header">

                        <div class="notification-category-icon schedule-icon">
                            <i data-lucide="calendar-clock"></i>
                        </div>

                        <div class="notification-category-info">
                            <span>Sproeien en planning</span>
                            <small>Uitvoering van sproeiacties en planningen</small>
                        </div>

                        <div class="notification-category-meta">
                            <span>2 opties</span>
                            <i data-lucide="chevron-down" class="notification-chevron"></i>
                        </div>

                    </summary>

                    <div class="notification-category-content">

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Sproeifout</span>
                                <small>Wanneer een sproeiactie mislukt</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-spray-error" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Planning mislukt</span>
                                <small>Wanneer een planning niet uitgevoerd kan worden</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-schedule-error" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                    </div>
                </details>


                <!-- FIRMWARE -->

                <details class="notification-category">

                    <summary class="notification-category-header">

                        <div class="notification-category-icon firmware-icon">
                            <i data-lucide="download-cloud"></i>
                        </div>

                        <div class="notification-category-info">
                            <span>Firmware</span>
                            <small>Beschikbare firmware-updates</small>
                        </div>

                        <div class="notification-category-meta">
                            <span>1 optie</span>
                            <i data-lucide="chevron-down" class="notification-chevron"></i>
                        </div>

                    </summary>

                    <div class="notification-category-content">

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Update beschikbaar</span>
                                <small>Wanneer een nieuwe firmwareversie beschikbaar is</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-firmware-available" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                    </div>
                </details>


                <!-- BUFFER -->

                <details class="notification-category">

                    <summary class="notification-category-header">

                        <div class="notification-category-icon general-icon">
                            <i data-lucide="layers"></i>
                        </div>

                        <div class="notification-category-info">
                            <span>Meldingen bundelen</span>
                            <small>Meerdere meldingen combineren</small>
                        </div>

                        <div class="notification-category-meta">
                            <span>2 opties</span>
                            <i data-lucide="chevron-down" class="notification-chevron"></i>
                        </div>

                    </summary>

                    <div class="notification-category-content">

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Meldingen bundelen</span>
                                <small>Verzamel meldingen voordat ze verstuurd worden</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-buffer-enabled" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-prediction-settings">

                            <div class="notification-slider-heading">
                                <small>Wachttijd voor het bundelen</small>
                                <strong id="notification-buffer-delay-value">10 seconden</strong>
                            </div>

                            <input
                                type="range"
                                id="notification-buffer-delay"
                                min="1"
                                max="300"
                                value="10"
                                step="1">

                            <div class="notification-slider-labels">
                                <span>1 seconde</span>
                                <span>300 seconden</span>
                            </div>

                        </div>

                    </div>
                </details>


                <!-- HERHALING -->

                <details class="notification-category">

                    <summary class="notification-category-header">

                        <div class="notification-category-icon general-icon">
                            <i data-lucide="repeat"></i>
                        </div>

                        <div class="notification-category-info">
                            <span>Herhaalde meldingen</span>
                            <small>Instellingen voor aanhoudende problemen</small>
                        </div>

                        <div class="notification-category-meta">
                            <span>2 opties</span>
                            <i data-lucide="chevron-down" class="notification-chevron"></i>
                        </div>

                    </summary>

                    <div class="notification-category-content">

                        <div class="notification-row">
                            <div class="notification-row-info">
                                <span>Herhaal meldingen</span>
                                <small>Stuur opnieuw een melding zolang een probleem actief blijft</small>
                            </div>
                            <label class="notification-toggle">
                                <input type="checkbox" id="notification-repeat-enabled" checked>
                                <span class="notification-toggle-slider"></span>
                            </label>
                        </div>

                        <div class="notification-prediction-settings">

                            <div class="notification-slider-heading">
                                <small>Interval tussen herhaalde meldingen</small>
                                <strong id="notification-repeat-interval-value">360 minuten</strong>
                            </div>

                            <input
                                type="range"
                                id="notification-repeat-interval"
                                min="1"
                                max="10080"
                                value="360"
                                step="1">

                            <div class="notification-slider-labels">
                                <span>1 minuut</span>
                                <span>7 dagen</span>
                            </div>

                        </div>

                    </div>
                </details>

            </div>
        </div>
    `;
}
