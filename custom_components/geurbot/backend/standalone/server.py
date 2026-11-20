
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
    get_device_performance,
    clear_device_errors,
    clear_device_logs,
    restart_device,
    unpair_device,
    factory_reset_device
)
device_manager = DeviceManager()


async def get_devices(request):
    return web.json_response({
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
    return app


if __name__ == "__main__":
    web.run_app(create_app(), host="127.0.0.1", port=8000)
