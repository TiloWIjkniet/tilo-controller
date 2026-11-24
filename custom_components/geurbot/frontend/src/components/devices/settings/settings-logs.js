
import {
    fetchDeviceLogs,
    clearDeviceErrors,
    clearDeviceLogs
} from "../../../services/device-logs-api.js";

import { formatUptime, setText } from "./settings-utils.js";

export function createLogsTemplate() {
    return `
        <section class="settings-card">
            <div class="settings-card-title">
                <span>📋</span><h3>Logs en meldingen</h3>
                <button id="refresh-device-logs" class="logs-refresh-button" type="button" title="Logs vernieuwen" aria-label="Logs vernieuwen">↻</button>
                <span class="settings-refresh" id="settings-logs-loading" hidden>Laden...</span>
            </div>

            <div class="logs-toolbar">
                <div class="logs-filter-section">
                    <div class="logs-section-header">
                        <strong>Logfilters</strong>
                        <span>Filter de weergegeven meldingen</span>
                    </div>

                    <div class="logs-filters">
                        <button class="logs-filter active" data-log-type="all" type="button">Alles</button>
                        <button class="logs-filter" data-log-type="info" type="button">Info</button>
                        <button class="logs-filter" data-log-type="warnings" type="button">Waarschuwingen</button>
                        <button class="logs-filter" data-log-type="errors" type="button">Fouten</button>
                        <button class="logs-filter" data-log-type="all-errors" type="button">Alle fouten</button>
                    </div>
                </div>

                <div class="logs-management">
                    <div class="logs-section-header">
                        <strong>Logbeheer</strong>
                        <span>Logs en fouten verwijderen</span>
                    </div>

                    <div class="logs-actions">
                        <button id="clear-device-errors" type="button">Fouten wissen</button>
                        <button id="clear-device-logs" type="button">Alles wissen</button>
                    </div>
                </div>

                <div class="logs-export">
                    <div class="logs-section-header">
                        <strong>Exporteren</strong>
                        <span>Bewaar je loggegevens</span>
                    </div>

                    <button id="download-device-logs" type="button">⬇ Download logs</button>
                </div>
            </div>

            <div class="logs-summary">
                <span id="logs-count">0 meldingen</span>
                <span id="logs-last-updated">Nog niet bijgewerkt</span>
            </div>

            <div class="logs-list" id="settings-logs-list">
                <div class="logs-empty">Nog geen logs geladen.</div>
            </div>

            <p class="logs-error" id="settings-logs-error" hidden></p>
        </section>
    `;
}

