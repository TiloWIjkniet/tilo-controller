
"""GeurBot Home Assistant integration."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.network import get_url

from .const import DOMAIN
from .backend.storage import GeurBotStorage
from .backend.device_manager import GeurBotDeviceManager
from .backend.communication import GeurBotCommunication


async def async_setup(
    hass: HomeAssistant,
    config: dict,
) -> bool:
    """Set up the GeurBot integration."""

    hass.data.setdefault(DOMAIN, {})

    return True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up GeurBot from a config entry."""

    # ========================================================
    # 1. STORAGE
    # ========================================================

    storage = GeurBotStorage(hass)

    await storage.async_load()

    # ========================================================
    # 2. DEVICE MANAGER
    # ========================================================

    home_assistant_url = get_url(hass)

    device_manager = GeurBotDeviceManager(
        hass=hass,
        storage=storage,
        home_assistant_url=home_assistant_url,
    )

    # ========================================================
    # 3. COMMUNICATION
    # ========================================================

    communication = GeurBotCommunication(hass)

    # ========================================================
    # 4. REGISTER INTEGRATION DATA
    # ========================================================

    hass.data[DOMAIN] = {
        "storage": storage,
        "device_manager": device_manager,
        "communication": communication,
    }

    # ========================================================
    # 5. START COMMUNICATION
    # ========================================================

    await communication.async_start()

    return True


async def async_unload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Unload GeurBot integration."""

    integration = hass.data.get(DOMAIN)

    if integration is None:
        return True

    communication = integration.get("communication")

    if communication is not None:
        await communication.async_stop()

    hass.data.pop(DOMAIN, None)

    return True
