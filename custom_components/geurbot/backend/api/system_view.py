
"""Administrative system actions for the GeurBot integration."""

import asyncio
import json
from copy import deepcopy
from datetime import datetime, timezone

from aiohttp import web

from homeassistant.helpers.http import (
    KEY_HASS,
    KEY_HASS_USER,
    HomeAssistantView,
)
from homeassistant.helpers import device_registry as dr

from .const import DOMAIN
from .storage import DEFAULT_DATA
from .backend.communication.esp_client import send_data


class GeurBotSystemView(HomeAssistantView):
    url = "/api/geurbot-system/{action}"
    name = "api:geurbot:system"
    requires_auth = True

    def _get_runtime(self, request):
        hass = request[KEY_HASS]
        runtime = hass.data.get(DOMAIN)

        if not runtime:
            return None, None

        return hass, runtime

    def _require_admin(self, request):
        user = request.get(KEY_HASS_USER)
        return bool(user and user.is_admin)

    async def _handle(self, request):
        if not self._require_admin(request):
            return web.json_response(
                {"success": False, "error": "Administrator privileges required"},
                status=403
            )

        hass, runtime = self._get_runtime(request)

        if not runtime:
            return web.json_response(
                {"success": False, "error": "GeurBot integration is not loaded"},
                status=503
            )

        action = request.match_info["action"]

        if action == "status" and request.method == "GET":
            return await self._status(runtime)

        if action == "backup" and request.method == "GET":
            return await self._backup(runtime)

        if action == "reload" and request.method == "POST":
            return await self._reload(hass, runtime)

        if action == "factory-reset" and request.method == "POST":
            return await self._factory_reset(request, hass, runtime)

        return web.json_response(
            {"success": False, "error": "Unknown system action"},
            status=404
        )

    async def _status(self, runtime):
        manager = runtime.get("device_manager")
        devices = manager.get_devices() if manager else []

        return web.json_response({
            "success": True,
            "loaded": True,
            "device_count": len(devices),
        })

    async def _backup(self, runtime):
        store = runtime.get("store")

        if not store:
            return web.json_response(
                {"success": False, "error": "Storage is unavailable"},
                status=503
            )

        backup = {
            "backup_version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "integration": DOMAIN,
            "data": deepcopy(store.data),
        }

        content = json.dumps(
            backup,
            indent=2,
            ensure_ascii=False,
        )

        return web.Response(
            text=content,
            content_type="application/json",
            headers={
                "Content-Disposition": 'attachment; filename="geurbot-backup.json"',
                "Cache-Control": "no-store",
            },
        )

    async def _reload(self, hass, runtime):
        entry = runtime.get("entry")

        if not entry:
            return web.json_response(
                {"success": False, "error": "Config entry not found"},
                status=500
            )

        entry_id = entry.entry_id

        async def reload_later():
            await asyncio.sleep(1)
            await hass.config_entries.async_reload(entry_id)

        hass.async_create_task(reload_later())

        return web.json_response({
            "success": True,
            "message": "GeurBot reload scheduled",
        })

    async def _factory_reset(self, request, hass, runtime):
        try:
            data = await request.json()
        except Exception:
            return web.json_response(
                {"success": False, "error": "Invalid JSON"},
                status=400
            )

        if data.get("confirmation") != "RESET":
            return web.json_response(
                {"success": False, "error": "Confirmation missing"},
                status=400
            )

        manager = runtime.get("device_manager")
        store = runtime.get("store")

        if not manager or not store:
            return web.json_response(
                {"success": False, "error": "GeurBot runtime is incomplete"},
                status=503
            )

        devices = manager.get_devices()
        failed_devices = []

        # Eerst alle ESP32-apparaten op afstand ontkoppelen.
        # Lokale gegevens blijven behouden als één ontkoppeling mislukt.
        for device in devices:
            device_id = str(
                device.get("device_id") or device.get("id") or "unknown"
            )

            credentials = {
                "client_id": device.get("client_id", ""),
                "token": device.get("token", ""),
            }

            if not all(credentials.values()):
                failed_devices.append({
                    "device_id": device_id,
                    "error": "Missing device credentials",
                })
                continue

            try:
                result = await send_data(
                    device,
                    "/api/security/unpair",
                    data=credentials,
                    method="POST",
                )

                if not result.get("success"):
                    failed_devices.append({
                        "device_id": device_id,
                        "error": result.get("error") or "Unpair failed",
                    })

            except Exception as error:
                failed_devices.append({
                    "device_id": device_id,
                    "error": str(error),
                })

        if failed_devices:
            return web.json_response({
                "success": False,
                "error": (
                    "Reset afgebroken: niet alle ESP32-apparaten "
                    "konden worden ontkoppeld. Lokale gegevens zijn behouden."
                ),
                "failed_devices": failed_devices,
            }, status=502)

        # Alle ESP32-apparaten zijn ontkoppeld.
        # Verwijder nu de bijbehorende Home Assistant-apparaatregistraties.
        device_registry = dr.async_get(hass)

        for device in devices:
            device_id = str(
                device.get("device_id") or device.get("id") or ""
            )

            if not device_id:
                continue

            registered_device = device_registry.async_get_device(
                identifiers={(DOMAIN, device_id)}
            )

            if registered_device:
                device_registry.async_remove_device(
                    registered_device.id
                )

        # Reset de runtime-manager en de persistente opslag.
        for device in devices:
            device_id = str(
                device.get("device_id") or device.get("id") or ""
            )
            if device_id:
                manager.remove_device(device_id)

        store.data = deepcopy(DEFAULT_DATA)
        await store.async_save()

        entry = runtime.get("entry")
        entry_id = entry.entry_id if entry else None

        if entry_id:
            async def reload_later():
                await asyncio.sleep(1)
                await hass.config_entries.async_reload(entry_id)

            hass.async_create_task(reload_later())

        return web.json_response({
            "success": True,
            "message": "Factory reset completed",
            "unpaired_devices": len(devices),
        })

    async def get(self, request):
        return await self._handle(request)

    async def post(self, request):
        return await self._handle(request)
