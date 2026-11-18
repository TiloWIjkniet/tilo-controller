
from homeassistant.components.http import HomeAssistantView

from ..api.manager import get_data, send_data
from ..devices.device_manager import get_device


class DeviceProxyView(HomeAssistantView):
    url = "/api/geurbot/devices/{device_id}/{endpoint:.*}"
    name = "api:geurbot:device_proxy"
    requires_auth = True

    ALLOWED_METHODS = {"GET", "POST", "PUT", "DELETE"}

    async def get(self, request, device_id, endpoint):
        return await self.handle_request(request, device_id, endpoint, "GET")

    async def post(self, request, device_id, endpoint):
        return await self.handle_request(request, device_id, endpoint, "POST")

    async def put(self, request, device_id, endpoint):
        return await self.handle_request(request, device_id, endpoint, "PUT")

    async def delete(self, request, device_id, endpoint):
        return await self.handle_request(request, device_id, endpoint, "DELETE")

    async def handle_request(self, request, device_id, endpoint, method):
        if method not in self.ALLOWED_METHODS:
            return self.json({"success": False, "error": "Method not allowed"}, status=405)

        hass = request.app["hass"]
        device = get_device(hass, device_id)

        if device is None:
            return self.json({"success": False, "error": "Device not found"}, status=404)

        try:
            data = await request.json() if method in {"POST", "PUT"} else None
        except (ValueError, UnicodeDecodeError):
            return self.json({"success": False, "error": "Invalid JSON"}, status=400)

        params = dict(request.query)

        result = await send_data(device, endpoint, data, params, method)

        if not result["success"]:
            return self.json(result, status=502)

        return self.json(result["data"])
