
"""Data coordinator for Tilo Controller."""

from datetime import timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
)

from .const import DOMAIN
from .device_manager import DeviceManager

_LOGGER = logging.getLogger(__name__)


class TiloControllerCoordinator(DataUpdateCoordinator):
    """Manage data updates for Tilo Controller."""

    def __init__(
        self,
        hass: HomeAssistant,
        device_manager: DeviceManager,
    ):
        """Initialize the coordinator."""

        super().__init__(
            hass,
            logger=_LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=30),
        )

        self.device_manager = device_manager

    async def _async_update_data(self):
        """Fetch data from all ESP controllers."""

        return self.device_manager.get_controllers()
