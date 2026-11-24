from aiohttp import web

from ..communication.esp_client import EspClient
from .manager import get_data, send_data, get_performance_stats
from urllib.parse import urlencode

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
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await get_data(device, "/api/device/modules-health")

    if not result["success"]:
        return web.json_response(
            {"success": False, "error": result.get("error") or "Could not retrieve device status"},
            status=502
        )

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

    # Verwijderen uit de RAM van Home Assistant.
    device_manager.remove_device(device_id)

    # Wijziging opslaan in de persistente opslag.
    await device_manager.async_save()

    print(f"[DEVICES] Apparaat {device_id} ontkoppeld en verwijderd.")

    return web.json_response({
        "success": True,
        "message": "Device successfully unpaired and removed"
    })


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

    # Verwijderen uit de RAM van Home Assistant.
    device_manager.remove_device(device_id)

    # Wijziging opslaan in de persistente opslag.
    await device_manager.async_save()

    print(f"[DEVICES] Apparaat {device_id} factory reset en verwijderd.")

    return web.json_response(
        result["data"],
        status=result.get("status") or 200
    )

async def update_device_name(request, device_manager):
    device_id = request.match_info["device_id"]

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"success": False, "error": "Invalid JSON"}, status=400)

    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        return web.json_response({"success": False, "error": "Invalid name"}, status=400)

    device = device_manager.update_device_name(device_id, name.strip())

    if not device:
        return web.json_response({"success": False, "error": "Device not found"}, status=404)

    return web.json_response({"success": True, "name": device["name"]})


async def get_devices(request, device_manager):
    
    devices = device_manager.get_devices()

    public_devices = [
        {
            key: value
            for key, value in device.items()
            if key not in ("token", "client_id")
        }
        for device in devices
    ]

    return web.json_response({

        "success": True,
        "devices": public_devices
    })


async def _proxy_fragrance_request(request, device_manager, method, endpoint):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    data = None

    if method in ("POST", "PUT", "PATCH") and request.can_read_body:
        try:
            data = await request.json()
        except Exception:
            return web.json_response(
                {"success": False, "error": "Invalid JSON"},
                status=400
            )

    result = await send_data(
        device,
        endpoint,
        data=data,
        method=method
    )

    if not result["success"]:
        return web.json_response({
            "success": False,
            "error": result.get("error") or "Fragrance request failed",
            "status": result.get("status")
        }, status=502)

    return web.json_response(
        result["data"],
        status=result.get("status") or 200
    )


async def get_device_fragrance_status(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "GET",
        "/api/device/fragrances/get-all"
    )


async def get_device_fragrance(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/get"
    )


async def spray_device_fragrance(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/spray"
    )


async def rename_device_fragrance(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/rename"
    )


async def set_device_fragrance_enabled(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/set-enabled"
    )


async def get_device_fragrance_stats(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/get-stats"
    )


async def get_device_fragrance_total_sprays(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/get-total-sprays"
    )


async def get_device_fragrance_uptime(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/get-uptime"
    )


async def get_device_fragrance_firmware_version(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/get-firmware-version"
    )


async def reset_device_fragrance_counter(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/reset-counter"
    )


async def set_device_fragrance_estimated_sprays(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "PUT",
        "/api/device/fragrances/set-estimated-sprays"
    )


async def get_device_fragrance_spray_log(request, device_manager):
    mac_address = request.query.get("mac_address")

    if not mac_address:
        return web.json_response(
            {"success": False, "error": "Missing mac_address"},
            status=400
        )

    endpoint = (
        "/api/device/fragrances/get-spray-log?"
        + urlencode({"mac_address": mac_address})
    )

    return await _proxy_fragrance_request(
        request, device_manager, "GET", endpoint
    )

async def get_device_fragrance_empty_bottle_value(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "POST",
        "/api/device/fragrances/get-empty-bottle-value"
    )


async def set_device_fragrance_empty_bottle_threshold(request, device_manager):
    return await _proxy_fragrance_request(
        request, device_manager, "PUT",
        "/api/device/fragrances/set-empty-bottle-threshold"
    )


