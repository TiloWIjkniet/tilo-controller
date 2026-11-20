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