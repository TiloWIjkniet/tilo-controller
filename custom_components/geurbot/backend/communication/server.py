
from __future__ import annotations

from aiohttp import web

from homeassistant.components.http import HomeAssistantView



from ...const import DOMAIN


class GeurBotDataView(HomeAssistantView):
    """Receive and route commands from GeurBot ESP devices."""

    url = "/api/geurbot/data"
    name = "api:geurbot:data"
    requires_auth = False

    async def post(self, request: web.Request) -> web.Response:

        # ====================================================
        # 1. GET AUTHORIZATION TOKEN
        # ====================================================

        authorization = request.headers.get("Authorization", "")

        if not authorization.startswith("Bearer "):
            return self.json_message(
                "Missing authorization token",
                status_code=401,
            )

        token = authorization[7:].strip()

        if not token:
            return self.json_message(
                "Empty authorization token",
                status_code=401,
            )

        # ====================================================
        # 2. READ JSON DATA
        # ====================================================

        try:
            payload = await request.json()
        except (ValueError, UnicodeDecodeError):
            return self.json_message(
                "Invalid JSON",
                status_code=400,
            )

        if not isinstance(payload, dict):
            return self.json_message(
                "Invalid payload",
                status_code=400,
            )

        command = payload.get("command")
        data = payload.get("data", {})

        if not isinstance(command, str) or not command:
            return self.json_message(
                "Invalid command",
                status_code=400,
            )

        if not isinstance(data, dict):
            return self.json_message(
                "Invalid data",
                status_code=400,
            )

        # ====================================================
        # 3. GET DEVICE MANAGER
        # ====================================================

        integration = self.hass.data.get(DOMAIN)

        if integration is None:
            return self.json_message(
                "GeurBot integration not initialized",
                status_code=500,
            )

        device_manager = integration.get("device_manager")

        if device_manager is None:
            return self.json_message(
                "DeviceManager not available",
                status_code=500,
            )

        # ====================================================
        # 4. VALIDATE TOKEN AND IDENTIFY DEVICE
        # ====================================================

        device_id = await device_manager.async_get_device_id_by_token(
            token
        )

        if device_id is None:
            return self.json_message(
                "Invalid authorization token",
                status_code=401,
            )

        # ====================================================
        # 5. COMMAND ROUTER
        # ====================================================

        await device_manager.async_handle_message(
            device_id,
            command,
            data,
        )

        # ====================================================
        # 6. RESPONSE
        # ====================================================

        return self.json({
            "success": True,
            "device_id": device_id,
            "command": command,
        })
