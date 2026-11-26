
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
                                Selecteer de apparaten waarop je notificaties wilt ontvangen.
                            </small>
                        </div>

   
                        <div
                            id="notification-destinations"
                            class="notification-destinations-list">

                            <p class="notification-empty-targets">
                                Bestemmingen laden...
                            </p>

                        </div>

                        <small
                            id="notification-destinations-status"
                            class="notification-destinations-status">
                            Bestemmingen laden...
                        </small>


                    </div>


                    <!-- GELUID -->

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


                    <!-- STILLE UREN -->

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
                            <input
                                type="time"
                                id="notification-quiet-start"
                                value="22:00">
                        </div>

                        <div class="notification-time-field">
                            <label for="notification-quiet-end">Eindtijd</label>
                            <input
                                type="time"
                                id="notification-quiet-end"
                                value="08:00">
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
