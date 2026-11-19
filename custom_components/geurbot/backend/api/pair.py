import os
import secrets

from aiohttp import web

from ..communication.esp_client import EspClient


async def add_discovered_device(request, device_manager):
    try:
        data = await request.json()
        device_id = data.get("device_id")
        name = data.get("name")

        if not device_id or not name:
            return web.json_response({"success": False, "error": "Missing required fields"}, status=400)

        device = device_manager.get_device(device_id)

        if not device:
            return web.json_response({"success": False, "error": "Device not found"}, status=404)

        # ha_url = os.getenv("GEURBOT_HOME_ASSISTANT_URL")
        # ha_token = os.getenv("GEURBOT_ACCESS_TOKEN")

        ha_url = "http://127.0.0.1:8000"
        ha_token = "JOUW_OKEN"

        if not ha_url or not ha_token:
            return web.json_response({"success": False, "error": "Home Assistant configuration missing"}, status=500)

        esp = EspClient(device)

        pairing_result = await esp.request("POST", "/api/security/pairing/open")
        print("Pairing open response:", pairing_result)

        if not pairing_result["success"]:
            return web.json_response({"success": False, "error": "Could not open pairing window on ESP", "details": pairing_result.get("error") or pairing_result.get("data")}, status=502)

        pairing_data = pairing_result.get("data") or {}
        pairing_code = pairing_data.get("pairing_code")

        if not pairing_code:
            return web.json_response({"success": False, "error": "No pairing code received from ESP", "details": pairing_data}, status=502)

        client_id = secrets.token_hex(16)

        result = await esp.request("POST", "/api/security/pair", data={"client_id": client_id, "pairing_code": pairing_code, "home_assistant_url": ha_url, "access_token": ha_token})
        print("Pair response from ESP:", result)

        if not result["success"]:
            return web.json_response({"success": False, "error": result.get("data", {}).get("error") or result.get("error") or "Pairing failed", "status": result.get("status")}, status=502)

        response_data = result.get("data") or {}

        if not response_data.get("success") or not response_data.get("token"):
            return web.json_response({"success": False, "error": "Invalid pairing response from ESP", "details": response_data}, status=502)

        device["name"] = name
        device["hostname"] = device.get("hostname")
        device["client_id"] = response_data["client_id"]
        device["token"] = response_data["token"]
        device["paired"] = True

        device_manager.registry.add(device)

        return web.json_response({"success": True, "device": { "device_id": device_id, "name": name, "hostname": device["hostname"], "paired": True }})

    except Exception as error:
        print(f"Pairing error: {error}")
        return web.json_response({"success": False, "error": str(error)}, status=500)