"""Coordinator for polling registered GeurBot devices."""
from __future__ import annotations

from datetime import timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .esp_client import EspClient

_LOGGER = logging.getLogger(__name__)


class GeurBotCoordinator(DataUpdateCoordinator):
    """Poll the existing ESP32 fragrance API without changing its contract."""

    def __init__(self, hass: HomeAssistant, device: dict) -> None:
        self.device = device
        self.device_id = device["device_id"]
        super().__init__(
            hass, _LOGGER, name=f"GeurBot {device.get('name', self.device_id)}",
            update_interval=timedelta(seconds=30),
        )

    async def _async_update_data(self):
        result = await EspClient(self.hass, self.device).request(
            "GET", "/api/device/fragrances/get-all"
        )
        if not result.get("success"):
            raise UpdateFailed(result.get("error") or f"ESP HTTP {result.get('status')}")
        payload = result.get("data")
        if isinstance(payload, list):
            fragrances = payload
        elif isinstance(payload, dict) and isinstance(payload.get("fragrances"), list):
            fragrances = payload["fragrances"]
        else:
            fragrances = []
        return {"online": True, "fragrances": fragrances, "raw": payload}
