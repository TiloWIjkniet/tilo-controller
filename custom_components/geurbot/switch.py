"""GeurBot fragrance enable/disable switches."""
from homeassistant.components.switch import SwitchEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from .const import DOMAIN
from .esp_client import EspClient


async def async_setup_entry(hass, entry, async_add_entities):
    runtime = hass.data[DOMAIN]
    added = set()

    def add_for_coordinator(coordinator):
        entities = []
        for fragrance in coordinator.device.get("fragrances", []):
            mac = fragrance.get("mac_address")
            if mac:
                entities.append(GeurBotFragranceSwitch(coordinator, mac, fragrance.get("name", mac)))
        fresh = [entity for entity in entities if entity.unique_id not in added]
        added.update(entity.unique_id for entity in fresh)
        if fresh:
            async_add_entities(fresh)

    runtime["entity_adders"]["switch"] = add_for_coordinator
    for coordinator in runtime["coordinators"].values():
        add_for_coordinator(coordinator)


class GeurBotFragranceSwitch(CoordinatorEntity, SwitchEntity):
    _attr_has_entity_name = True
    _attr_icon = "mdi:air-freshener"

    def __init__(self, coordinator, mac, name):
        super().__init__(coordinator)
        self.mac = mac
        self._attr_unique_id = f"{coordinator.device_id}_{mac}_enabled"
        self._attr_name = f"{name} ingeschakeld"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.device_id)},
            name=coordinator.device.get("name", coordinator.device_id),
            manufacturer="GeurBot", model="ESP32 GeurBot",
        )

    @property
    def is_on(self):
        for item in (self.coordinator.data or {}).get("fragrances", []):
            if item.get("mac_address") == self.mac:
                return bool(item.get("enabled", True))
        return None

    async def async_turn_on(self, **kwargs):
        await self._set_enabled(True)

    async def async_turn_off(self, **kwargs):
        await self._set_enabled(False)

    async def _set_enabled(self, enabled):
        result = await EspClient(self.hass, self.coordinator.device).request(
            "POST", "/api/device/fragrances/set-enabled",
            {"mac_address": self.mac, "enabled": enabled},
        )
        if not result.get("success"):
            raise RuntimeError(result.get("error") or f"ESP HTTP {result.get('status')}")
        await self.coordinator.async_request_refresh()
