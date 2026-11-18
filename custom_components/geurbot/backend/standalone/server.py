
from aiohttp import web

from ..core.device_manager import DeviceManager


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

    return app


if __name__ == "__main__":
    web.run_app(create_app(), host="127.0.0.1", port=8000)
