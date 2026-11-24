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
        # Keep the shared registry record current for schedules, monitors and entities.
        # Merge ESP data with existing Home Assistant fragrance data.
        existing_fragrances = {
            fragrance["mac_address"]: fragrance
            for fragrance in self.device.get("fragrances", [])
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

            updated_fragrance = {
                **existing,
                **fragrance
            }

            # Preserve Home Assistant-managed values.
            for key in ("schedule", "unreachable"):
                if key in existing:
                    updated_fragrance[key] = existing[key]

            updated_fragrances.append(updated_fragrance)

        # Keep fragrances that are no longer returned by the ESP.
        for mac_address, fragrance in existing_fragrances.items():
            if mac_address not in returned_mac_addresses:
                updated_fragrances.append(fragrance)

        self.device["fragrances"] = updated_fragrances