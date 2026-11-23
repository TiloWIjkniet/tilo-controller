"""GeurBot connectivity and fragrance availability entities."""
from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from .const import DOMAIN


async def async_setup_entry(hass, entry, async_add_entities):
    runtime = hass.data[DOMAIN]
    added = set()

    def add_for_coordinator(coordinator):
        entities = [GeurBotOnlineSensor(coordinator)]
        for fragrance in coordinator.device.get("fragrances", []):
            mac = fragrance.get("mac_address")
            if mac:
                entities.append(GeurBotFragranceAvailableSensor(coordinator, mac, fragrance.get("name", mac)))
        fresh = [entity for entity in entities if entity.unique_id not in added]
        added.update(entity.unique_id for entity in fresh)
        if fresh:
            async_add_entities(fresh)

    runtime["entity_adders"]["binary_sensor"] = add_for_coordinator
    for coordinator in runtime["coordinators"].values():
        add_for_coordinator(coordinator)


class GeurBotOnlineSensor(CoordinatorEntity, BinarySensorEntity):
    _attr_name = "Online"
    _attr_device_class = "connectivity"
    _attr_has_entity_name = True

    def __init__(self, coordinator):
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.device_id}_online"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.device_id)},
            name=coordinator.device.get("name", coordinator.device_id),
            manufacturer="GeurBot", model="ESP32 GeurBot",
        )

    @property
    def is_on(self):
        return bool(self.coordinator.data and self.coordinator.data.get("online"))


class GeurBotFragranceAvailableSensor(CoordinatorEntity, BinarySensorEntity):
    _attr_device_class = "connectivity"
    _attr_has_entity_name = True

    def __init__(self, coordinator, mac, name):
        super().__init__(coordinator)
        self.mac = mac
        self._attr_unique_id = f"{coordinator.device_id}_{mac}_available"
        self._attr_name = f"{name} beschikbaar"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.device_id)},
            name=coordinator.device.get("name", coordinator.device_id),
            manufacturer="GeurBot", model="ESP32 GeurBot",
        )

    @property
    def is_on(self):
        for item in (self.coordinator.data or {}).get("fragrances", []):
            if item.get("mac_address") == self.mac:
                return bool(item.get("available", False))
        return None
