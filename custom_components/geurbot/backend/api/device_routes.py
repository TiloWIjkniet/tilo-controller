from aiohttp import web

from ..api.device_status import (
    get_network_status,
    get_firmware_info,
    get_device_fragrance_status,
    get_device_diagnostics,
    get_device_logs,
    clear_device_errors,
    get_device_performance,
    clear_device_logs,
    restart_device,
    unpair_device,
    factory_reset_device,
    update_device_name,
    get_device_fragrance,
    spray_device_fragrance,
    rename_device_fragrance,
    set_device_fragrance_enabled,
    get_device_fragrance_stats,
    get_device_fragrance_total_sprays,
    get_device_fragrance_uptime,
    get_device_fragrance_firmware_version,
    get_device_fragrances,
    reset_device_fragrance_counter,
    set_device_fragrance_estimated_sprays,
    get_device_fragrance_empty_bottle_value,
    set_device_fragrance_empty_bottle_threshold,
    get_device_fragrance_spray_log
)

def setup_device_routes(app, device_manager):


    app.router.add_get(
        "/api/geurbot/devices/{device_id}/network/status",
        lambda request: get_network_status(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/firmware/esp/info",
        lambda request: get_firmware_info(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/status",
        lambda request: get_device_fragrance_status(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/diagnostics/{endpoint}",
        lambda request: get_device_diagnostics(request, device_manager)
    )

    # LOGS
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/logs",
        lambda request: get_device_logs(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/logs/{endpoint}",
        lambda request: get_device_logs(request, device_manager)
    )

    # CLEAR ERRORS
    app.router.add_delete(
        "/api/geurbot/devices/{device_id}/logs/clear",
        lambda request: clear_device_errors(request, device_manager)
    )

    # CLEAR ALL LOGS
    app.router.add_delete(
        "/api/geurbot/devices/{device_id}/logs/clear-all",
        lambda request: clear_device_logs(request, device_manager)
    )

    # PERFORMANCE
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/performance",
        lambda request: get_device_performance(request, device_manager)
    )

    # MAINTENANCE
    app.router.add_post(
        "/api/geurbot/devices/{device_id}/restart",
        lambda request: restart_device(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/unpair",
        lambda request: unpair_device(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/factory-reset",
        lambda request: factory_reset_device(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices",
        lambda request: get_devices(request, device_manager)
    )

    app.router.add_patch(
        "/api/geurbot/devices/{device_id}/name",
        lambda request: update_device_name(request, device_manager)
    )

    # FRAGRANCES
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/status",
        lambda request: get_device_fragrance_status(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/get",
        lambda request: get_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/spray",
        lambda request: spray_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/rename",
        lambda request: rename_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/set-enabled",
        lambda request: set_device_fragrance_enabled(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/stats",
        lambda request: get_device_fragrance_stats(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/total-sprays",
        lambda request: get_device_fragrance_total_sprays(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/uptime",
        lambda request: get_device_fragrance_uptime(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/firmware-version",
        lambda request: get_device_fragrance_firmware_version(request, device_manager)
    )
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/get-all",
        lambda request: get_device_fragrances(request, device_manager)
    )

        # FRAGRANCES

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/status",
        lambda request: get_device_fragrance_status(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/get-all",
        lambda request: get_device_fragrances(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/get",
        lambda request: get_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/spray",
        lambda request: spray_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/rename",
        lambda request: rename_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/set-enabled",
        lambda request: set_device_fragrance_enabled(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/stats",
        lambda request: get_device_fragrance_stats(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/total-sprays",
        lambda request: get_device_fragrance_total_sprays(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/uptime",
        lambda request: get_device_fragrance_uptime(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/firmware-version",
        lambda request: get_device_fragrance_firmware_version(request, device_manager)
    )

    # SPRAY COUNTER

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/reset-counter",
        lambda request: reset_device_fragrance_counter(request, device_manager)
    )

    app.router.add_put(
        "/api/geurbot/devices/{device_id}/fragrance/estimated-sprays",
        lambda request: set_device_fragrance_estimated_sprays(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/spray-log",
        lambda request: get_device_fragrance_spray_log(request, device_manager)
    )


    # FRAGRANCES

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/status",
        lambda request: get_device_fragrance_status(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/get-all",
        lambda request: get_device_fragrances(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/get",
        lambda request: get_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/spray",
        lambda request: spray_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/rename",
        lambda request: rename_device_fragrance(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/set-enabled",
        lambda request: set_device_fragrance_enabled(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/stats",
        lambda request: get_device_fragrance_stats(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/total-sprays",
        lambda request: get_device_fragrance_total_sprays(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/uptime",
        lambda request: get_device_fragrance_uptime(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/firmware-version",
        lambda request: get_device_fragrance_firmware_version(request, device_manager)
    )

    # SPRAY COUNTER

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/reset-counter",
        lambda request: reset_device_fragrance_counter(request, device_manager)
    )

    app.router.add_put(
        "/api/geurbot/devices/{device_id}/fragrance/estimated-sprays",
        lambda request: set_device_fragrance_estimated_sprays(request, device_manager)
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/spray-log",
        lambda request: get_device_fragrance_spray_log(request, device_manager)
    )

    # EMPTY BOTTLE SENSOR

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/empty-bottle-value",
        lambda request: get_device_fragrance_empty_bottle_value(request, device_manager)
    )

    app.router.add_put(
        "/api/geurbot/devices/{device_id}/fragrance/empty-bottle-threshold",
        lambda request: set_device_fragrance_empty_bottle_threshold(request, device_manager)
    )