export function setupLogsSettings({ overlay, getSelectedDevice }) {
    let activeLogType = "all";
    let allLogs = [];
    let logsLoading = false;
    let refreshInterval = null;

    // ==================================================
    // FEEDBACKMELDING
    // ==================================================

    function showFeedback(title, message, type = "success") {
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

    // ==================================================
    // LOGS EXTRAHEREN
    // ==================================================

    function extractLogs(response) {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.logs)) return response.logs;
        if (Array.isArray(response?.events)) return response.events;
        if (Array.isArray(response?.data)) return response.data;

        throw new Error(
            "De logs API heeft geen geldige lijst teruggegeven."
        );
    }

    // ==================================================
    // LOGS WEERGEVEN
    // ==================================================

    function renderLogs() {
        const list = overlay.querySelector("#settings-logs-list");

        const filteredLogs = allLogs.filter(log => {
            const type = String(log?.type ?? "").toUpperCase();

            switch (activeLogType) {
                case "all":
                    return true;

                case "info":
                    return type === "LOG" || type === "INFO";

                case "warnings":
                    return type === "WARNING" || type === "WARN";

                case "errors":
                case "all-errors":
                    return type === "ERROR";

                default:
                    return false;
            }
        });

        list.replaceChildren();

        setText(
            overlay,
            "#logs-count",
            `${filteredLogs.length} meldingen`
        );

        if (!filteredLogs.length) {
            const empty = document.createElement("div");
            empty.className = "logs-empty";
            empty.textContent = "Geen logs gevonden.";
            list.appendChild(empty);
            return;
        }

        [...filteredLogs].reverse().forEach(log => {
            const item = document.createElement("article");

            item.className =
                `log-item log-${String(log.type ?? "log").toLowerCase()}`;

            const header = document.createElement("div");
            header.className = "log-item-header";

            const type = document.createElement("span");
            type.className = "log-type";
            type.textContent = log.type ?? "LOG";

            const time = document.createElement("span");
            time.className = "log-time";

            time.textContent = log.actualTime
                ? new Date(log.actualTime).toLocaleString("nl-NL")
                : `Uptime: ${formatUptime((log.uptime ?? 0) / 1000)}`;

            header.append(type, time);
            item.appendChild(header);

            if (log.errorCode) {
                const code = document.createElement("span");
                code.className = "log-code";
                code.textContent = log.errorCode;
                item.appendChild(code);
            }

            const description = document.createElement("strong");
            description.className = "log-description";
            description.textContent = log.description ?? "Geen omschrijving";

            item.appendChild(description);

            if (log.explanation) {
                const explanation = document.createElement("p");
                explanation.className = "log-explanation";
                explanation.textContent = log.explanation;
                item.appendChild(explanation);
            }

            if (log.values && Object.keys(log.values).length) {
                const details = document.createElement("details");
                details.className = "log-details";

                const summary = document.createElement("summary");
                summary.textContent = "Extra gegevens";

                const values = document.createElement("pre");
                values.textContent = JSON.stringify(log.values, null, 2);

                details.append(summary, values);
                item.appendChild(details);
            }

            list.appendChild(item);
        });
    }

    // ==================================================
    // LOGS OPHALEN
    // ==================================================

    async function load(showNotification = false) {
        const device = getSelectedDevice();

        if (!device || overlay.hidden || logsLoading) return;

        logsLoading = true;

        const loading = overlay.querySelector("#settings-logs-loading");
        const errorElement = overlay.querySelector("#settings-logs-error");

        loading.hidden = false;
        errorElement.hidden = true;

        const feedback = showNotification
            ? showFeedback(
                "Logs vernieuwen",
                "De logs worden opgehaald...",
                "loading"
            )
            : null;

        try {
            allLogs = extractLogs(
                await fetchDeviceLogs(device.id, "all")
            );

            renderLogs();

            setText(
                overlay,
                "#logs-last-updated",
                `Bijgewerkt om ${new Date().toLocaleTimeString("nl-NL")}`
            );

            if (feedback) {
                feedback.remove();

                showFeedback(
                    "Logs bijgewerkt",
                    "De nieuwste logs zijn opgehaald.",
                    "success"
                );
            }

        } catch (error) {
            console.error("Fout bij ophalen logs:", error);

            errorElement.textContent = error.message;
            errorElement.hidden = false;

            if (feedback) {
                feedback.remove();

                showFeedback(
                    "Logs ophalen mislukt",
                    error.message || "De logs konden niet worden opgehaald.",
                    "error"
                );
            }

        } finally {
            logsLoading = false;
            loading.hidden = true;
        }
    }

    // ==================================================
    // AUTOMATISCH VERVERSEN
    // ==================================================

    function startRefresh() {
        stopRefresh();
        refreshInterval = setInterval(load, 10000);
    }

    function stopRefresh() {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    // ==================================================
    // FOUTEN WISSEN
    // ==================================================

    async function clearErrors() {
        const device = getSelectedDevice();

        if (!device) return;

        if (!confirm(
            "Weet je zeker dat je alle opgeslagen fouten wilt wissen?"
        )) {
            return;
        }

        const feedback = showFeedback(
            "Fouten wissen",
            "De opgeslagen fouten worden verwijderd...",
            "loading"
        );

        try {
            await clearDeviceErrors(device.id);

            await load();

            feedback.remove();

            showFeedback(
                "Fouten gewist",
                "Alle opgeslagen fouten zijn verwijderd.",
                "success"
            );

        } catch (error) {
            console.error("Fouten wissen mislukt:", error);

            feedback.remove();

            showFeedback(
                "Fouten wissen mislukt",
                error.message || "De fouten konden niet worden verwijderd.",
                "error"
            );
        }
    }

    // ==================================================
    // ALLE LOGS WISSEN
    // ==================================================

    async function clearAll() {
        const device = getSelectedDevice();

        if (!device) return;

        if (!confirm(
            "Weet je zeker dat je ALLE logs wilt wissen?"
        )) {
            return;
        }

        const feedback = showFeedback(
            "Logs wissen",
            "Alle logs worden verwijderd...",
            "loading"
        );

        try {
            await clearDeviceLogs(device.id);

            await load();

            feedback.remove();

            showFeedback(
                "Logs gewist",
                "Alle opgeslagen logs zijn verwijderd.",
                "success"
            );

        } catch (error) {
            console.error("Logs wissen mislukt:", error);

            feedback.remove();

            showFeedback(
                "Logs wissen mislukt",
                error.message || "De logs konden niet worden verwijderd.",
                "error"
            );
        }
    }

    // ==================================================
    // LOGS DOWNLOADEN
    // ==================================================

    function download() {
        if (!allLogs.length) {
            showFeedback(
                "Geen logs beschikbaar",
                "Er zijn momenteel geen logs om te downloaden.",
                "error"
            );

            return;
        }

        try {
            const blob = new Blob(
                [JSON.stringify(allLogs, null, 2)],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download =
                `geurbot-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            showFeedback(
                "Logs gedownload",
                `${allLogs.length} logmeldingen zijn geëxporteerd.`,
                "success"
            );

        } catch (error) {
            console.error("Logs downloaden mislukt:", error);

            showFeedback(
                "Download mislukt",
                error.message || "De logs konden niet worden gedownload.",
                "error"
            );
        }
    }

    // ==================================================
    // EVENT LISTENERS
    // ==================================================

    overlay.querySelectorAll(".logs-filter").forEach(button => {
        button.addEventListener("click", () => {
            activeLogType = button.dataset.logType;

            overlay.querySelectorAll(".logs-filter").forEach(filter => {
                filter.classList.toggle(
                    "active",
                    filter === button
                );
            });

            renderLogs();
        });
    });

    overlay.querySelector("#refresh-device-logs")
        .addEventListener("click", () => load(true));

    overlay.querySelector("#clear-device-errors")
        .addEventListener("click", clearErrors);

    overlay.querySelector("#clear-device-logs")
        .addEventListener("click", clearAll);

    overlay.querySelector("#download-device-logs")
        .addEventListener("click", download);

    // ==================================================
    // RESET
    // ==================================================

    function reset() {
        stopRefresh();

        activeLogType = "all";
        allLogs = [];

        overlay.querySelectorAll(".logs-filter").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.logType === "all"
            );
        });

        setText(overlay, "#logs-count", "0 meldingen");
        setText(overlay, "#logs-last-updated", "Nog niet bijgewerkt");

        overlay.querySelector("#settings-logs-list").innerHTML =
            '<div class="logs-empty">Nog geen logs geladen.</div>';

        overlay.querySelector("#settings-logs-error").hidden = true;
    }

    return {
        load,
        startRefresh,
        stopRefresh,
        reset
    };
}
