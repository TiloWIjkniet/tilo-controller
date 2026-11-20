
export function createApiTerminalTemplate() {
    return `
        <section class="settings-card api-terminal">
            <div class="settings-card-title">
                <span>⌘</span>
                <h3>API-terminal</h3>
            </div>

            <div class="api-terminal-request">
                <select id="api-method">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                </select>

                <input id="api-url" type="text" value="/api/status" placeholder="https://192.168.1.100/api/status">

                <button id="api-send" type="button">Versturen</button>
            </div>

            <div class="settings-field">
                <label for="api-params">Query parameters (JSON)</label>
                <textarea id="api-params" rows="3" placeholder='{"limit": 10}'></textarea>
            </div>

            <div class="settings-field">
                <label for="api-headers">Headers (JSON)</label>
                <textarea id="api-headers" rows="3" placeholder='{"Content-Type": "application/json"}'></textarea>
            </div>

            <div class="settings-field">
                <label for="api-body">Request body (JSON)</label>
                <textarea id="api-body" rows="7" placeholder='{"enabled": true}'></textarea>
            </div>

            <div class="api-terminal-response">
                <div class="settings-card-title">
                    <h3>Response</h3>
                    <button id="api-copy-response" type="button" disabled>Copy</button>
                </div>

                <div id="api-response-info">Nog geen request uitgevoerd.</div>
                <pre id="api-response-body">Response verschijnt hier...</pre>

                <details>
                    <summary>Response headers</summary>
                    <pre id="api-response-headers">-</pre>
                </details>
            </div>

            <div class="api-terminal-history">
                <div class="settings-card-title">
                    <h3>Requestgeschiedenis</h3>
                    <button id="api-clear-history" type="button">Wissen</button>
                </div>
                <div id="api-history-list">Nog geen requests.</div>
            </div>
        </section>
    `;
}
