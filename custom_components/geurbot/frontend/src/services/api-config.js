const BACKEND = "standalone";

export const API = {
    discovery: BACKEND === "standalone"
        ? "/api/scan"
        : "/api/geurbot/discovery",

    devices: BACKEND === "standalone"
        ? "/api/devices"
        : "/api/geurbot/devices",

    addDevice: BACKEND === "standalone"
        ? "/api/devices"
        : "/api/geurbot/devices"
};