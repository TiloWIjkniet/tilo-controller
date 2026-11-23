
import {
    createDeviceHeader,
    createDeviceContent,
    createDiscoveryModal
} from "../components/devices/device-list.js";

import {
    createFragranceHeader,
    createFragranceContent
} from "../components/fragrances/fragrance-list.js";

import {
    createScheduleHeader,
    createScheduleContent
} from "../components/schedule/schedule-list.js";

import {
    createScheduleModal,
    initializeScheduleEvents
} from "../components/schedule/schedule-events.js";

import { createGeneralSettingsTemplate } from "../components/algemene-settings/settings-general-template.js";

export function createApp() {
    return `
        <main class="dashboard">

     
            <div class="dashboard-headers">
                ${createDeviceHeader()}
                ${createFragranceHeader()}
                ${createScheduleHeader()}
            </div>

            <div class="dashboard-content">
                <aside class="sidebar">
                    ${createDeviceContent()}
                </aside>

                <section class="content">
                    ${createFragranceContent()}
                </section>

                <section class="extra-panel">
                    ${createScheduleContent()}
                    ${createScheduleModal()}
                </section>
            </div>

            ${createDiscoveryModal()}

            ${createGeneralSettingsTemplate()}

        </main>
    `;
}