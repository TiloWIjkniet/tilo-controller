"""Versioned persistent storage for GeurBot."""
from __future__ import annotations

from copy import deepcopy
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_KEY, STORAGE_VERSION

DEFAULT_DATA: dict[str, Any] = {
    "schema_version": STORAGE_VERSION,
    "devices": {},
    "notification_settings": None,
    "notification_state": {},
    "metadata": {},
}


class GeurBotStore:
    """Owns all integration-managed persistent data."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, STORAGE_VERSION, f"{DOMAIN}_{STORAGE_KEY}")
        self.data: dict[str, Any] = deepcopy(DEFAULT_DATA)

    async def async_load(self) -> dict[str, Any]:
        stored = await self._store.async_load()
        if isinstance(stored, dict):
            old_version = stored.get("schema_version", 1)
            self.data = {**deepcopy(DEFAULT_DATA), **stored}
            # Version 1 migration: normalize absent collections without dropping
            # any device, fragrance, schedule, or notification information.
            if old_version < 1:
                self.data["devices"] = self.data.get("devices") or {}
            if not isinstance(self.data.get("devices"), dict):
                self.data["devices"] = {}
            if not isinstance(self.data.get("metadata"), dict):
                self.data["metadata"] = {}
            self.data["schema_version"] = STORAGE_VERSION
        return self.data

    async def async_save(self) -> None:
        await self._store.async_save(self.data)

    async def async_save_devices(self, devices: list[dict[str, Any]]) -> None:
        self.data["devices"] = {
            str(device["device_id"]): deepcopy(device)
            for device in devices
            if isinstance(device, dict) and device.get("device_id")
        }
        await self.async_save()
