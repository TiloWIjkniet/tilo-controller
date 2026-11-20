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

    return {
        available: firmware.update_available ?? false,
        label: firmware.update_available ? `Update beschikbaar: ${firmware.latest}` : "",
        current: firmware.version,
        latest: firmware.latest,
        buildDate: firmware.build_date,
        buildTime: firmware.build_time
    };
}