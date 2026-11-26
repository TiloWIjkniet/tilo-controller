"""Home Assistant notification targets."""

from homeassistant.core import HomeAssistant


async def get_notification_targets(hass: HomeAssistant) -> list[dict]:
    """Return all available notify entities."""

    targets = []

    for entity_id in hass.states.async_entity_ids("notify"):
        state = hass.states.get(entity_id)

        if state is None:
            continue

        targets.append({
            "entity_id": entity_id,
            "name": state.attributes.get(
                "friendly_name",
                entity_id
            ),
            "available": state.state != "unavailable"
        })

    return targets