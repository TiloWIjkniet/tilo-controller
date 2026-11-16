
"""Discover GeurBot devices using mDNS."""

from __future__ import annotations

import asyncio
import ipaddress
import logging
from typing import Any

from homeassistant.components import zeroconf
from homeassistant.core import HomeAssistant

from zeroconf import ServiceStateChange
from zeroconf.asyncio import AsyncServiceBrowser, AsyncServiceInfo

_LOGGER = logging.getLogger(__name__)

SERVICE_TYPE = "_geurbot._tcp.local."
DEFAULT_SCAN_DURATION = 5.0
SERVICE_INFO_TIMEOUT = 3000


class GeurBotDiscovery:
    """Discover GeurBot devices on the local network."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def async_scan(
        self,
        duration: float = DEFAULT_SCAN_DURATION,
    ) -> list[dict[str, Any]]:
        """Scan the network for GeurBot devices."""

        aiozc = await zeroconf.async_get_async_instance(self.hass)

        devices: dict[str, dict[str, Any]] = {}
        tasks: set[asyncio.Task[None]] = set()

        async def async_process_service(name: str) -> None:
            """Retrieve information about a discovered service."""

            info = AsyncServiceInfo(SERVICE_TYPE, name)

            try:
                found = await info.async_request(
                    aiozc,
                    timeout=SERVICE_INFO_TIMEOUT,
                )
            except Exception:
                _LOGGER.debug(
                    "Could not retrieve GeurBot service information: %s",
                    name,
                    exc_info=True,
                )
                return

            if not found:
                return

            properties = {
                key.decode("utf-8"): value.decode("utf-8")
                for key, value in info.properties.items()
            }

            device_id = properties.get("device_id")

            if not device_id:
                _LOGGER.debug(
                    "Ignoring service without device_id: %s",
                    name,
                )
                return

            addresses = info.parsed_addresses()

            if not addresses:
                return

            # Prefer IPv4 addresses for the ESP32-C3.
            addresses.sort(
                key=lambda address: (
                    ipaddress.ip_address(address).version != 4
                )
            )

            devices[device_id] = {
                "device_id": device_id,
                "hostname": info.server.rstrip("."),
                "host": addresses[0],
                "port": info.port,
                "api_version": properties.get("api_version"),
            }

        def on_service_state_change(
            zeroconf_instance: Any,
            service_type: str,
            name: str,
            state_change: ServiceStateChange,
        ) -> None:
            """Handle mDNS service discovery events."""

            if state_change != ServiceStateChange.Added:
                return

            task = self.hass.async_create_task(
                async_process_service(name)
            )
            tasks.add(task)
            task.add_done_callback(tasks.discard)

        browser = AsyncServiceBrowser(
            aiozc,
            SERVICE_TYPE,
            handlers=[on_service_state_change],
        )

        try:
            await asyncio.sleep(duration)
        finally:
            await browser.async_cancel()

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        return list(devices.values())
