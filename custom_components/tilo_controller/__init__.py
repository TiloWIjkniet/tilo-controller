
"""Tilo Controller integration."""

from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

from .const import DOMAIN
from .device_manager import DeviceManager
from .schedule_manager import ScheduleManager
from .coordinator import TiloControllerCoordinator


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the integration."""

    hass.data.setdefault(DOMAIN, {
        "entries": set(),
        "device_manager": DeviceManager(),
        "schedule_manager": ScheduleManager(),
        "coordinator": None,
    })

    return True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up a config entry."""

    domain_data = hass.data.setdefault(DOMAIN, {
        "entries": set(),
        "device_manager": DeviceManager(),
        "schedule_manager": ScheduleManager(),
        "coordinator": None,
    })

    device_manager = domain_data["device_manager"]

    # Register this ESP controller.
    device_manager.add_controller(
        esp_id=entry.entry_id,
        name=entry.data["name"],
        host=entry.data["host"],
    )

    # Create the shared coordinator.
    if domain_data["coordinator"] is None:
        coordinator = TiloControllerCoordinator(
            hass,
            device_manager,
        )

        domain_data["coordinator"] = coordinator

        await coordinator.async_config_entry_first_refresh()

    domain_data["entries"].add(entry.entry_id)

    return True


async def async_unload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Unload a config entry."""

    domain_data = hass.data.get(DOMAIN)

    if domain_data is None:
        return True

    domain_data["entries"].discard(entry.entry_id)

    domain_data["device_manager"].remove_controller(entry.entry_id)

    if not domain_data["entries"]:
        hass.data.pop(DOMAIN)

    return True
