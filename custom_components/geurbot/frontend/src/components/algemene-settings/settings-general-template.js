
import { createNotificationsTemplate } from "./settings-notifications-template.js";
import { createSystemSettingsTemplate } from "./settings-system-template.js";


// ==================================================
// ALGEMENE INSTELLINGEN TEMPLATE
// ==================================================

export function createGeneralSettingsTemplate() {
    return `
        <div
            class="general-settings-overlay"
            id="general-settings-overlay"
            hidden
        >
            <section
                class="general-settings-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="general-settings-title"
            >

                <!-- HEADER -->

                <header class="settings-header">
                    <div>
                        <p class="settings-eyebrow">
                            DASHBOARDINSTELLINGEN
                        </p>

                        <h2 id="general-settings-title">
                            Algemene instellingen
                        </h2>

                        <p>
                            Beheer je dashboard en GeurBot-integratie.
                        </p>
                    </div>

                    <button
                        class="settings-close"
                        id="close-general-settings"
                        type="button"
                        aria-label="Venster sluiten"
                    >
                        ×
                    </button>
                </header>


                <!-- TABS -->

                <div class="settings-tabs" role="tablist">

                    <button
                        class="settings-tab active"
                        type="button"
                        role="tab"
                        aria-selected="true"
                        data-general-tab="notifications"
                    >
                        <i data-lucide="bell"></i>
                        Notificaties
                    </button>

                    <button
                        class="settings-tab"
                        type="button"
                        role="tab"
                        aria-selected="false"
                        data-general-tab="system"
                    >
                        <i data-lucide="settings"></i>
                        Systeembeheer
                    </button>

                </div>


                <!-- INHOUD -->

                <div class="settings-content">

                    <div
                        class="settings-panel active"
                        role="tabpanel"
                        data-general-panel="notifications"
                    >
                        ${createNotificationsTemplate()}
                    </div>

           

                </div>


                <!-- FOOTER -->

                <footer class="settings-footer">
                    <span>GeurBot Dashboard</span>
                </footer>

            </section>
        </div>
    `;
}


        //  <div
        //                 class="settings-panel"
        //                 role="tabpanel"
        //                 data-general-panel="system"
        //             >
        //                 ${createSystemSettingsTemplate()}
        //             </div>