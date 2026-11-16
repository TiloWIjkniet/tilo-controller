"""Manage GeurBot devices and communication."""

from __future__ import annotations

import hashlib
import secrets
import hmac

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from ..communication.api import GeurBotAPI, GeurBotAPIError
from ..storage.storage import GeurBotStorage


class GeurBotDeviceManager:
    """Central manager for all GeurBot devices."""

    def __init__(
        self,
        hass: HomeAssistant,
        storage: GeurBotStorage,
        home_assistant_url: str,
    ) -> None:
        self.hass = hass
        self.storage = storage
        self.home_assistant_url = home_assistant_url.rstrip("/")

        self.session = async_get_clientsession(hass)

    # ============================================================
    # API
    # ============================================================

    def _get_api(
        self,
        device: dict[str, Any],
    ) -> GeurBotAPI:
        """Create an API client for a device."""

        connection = device["connection"]

        return GeurBotAPI(
            session=self.session,
            host=connection["host"],
            port=connection.get("port", 80),
        )

    # ============================================================
    # DEVICE MANAGEMENT
    # ============================================================

    async def async_get_devices(self) -> dict:
        """Get all registered devices."""

        return await self.storage.async_get_devices()

    async def async_get_device(
        self,
        device_id: str,
    ) -> dict | None:
        """Get one registered device."""

        return await self.storage.async_get_device(device_id)

    async def async_pair_device(
        self,
        host: str,
        client_id: str,
        pairing_code: str,
        name: str | None = None,
        port: int = 80,
        hostname: str | None = None,
    ) -> dict:
        """Pair a new GeurBot."""

        device_id = client_id

        if await self.storage.async_get_device(device_id):
            raise ValueError(
                f"Device already registered: {device_id}"
            )

        # Home Assistant generates its own authentication token.
        ha_token = secrets.token_urlsafe(32)

        ha_token_hash = hashlib.sha256(
            ha_token.encode("utf-8")
        ).hexdigest()

        api = GeurBotAPI(
            session=self.session,
            host=host,
            port=port,
        )

        # Send pairing request to the ESP.
        response = await api.async_pair(
            client_id=client_id,
            pairing_code=pairing_code,
            home_assistant_url=self.home_assistant_url,
            access_token=ha_token,
        )

        if not response.get("success"):
            raise GeurBotAPIError(
                response.get("error", "Pairing failed")
            )

        esp_token = response.get("token")

        if not isinstance(esp_token, str) or not esp_token:
            raise GeurBotAPIError(
                "ESP did not return an authentication token"
            )

        try:
            # Save the device.
            await self.storage.async_add_device(
                device_id,
                {
                    "name": name or device_id,
                    "hostname": hostname or host,
                    "host": host,
                    "port": port,
                },
            )

            # Save identification and authentication data.
            await self.storage.async_update_device(
                device_id,
                {
                    "client_id": client_id,
                    "authentication": {
                        "ha_token_hash": ha_token_hash,
                        "esp_token": esp_token,
                    },
                },
            )

        except Exception:
            # If storage fails, try to undo the ESP pairing.
            try:
                await api.async_unpair(
                    client_id=client_id,
                    token=esp_token,
                )
            except GeurBotAPIError:
                pass

            raise

        return await self.storage.async_get_device(device_id)

    async def async_add_discovered_device(
        self,
        discovered_device: dict[str, Any],
        name: str,
        pairing_code: str,
    ) -> dict:
        """Pair and register a discovered GeurBot."""

        required_fields = (
            "device_id",
            "host",
            "port",
            "hostname",
        )

        for field in required_fields:
            if not discovered_device.get(field):
                raise ValueError(
                    f"Missing discovery field: {field}"
                )

        name = name.strip()

        if not name:
            raise ValueError("Device name cannot be empty")

        return await self.async_pair_device(
            host=discovered_device["host"],
            port=discovered_device["port"],
            client_id=discovered_device["device_id"],
            pairing_code=pairing_code,
            name=name,
            hostname=discovered_device["hostname"],
        )

    async def async_remove_device(
        self,
        device_id: str,
    ) -> None:
        """Unpair and remove a device."""

        device = await self.storage.async_get_device(device_id)

        if device is None:
            raise KeyError(
                f"Device not found: {device_id}"
            )

        authentication = device.get("authentication", {})

        api = self._get_api(device)

        # First remove the pairing on the ESP.
        await api.async_unpair(
            client_id=device["client_id"],
            token=authentication["esp_token"],
        )

        # Only remove local data after successful unpairing.
        await self.storage.async_remove_device(device_id)

    # ============================================================
    # CONNECTION
    # ============================================================

    async def async_check_connection(
        self,
        device_id: str,
    ) -> dict:
        """Check the connection and authentication of a device."""

        device = await self.storage.async_get_device(device_id)

        if device is None:
            raise KeyError(
                f"Device not found: {device_id}"
            )

        authentication = device.get("authentication", {})

        api = self._get_api(device)

        response = await api.async_get_security_status(
            client_id=device["client_id"],
            token=authentication["esp_token"],
        )

        if response.get("authenticated"):
            await self.storage.async_update_device(
                device_id,
                {
                    "last_seen": dt_util.utcnow().isoformat(),
                },
            )

        return response

    # ============================================================
    # INCOMING AUTHENTICATION
    # ============================================================

    async def async_get_device_id_by_token(
        self,
        token: str,
    ) -> str | None:
        """Find a device using its Home Assistant token."""

        if not token:
            return None

        received_hash = hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

        devices = await self.storage.async_get_devices()

        for device_id, device in devices.items():
            authentication = device.get("authentication", {})

            stored_hash = authentication.get("ha_token_hash", "")

            if stored_hash and hmac.compare_digest(
                received_hash,
                stored_hash,
            ):
                return device_id

        return None

    # ============================================================
    # INCOMING MESSAGES
    # ============================================================

    async def async_handle_message(
        self,
        device_id: str,
        command: str,
        data: dict[str, Any],
    ) -> None:
        """Route an incoming command from a GeurBot."""

        device = await self.storage.async_get_device(device_id)

        if device is None:
            raise KeyError(
                f"Device not found: {device_id}"
            )

        await self.storage.async_update_device(
            device_id,
            {
                "last_seen": dt_util.utcnow().isoformat(),
            },
        )

        match command:

            case "pop":
                # TODO: Forward to the fragrance pop handler.
                pass

            case _:
                raise ValueError(
                    f"Unknown GeurBot command: {command}"
                )