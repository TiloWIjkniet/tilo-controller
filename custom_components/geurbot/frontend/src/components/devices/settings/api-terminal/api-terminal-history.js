
const STORAGE_KEY = "geurbot-api-history";
const MAX_HISTORY = 30;

export function getApiHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
        return [];
    }
}

export function addApiHistory(request) {
    const history = getApiHistory();

    history.unshift({
        ...request,
        timestamp: new Date().toISOString()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function clearApiHistory() {
    localStorage.removeItem(STORAGE_KEY);
}
