from aiohttp import web

from .device_status import (
    get_network_status,
    get_firmware_info,
    get_device_fragrance_status
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