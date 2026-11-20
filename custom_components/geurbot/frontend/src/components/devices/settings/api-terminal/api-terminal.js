
import { sendApiRequest } from "./api-terminal-request.js";
import { showApiResponse, showApiError } from "./api-terminal-response.js";
import {
    getApiHistory,
    addApiHistory,
    clearApiHistory
} from "./api-terminal-history.js";

export function setupApiTerminal({ overlay, getSelectedDevice }) {
    const terminal = overlay.querySelector(".api-terminal");
    if (!terminal) return;

    const methodInput = terminal.querySelector("#api-method");
    const urlInput = terminal.querySelector("#api-url");
    const paramsInput = terminal.querySelector("#api-params");
    const headersInput = terminal.querySelector("#api-headers");
    const bodyInput = terminal.querySelector("#api-body");
    const sendButton = terminal.querySelector("#api-send");
    const historyList = terminal.querySelector("#api-history-list");
    const clearHistoryButton = terminal.querySelector("#api-clear-history");
    const copyButton = terminal.querySelector("#api-copy-response");
    const responseBody = terminal.querySelector("#api-response-body");

    function parseJson(input, fallback = {}) {
        if (!input.trim()) return fallback;

        const value = JSON.parse(input);
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Verwacht een JSON-object.");
        }

        return value;
    }

    function renderHistory() {
        const history = getApiHistory();
        historyList.replaceChildren();

        if (!history.length) {
            historyList.textContent = "Nog geen requests.";
            return;
        }

        history.forEach((request, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "api-history-item";
            button.textContent = `${request.method} ${request.url}`;
            button.addEventListener("click", () => {
                methodInput.value = request.method;
                urlInput.value = request.url;
                paramsInput.value = JSON.stringify(request.params ?? {}, null, 4);
                headersInput.value = JSON.stringify(request.headers ?? {}, null, 4);
                bodyInput.value = request.body ? JSON.stringify(request.body, null, 4) : "";
            });

            historyList.append(button);
        });
    }

    async function executeRequest() {
        sendButton.disabled = true;
        sendButton.textContent = "Bezig...";

        try {
            const request = {
                deviceId: getSelectedDevice()?.id,
                method: methodInput.value,
                url: urlInput.value.trim(),
                params: parseJson(paramsInput.value),
                headers: parseJson(headersInput.value),
                body: parseJson(bodyInput.value, null)
            };

            if (!request.deviceId) throw new Error("Geen apparaat geselecteerd.");
            if (!request.url) throw new Error("Vul een endpoint in.");

            const result = await sendApiRequest(request);
            showApiResponse(terminal, result);

            addApiHistory(request);
            renderHistory();
        } catch (error) {
            showApiError(terminal, error);
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = "Versturen";
        }
    }

    sendButton.addEventListener("click", executeRequest);

    urlInput.addEventListener("keydown", event => {
        if (event.key === "Enter") executeRequest();
    });

    clearHistoryButton.addEventListener("click", () => {
        clearApiHistory();
        renderHistory();
    });

    copyButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(responseBody.textContent);
        copyButton.textContent = "Gekopieerd!";
        setTimeout(() => copyButton.textContent = "Copy", 1500);
    });

    renderHistory();
    return { executeRequest };
}
