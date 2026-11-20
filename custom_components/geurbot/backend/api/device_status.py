from aiohttp import web

from ..communication.esp_client import EspClient
from .manager import get_data, send_data, get_performance_stats

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



async def get_device_diagnostics(request, device_manager):

    print("DIAGNOSTICS ROUTE AANGEROEPEN")
    print("Device ID:", request.match_info["device_id"])
    print("Endpoint:", request.match_info["endpoint"])


    device_id = request.match_info["device_id"]
    endpoint = request.match_info["endpoint"]

    allowed_endpoints = {"uptime","memory","storage","reset"}

    if endpoint not in allowed_endpoints:
        return web.json_response(
            {"success": False, "error": "Invalid diagnostics endpoint"},
            status=404
        )

    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await get_data(device, f"/api/diagnostics/{endpoint}")

    if not result["success"]:
        return web.json_response(
            {
                "success": False,
                "error": result.get("error")
                    or result.get("data", {}).get("error")
                    or "Could not retrieve diagnostics",
                "status": result.get("status")
            },
            status=502
        )

    return web.json_response(result["data"])



async def get_device_logs(request, device_manager):
    device_id = request.match_info["device_id"]
    endpoint = request.match_info.get("endpoint", "all")

    allowed_endpoints = {
        "all": "/api/logs",
        "info": "/api/logs/info",
        "warnings": "/api/logs/warnings",
        "errors": "/api/logs/errors"
    }

    if endpoint not in allowed_endpoints:
        return web.json_response(
            {"success": False, "error": "Invalid logs endpoint"},
            status=404
        )

    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await get_data(device, allowed_endpoints[endpoint])

    if not result["success"]:
        return web.json_response(
            {
                "success": False,
                "error": result.get("error") or "Could not retrieve logs",
                "status": result.get("status")
            },
            status=502
        )

    return web.json_response(result["data"])


async def clear_device_errors(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await send_data(
        device,
        "/api/logs/clear",
        method="DELETE"
    )

    if not result["success"]:
        return web.json_response(
            {
                "success": False,
                "error": result.get("error") or "Could not clear errors"
            },
            status=502
        )

    return web.json_response(result["data"])


async def clear_device_logs(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await send_data(
        device,
        "/api/logs/clear-all",
        method="DELETE"
    )

    if not result["success"]:
        return web.json_response(
            {
                "success": False,
                "error": result.get("error") or "Could not clear logs"
            },
            status=502
        )

    return web.json_response(result["data"])


async def get_device_performance(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    stats = get_performance_stats(device.get("hostname", "unknown"))

    esp_result = await get_data(
        device,
        "/api/diagnostics/performance"
    )

    stats["device_performance"] = (
        esp_result["data"] if esp_result["success"] else None
    )

    stats["device_performance_available"] = esp_result["success"]

    if not esp_result["success"]:
        stats["device_performance_error"] = (
            esp_result.get("error")
            or esp_result.get("data", {}).get("error")
            or "Could not retrieve ESP32 performance"
        )



    return web.json_response(stats)
    stats = get_performance_stats(device.get("hostname", "unknown"))
    return web.json_response(stats)


async def restart_device(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await send_data(
        device,
        "/api/device/restart"
    )

    if not result["success"]:
        return web.json_response(
            {"success": False, "error": result.get("error") or "Could not restart device"},
            status=502
        )

    return web.json_response(result["data"])


async def unpair_device(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    data = {
        "client_id": device.get("client_id", ""),
        "token": device.get("token", "")
    }

    if not all(data.values()):
        return web.json_response(
            {"success": False, "error": "Missing device credentials"},
            status=401
        )

    result = await send_data(
        device,
        "/api/security/unpair",
        data=data
    )

    if not result["success"]:
        return web.json_response(
            result.get("data") or {
                "success": False,
                "error": result.get("error") or "Could not unpair device"
            },
            status=502
        )

    return web.json_response(result["data"])


async def factory_reset_device(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    data = {
        "client_id": device.get("client_id", ""),
        "token": device.get("token", "")
    }

    if not all(data.values()):
        return web.json_response(
            {"success": False, "error": "Missing device credentials"},
            status=401
        )

    result = await send_data(
        device,
        "/api/device/factory-reset",
        data=data
    )

    if not result["success"]:
        return web.json_response(
            result.get("data") or {
                "success": False,
                "error": result.get("error") or "Could not reset device"
            },
            status=502
        )

    return web.json_response(
        result["data"],
        status=result.get("status") or 200
    )
