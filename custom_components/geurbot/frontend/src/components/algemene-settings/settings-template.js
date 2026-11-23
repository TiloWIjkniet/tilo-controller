export function createGeneralSettingsTemplate() {
    return `
        <div class="general-settings-overlay" id="general-settings-overlay" hidden>
            <section class="general-settings-modal" role="dialog"
                aria-modal="true" aria-labelledby="general-settings-title">

                <header class="settings-header">
                    <div>
                        <p class="settings-eyebrow">DASHBOARDINSTELLINGEN</p>
                        <h2 id="general-settings-title">Algemene instellingen</h2>
                        <p>Beheer je dashboardvoorkeuren.</p>
                    </div>

                    <button class="settings-close" id="close-general-settings"
                        type="button" aria-label="Venster sluiten">×</button>
                </header>

                <div class="settings-tabs">
                    <button class="settings-tab active" type="button"
                        data-general-tab="notifications">
                        <i data-lucide="bell"></i>
                        Notificaties
                    </button>
                </div>

                <div class="settings-content">
                    <div class="settings-panel active"
                        data-general-panel="notifications">
                        <h3>Notificaties</h3>
                        <p>Beheer welke meldingen je van het dashboard ontvangt.</p>
                    </div>
                </div>

                <footer class="settings-footer">
                    <span>GeurBot Dashboard</span>
                </footer>
            </section>
        </div>
    `;
}