"""Config flow for GeurBot."""
from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult
import voluptuous as vol

from .const import DOMAIN, DEFAULT_SCAN_TIMEOUT


class GeurBotConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for GeurBot."""

    VERSION = 1

    async def async_step_user(self, user_input=None) -> FlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")

        if user_input is not None:
            return self.async_create_entry(title="GeurBot", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Optional("scan_timeout", default=DEFAULT_SCAN_TIMEOUT):
                    vol.All(vol.Coerce(int), vol.Range(min=3, max=60)),
                vol.Optional("notify_service", default=""): str
            }),
        )
