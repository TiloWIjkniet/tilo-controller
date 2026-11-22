import { createGeneralTemplate } from "./settings-general.js";
import { createDevicesTemplate } from "./settings-devices.js";
import { createLogsTemplate } from "./settings-logs.js";
import { createMaintenanceTemplate } from "./settings-maintenance.js";
import { createApiTerminalTemplate } from "./api-terminal/api-terminal-template.js";
import { createPerformanceTemplate } from "./settings-performance.js";
export function createSettingsTemplate() {
    return `
        <div class="device-settings-overlay" id="device-settings-overlay" hidden>
            <section class="device-settings-modal" role="dialog" aria-modal="true" aria-labelledby="device-settings-title">
                <header class="settings-header">
                    <div>
                        <p class="settings-eyebrow">APPARAATBEHEER</p>
                        <h2 id="device-settings-title">GeurBot instellingen</h2>
                        <p>Beheer de gegevens van je apparaat.</p>
                    </div>
                    <button class="settings-close" id="close-device-settings" type="button" aria-label="Venster sluiten">×</button>
                </header>

                <div class="settings-tabs">
                    <button class="settings-tab active" type="button" data-tab="general"><span>⚙</span> Algemeen</button>
                    <button class="settings-tab" type="button" data-tab="fragrances"><span>🌸</span> Geuren</button>
                    <button class="settings-tab" type="button" data-tab="logs"><span>📋</span> Logs</button>
                    <button class="settings-tab" type="button" data-tab="performance"><span>📊</span> Prestaties</button>
                    <button class="settings-tab" type="button" data-tab="maintenance"><span>🛠</span> Onderhoud</button>
                    <button class="settings-tab" type="button" data-tab="api-terminal"><span>⌘</span> API-terminal</button>
                </div>

                <div class="settings-content">
                    <div class="settings-panel active" data-panel="general">${createGeneralTemplate()}</div>
                    <div class="settings-panel" data-panel="fragrances" hidden>${createDevicesTemplate()}</div>
                    <div class="settings-panel" data-panel="logs" hidden>${createLogsTemplate()}</div>
                    <div class="settings-panel" data-panel="performance" hidden>${createPerformanceTemplate()}</div>
                    <div class="settings-panel" data-panel="maintenance" hidden>${createMaintenanceTemplate()}</div>
                    <div class="settings-panel" data-panel="api-terminal" hidden>${createApiTerminalTemplate()}</div>
                    
                </div>

                <footer class="settings-footer"><span>GeurBot Dashboard</span></footer>
            </section>
        </div>
    `;
}
