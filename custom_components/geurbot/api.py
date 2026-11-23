"""Safe generic API command handler for registered GeurBot devices."""
from __future__ import annotations

from urllib.parse import unquote
import re

from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from .esp_client import EspClient

ALLOWED_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}


def validate_endpoint(endpoint: str) -> bool:
    if not isinstance(endpoint, str) or not endpoint.startswith("/"):
        return False
    decoded = unquote(endpoint)
    return not (
        endpoint.startswith("//") or "?" in endpoint or "#" in endpoint
        or "\\" in decoded or ".." in decoded.split("/")
        or any(ord(char) < 32 for char in decoded)
    )


async def async_api_command(hass: HomeAssistant, call: ServiceCall) -> dict:
    """Run a request against a device already stored by this integration."""
    runtime = hass.data.get("geurbot")
    if not runtime:
        raise HomeAssistantError("GeurBot is niet geladen")
    device_id = str(call.data.get("device_id", ""))
    device = runtime["device_manager"].get_device(device_id)
    if device is None:
        raise ServiceValidationError("Onbekend GeurBot-apparaat")
    endpoint = call.data.get("endpoint")
    method = str(call.data.get("method", "GET")).upper()
    payload = call.data.get("payload")
    params = call.data.get("params") or {}
    if method not in ALLOWED_METHODS:
        raise ServiceValidationError(f"HTTP-methode niet toegestaan: {method}")
    if not validate_endpoint(endpoint):
        raise ServiceValidationError("Ongeldig of onveilig API-endpoint")
    if not isinstance(params, dict) or (payload is not None and not isinstance(payload, (dict, list))):
        raise ServiceValidationError("Payload en params moeten JSON-objecten zijn")
    result = await EspClient(hass, device).request(method, endpoint, payload, params)
    if result.get("status") is None:
        raise HomeAssistantError(f"GeurBot niet bereikbaar: {result.get('error', 'onbekende fout')}")
    if not result["success"]:
        raise HomeAssistantError(
            f"ESP32 antwoordde met HTTP {result['status']}: {result.get('data')}"
        )
    return result


def async_register_services(hass: HomeAssistant) -> None:
    """Register GeurBot services used by automations and scripts."""
    async def handle_api_command(call: ServiceCall):
        return await async_api_command(hass, call)

    async def handle_set_schedules(call: ServiceCall) -> None:
        runtime = hass.data.get("geurbot")
        if not runtime:
            raise HomeAssistantError("GeurBot is niet geladen")
        device = runtime["device_manager"].get_device(str(call.data.get("device_id", "")))
        if device is None:
            raise ServiceValidationError("Onbekend GeurBot-apparaat")
        mac = call.data.get("mac_address")
        schedules = call.data.get("schedules")
        if not isinstance(schedules, list):
            raise ServiceValidationError("schedules moet een lijst zijn")
        fragrance = next((item for item in device.get("fragrances", []) if item.get("mac_address") == mac), None)
        if fragrance is None:
            raise ServiceValidationError("Geurmodule niet gevonden op dit apparaat")
        for item in schedules:
            if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not item.get("id"):
                raise ServiceValidationError("Iedere schedule moet een id bevatten")
            if not isinstance(item.get("time"), str) or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", item["time"]):
                raise ServiceValidationError("time moet de vorm HH:MM hebben")
            if not isinstance(item.get("days", []), list) or not item.get("days") or not all(type(day) is int and 0 <= day <= 6 for day in item.get("days", [])):
                raise ServiceValidationError("days moet minimaal één weekdag 0 t/m 6 bevatten")
            if type(item.get("sprays", 1)) is not int or not 1 <= item.get("sprays", 1) <= 20:
                raise ServiceValidationError("sprays moet tussen 1 en 20 liggen")
        fragrance["schedule"] = schedules
        await runtime["store"].async_save_devices(runtime["device_manager"].get_devices())

    async def handle_scan(call: ServiceCall) -> None:
        runtime = hass.data.get("geurbot")
        if not runtime:
            raise HomeAssistantError("GeurBot is niet geladen")
        timeout = max(3, min(60, int(call.data.get("timeout", runtime["entry"].data.get("scan_timeout", 10)))))
        await runtime["device_manager"].scan(timeout)
        await runtime["store"].async_save_devices(runtime["device_manager"].get_devices())

    hass.services.async_register(
        "geurbot", "api_command", handle_api_command,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register("geurbot", "set_schedules", handle_set_schedules)
    hass.services.async_register("geurbot", "scan_devices", handle_scan)
