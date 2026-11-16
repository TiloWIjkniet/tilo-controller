
"""Persistent storage for GeurBot."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util


STORAGE_VERSION = 1
STORAGE_KEY = "geurbot_storage"

MAX_SPRAY_HISTORY = 20


class GeurBotStorage:

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store = Store(hass,STORAGE_VERSION,STORAGE_KEY,)
        self.data: dict[str, Any] = {"devices": {}}
        self._loaded = False

    # ==========================================================
    # INITIALIZATION
    # ==========================================================

    async def async_load(self) -> None:
        """Load stored data from Home Assistant."""

        stored_data = await self.store.async_load()

        if isinstance(stored_data, dict):
            devices = stored_data.get("devices", {})

            if isinstance(devices, dict): 
                self.data = {"devices": devices}
                
        self._loaded = True

    async def async_save(self) -> None:
        """Save all data."""

        await self._ensure_loaded()
        await self.store.async_save(deepcopy(self.data))

    async def _ensure_loaded(self) -> None:
        """Ensure storage has been loaded."""

        if not self._loaded:
            await self.async_load()

    # ==========================================================
    # DEVICE MANAGEMENT
    # ==========================================================

    async def async_get_devices(self) -> dict:
        """Get all devices."""

        await self._ensure_loaded()

        return deepcopy(self.data["devices"])

    async def async_get_device(
        self,
        device_id: str,
    ) -> dict | None:
        """Get one device."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        return deepcopy(device) if device else None

    async def async_add_device(
        self,
        device_id: str,
        data: dict,
    ) -> None:
        """Add a new device."""

        await self._ensure_loaded()

        if device_id in self.data["devices"]:
            raise ValueError(f"Device already exists: {device_id}")

        device = {
            "id": device_id,
            "name": data.get("name", device_id),
            "connection": {
                "hostname": data.get("hostname"),
                "host": data.get("host"),
                "port": data.get("port", 80),
            },
            "firmware": data.get("firmware"),
            "hardware": data.get("hardware"),
            "created_at": dt_util.utcnow().isoformat(),
            "last_seen": None,
            "settings": {},
            "capabilities": [],
            "modules": {},
            "fragrances": {},
        }

        self.data["devices"][device_id] = device

        await self.async_save()

    async def async_update_device(
        self,
        device_id: str,
        data: dict,
    ) -> None:
        """Update device information."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        for key, value in data.items():
            if key == "connection":
                device["connection"].update(value)
            elif key == "settings":
                device["settings"].update(value)
            else:
                device[key] = value

        await self.async_save()

    async def async_remove_device(
        self,
        device_id: str,
    ) -> None:
        """Remove a device and its associated data."""

        await self._ensure_loaded()

        if device_id not in self.data["devices"]:
            raise KeyError(f"Device not found: {device_id}")

        del self.data["devices"][device_id]

        await self.async_save()

    # ==========================================================
    # FRAGRANCE MANAGEMENT
    # ==========================================================

    async def async_get_fragrances(
        self,
        device_id: str,
    ) -> dict:
        """Get all fragrances belonging to a device."""

        device = await self.async_get_device(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        return device["fragrances"]

    async def async_get_fragrance(
        self,
        device_id: str,
        fragrance_id: str,
    ) -> dict | None:
        """Get one fragrance."""

        fragrances = await self.async_get_fragrances(device_id)

        return fragrances.get(fragrance_id)

    async def async_add_fragrance(
        self,
        device_id: str,
        fragrance_id: str,
        data: dict,
    ) -> None:
        """Add a fragrance to a device."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        if fragrance_id in device["fragrances"]:
            raise ValueError(
                f"Fragrance already exists: {fragrance_id}"
            )

        fragrance = {
            "id": fragrance_id,
            "name": data.get("name", fragrance_id),
            "enabled": data.get("enabled", True),
            "created_at": dt_util.utcnow().isoformat(),
            "updated_at": None,
            "schedule": data.get("schedule", []),
            "spray_count": 0,
            "last_sprayed": None,
            "spray_history": [],
            "settings": data.get("settings", {}),
        }

        device["fragrances"][fragrance_id] = fragrance

        await self.async_save()

    async def async_update_fragrance(
        self,
        device_id: str,
        fragrance_id: str,
        data: dict,
    ) -> None:
        """Update fragrance information."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        fragrance = device["fragrances"].get(fragrance_id)

        if fragrance is None:
            raise KeyError(
                f"Fragrance not found: {fragrance_id}"
            )

        for key, value in data.items():
            if key == "settings":
                fragrance["settings"].update(value)
            else:
                fragrance[key] = value

        fragrance["updated_at"] = dt_util.utcnow().isoformat()

        await self.async_save()

    async def async_remove_fragrance(
        self,
        device_id: str,
        fragrance_id: str,
    ) -> None:
        """Remove a fragrance."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        if fragrance_id not in device["fragrances"]:
            raise KeyError(
                f"Fragrance not found: {fragrance_id}"
            )

        del device["fragrances"][fragrance_id]

        await self.async_save()

    # ==========================================================
    # MODULE MANAGEMENT
    # ==========================================================

    async def async_get_modules(
        self,
        device_id: str,
    ) -> dict:
        """Get all modules belonging to a device."""

        device = await self.async_get_device(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        return device["modules"]

    async def async_add_module(
        self,
        device_id: str,
        module_id: str,
        data: dict,
    ) -> None:
        """Add a module to a device."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        if module_id in device["modules"]:
            raise ValueError(f"Module already exists: {module_id}")

        module = {
            "id": module_id,
            "name": data.get("name", module_id),
            "type": data.get("type"),
            "protocol": data.get("protocol"),
            "address": data.get("address"),
            "firmware": data.get("firmware"),
            "hardware": data.get("hardware"),
            "enabled": data.get("enabled", True),
            "discovery_source": data.get(
                "discovery_source",
                "manual",
            ),
            "last_seen": None,
            "capabilities": data.get("capabilities", []),
            "settings": data.get("settings", {}),
        }

        device["modules"][module_id] = module

        await self.async_save()

    async def async_update_module(
        self,
        device_id: str,
        module_id: str,
        data: dict,
    ) -> None:
        """Update module information."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        module = device["modules"].get(module_id)

        if module is None:
            raise KeyError(f"Module not found: {module_id}")

        for key, value in data.items():
            if key == "settings":
                module["settings"].update(value)
            else:
                module[key] = value

        await self.async_save()

    async def async_remove_module(
        self,
        device_id: str,
        module_id: str,
    ) -> None:
        """Remove a module."""

        await self._ensure_loaded()

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        if module_id not in device["modules"]:
            raise KeyError(f"Module not found: {module_id}")

        del device["modules"][module_id]

        await self.async_save()

    # ==========================================================
    # SPRAY HISTORY
    # ==========================================================

    async def async_record_spray(
        self,
        device_id: str,
        fragrance_id: str,
        amount: int = 1,
    ) -> None:
        """Record a completed spray action."""

        await self._ensure_loaded()

        if amount < 1:
            raise ValueError("Spray amount must be at least 1")

        device = self.data["devices"].get(device_id)

        if device is None:
            raise KeyError(f"Device not found: {device_id}")

        fragrance = device["fragrances"].get(fragrance_id)

        if fragrance is None:
            raise KeyError(
                f"Fragrance not found: {fragrance_id}"
            )

        timestamp = dt_util.utcnow().isoformat()

        fragrance["spray_count"] += amount
        fragrance["last_sprayed"] = timestamp

        history = fragrance["spray_history"]

        history.append({
            "timestamp": timestamp,
            "amount": amount,
        })

        fragrance["spray_history"] = history[
            -MAX_SPRAY_HISTORY:
        ]

        await self.async_save()

    async def async_get_spray_history(
        self,
        device_id: str,
        fragrance_id: str,
    ) -> list:
        """Get the last 100 spray events."""

        fragrance = await self.async_get_fragrance(
            device_id,
            fragrance_id,
        )

        if fragrance is None:
            raise KeyError(
                f"Fragrance not found: {fragrance_id}"
            )

        return fragrance["spray_history"]
