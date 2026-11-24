
import secrets

from ..communication.esp_client import EspClient


async def add_discovered_device(device_manager, device_id, name, ha_url, ha_token):
    if not device_id or not name:
        return {"success": False, "error": "Missing required fields"}, 400

    if not ha_url or not ha_token:
        return {"success": False, "error": "Home Assistant configuration missing"}, 500

    device = device_manager.get_device(device_id)

    if not device:
        return {"success": False, "error": "Device not found"}, 404

    esp = EspClient(device)

    pairing_result = await esp.request("POST", "/api/security/pairing/open")

    if not pairing_result["success"]:
        return {
            "success": False,
            "error": "Could not open pairing window on ESP",
            "details": pairing_result.get("data") or pairing_result.get("error")
        }, 502

    pairing_data = pairing_result.get("data") or {}
    pairing_code = pairing_data.get("pairing_code")

    if not pairing_code:
        return {"success": False, "error": "No pairing code received from ESP"}, 502

    client_id = secrets.token_hex(16)

    result = await esp.request(
        "POST",
        "/api/security/pair",
        data={
            "client_id": client_id,
            "pairing_code": pairing_code,
            "home_assistant_url": ha_url,
            "access_token": ha_token
        }
    )

    if not result["success"]:
        return {
            "success": False,
            "error": (result.get("data") or {}).get("error")
                     or result.get("error")
                     or "Pairing failed",
            "status": result.get("status")
        }, 502

    response_data = result.get("data") or {}

    if (
        not response_data.get("success")
        or not response_data.get("token")
        or response_data.get("client_id") != client_id
    ):
        return {
            "success": False,
            "error": "Invalid pairing response from ESP"
        }, 502

    device["name"] = name.strip()
    device["client_id"] = client_id
    device["token"] = response_data["token"]
    device["paired"] = True

    device_manager.registry.add(device)

    return {
        "success": True,
        "device": {
            "device_id": device_id,
            "name": device["name"],
            "hostname": device.get("hostname"),
            "paired": True
        }
    }, 200
