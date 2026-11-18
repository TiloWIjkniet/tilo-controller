import { createDeviceList } from "../components/devices/device-list.js";

export function createApp() {
    return `
        <main class="dashboard">
            <aside class="sidebar">
                <div class="brand">
                    <div>
                        <h1>Tilo Controller</h1>
                        <p>GeurBot beheer</p>
                    </div>
                </div>
                ${createDeviceList()}
            </aside>

        </main>
    `;
}
