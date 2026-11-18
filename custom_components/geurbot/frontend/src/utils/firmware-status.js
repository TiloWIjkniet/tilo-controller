
export function getFirmwareStatus(firmware) {
    if (!firmware?.success || !firmware?.version) {
        return {
            available: false,
            label: "",
            current: null,
            latest: null,
            buildDate: null,
            buildTime: null
        };
    }

    // Placeholder: wordt later door de updatecontrole ingevuld.
    const latest = null;
    const updateAvailable = false;

    return {
        available: updateAvailable,
        label: updateAvailable ? `Update beschikbaar: ${latest}` : "",
        current: firmware.version,
        latest,
        buildDate: firmware.build_date,
        buildTime: firmware.build_time
    };
}
