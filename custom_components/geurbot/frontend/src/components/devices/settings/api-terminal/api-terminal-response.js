
export function showApiResponse(container, result) {
    const info = container.querySelector("#api-response-info");
    const body = container.querySelector("#api-response-body");
    const headers = container.querySelector("#api-response-headers");
    const copyButton = container.querySelector("#api-copy-response");

    info.textContent = `${result.status} ${result.statusText} | ${result.duration} ms | ${result.size} bytes`;
    info.className = result.success ? "api-response-success" : "api-response-error";

    body.textContent = typeof result.body === "string"
        ? result.body
        : JSON.stringify(result.body, null, 4);

    headers.textContent = JSON.stringify(result.headers, null, 4);
    copyButton.disabled = false;
}


export function showApiError(container, error) {
    const info = container.querySelector("#api-response-info");
    const body = container.querySelector("#api-response-body");
    const headers = container.querySelector("#api-response-headers");

    info.textContent = error.status
        ? `HTTP ${error.status} ${error.statusText ?? ""}`
        : "Request mislukt";

    info.className = "api-response-error";

    body.textContent = [
        error.message,
        error.response ? `\nResponse:\n${error.response}` : "",
        error.stack ? `\nStack:\n${error.stack}` : ""
    ].filter(Boolean).join("\n");

    if (headers) {
        headers.textContent = JSON.stringify(error.headers ?? {}, null, 4);
    }
}