async def start_firmware_update(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    # Haal de nieuwste firmware-informatie op
    info = await get_data(device, "/api/firmware/esp/info")

    if not info["success"]:
        return web.json_response({
            "success": False,
            "error": "Could not retrieve firmware information"
        }, status=502)

    firmware = info["data"]

    if not firmware.get("update_available"):
        return web.json_response({
            "success": False,
            "error": "NO_UPDATE_AVAILABLE"
        }, status=409)

    # Updategegevens
    data = {
        "client_id": device.get("client_id", ""),
        "token": device.get("token", ""),
        "version": firmware.get("latest", ""),
         "url": "https://raw.githubusercontent.com/TiloWIjkniet/tilo-controller/main/firmware/esp32/version.json"
    }

    if not all(data.values()):
        return web.json_response({
            "success": False,
            "error": "MISSING_UPDATE_DATA"
        }, status=400)

    # Start firmware-update op de ESP32
    result = await send_data(
        device,
        "/api/firmware/esp/update",
        data=data,
        method="POST"
    )

    if not result["success"]:
        return web.json_response(
            result.get("data") or {
                "success": False,
                "error": result.get("error") or "UPDATE_START_FAILED"
            },
            status=502
        )

    return web.json_response(
        result["data"],
        status=result.get("status") or 202
    )


async def get_device_fragrances(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    result = await get_data(
        device,
        "/api/device/fragrances/get-all"
    )

    if not result["success"]:
        return web.json_response(
            {
                "success": False,
                "error": result.get("error") or "Could not retrieve fragrances"
            },
            status=502
        )

    data = result["data"]

    # Ondersteun zowel een lijst als een object met fragrances.
    fragrances = data if isinstance(data, list) else data.get("fragrances")

    if not isinstance(fragrances, list):
        return web.json_response(
            {"success": False, "error": "Invalid fragrance response"},
            status=502
        )

    # Bewaar bestaande Home Assistant-gegevens per MAC-adres.
    existing_fragrances = {
        fragrance["mac_address"]: fragrance
        for fragrance in device.get("fragrances", [])
        if isinstance(fragrance, dict) and fragrance.get("mac_address")
    }

    updated_fragrances = []
    returned_mac_addresses = set()

    for fragrance in fragrances:
        if not isinstance(fragrance, dict):
            continue

        mac_address = fragrance.get("mac_address")

        if not mac_address:
            updated_fragrances.append(fragrance)
            continue

        returned_mac_addresses.add(mac_address)

        existing = existing_fragrances.get(mac_address, {})

        # ESP-gegevens combineren met bestaande Home Assistant-gegevens.
        updated_fragrance = {
            **existing,
            **fragrance
        }

        # Backend-eigen gegevens behouden.
        if "schedule" in existing:
            updated_fragrance["schedule"] = existing["schedule"]

        updated_fragrance["unreachable"] = False

        updated_fragrances.append(updated_fragrance)
    # Behoud geuren die niet door de ESP zijn teruggestuurd.
    for mac_address, fragrance in existing_fragrances.items():
        if mac_address not in returned_mac_addresses:
            fragrance = dict(fragrance)
            fragrance["unreachable"] = True
            updated_fragrances.append(fragrance)

    device_manager.update_device_fragrances(
        device_id,
        updated_fragrances
    )

    return web.json_response({
    "success": True,
    "fragrances": updated_fragrances
}   )


async def get_backend_device_fragrances(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response({"success": False, "error": "Device not found"}, status=404)

    return web.json_response({
        "success": True,
        "fragrances": device.get("fragrances", [])
    })


async def update_backend_device_fragrances(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response({"success": False, "error": "Device not found"}, status=404)

    try:
        data = await request.json()
        fragrances = data.get("fragrances")

        if not isinstance(fragrances, list):
            return web.json_response({"success": False, "error": "Invalid fragrances"}, status=400)

        device_manager.update_device_fragrances(device_id, fragrances)
        await device_manager.async_save()

        return web.json_response({"success": True})

    except Exception as error:
        return web.json_response({"success": False, "error": str(error)}, status=400)


async def delete_backend_device_fragrance(request, device_manager):
    device_id = request.match_info["device_id"]
    mac_address = request.match_info["mac_address"]

    print(f"[FRAGRANCES] Verwijderen: {mac_address} van {device_id}")

    try:
        removed = device_manager.remove_device_fragrance(
            device_id,
            mac_address
        )

        if not removed:
            return web.json_response({
                "success": False,
                "error": "Device or fragrance not found"
            }, status=404)
        await device_manager.async_save()
        print(f"[FRAGRANCES] Geur {mac_address} verwijderd")

        return web.json_response({"success": True})

    except Exception as error:
        print(f"[FRAGRANCES] Verwijderen mislukt: {error}")

        return web.json_response({
            "success": False,
            "error": str(error)
        }, status=500)


import asyncio
async def execute_device_fragrance_spray(device, mac_address, amount=1, interval=2):
    for spray_number in range(amount):
        result = await send_data(
            device,
            "/api/device/fragrances/spray",
            data={"mac_address": mac_address},
            method="POST"
        )

        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error") or "Spray failed",
                "spray_number": spray_number + 1
            }

        if spray_number < amount - 1:
            await asyncio.sleep(interval)

    return {"success": True}