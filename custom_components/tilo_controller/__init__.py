
"""Tilo Controller integration."""

from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.frontend import async_register_built_in_panel

from .const import DOMAIN

PANEL_URL = "/tilo_controller"
PANEL_RESOURCE = "/tilo_controller/tilo-controller.js"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up Tilo Controller."""

    www_path = Path(__file__).parent / "www"

    await hass.http.async_register_static_paths([
        StaticPathConfig(
            PANEL_RESOURCE,
            str(www_path / "tilo-controller.js"),
            False,
        )
    ])

    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Tilo Controller",
        sidebar_icon="mdi:air-purifier",
        frontend_url_path=PANEL_URL.strip("/"),
        config={
            "_panel_custom": {
                "name": "tilo-controller",
                "module_url": PANEL_RESOURCE,
            }
        },
        require_admin=False,
    )

    return True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up a config entry."""

    return True
