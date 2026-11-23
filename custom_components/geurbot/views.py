"""Authenticated HTTP compatibility routes for the existing GeurBot frontend."""
from __future__ import annotations

from urllib.parse import unquote

from aiohttp import web
from homeassistant.helpers.http import KEY_HASS, HomeAssistantView
from homeassistant.helpers import device_registry as dr

from .const import DOMAIN
from .backend.api import device_status
from .backend.api.api_terminal import api_terminal_request
from .backend.api.notification_settings import DEFAULT_NOTIFICATION_SETTINGS, merge_settings, validate_settings


class RequestShim:
    """Expose the small aiohttp request interface used by legacy handlers."""
    def __init__(self, request, match_info):
        self._request = request
        self.match_info = match_info
        self.query = request.query
        self.can_read_body = request.can_read_body

    async def json(self):
        return await self._request.json()


class GeurBotApiView(HomeAssistantView):
    url = "/api/geurbot/{path:.*}"
    name = "api:geurbot:compat"
    requires_auth = True

    async def _handle(self, request, method):
        runtime = request.app[KEY_HASS].data.get(DOMAIN)
        if not runtime:
            return self.json({"success": False, "error": "GeurBot niet geladen"}, status_code=503)
        manager = runtime["device_manager"]
        path = "/" + request.match_info.get("path", "").strip("/")
        parts = [unquote(part) for part in path.strip("/").split("/") if part]
        if len(parts) >= 2 and parts[0] == "devices":
            device_id = parts[1]
            tail = parts[2:]
        else:
            return self.json({"success": False, "error": "Onbekende GeurBot-route"}, status_code=404)
        match = {"device_id": device_id}
        handler = None
        if tail == ["network", "status"] and method == "GET": handler = device_status.get_network_status
        elif tail == ["firmware", "esp", "info"] and method == "GET": handler = device_status.get_firmware_info
        elif tail == ["fragrance", "status"] and method == "GET": handler = device_status.get_device_fragrance_status
        elif tail == ["fragrance", "get-all"] and method == "GET": handler = device_status.get_device_fragrances
        elif tail == ["diagnostics", "uptime"] and method == "GET": match["endpoint"]="uptime"; handler=device_status.get_device_diagnostics
        elif tail == ["diagnostics", "memory"] and method == "GET": match["endpoint"]="memory"; handler=device_status.get_device_diagnostics
        elif tail == ["diagnostics", "storage"] and method == "GET": match["endpoint"]="storage"; handler=device_status.get_device_diagnostics
        elif tail == ["diagnostics", "reset"] and method == "GET": match["endpoint"]="reset"; handler=device_status.get_device_diagnostics
        elif tail == ["logs"] and method == "GET": match["endpoint"]="all"; handler=device_status.get_device_logs
        elif len(tail)==2 and tail[0]=="logs" and tail[1] in {"info","warnings","errors"} and method=="GET": match["endpoint"]=tail[1]; handler=device_status.get_device_logs
        elif tail == ["logs", "clear"] and method == "DELETE": handler=device_status.clear_device_errors
        elif tail == ["logs", "clear-all"] and method == "DELETE": handler=device_status.clear_device_logs
        elif tail == ["performance"] and method == "GET": handler=device_status.get_device_performance
        elif tail == ["restart"] and method == "POST": handler=device_status.restart_device
        elif tail == ["unpair"] and method == "POST": handler=device_status.unpair_device
        elif tail == ["factory-reset"] and method == "POST": handler=device_status.factory_reset_device
        elif tail == ["name"] and method == "PATCH": handler=device_status.update_device_name
        elif tail == ["fragrance", "get"] and method == "POST": handler=device_status.get_device_fragrance
        elif tail == ["fragrance", "spray"] and method == "POST": handler=device_status.spray_device_fragrance
        elif tail == ["fragrance", "rename"] and method == "POST": handler=device_status.rename_device_fragrance
        elif tail == ["fragrance", "set-enabled"] and method == "POST": handler=device_status.set_device_fragrance_enabled
        elif tail == ["fragrance", "stats"] and method == "POST": handler=device_status.get_device_fragrance_stats
        elif tail == ["fragrance", "total-sprays"] and method == "POST": handler=device_status.get_device_fragrance_total_sprays
        elif tail == ["fragrance", "uptime"] and method == "POST": handler=device_status.get_device_fragrance_uptime
        elif tail == ["fragrance", "firmware-version"] and method == "POST": handler=device_status.get_device_fragrance_firmware_version
        elif tail == ["fragrance", "reset-counter"] and method == "POST": handler=device_status.reset_device_fragrance_counter
        elif tail == ["fragrance", "estimated-sprays"] and method == "PUT": handler=device_status.set_device_fragrance_estimated_sprays
        elif tail == ["fragrance", "spray-log"] and method == "GET": handler=device_status.get_device_fragrance_spray_log
        elif tail == ["fragrance", "empty-bottle-value"] and method == "POST": handler=device_status.get_device_fragrance_empty_bottle_value
        elif tail == ["fragrance", "empty-bottle-threshold"] and method == "PUT": handler=device_status.set_device_fragrance_empty_bottle_threshold
        elif tail == ["firmware", "esp", "update"] and method == "POST": handler=device_status.start_firmware_update
        elif tail == ["fragrance", "backend"] and method == "GET": handler=device_status.get_backend_device_fragrances
        elif tail == ["fragrance", "backend", "update"] and method == "POST": handler=device_status.update_backend_device_fragrances
        elif len(tail)==3 and tail[:2]==["fragrance","backend"] and method=="DELETE": match["mac_address"]=tail[2]; handler=device_status.delete_backend_device_fragrance
        elif tail == ["api-terminal", "request"] and method == "POST":
            return await api_terminal_request(RequestShim(request, match), manager)
        if handler is None:
            return self.json({"success": False, "error": "Onbekende route of HTTP-methode"}, status_code=404)
        response = await handler(RequestShim(request, match), manager)
        if method != "GET":
            await runtime["store"].async_save_devices(manager.get_devices())
            coordinator = runtime["coordinators"].get(device_id)
            if manager.get_device(device_id) is None:
                runtime["coordinators"].pop(device_id, None)
                device_registry = dr.async_get(request.app[KEY_HASS])
                if device_entry := device_registry.async_get_device({(DOMAIN, device_id)}):
                    device_registry.async_remove_device(device_entry.id)
            elif coordinator:
                for adder in runtime["entity_adders"].values():
                    adder(coordinator)
        return response

    async def get(self, request, path): return await self._handle(request, "GET")
    async def post(self, request, path): return await self._handle(request, "POST")
    async def put(self, request, path): return await self._handle(request, "PUT")
    async def patch(self, request, path): return await self._handle(request, "PATCH")
    async def delete(self, request, path): return await self._handle(request, "DELETE")


