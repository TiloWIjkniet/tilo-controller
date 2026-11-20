
import {
    createDeviceHeader,
    createDeviceContent,
    createDiscoveryModal
} from "../components/devices/device-list.js";

import {
    createFragranceHeader,
    createFragranceContent
} from "../components/fragrances/fragrance-list.js";

export function createApp() {
    return `
        <main class="dashboard">

            <div class="dashboard-headers">
                ${createDeviceHeader()}
                ${createFragranceHeader()}

                <header class="panel-header extra-header">
                    <div class="panel-header-title">
                        <h2>Extra functies</h2>
                        <p>Toekomstige uitbreidingen</p>
                    </div>
                </header>
            </div>

            <div class="dashboard-content">
                <aside class="sidebar">
                    ${createDeviceContent()}
                </aside>

                <section class="content">
                    ${createFragranceContent()}
                </section>

                <section class="extra-panel">
                    <div class="extra-content"></div>
                </section>
            </div>

            ${createDiscoveryModal()}

        </main>
    `;
}
