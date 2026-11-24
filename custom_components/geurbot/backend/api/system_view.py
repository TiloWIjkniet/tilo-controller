
"""Administrative system actions for the GeurBot integration."""

import asyncio
import json
import logging
from copy import deepcopy
from datetime import datetime, timezone

from aiohttp import web

from homeassistant.exceptions import Unauthorized
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.http import HomeAssistantView, KEY_HASS

from ...const import DOMAIN
from ...storage import DEFAULT_DATA
from .manager import send_data


_LOGGER = logging.getLogger(__name__)


class GeurBotSystemView(HomeAssistantView):
    """Handle administrative GeurBot system actions."""

    url = "/api/geurbot-system/{action}"
    name = "api:geurbot:system"
    requires_auth = True

    def _get_runtime(self, request):
        """Return Home Assistant and the GeurBot runtime."""
        hass = request.app[KEY_HASS]
        runtime = hass.data.get(DOMAIN)

        return hass, runtime

    def _require_admin(self, request):
        """Ensure the current user is an administrator."""
        user = request["hass_user"]

        if not user.is_admin:
            raise Unauthorized()

    async def _handle(self, request):
        """Handle a system action."""
        self._require_admin(request)

        hass, runtime = self._get_runtime(request)

        if not runtime:
            return web.json_response(
                {
                    "success": False,
                    "error": "GeurBot integration is not loaded",
                },
                status=503,
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
            {
                "success": False,
                "error": "Unknown system action",
            },
            status=404,
        )

    async def _status(self, runtime):
        """Return the integration status."""
        manager = runtime.get("device_manager")

        devices = manager.get_devices() if manager else []

        return web.json_response(
            {
                "success": True,
                "loaded": True,
                "device_count": len(devices),
            }
        )

    async def _backup(self, runtime):
        """Create a JSON backup of the integration storage."""
        store = runtime.get("store")

        if not store:
            return web.json_response(
                {
                    "success": False,
                    "error": "Storage is unavailable",
                },
                status=503,
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
                "Content-Disposition": (
                    'attachment; filename="geurbot-backup.json"'
                ),
                "Cache-Control": "no-store",
            },
        )

    async def _reload(self, hass, runtime):
        """Reload the GeurBot config entry."""
        entry = runtime.get("entry")

        if not entry:
            return web.json_response(
                {
                    "success": False,
                    "error": "Config entry not found",
                },
                status=500,
            )

        entry_id = entry.entry_id

        async def reload_later():
            """Reload after the HTTP response has been sent."""
            await asyncio.sleep(1)

            try:
                await hass.config_entries.async_reload(entry_id)
            except Exception:
                _LOGGER.exception("Failed to reload GeurBot")

        hass.async_create_task(reload_later())

        return web.json_response(
            {
                "success": True,
                "message": "GeurBot reload scheduled",
            }
        )

    async def _factory_reset(self, request, hass, runtime):
        """Unpair all ESP32 devices and reset local integration data."""

        try:
            data = await request.json()
        except (json.JSONDecodeError, ValueError):
            return web.json_response(
                {
                    "success": False,
                    "error": "Invalid JSON",
                },
                status=400,
            )

        if not isinstance(data, dict):
            return web.json_response(
                {
                    "success": False,
                    "error": "Invalid request data",
                },
                status=400,
            )

        if data.get("confirmation") != "RESET":
            return web.json_response(
                {
                    "success": False,
                    "error": "Confirmation missing",
                },
                status=400,
            )

        manager = runtime.get("device_manager")
        store = runtime.get("store")

        if not manager or not store:
            return web.json_response(
                {
                    "success": False,
                    "error": "GeurBot runtime is incomplete",
                },
                status=503,
            )

        devices = manager.get_devices()
        failed_devices = []

        # ---------------------------------------------------------
        # 1. Unpair all ESP32 devices remotely.
        # ---------------------------------------------------------

        for device in devices:
            device_id = str(
                device.get("device_id")
                or device.get("id")
                or "unknown"
            )

            credentials = {
                "client_id": device.get("client_id", ""),
                "token": device.get("token", ""),
            }

            if not all(credentials.values()):
                failed_devices.append(
                    {
                        "device_id": device_id,
                        "error": "Missing device credentials",
                    }
                )
                continue

            try:
                result = await send_data(
                    device,
                    "/api/security/unpair",
                    data=credentials,
                )

                if not result or not result.get("success"):
                    failed_devices.append(
                        {
                            "device_id": device_id,
                            "error": (
                                result.get("error", "Unpair failed")
                                if result
                                else "No response from device"
                            ),
                        }
                    )

            except Exception as error:
                _LOGGER.exception(
                    "Failed to unpair GeurBot device %s",
                    device_id,
                )

                failed_devices.append(
                    {
                        "device_id": device_id,
                        "error": str(error),
                    }
                )

        # Do not delete local data if one or more devices failed.
        if failed_devices:
            return web.json_response(
                {
                    "success": False,
                    "error": (
                        "Factory reset aborted. "
                        "Not all ESP32 devices could be unpaired. "
                        "Local data has been retained."
                    ),
                    "failed_devices": failed_devices,
                },
                status=502,
            )

        # ---------------------------------------------------------
        # 2. Remove Home Assistant device registry entries.
        # ---------------------------------------------------------

        device_registry = dr.async_get(hass)

        for device in devices:
            device_id = str(
                device.get("device_id")
                or device.get("id")
                or ""
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

        # ---------------------------------------------------------
        # 3. Remove devices from the runtime manager.
        # ---------------------------------------------------------

        for device in devices:
            device_id = str(
                device.get("device_id")
                or device.get("id")
                or ""
            )

            if device_id:
                manager.remove_device(device_id)

        # ---------------------------------------------------------
        # 4. Clear persistent integration storage.
        # ---------------------------------------------------------

        store.data = deepcopy(DEFAULT_DATA)
        await store.async_save()

        # ---------------------------------------------------------
        # 5. Reload the integration.
        # ---------------------------------------------------------

        entry = runtime.get("entry")

        if entry:
            entry_id = entry.entry_id

            async def reload_later():
                """Reload after the reset response has been sent."""
                await asyncio.sleep(1)

                try:
                    await hass.config_entries.async_reload(entry_id)
                except Exception:
                    _LOGGER.exception(
                        "Failed to reload GeurBot after factory reset"
                    )

            hass.async_create_task(reload_later())

        _LOGGER.warning(
            "GeurBot factory reset completed. %s devices unpaired.",
            len(devices),
        )

        return web.json_response(
            {
                "success": True,
                "message": "Factory reset completed",
                "unpaired_devices": len(devices),
            }
        )

    async def get(self, request):
        """Handle GET requests."""
        return await self._handle(request)

    async def post(self, request):
        """Handle POST requests."""
        return await self._handle(request)