class GeurBotRootApiView(HomeAssistantView):
    url = "/api/{resource:geurbot|devices|scan|notifications}"
    name = "api:geurbot:root"
    requires_auth = True

    async def get(self, request, resource):
        runtime = request.app[KEY_HASS].data.get(DOMAIN)
        if not runtime: return self.json({"success": False, "error": "GeurBot niet geladen"}, status_code=503)
        if resource == "devices":
            public_devices = [
                {key: value for key, value in device.items() if key not in {"token", "client_id"}}
                for device in runtime["device_manager"].get_devices()
            ]
            return self.json({"success": True, "devices": public_devices})
        if resource == "notifications":
            settings = runtime["store"].data.get("notification_settings") or DEFAULT_NOTIFICATION_SETTINGS
            return self.json(settings)
        return self.json({"success": False, "error": "Onbekende route"}, status_code=404)

    async def post(self, request, resource):
        runtime = request.app[KEY_HASS].data.get(DOMAIN)
        if not runtime: return self.json({"success": False, "error": "GeurBot niet geladen"}, status_code=503)
        manager = runtime["device_manager"]
        if resource == "scan":
            try: timeout = max(3, min(60, int(request.query.get("timeout", str(runtime["entry"].data.get("scan_timeout", 10))))))
            except ValueError: timeout = 10
            devices = await manager.scan(timeout)
            await runtime["store"].async_save_devices(manager.get_devices())
            return self.json({"success": True, "devices": devices})
        return self.json({"success": False, "error": "Onbekende route"}, status_code=404)

    async def put(self, request, resource):
        runtime = request.app[KEY_HASS].data.get(DOMAIN)
        if not runtime or resource != "notifications":
            return self.json({"success": False, "error": "Onbekende route"}, status_code=404)
        try:
            data = await request.json()
            if not isinstance(data, dict): raise ValueError("Expected a JSON object")
            current = runtime["store"].data.get("notification_settings") or DEFAULT_NOTIFICATION_SETTINGS
            settings = merge_settings(merge_settings(DEFAULT_NOTIFICATION_SETTINGS, current), data)
            validate_settings(settings)
            runtime["store"].data["notification_settings"] = settings
            await runtime["store"].async_save()
            return self.json({"success": True, "settings": settings})
        except (ValueError, TypeError, KeyError) as err:
            return self.json({"success": False, "error": str(err)}, status_code=400)


class GeurBotDevicesAddView(HomeAssistantView):
    url = "/api/devices/add"
    name = "api:geurbot:devices:add"
    requires_auth = True

    async def post(self, request):
        runtime = request.app[KEY_HASS].data.get(DOMAIN)
        if not runtime: return self.json({"success": False, "error": "GeurBot niet geladen"}, status_code=503)
        try: data = await request.json()
        except ValueError: return self.json({"success": False, "error": "Ongeldige JSON"}, status_code=400)
        device_id, name = data.get("device_id"), data.get("name")
        device = runtime["device_manager"].get_device(device_id) if device_id else None
        if not device: return self.json({"success": False, "error": "Apparaat niet gevonden"}, status_code=404)
        # Pairing handshake needs a real HA callback credential. Never use the
        # placeholder token that was hardcoded in the old standalone server.
        return self.json({
            "success": False,
            "error": "Pairing is nog niet beschikbaar: de oude server gebruikte een hardcoded placeholder-token. De ESP32 API blijft ongewijzigd; configureer eerst de callback-authenticatie.",
        }, status_code=501)
