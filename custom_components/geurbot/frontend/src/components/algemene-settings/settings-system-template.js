
export function createSystemSettingsTemplate() {
    return `
        <div class="system-settings">

            <!-- INTRODUCTIE -->
            <div class="system-settings-intro">
                <div>
                    <h3>Systeembeheer</h3>
                    <p>
                        Beheer de GeurBot-integratie, gekoppelde apparaten
                        en systeeminstellingen.
                    </p>
                </div>
            </div>


            <!-- INTEGRATIESTATUS -->
            <section class="system-settings-card">

                <div class="system-settings-card-heading">
                    <div>
                        <h4>Integratiestatus</h4>
                        <p>
                            Bekijk de status van de GeurBot-integratie
                            en het aantal gekoppelde apparaten.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="system-action-button"
                        id="system-refresh-status">

                        <i data-lucide="refresh-cw"></i>
                        Vernieuwen

                    </button>
                </div>

                <div
                    class="system-status"
                    id="geurbot-system-status"
                    role="status"
                    aria-live="polite">

                    Status wordt nog niet opgehaald.

                </div>

            </section>


            <!-- INTEGRATIE HERSTARTEN -->
            <section class="system-settings-card">

                <div class="system-settings-card-heading">
                    <div>
                        <h4>Integratie herstarten</h4>
                        <p>
                            Herstart de GeurBot-integratie.
                            Opgeslagen instellingen en apparaten blijven behouden.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    class="system-action-button"
                    id="system-reload">

                    <i data-lucide="rotate-cw"></i>
                    Integratie herstarten

                </button>

            </section>


            <!-- BACK-UP -->
            <section class="system-settings-card">

                <div class="system-settings-card-heading">
                    <div>
                        <h4>Back-up</h4>
                        <p>
                            Download een JSON-back-up van je opgeslagen
                            GeurBot-configuratie.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    class="system-action-button"
                    id="system-backup">

                    <i data-lucide="download"></i>
                    Back-up downloaden

                </button>

            </section>


            <!-- FABRIEKSRESET -->
            <section class="system-settings-card system-danger-card">

                <div class="system-settings-card-heading">
                    <div>
                        <h4>Fabrieksinstellingen</h4>
                        <p>
                            Verwijder de opgeslagen GeurBot-configuratie
                            en ontkoppel alle gekoppelde ESP32-apparaten.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    class="system-action-button system-danger-button"
                    id="system-factory-reset">

                    <i data-lucide="alert-triangle"></i>
                    Fabrieksreset

                </button>


                <!-- BEVESTIGING -->
                <div
                    class="system-reset-confirmation"
                    id="system-reset-confirmation"
                    hidden>

                    <div class="system-reset-warning">

                        <i data-lucide="alert-circle"></i>

                        <div>
                            <strong>
                                Let op: deze actie is definitief.
                            </strong>

                            <p>
                                Alle gekoppelde ESP32-apparaten worden
                                op afstand ontkoppeld. Daarna worden de
                                lokale GeurBot-gegevens verwijderd.
                            </p>
                        </div>

                    </div>


                    <label for="system-reset-input">
                        Typ RESET om de fabrieksreset te bevestigen.
                    </label>

                    <input
                        type="text"
                        id="system-reset-input"
                        autocomplete="off"
                        autocapitalize="characters"
                        spellcheck="false"
                        placeholder="Typ RESET">


                    <div class="system-reset-actions">

                        <button
                            type="button"
                            class="system-action-button"
                            id="system-reset-cancel">

                            Annuleren

                        </button>

                        <button
                            type="button"
                            class="system-action-button system-danger-button"
                            id="system-reset-confirm"
                            disabled>

                            <i data-lucide="trash-2"></i>
                            Fabrieksreset uitvoeren

                        </button>

                    </div>

                </div>

            </section>


            <!-- ACTIEMELDINGEN -->
            <div
                class="system-action-message"
                id="system-action-message"
                role="status"
                aria-live="polite">
            </div>

        </div>
    `;
}
