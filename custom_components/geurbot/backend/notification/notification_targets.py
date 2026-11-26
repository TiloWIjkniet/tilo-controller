
"""Home Assistant notification targets."""

from homeassistant.core import HomeAssistant


async def get_notification_targets(
    hass: HomeAssistant,
) -> list[dict]:
    """Return modern notify entities and legacy notify services."""

    targets = {}

    services = hass.services.async_services()
    notify_services = services.get("notify", {})

    # ==================================================
    # MODERNE NOTIFY-ENTITEITEN
    # ==================================================

    for state in hass.states.async_all("notify"):
        entity_id = state.entity_id

        targets[entity_id] = {
            "entity_id": entity_id,
            "name": state.attributes.get(
                "friendly_name",
                entity_id,
            ),
            "available": state.state not in {
                "unavailable",
                "unknown",
            },
            "target_type": "entity",
        }

    # ==================================================
    # LEGACY NOTIFY-SERVICES
    # ==================================================

    for service_name in notify_services:
        if service_name in {
            "send_message",
            "reload",
            "notify",
        }:
            continue

        entity_id = f"notify.{service_name}"

        if entity_id in targets:
            continue

        targets[entity_id] = {
            "entity_id": entity_id,
            "name": service_name.replace(
                "_",
                " ",
            ).strip().title(),
            "available": True,
            "target_type": "service",
        }

    return sorted(
        targets.values(),
        key=lambda target: target["name"].casefold(),
    )
