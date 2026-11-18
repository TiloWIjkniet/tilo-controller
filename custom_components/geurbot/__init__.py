from .backend.api.devices import DeviceProxyView


async def async_setup(hass, config):
    hass.http.register_view(DeviceProxyView())
    return True