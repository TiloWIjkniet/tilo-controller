
import { fetchDevicePerformance } from "../../../services/device-settings-api.js";

// ==================================================
// CONSTANTS
// ==================================================

const COLORS = [
    "#4f8cff", "#16b981", "#f59e0b", "#a78bfa",
    "#ef6b6b", "#06b6d4", "#ec4899", "#84cc16"
];

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
})[char]);

const isValidNumber = value =>
    value !== null && value !== undefined && Number.isFinite(Number(value));

// ==================================================
// FORMATTERS
// ==================================================

const formatTime = timestamp =>
    new Date(timestamp).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit"
    });

const formatDuration = value => {
    if (!isValidNumber(value)) return "Niet beschikbaar";

    const duration = Number(value);

    return duration >= 1000
        ? `${(duration / 1000).toFixed(2)} s`
        : `${duration.toFixed(0)} ms`;
};

const formatBytes = bytes => {
    if (!isValidNumber(bytes)) return "Niet beschikbaar";

    const value = Number(bytes);

    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`;

    return `${value.toFixed(0)} B`;
};

const formatPercent = value =>
    !isValidNumber(value)
        ? "Niet beschikbaar"
        : `${Number(value).toFixed(1)}%`;

const formatElapsed = milliseconds => {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return "Onbekend";

    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (days) return `${days} d ${hours} u`;
    if (hours) return `${hours} u ${minutes} min`;
    if (minutes) return `${minutes} min ${remainingSeconds} sec`;

    return `${remainingSeconds} sec`;
};

const formatBlockDuration = seconds => {
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.round(seconds % 60);

        return remaining ? `${minutes} min ${remaining} sec` : `${minutes} min`;
    }

    return `${Math.round(seconds)} sec`;
};

// ==================================================
// METRIC COMPONENTS
// ==================================================

function createMetric(label, value, description = "", className = "") {
    return `
        <div class="performance-metric">
            <span>${escapeHtml(label)}</span>
            <strong class="${escapeHtml(className)}">${escapeHtml(value)}</strong>
            <small>${escapeHtml(description)}</small>
        </div>
    `;
}

function createWifiTimedMetric(label, value, description, key, baseMs, running = true) {
    return `
        <div class="performance-metric">
            <span>${escapeHtml(label)}</span>
            <strong
                data-wifi-timer="${escapeHtml(key)}"
                data-base-ms="${Number(baseMs) || 0}"
                data-started-at="${Date.now()}"
                data-running="${running}"
                data-placeholder="${!running && baseMs == null}">
                ${escapeHtml(value)}
            </strong>
            <small>${escapeHtml(description)}</small>
        </div>
    `;
}

// ==================================================
// MAIN TEMPLATE
// ==================================================

export function createPerformanceTemplate() {
    return `
        <section class="settings-card performance-dashboard">
            <div class="settings-card-title">
                <span>📊</span>
                <h3>Performance Monitor</h3>
            </div>

            <div class="performance-header">
                <div>
                    <p>Realtime prestatiemonitoring van je GeurBot.</p>
                    <span id="performance-updated">Nog geen metingen</span>
                </div>

                <span class="performance-live"><i></i> LIVE</span>
            </div>

            <div id="performance-content">
                <p>Wachten op prestatiedata...</p>
            </div>
        </section>
    `;
}

// ==================================================
// ENDPOINT FILTERS
// ==================================================

function getSelectedEndpoints(endpoints, selected) {
    return Object.entries(endpoints).filter(([name]) => selected.has(name));
}

function createEndpointFilters(endpoints, selected) {
    return `
        <div class="performance-filters">
            <div class="performance-section-heading">
                <div>
                    <h4>Endpoint filters</h4>
                    <p>Selecteer welke endpoints in de grafieken worden meegenomen.</p>
                </div>

                <div class="performance-filter-actions">
                    <button type="button" data-filter-action="all">Alles</button>
                    <button type="button" data-filter-action="none">Geen</button>
                </div>
            </div>

            <div class="performance-filter-list">
                ${Object.entries(endpoints).map(([name], index) => `
                    <label class="performance-filter-item">
                        <input
                            type="checkbox"
                            data-endpoint-filter="${escapeHtml(name)}"
                            ${selected.has(name) ? "checked" : ""}>

                        <i style="background:${COLORS[index % COLORS.length]}"></i>
                        <span>${escapeHtml(name)}</span>
                    </label>
                `).join("")}
            </div>
        </div>
    `;
}

// ==================================================
// WIFI OVERVIEW
// ==================================================

function createWifiOverview(network, uptimeSeconds) {
    if (!network || Object.keys(network).length === 0) {
        return `<p class="performance-empty">Geen wifi-informatie beschikbaar.</p>`;
    }

    const connected = network.connected === true;
    const internet = network.internet_available === true;

    const uptimeMs = (Number(uptimeSeconds) || 0) * 1000;

    const reconnects = Number(network.reconnect_count) || 0;
    const disconnects = Number(network.disconnect_count) || 0;

    const connectionDuration = Number(network.connection_duration_ms) || 0;
    const lastConnected = Number(network.last_connected_ms) || 0;
    const lastDisconnected = Number(network.last_disconnect_ms) || 0;

    const sinceLastDisconnect = lastDisconnected > 0
        ? Math.max(0, uptimeMs - lastDisconnected)
        : null;

const offlineDuration = lastDisconnected > 0 && lastConnected > lastDisconnected
    ? lastConnected - lastDisconnected
    : !connected && lastDisconnected > 0
        ? Math.max(0, uptimeMs - lastDisconnected)
        : null;

    const sinceLastConnection = lastConnected > 0
        ? Math.max(0, uptimeMs - lastConnected)
        : null;

    return `
        <div class="performance-wifi-grid">

            ${createMetric(
                "Wifi-status",
                connected ? "Verbonden" : "Niet verbonden",
                network.ssid || "Geen SSID",
                connected ? "performance-good" : "performance-error"
            )}

            ${createMetric(
                "Signaalsterkte",
                connected && network.rssi != null
                    ? `${network.rssi} dBm`
                    : "Geen signaal"
            )}

            ${createMetric(
                "Internet",
                internet ? "Beschikbaar" : "Niet beschikbaar",
                network.gateway_configured ? "Gateway ingesteld" : "Geen gateway",
                internet ? "performance-good" : "performance-error"
            )}

            ${createMetric(
                "IP-adres",
                network.ip || "Geen IP-adres",
                network.dns_configured ? "DNS ingesteld" : "Geen DNS"
            )}

            ${createMetric(
                "Reconnects",
                reconnects,
                "Succesvolle herverbindingen"
            )}

            ${createMetric(
                "Disconnects",
                disconnects,
                "Verbroken verbindingen"
            )}

            ${createWifiTimedMetric(
                "Huidige verbinding",
                connected ? formatElapsed(connectionDuration) : "Niet verbonden",
                "Verbindingsduur",
                "connection",
                connectionDuration,
                connected
            )}
            ${createWifiTimedMetric(
                "Sinds laatste verbreking",
                sinceLastDisconnect !== null
                    ? formatElapsed(sinceLastDisconnect)
                    : "Nog niet beschikbaar",
                "Tijd sinds de laatste disconnect",
                "last-disconnect",
                sinceLastDisconnect,
                sinceLastDisconnect !== null
            )}
            ${createWifiTimedMetric(
                "Laatste offlineperiode",
                offlineDuration !== null
                    ? formatElapsed(offlineDuration)
                    : "Niet beschikbaar",
                connected ? "Duur van de vorige offlineperiode" : "Huidige offlineperiode",
                "offline-duration",
                offlineDuration,
                !connected && offlineDuration !== null
            )}

            ${createWifiTimedMetric(
                "Verbinding gestart",
                sinceLastConnection !== null
                    ? formatElapsed(sinceLastConnection)
                    : "Nog niet verbonden",
                "Tijd sinds de laatste verbinding begon",
                "last-connection",
                sinceLastConnection ?? 0,
                sinceLastConnection !== null
            )}

        </div>
    `;
}

// ==================================================
// WIFI HISTORY TIMELINE
// ==================================================
// ==================================================
// MILLIS OVERFLOW CORRECTION
// ==================================================

function unwrapMillisTimestamp(timestamp, uptimeNow) {
    const UINT32_RANGE = 0x100000000;
    const rawTimestamp = Number(timestamp) >>> 0;

    const epoch = Math.floor(uptimeNow / UINT32_RANGE);
    let unwrapped = epoch * UINT32_RANGE + rawTimestamp;

    // Houd rekening met een kleine afwijking door uptimeSeconds
    // die mogelijk alleen hele seconden bevat.
    if (unwrapped > uptimeNow + 1000) {
        unwrapped -= UINT32_RANGE;
    }

    return unwrapped;
}



function createWifiHistoryChart(history, uptimeSeconds, hours) {
    if (!history || !Array.isArray(history.entries)) {
        return `<p class="performance-empty">Wifi-verbindingsgeschiedenis niet beschikbaar.</p>`;
    }

    const now = Date.now();
    const uptimeNow = (Number(uptimeSeconds) || 0) * 1000;
    const clockOffset = now - uptimeNow;

    const windowMs = hours * 60 * 60 * 1000;
    const start = now - windowMs;
    const end = now;

    const width = 1000;
    const height = 190;

    const left = 75;
    const right = 25;
    const plotWidth = width - left - right;

    const barY = 65;
    const barHeight = 55;

    const x = timestamp =>
        left + ((timestamp - start) / windowMs) * plotWidth;

    // Millis-timestamps reconstrueren naar een doorlopende tijdlijn.
    const entries = history.entries
        .map(entry => {
            const rawStart = Number(entry.started_at_ms);
            const rawEnd = Number(entry.ended_at_ms);

            if (!Number.isFinite(rawStart))
                return null;

            const uptimeStart = unwrapMillisTimestamp(rawStart, uptimeNow);

            let duration = Number(entry.duration_ms);

            if (!Number.isFinite(duration) || duration < 0) {
                if (!Number.isFinite(rawEnd))
                    return null;

                duration = (rawEnd - rawStart) >>> 0;
            }

            const uptimeEnd = uptimeStart + duration;

            const entryStart = uptimeStart + clockOffset;
            const entryEnd = uptimeEnd + clockOffset;

            const clippedStart = Math.max(start, entryStart);
            const clippedEnd = Math.min(end, entryEnd);

            if (clippedEnd <= clippedStart)
                return null;

            return {
                connected: entry.connected === true,
                start: clippedStart,
                end: clippedEnd
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

    // Alleen geregistreerde perioden tekenen.
    const blocks = entries.map(period => {
        const blockX = x(period.start);
        const blockEndX = x(period.end);
        const blockWidth = Math.max(1, blockEndX - blockX);

        const color = period.connected ? "#16b981" : "#ef4444";
        const label = period.connected ? "Verbonden" : "Niet verbonden";

        const tooltip = [
            label,
            `Van: ${new Date(period.start).toLocaleString("nl-NL")}`,
            `Tot: ${new Date(period.end).toLocaleString("nl-NL")}`,
            `Duur: ${formatElapsed(period.end - period.start)}`
        ].join("\n");

        return `
            <rect
                x="${blockX}"
                y="${barY}"
                width="${blockWidth}"
                height="${barHeight}"
                rx="2"
                fill="${color}"
                opacity="0.95">
                <title>${escapeHtml(tooltip)}</title>
            </rect>
        `;
    }).join("");

    // Tijdlabels.
    const labels = Array.from({ length: 5 }, (_, index) => {
        const timestamp = start + windowMs * index / 4;
        const date = new Date(timestamp);

        const label = hours >= 24
            ? date.toLocaleString("nl-NL", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            })
            : date.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit"
            });

        const position = x(timestamp);

        return `
            <line
                x1="${position}"
                y1="${barY + barHeight}"
                x2="${position}"
                y2="${barY + barHeight + 6}"
                stroke="currentColor"
                opacity=".4"/>

            <text
                x="${position}"
                y="${barY + barHeight + 25}"
                text-anchor="middle"
                fill="currentColor"
                font-size="11">
                ${label}
            </text>
        `;
    }).join("");

    const currentStatus = history.current_connected === true;

    return `
        <div class="performance-chart">

            <div class="performance-chart-legend">
                <span class="performance-legend-item">
                    <i style="background:#16b981"></i>
                    Verbonden
                </span>

                <span class="performance-legend-item">
                    <i style="background:#ef4444"></i>
                    Niet verbonden
                </span>
            </div>

            <div class="performance-chart-legend">
                <span>
                    Huidige status:
                    <strong class="${currentStatus ? "performance-good" : "performance-error"}">
                        ${currentStatus ? "Verbonden" : "Niet verbonden"}
                    </strong>
                </span>

                <span>${entries.length} geregistreerde perioden</span>
            </div>

            <svg
                viewBox="0 ${0} ${width} ${height}"
                role="img"
                aria-label="Wifi-verbindingsgeschiedenis">

                <line
                    x1="${left}"
                    y1="${barY + barHeight}"
                    x2="${width - right}"
                    y2="${barY + barHeight}"
                    stroke="currentColor"
                    opacity=".2"/>

                ${blocks}
                ${labels}

            </svg>
        </div>
    `;
}



// ==================================================
// WIFI TIMERS
// ==================================================

function updateWifiTimers(content) {
    if (!content) return;

    const now = Date.now();

    content.querySelectorAll("[data-wifi-timer], [data-uptime]").forEach(element => {
        if (element.dataset.placeholder === "true") return;

        const baseMs = Number(element.dataset.baseMs) || 0;
        const startedAt = Number(element.dataset.startedAt) || now;

        const running =
            element.hasAttribute("data-uptime") ||
            element.dataset.running === "true";

        const elapsed = baseMs + (running ? now - startedAt : 0);

        element.textContent = formatElapsed(elapsed);
    });
}
// ==================================================
// SYSTEM PERFORMANCE
// ==================================================

function createSystemOverview(performance) {
    const cpu = performance.cpu ?? {};
    const memory = performance.memory ?? {};
    const storage = performance.storage ?? {};
    const firmware = performance.firmware ?? {};
    const system = performance.system ?? {};

    return `
        <div class="performance-system-grid">

            ${createMetric(
                "CPU-frequentie",
                isValidNumber(cpu.frequency_mhz)
                    ? `${cpu.frequency_mhz} MHz`
                    : "Niet beschikbaar",
                `${cpu.cores ?? "?"} CPU-core(s)`
            )}

            ${createMetric(
                "Chipmodel",
                cpu.chip_model || "Onbekend",
                `Revisie ${cpu.chip_revision ?? "Onbekend"}`
            )}

            ${createMetric(
                "CPU-belasting",
                formatPercent(cpu.usage_percent),
                "Actueel CPU-gebruik"
            )}

            ${createMetric(
                "Heap-gebruik",
                formatPercent(memory.heap_usage_percent),
                `${formatBytes(memory.heap_used)} gebruikt`
            )}

            ${createMetric(
                "Vrije heap",
                formatBytes(memory.heap_free),
                "Beschikbaar werkgeheugen"
            )}

            ${createMetric(
                "Minimale vrije heap",
                formatBytes(memory.heap_min_free),
                "Laagste vrije heap sinds opstart"
            )}

            ${createMetric(
                "Grootste allocatie",
                formatBytes(memory.heap_max_alloc),
                "Grootste aaneengesloten allocatie"
            )}

            ${createMetric(
                "Heap-fragmentatie",
                formatPercent(memory.heap_fragmentation_percent),
                "Indicatieve fragmentatie"
            )}

            ${createMetric(
                "LittleFS-gebruik",
                formatPercent(storage.usage_percent),
                `${formatBytes(storage.used_bytes)} / ${formatBytes(storage.total_bytes)}`
            )}

            ${createMetric(
                "LittleFS vrij",
                formatBytes(storage.free_bytes),
                storage.available ? "Opslag beschikbaar" : "Opslag niet beschikbaar"
            )}

            ${createMetric(
                "Firmwaregrootte",
                formatBytes(firmware.sketch_size),
                "Gebruikte firmware"
            )}

            ${createMetric(
                "Firmware-ruimte vrij",
                formatBytes(firmware.free_sketch_space),
                "Beschikbare firmware-ruimte"
            )}

            <div class="performance-metric">
                <span>Uptime</span>
                <strong
                    data-uptime
                    data-base-ms="${(Number(system.uptime_seconds) || 0) * 1000}"
                    data-started-at="${Date.now()}">
                    ${isValidNumber(system.uptime_seconds)
                        ? formatElapsed(Number(system.uptime_seconds) * 1000)
                        : "Niet beschikbaar"}
                </strong>
                <small>Tijd sinds laatste opstart</small>
            </div>

            ${createMetric(
                "Resetreden",
                system.reset_reason || "Onbekend",
                `SDK: ${system.sdk_version || "Onbekend"}`
            )}

            ${createMetric(
                "Arduino core",
                system.arduino_core_version || "Onbekend",
                `Flash: ${formatBytes(system.flash_size)}`
            )}

        </div>
    `;
}

// ==================================================
// API CHART HELPERS
// ==================================================

function getChartBuckets(minutes, count) {
    const now = Date.now();
    const windowMs = minutes * 60000;
    const start = now - windowMs;
    const bucketDuration = windowMs / count;

    return {
        now,
        start,
        windowMs,
        bucketDuration,
        buckets: Array.from({ length: count }, (_, index) => ({
            timestamp: start + (index + 0.5) * bucketDuration,
            total: 0,
            count: 0
        }))
    };
}

function getChartSamples(endpoints, selected, start, now) {
    const samples = [];

    getSelectedEndpoints(endpoints, selected).forEach(([, endpoint]) => {
        (endpoint.samples ?? []).forEach(sample => {
            const timestamp = Number(sample.timestamp);
            const duration = Number(sample.duration_ms);

            if (!Number.isFinite(timestamp) || timestamp < start || timestamp > now)
                return;

            if (!Number.isFinite(duration) || duration < 0)
                return;

            samples.push({ timestamp, duration });
        });
    });

    return samples;
}

// ==================================================
// API RESPONSE TIME CHART
// ==================================================

function createLineChart(endpoints, selected, minutes) {
    const bucketCount = Math.min(60, Math.max(10, minutes * 2));

    const {
        now,
        start,
        windowMs,
        bucketDuration,
        buckets
    } = getChartBuckets(minutes, bucketCount);

    getChartSamples(endpoints, selected, start, now).forEach(sample => {
        const index = Math.min(
            bucketCount - 1,
            Math.floor((sample.timestamp - start) / bucketDuration)
        );

        buckets[index].total += sample.duration;
        buckets[index].count++;
    });

    const points = buckets.filter(bucket => bucket.count > 0);

    if (!points.length) {
        return `<p class="performance-empty">Geen meetpunten in deze periode.</p>`;
    }

    const width = 900;
    const height = 300;

    const left = 70;
    const right = 25;
    const top = 25;
    const bottom = 45;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const values = points.map(point => point.total / point.count);
    const maxValue = Math.max(100, ...values) * 1.15;

    const x = timestamp =>
        left + ((timestamp - start) / windowMs) * plotWidth;

    const y = value =>
        top + plotHeight - (value / maxValue) * plotHeight;

    let grid = "";

    for (let i = 0; i <= 4; i++) {
        const value = maxValue * i / 4;
        const position = y(value);

        grid += `
            <line
                x1="${left}"
                y1="${position}"
                x2="${width - right}"
                y2="${position}"
                stroke="currentColor"
                opacity=".12"/>

            <text
                x="${left - 10}"
                y="${position + 4}"
                text-anchor="end"
                fill="currentColor"
                font-size="11">
                ${Math.round(value)} ms
            </text>
        `;
    }

    const linePoints = points.map(point =>
        `${x(point.timestamp)},${y(point.total / point.count)}`
    ).join(" ");

    const circles = points.map(point => {
        const average = point.total / point.count;

        return `
            <circle
                cx="${x(point.timestamp)}"
                cy="${y(average)}"
                r="3.5"
                fill="#4f8cff">
                <title>
                    Gemiddeld: ${formatDuration(average)}
                    (${point.count} requests)
                </title>
            </circle>
        `;
    }).join("");

    const labels = Array.from({ length: 5 }, (_, index) => {
        const timestamp = start + windowMs * index / 4;
        const label = new Date(timestamp).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit"
        });

        return `
            <text
                x="${x(timestamp)}"
                y="${height - 12}"
                text-anchor="middle"
                fill="currentColor"
                font-size="11">
                ${label}
            </text>
        `;
    }).join("");

    return `
        <div class="performance-chart">

            <div class="performance-chart-legend">
                <span class="performance-legend-item">
                    <i style="background:#4f8cff"></i>
                    Gemiddelde responstijd
                </span>
            </div>

            <svg
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Gemiddelde API responstijd">

                ${grid}

                <polyline
                    points="${linePoints}"
                    fill="none"
                    stroke="#4f8cff"
                    stroke-width="3"
                    stroke-linejoin="round"
                    stroke-linecap="round"/>

                ${circles}
                ${labels}
            </svg>
        </div>
    `;
}

// ==================================================
// REQUEST ACTIVITY CHART
// ==================================================


function createRequestChart(endpoints, selected, minutes) {
    const bucketCount = 10;

    const {
        now,
        start,
        bucketDuration,
        buckets
    } = getChartBuckets(minutes, bucketCount);

    getChartSamples(endpoints, selected, start, now).forEach(sample => {
        const index = Math.min(
            bucketCount - 1,
            Math.floor((sample.timestamp - start) / bucketDuration)
        );

        buckets[index].count++;
    });

    const values = buckets.map(bucket => bucket.count);
    const max = Math.max(1, ...values);

    const width = 900;
    const height = 260;

    const barWidth = 55;
    const gap = (width - 80 - bucketCount * barWidth) / (bucketCount - 1);

    const blockSeconds = bucketDuration / 1000;
    const blockDurationText = formatBlockDuration(blockSeconds);

    const bars = buckets.map((bucket, index) => {
        const barHeight = bucket.count / max * 145;
        const x = 40 + index * (barWidth + gap);

        const timestamp = start + (index + 0.5) * bucketDuration;
        const label = new Date(timestamp).toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit"
        });

        return `
            <rect
                x="${x}"
                y="${175 - barHeight}"
                width="${barWidth}"
                height="${Math.max(1, barHeight)}"
                rx="5"
                fill="#16b981">
                <title>${bucket.count} requests</title>
            </rect>

            <text
                x="${x + barWidth / 2}"
                y="${165 - barHeight}"
                text-anchor="middle"
                fill="currentColor"
                font-size="12">
                ${bucket.count}
            </text>

            <text
                x="${x + barWidth / 2}"
                y="200"
                text-anchor="middle"
                fill="currentColor"
                font-size="10">
                ${label}
            </text>
        `;
    }).join("");

    return `
        <div class="performance-chart">
            <div class="performance-chart-legend">
                <span class="performance-legend-item">
                    <i style="background:#16b981"></i>
                    Aantal requests
                </span>

                <span class="performance-muted">
                    Elk blok vertegenwoordigt ${blockDurationText}
                </span>
            </div>

            <svg
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Aantal API requests per tijdsblok">

                <line
                    x1="30"
                    y1="175"
                    x2="880"
                    y2="175"
                    stroke="currentColor"
                    opacity=".2"/>

                ${bars}
            </svg>
        </div>

        <p class="performance-muted">
            Totaal aantal requests per tijdsinterval.
            Elk blok beslaat ${blockDurationText}.
        </p>
    `;
}


// ==================================================
// API OVERVIEW
// ==================================================

function createOverview(endpoints, selected) {
    const entries = getSelectedEndpoints(endpoints, selected);

    const requests = entries.reduce((sum, [, endpoint]) =>
        sum + (Number(endpoint.requests) || 0), 0);

    const errors = entries.reduce((sum, [, endpoint]) =>
        sum + (Number(endpoint.errors) || 0), 0);

    const successful = requests - errors;

    const duration = entries.reduce((sum, [, endpoint]) =>
        sum + (Number(endpoint.average_duration_ms) || 0) *
        (Number(endpoint.requests) || 0), 0);

    const bytes = entries.reduce((sum, [, endpoint]) =>
        sum + (Number(endpoint.total_response_bytes) || 0), 0);

    return {
        requests,
        errors,
        successful,
        successRate: requests ? successful / requests * 100 : 0,
        averageDuration: requests ? duration / requests : 0,
        bytes
    };
}

// ==================================================
// ENDPOINT TABLE
// ==================================================

function createEndpointTable(endpoints) {
    const rows = Object.entries(endpoints).map(([name, data]) => `
        <tr>
            <td>${escapeHtml(name)}</td>
            <td>${Number(data.requests) || 0}</td>
            <td>${Number(data.errors) || 0}</td>
            <td>${formatPercent(data.success_rate)}</td>
            <td>${formatDuration(data.average_duration_ms)}</td>
            <td>${formatDuration(data.p95_duration_ms)}</td>
            <td>${formatDuration(data.min_duration_ms)}</td>
            <td>${formatDuration(data.max_duration_ms)}</td>
            <td>${Number(data.requests_per_minute) || 0}</td>
            <td>${formatBytes(data.average_response_bytes)}</td>
        </tr>
    `).join("");

    return `
        <div class="performance-table-scroll">
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Requests</th>
                        <th>Fouten</th>
                        <th>Succes</th>
                        <th>Gemiddeld</th>
                        <th>P95</th>
                        <th>Min.</th>
                        <th>Max.</th>
                        <th>/min</th>
                        <th>Gem. data</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows || `
                        <tr>
                            <td colspan="10">Geen endpointgegevens beschikbaar.</td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

// ==================================================
// HTTP STATUS CODES
// ==================================================

function createStatusOverview(endpoints) {
    const statuses = {};

    Object.values(endpoints).forEach(endpoint => {
        Object.entries(endpoint.status_codes ?? {}).forEach(([status, count]) => {
            statuses[status] = (statuses[status] ?? 0) + (Number(count) || 0);
        });
    });

    const entries = Object.entries(statuses).sort(
        ([a], [b]) => Number(a) - Number(b)
    );

    if (!entries.length) {
        return "<p>Geen HTTP-statuscodes beschikbaar.</p>";
    }

    return `
        <div class="performance-status-list">
            ${entries.map(([status, count]) => `
                <div class="performance-status-item">
                    <strong>${escapeHtml(status)}</strong>
                    <span>${count} requests</span>
                </div>
            `).join("")}
        </div>
    `;
}

// ==================================================
// DASHBOARD RENDERING
// ==================================================

function renderDashboard(content, result, selected, minutes, wifiHours, uptimeHours) {
    const endpoints = result.endpoints ?? {};
    const overview = createOverview(endpoints, selected);

    const performance = result.device_performance;

    const hardwareAvailable =
        result.device_performance_available === true &&
        performance?.success === true;

    const network = performance?.network ?? {};
    const wifiHistory = network.wifi_history ?? {};
    const uptimeHistory = network.uptime_history ?? {};
    const uptimeSeconds = performance?.system?.uptime_seconds ?? 0;

    content.innerHTML = `
        <section class="performance-section">
            <h4>Systeemstatus</h4>
            <p>Hardware, geheugen en opslag van je GeurBot.</p>

            ${hardwareAvailable
                ? createSystemOverview(performance)
                : `<p class="performance-empty">
                    Apparaatmetingen niet beschikbaar.
                    ${escapeHtml(result.device_performance_error || "")}
                   </p>`
            }
        </section>

        <section class="performance-section">
            <h4>Wifi-prestaties</h4>
            <p>Verbindingskwaliteit en netwerkstabiliteit.</p>

            ${hardwareAvailable
                ? createWifiOverview(network, uptimeSeconds)
                : `<p class="performance-empty">Wifi-informatie niet beschikbaar.</p>`
            }
        </section>

        <section class="performance-section">
            <div class="performance-section-heading">
                <div>
                    <h4>Wifi-verbindingsgeschiedenis</h4>
                    <p>Historisch overzicht van verbonden en niet verbonden perioden.</p>
                </div>

                <select id="performance-wifi-range">
                    <option value="1" ${wifiHours === 1 ? "selected" : ""}>1 uur</option>
                    <option value="6" ${wifiHours === 6 ? "selected" : ""}>6 uur</option>
                    <option value="24" ${wifiHours === 24 ? "selected" : ""}>1 dag</option>
                    <option value="168" ${wifiHours === 168 ? "selected" : ""}>7 dagen</option>
                </select>
            </div>

            ${hardwareAvailable
                ? createWifiHistoryChart(wifiHistory, uptimeSeconds, wifiHours)
                : `<p class="performance-empty">Wifi-historie niet beschikbaar.</p>`
            }

            
        </section>
        <section class="performance-section">
            <div class="performance-section-heading">
                <div>
                    <h4>Apparaat uptimegeschiedenis</h4>
                    <p>Historisch overzicht van actieve en offline perioden.</p>
                </div>
            </div>

            ${hardwareAvailable
                ? createUptimeHistoryChart(uptimeHistory, uptimeHours)
                : `<p class="performance-empty">Uptimegeschiedenis niet beschikbaar.</p>`
            }
        </section>
        <section class="performance-section">
            <h4>API-overzicht</h4>
            <p>Prestaties van de communicatie met je GeurBot.</p>

            <div class="performance-summary">
                ${createMetric("Totaal requests", overview.requests, `${selected.size} geselecteerde endpoints`)}
                ${createMetric("Succespercentage", formatPercent(overview.successRate), `${overview.successful} succesvol`)}
                ${createMetric("Gemiddelde latency", formatDuration(overview.averageDuration), "Geselecteerde endpoints")}
                ${createMetric("Mislukte requests", overview.errors, "Fouten en time-outs")}
                ${createMetric("Ontvangen data", formatBytes(overview.bytes), "Totale responsegrootte")}
            </div>
        </section>

        ${createEndpointFilters(endpoints, selected)}

        <section class="performance-section">
            <div class="performance-section-heading">
                <div>
                    <h4>Gemiddelde API-responstijd</h4>
                    <p>Gemiddelde responstijd van alle geselecteerde endpoints.</p>
                </div>

                <select id="performance-time-range">
                    <option value="1" ${minutes === 1 ? "selected" : ""}>1 minuut</option>
                    <option value="5" ${minutes === 5 ? "selected" : ""}>5 minuten</option>
                    <option value="15" ${minutes === 15 ? "selected" : ""}>15 minuten</option>
                    <option value="60" ${minutes === 60 ? "selected" : ""}>1 uur</option>
                </select>
            </div>

            ${createLineChart(endpoints, selected, minutes)}
        </section>

        <section class="performance-section">
            <h4>Request activiteit</h4>
            <p>Totaal aantal requests van de geselecteerde endpoints.</p>
            ${createRequestChart(endpoints, selected, minutes)}
        </section>

        <section class="performance-section">
            <h4>HTTP-statuscodes</h4>
            <p>Verdeling van de ontvangen HTTP-statuscodes.</p>
            ${createStatusOverview(endpoints)}
        </section>

        <section class="performance-section">
            <h4>Endpoint statistieken</h4>
            <p>Gedetailleerde metingen per API-endpoint.</p>
            ${createEndpointTable(endpoints)}
        </section>
    `;
}


function createUptimeHistoryChart(history, hours) {
    if (!history || !Array.isArray(history.entries)) {
        return `<p class="performance-empty">Uptimegeschiedenis niet beschikbaar.</p>`;
    }

    const now = Date.now();
    const lastSeen = Number(history.last_seen) * 1000;
    const windowMs = hours * 60 * 60 * 1000;
    const start = now - windowMs;
    const end = now;

    const width = 1000;
    const height = 190;

    const left = 75;
    const right = 25;
    const plotWidth = width - left - right;

    const barY = 65;
    const barHeight = 55;

    const x = timestamp =>
        left + ((timestamp - start) / windowMs) * plotWidth;

    const toDate = timestamp => new Date(timestamp);

    // Offlineperiodes ophalen.
    const entries = history.entries
        .map(entry => {
            const entryStart = Number(entry.started_at_ms);
            const entryEnd = Number(entry.ended_at_ms);

            if (!Number.isFinite(entryStart) || !Number.isFinite(entryEnd))
                return null;

            const clippedStart = Math.max(start, entryStart);
            const clippedEnd = Math.min(lastSeen, entryEnd, end);

            if (clippedEnd <= clippedStart)
                return null;

            return {
                start: clippedStart,
                end: clippedEnd
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

    // Bekende tijdlijn tot lastSeen.
    const knownEnd = Math.max(start, Math.min(lastSeen, end));
    const knownWidth = Math.max(0, x(knownEnd) - left);

    const onlineBlock = `
        <rect
            x="${left}"
            y="${barY}"
            width="${knownWidth}"
            height="${barHeight}"
            rx="3"
            fill="#16b981"
            opacity="0.95">
            <title>Bekende periode</title>
        </rect>
    `;

    // Onbekende periode tussen lastSeen en nu.
    const unknownStart = Math.max(start, lastSeen);
    const unknownWidth = Math.max(0, x(end) - x(unknownStart));

    const unknownBlock = unknownWidth > 0 ? `
        <defs>
            <pattern
                id="unknownPattern"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#48a584"/>
                <rect width="2" height="8" fill="#48a584"/>
            </pattern>
        </defs>

        <rect
            x="${x(unknownStart)}"
            y="${barY}"
            width="${unknownWidth}"
            height="${barHeight}"
            rx="3"
            fill="url(#unknownPattern)">
            <title>Geen gegevens beschikbaar</title>
        </rect>
    ` : "";

    // Rode blokken: offlineperiodes.
    const offlineBlocks = entries.map(entry => {
        const actualX = x(entry.start);
        const actualWidth = x(entry.end) - actualX;

        const blockWidth = Math.max(2, actualWidth);
        const blockX = Math.max(left, actualX);

        const tooltip = [
            "Apparaat offline",
            `Van: ${toDate(entry.start).toLocaleString("nl-NL")}`,
            `Tot: ${toDate(entry.end).toLocaleString("nl-NL")}`,
            `Duur: ${formatElapsed(entry.end - entry.start)}`
        ].join("\n");

        return `
            <rect
                x="${blockX}"
                y="${barY - 15}"
                width="${Math.min(blockWidth, width - right - blockX)}"
                height="70"
                rx="3"
                fill="#ef4444"
                opacity="0.95"
                style="cursor:pointer">
                <title>${escapeHtml(tooltip)}</title>
            </rect>
        `;
    }).join("");

    // Tijdlabels.
    const labels = Array.from({ length: 5 }, (_, index) => {
        const timestamp = start + windowMs * index / 4;
        const date = toDate(timestamp);

        const label = hours >= 24
            ? date.toLocaleString("nl-NL", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            })
            : date.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit"
            });

        const position = x(timestamp);

        return `
            <line
                x1="${position}"
                y1="${barY + barHeight}"
                x2="${position}"
                y2="${barY + barHeight + 6}"
                stroke="currentColor"
                opacity=".4"/>

            <text
                x="${position}"
                y="${barY + barHeight + 25}"
                text-anchor="middle"
                fill="currentColor"
                font-size="11">
                ${label}
            </text>
        `;
    }).join("");

    const currentStatus = history.current_connected === true;

    return `
        <div class="performance-chart">

            <div class="performance-chart-legend">
                <span class="performance-legend-item">
                    <i style="background:#16b981"></i>
                    Bekend / actief
                </span>

                <span class="performance-legend-item">
                    <i style="background:#ef4444"></i>
                    Offline
                </span>

                <span class="performance-legend-item">
                    <i style="background:#9ca3af"></i>
                    Onbekend
                </span>
            </div>

            <div class="performance-chart-legend">
                <span>
                    Huidige status:
                    <strong class="${currentStatus ? "performance-good" : "performance-error"}">
                        ${currentStatus ? "Actief" : "Offline"}
                    </strong>
                </span>

                <span>${entries.length} offlineperioden</span>
            </div>

            <svg
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Apparaat uptimegeschiedenis">

                ${onlineBlock}
                ${unknownBlock}
                ${offlineBlocks}
                ${labels}

            </svg>
        </div>
    `;
}





// ==================================================
// PERFORMANCE SETTINGS
// ==================================================

export function setupPerformanceSettings({ overlay, getSelectedDevice }) {
    const content = overlay.querySelector("#performance-content");
    const updated = overlay.querySelector("#performance-updated");

    let wifiTimerInterval = null;
    let refreshInterval = null;

    let latestResult = null;

    let selectedRange = 15;
    let selectedWifiRange = 24;
    let selectedUptimeRange = 168;

    let selectedEndpoints = new Set();

    let loading = false;
    let active = false;
    let loadVersion = 0;

    // ==============================================
    // RENDER
    // ==============================================

    function render() {
        if (!latestResult || !content) return;

        renderDashboard(
            content,
            latestResult,
            selectedEndpoints,
            selectedRange,
            selectedWifiRange,
            selectedUptimeRange
        );
    }

    // ==============================================
    // CHANGE EVENTS
    // ==============================================

    content?.addEventListener("change", event => {
        if (event.target.id === "performance-time-range") {
            selectedRange = Number(event.target.value);
            render();
            return;
        }

        if (event.target.id === "performance-wifi-range") {
            selectedWifiRange = Number(event.target.value);
            render();
            return;
        }

        if (event.target.matches("[data-endpoint-filter]")) {
            const name = event.target.dataset.endpointFilter;

            if (event.target.checked) {
                selectedEndpoints.add(name);
            } else {
                selectedEndpoints.delete(name);
            }

            render();
        }
    });

    // ==============================================
    // FILTER BUTTONS
    // ==============================================

    content?.addEventListener("click", event => {
        const button = event.target.closest("[data-filter-action]");

        if (!button || !latestResult) return;

        const names = Object.keys(latestResult.endpoints ?? {});

        if (button.dataset.filterAction === "all") {
            selectedEndpoints = new Set(names);
        } else {
            selectedEndpoints.clear();
        }

        render();
    });

    // ==============================================
    // DATA OPHALEN
    // ==============================================

    async function load() {
        if (!active || !content || loading) return;

        const device = getSelectedDevice();

        if (!device) return;

        loading = true;

        const currentVersion = loadVersion;
        const deviceId = device.id;

        try {
            const result = await fetchDevicePerformance(deviceId);

            if (!active || currentVersion !== loadVersion) return;

            if (!result || !result.success) {
                throw new Error(result?.error ?? "Prestaties ophalen mislukt.");
            }

            //console.log("Performance API:", result);

            const previousNames = new Set(selectedEndpoints);
            const newNames = Object.keys(result.endpoints ?? {});

            if (!latestResult) {
                selectedEndpoints = new Set(newNames);
            } else {
                selectedEndpoints = new Set(
                    newNames.filter(name => previousNames.has(name))
                );
            }

            latestResult = result;

            render();

            if (updated) {
                updated.textContent =
                    `Laatst bijgewerkt: ${formatTime(result.generated_at)}`;
            }
        } catch (error) {
            if (!active || currentVersion !== loadVersion) return;

            console.error("Performance ophalen mislukt:", error);

            content.innerHTML = `
                <p class="performance-error">
                    Fout bij ophalen van prestaties:
                    ${escapeHtml(error.message)}
                </p>
            `;
        } finally {
            loading = false;
        }
    }

    // ==============================================
    // REFRESH
    // ==============================================

    function startRefresh() {
        stopRefresh();

        active = true;

        load();

        refreshInterval = setInterval(load, 5000);

        wifiTimerInterval = setInterval(
            () => updateWifiTimers(content),
            1000
        );
    }

    function stopRefresh() {
        active = false;
        loadVersion++;

        clearInterval(refreshInterval);
        clearInterval(wifiTimerInterval);

        refreshInterval = null;
        wifiTimerInterval = null;
    }

    // ==============================================
    // RESET
    // ==============================================

    function reset() {
        loadVersion++;

        latestResult = null;

        selectedEndpoints.clear();

        selectedRange = 15;
        selectedWifiRange = 24;
        selectedUptimeRange = 168;

        if (content) {
            content.innerHTML =
                "<p>Selecteer een apparaat om de prestaties te bekijken.</p>";
        }

        if (updated) {
            updated.textContent = "Nog geen metingen";
        }
    }

    return {
        load,
        startRefresh,
        stopRefresh,
        reset
    };


}
