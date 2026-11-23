
from aiohttp import web

from ..core.device_manager import DeviceManager
from ..api.api_terminal import api_terminal_request
from ..api.pair import add_discovered_device
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
    get_device_fragrance_spray_log,
    start_firmware_update,
    update_backend_device_fragrances,
    get_backend_device_fragrances,
    delete_backend_device_fragrance
)

from ..api.notification_settings import (
    get_notification_settings,
    update_notification_settings
)

from ..notification.notifications import notification_manager
from ..automations.fragrance_monitor import FragranceMonitor
from ..automations.schedule_runner import ScheduleRunner

device_manager = DeviceManager()


async def get_devices(request):
    return web.json_response({
        "success": True,
        "devices": device_manager.get_devices()
    })

async def start_scan(request):
    timeout = int(request.query.get("timeout", 10))

    devices = await device_manager.scan(timeout)

    return web.json_response({
        "success": True,
        "devices": devices
    })


def create_app():
    app = web.Application()


        # BACKGROUND TASKS
    fragrance_monitor = FragranceMonitor(device_manager)
    schedule_runner = ScheduleRunner(device_manager)

    async def start_background_tasks(app):
        await notification_manager.start()
        await fragrance_monitor.start()
        await schedule_runner.start()

        print("[BACKEND] Background tasks gestart")

    async def stop_background_tasks(app):
        await fragrance_monitor.stop()
        await schedule_runner.stop()
        await notification_manager.stop()

        print("[BACKEND] Background tasks gestopt")

    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(stop_background_tasks)

    # DEVICES
    app.router.add_get("/api/devices", get_devices)
    app.router.add_post("/api/scan", start_scan)
    app.router.add_post(
        "/api/devices/add",
        lambda request: add_discovered_device(request, device_manager)
    )

    # NETWORK
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/network/status",
        lambda request: get_network_status(request, device_manager)
    )

    # FIRMWARE
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/firmware/esp/info",
        lambda request: get_firmware_info(request, device_manager)
    )

    # FRAGRANCE
    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/status",
        lambda request: get_device_fragrance_status(request, device_manager)
    )

    # DIAGNOSTICS
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


    # API TERMINAL
    app.router.add_post(
        "/api/geurbot/devices/{device_id}/api-terminal/request",
        lambda request: api_terminal_request(request, device_manager)
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
    app.router.add_post(
        "/api/geurbot/devices/{device_id}/firmware/esp/update",
        lambda request: start_firmware_update(request, device_manager)
    )

        # NOTIFICATIONS
    app.router.add_get(
        "/api/notifications",
        get_notification_settings
    )

    app.router.add_put(
        "/api/notifications",
        update_notification_settings
    )

    app.router.add_get(
        "/api/geurbot/devices/{device_id}/fragrance/backend",
        lambda request: get_backend_device_fragrances(request, device_manager)
    )

    app.router.add_post(
        "/api/geurbot/devices/{device_id}/fragrance/backend/update",
        lambda request: update_backend_device_fragrances(request, device_manager)
    )
    app.router.add_delete(
        "/api/geurbot/devices/{device_id}/fragrance/backend/{mac_address}",
        lambda request: delete_backend_device_fragrance(request, device_manager)
    )
    return app


print("[DEBUG] update_backend_device_fragrances:", update_backend_device_fragrances)
if __name__ == "__main__":
    web.run_app(create_app(), host="127.0.0.1", port=8000)
