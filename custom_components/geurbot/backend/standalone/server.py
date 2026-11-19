
from aiohttp import web

from ..core.device_manager import DeviceManager
from ..api.pair import add_discovered_device
from ..api.device_routes import (get_network_status, get_firmware_info, get_device_fragrance_status)
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

    app.router.add_get("/api/devices", get_devices)
    app.router.add_post("/api/scan", start_scan)
    app.router.add_post("/api/devices/add", lambda request: add_discovered_device(request, device_manager))

    app.router.add_get("/api/geurbot/devices/{device_id}/network/status", lambda request: get_network_status(request, device_manager))
    app.router.add_get("/api/geurbot/devices/{device_id}/firmware/esp/info", lambda request: get_firmware_info(request, device_manager))
    app.router.add_get("/api/geurbot/devices/{device_id}/fragrance/status", lambda request: get_device_fragrance_status(request, device_manager))

    return app


if __name__ == "__main__":
    web.run_app(create_app(), host="127.0.0.1", port=8000)
