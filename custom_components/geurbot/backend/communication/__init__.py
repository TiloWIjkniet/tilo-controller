
from __future__ import annotations

from homeassistant.core import HomeAssistant

from .server import GeurBotDataView


class GeurBotCommunication:
    """Manage GeurBot communication components."""

    def __init__(
        self,
        hass: HomeAssistant,
    ) -> None:
        self.hass = hass
        self._started = False

    async def async_start(self) -> None:
        """Register communication endpoints."""

        if self._started:
            return

        self.hass.http.register_view(
            GeurBotDataView()
        )

        self._started = True

    async def async_stop(self) -> None:
        """Stop communication components."""

        if not self._started:
            return

        self._started = False
