"""Tilo Controller integration."""

from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN

PANEL_URL = "tilo_controller"
PANEL_RESOURCE = "/tilo_controller_static"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up Tilo Controller."""

    www_path = Path(__file__).parent / "www"

    await hass.http.async_register_static_paths([
        StaticPathConfig(
            PANEL_RESOURCE,
            str(www_path),
            False,
        )
    ])

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="tilo-controller",
        frontend_url_path=PANEL_URL,
        module_url=f"{PANEL_RESOURCE}/tilo-controller.js",
        sidebar_title="Tilo Controller",
        sidebar_icon="mdi:air-purifier",
        embed_iframe=False,
        require_admin=False,
    )

    return True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up a config entry."""

    return True