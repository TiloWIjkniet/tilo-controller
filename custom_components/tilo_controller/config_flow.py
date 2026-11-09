
"""Config flow for Tilo Controller."""

import voluptuous as vol

from homeassistant import config_entries

from .const import DOMAIN


class TiloControllerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial setup."""

        if user_input is not None:
            name = user_input["name"].strip()
            host = user_input["host"].strip().rstrip("/")

            # Add http:// if the user only entered an IP address.
            if not host.startswith(("http://", "https://")):
                host = f"http://{host}"

            # Prevent adding the same ESP twice.
            await self.async_set_unique_id(host)
            self._abort_if_unique_id_configured()

            return self.async_create_entry(
                title=name,
                data={
                    "name": name,
                    "host": host,
                },
            )

        data_schema = vol.Schema({
            vol.Required("name"): str,
            vol.Required("host"): str,
        })

        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
        )
