"""GeurBot sensor entities."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN


async def async_setup_entry(hass, entry, async_add_entities):
    runtime = hass.data[DOMAIN]
    added = set()

    def add_for_coordinator(coordinator):
        candidates = [GeurBotFragranceCountSensor(coordinator)]
        for fragrance in coordinator.device.get("fragrances", []):
            mac = fragrance.get("mac_address")
            if mac:
                candidates.append(GeurBotRemainingSpraysSensor(coordinator, mac))
        fresh = [entity for entity in candidates if entity.unique_id not in added]
        added.update(entity.unique_id for entity in fresh)
        if fresh:
            async_add_entities(fresh)

    runtime["entity_adders"]["sensor"] = add_for_coordinator
    for coordinator in runtime["coordinators"].values():
        add_for_coordinator(coordinator)


class GeurBotBaseEntity(CoordinatorEntity, SensorEntity):
    def __init__(self, coordinator, suffix):
        super().__init__(coordinator)
        self.device = coordinator.device
        self._attr_has_entity_name = True
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.device_id)},
            name=self.device.get("name", coordinator.device_id),
            manufacturer="GeurBot",
            model="ESP32 GeurBot",
        )
        self._attr_unique_id = f"{coordinator.device_id}_{suffix}"


class GeurBotFragranceCountSensor(GeurBotBaseEntity):
    _attr_name = "Aantal geurmodules"
    _attr_icon = "mdi:air-freshener"

    def __init__(self, coordinator):
        super().__init__(coordinator, "fragrance_count")

    @property
    def native_value(self):
        return len(self.coordinator.data.get("fragrances", [])) if self.coordinator.data else 0


class GeurBotRemainingSpraysSensor(GeurBotBaseEntity):
    _attr_name = "Resterende sprays"
    _attr_icon = "mdi:spray"

    def __init__(self, coordinator, mac):
        self.mac = mac
        super().__init__(coordinator, f"{mac}_remaining_sprays")
        self._attr_name = f"{mac} resterende sprays"

    @property
    def native_value(self):
        for item in (self.coordinator.data or {}).get("fragrances", []):
            if item.get("mac_address") == self.mac:
                estimated = item.get("estimated_sprays")
                total = item.get("total_sprays")
                if isinstance(estimated, (int, float)) and isinstance(total, (int, float)):
                    return max(0, estimated - total)
        return None
