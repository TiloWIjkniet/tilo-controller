"""Home Assistant notification targets."""

from homeassistant.core import HomeAssistant


async def get_notification_targets(
    hass: HomeAssistant
) -> list[dict]:
    """Return available Home Assistant notification targets."""

    targets = []

    services = hass.services.async_services()
    notify_services = services.get("notify", {})

    for service_name in notify_services:
        # Dit is de algemene service, geen afzonderlijke bestemming.
        if service_name in {"send_message", "reload"}:
            continue

        # Maak van mobile_app_tilos_phone bijvoorbeeld Tilos Phone.
        name = service_name.replace("_", " ").strip().title()

        targets.append({
            "entity_id": f"notify.{service_name}",
            "name": name,
            "available": True
        })

    return targets