"""GeurBot action buttons."""
from homeassistant.components.button import ButtonEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from .const import DOMAIN
from .esp_client import EspClient


async def async_setup_entry(hass, entry, async_add_entities):
    runtime = hass.data[DOMAIN]

    added = set()
    def add_for_coordinator(coordinator):
        candidates = [GeurBotRestartButton(coordinator)]
        for fragrance in coordinator.device.get("fragrances", []):
            mac = fragrance.get("mac_address")
            if mac:
                candidates.append(GeurBotSprayButton(coordinator, mac, fragrance.get("name", mac)))
        fresh = [entity for entity in candidates if entity.unique_id not in added]
        added.update(entity.unique_id for entity in fresh)
        if fresh:
            async_add_entities(fresh)

    runtime["entity_adders"]["button"] = add_for_coordinator
    for coordinator in runtime["coordinators"].values():
        add_for_coordinator(coordinator)


class GeurBotBaseButton(CoordinatorEntity, ButtonEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator, unique_suffix, name, icon):
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.device_id}_{unique_suffix}"
        self._attr_name = name
        self._attr_icon = icon
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.device_id)},
            name=coordinator.device.get("name", coordinator.device_id),
            manufacturer="GeurBot", model="ESP32 GeurBot",
        )


class GeurBotRestartButton(GeurBotBaseButton):
    def __init__(self, coordinator):
        super().__init__(coordinator, "restart", "Herstart apparaat", "mdi:restart")

    async def async_press(self):
        result = await EspClient(self.hass, self.coordinator.device).request("POST", "/api/device/restart")
        if not result.get("success"):
            raise RuntimeError(result.get("error") or f"ESP HTTP {result.get('status')}")


class GeurBotSprayButton(GeurBotBaseButton):
    def __init__(self, coordinator, mac, fragrance_name):
        self.mac = mac
        super().__init__(coordinator, f"{mac}_spray", f"Spray {fragrance_name}", "mdi:spray")

    async def async_press(self):
        result = await EspClient(self.hass, self.coordinator.device).request(
            "POST", "/api/device/fragrances/spray", {"mac_address": self.mac}
        )
        if not result.get("success"):
            raise RuntimeError(result.get("error") or f"ESP HTTP {result.get('status')}")
        await self.coordinator.async_request_refresh()
