from aiohttp import web

from ..communication.esp_client import EspClient
from .manager import get_data

async def get_network_status(request, device_manager):
    device_id = request.match_info["device_id"]

    print("Gezocht device:", device_id)
    print("Bekende devices:", device_manager.get_devices())

    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response({"success": False, "error": "Device not found"}, status=404)

    result = await get_data(device, "/api/network/status")

    if not result["success"]:
        return web.json_response({"success": False, "error": result.get("error", "Could not retrieve network status")}, status=502)

    return web.json_response(result["data"])



async def get_firmware_info(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response({"success": False, "error": "Device not found"}, status=404)

    result = await get_data(device, "/api/firmware/esp/info")

    if not result["success"]:
        return web.json_response({"success": False, "error": result.get("error") or result.get("data", {}).get("error", "Could not retrieve firmware info"), "status": result.get("status")}, status=502)

    return web.json_response(result["data"])


async def get_device_fragrance_status(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response({"success": False, "error": "Device not found"}, status=404)

    result = await get_data(device, "/api/device/modules-health")

    if not result["success"]:
        return web.json_response({"success": False, "error": result.get("error") or "Could not retrieve device modules-health", "status": result.get("status")}, status=502)

    return web.json_response(result["data"])