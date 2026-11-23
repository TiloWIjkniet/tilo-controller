"""Home Assistant integration for GeurBot devices."""
from __future__ import annotations

import logging
import json
from copy import deepcopy
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import panel_custom

from .const import DOMAIN, PLATFORMS, PANEL_TITLE, PANEL_ICON
from .storage import GeurBotStore
from .api import async_register_services
from .coordinator import GeurBotCoordinator
from .backend.core.device_manager import DeviceManager
from .backend.api.notification_settings import set_settings_provider, DEFAULT_NOTIFICATION_SETTINGS, merge_settings, validate_settings
from .backend.notification.notifications import notification_manager
from .backend.automations.fragrance_monitor import FragranceMonitor
from .backend.automations.schedule_runner import ScheduleRunner
from homeassistant.helpers.update_coordinator import UpdateFailed
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util
from .backend.communication.esp_client import set_shared_session
from .views import GeurBotApiView, GeurBotRootApiView, GeurBotDevicesAddView

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up routes and services once for this HA instance."""
    async_register_services(hass)
    hass.http.register_view(GeurBotApiView())
    hass.http.register_view(GeurBotRootApiView())
    hass.http.register_view(GeurBotDevicesAddView())
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up GeurBot from a config entry."""
    store = GeurBotStore(hass)
    stored = await store.async_load()
    set_shared_session(async_get_clientsession(hass))
    manager = DeviceManager()
    for device in stored.get("devices", {}).values():
        if isinstance(device, dict) and device.get("device_id"):
            manager.registry.add(device)

    runtime = {
        "store": store,
        "device_manager": manager,
        "coordinators": {},
        "entry": entry,
        "entity_adders": {},
    }
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN] = runtime

    for device_id, device in manager.registry.devices.items():
        coordinator = GeurBotCoordinator(hass, device)
        runtime["coordinators"][device_id] = coordinator
        try:
            await coordinator.async_config_entry_first_refresh()
        except UpdateFailed as err:
            _LOGGER.warning("GeurBot %s is momenteel niet bereikbaar: %s", device_id, err)

    async def persist_devices() -> None:
        await store.async_save_devices(manager.get_devices())

    async def handle_device_found(device):
        await persist_devices()
        device_id = device["device_id"]
        if device_id in runtime["coordinators"]:
            return
        coordinator = GeurBotCoordinator(hass, device)
        runtime["coordinators"][device_id] = coordinator
        await coordinator.async_refresh()
        for platform, adder in runtime["entity_adders"].items():
            adder(coordinator)
    manager.on_device_found = handle_device_found

    if store.data.get("notification_settings") is None:
        legacy_file = Path(__file__).parent / "backend" / "data" / "notification_settings.json"
        def read_legacy_settings():
            try:
                with legacy_file.open("r", encoding="utf-8") as legacy:
                    value = json.load(legacy)
                return value if isinstance(value, dict) else None
            except (OSError, ValueError, TypeError):
                return None
        legacy_settings = await hass.async_add_executor_job(read_legacy_settings)
        settings = merge_settings(DEFAULT_NOTIFICATION_SETTINGS, legacy_settings or {})
        try:
            validate_settings(settings)
        except (ValueError, TypeError, KeyError):
            settings = deepcopy(DEFAULT_NOTIFICATION_SETTINGS)
        store.data["notification_settings"] = settings
        await store.async_save()
    set_settings_provider(lambda: store.data.get("notification_settings") or DEFAULT_NOTIFICATION_SETTINGS)

    async def notification_handler(**notification):
        title = notification.get("title", "GeurBot")
        message = notification.get("message", "")
        notification_id = f"geurbot_{notification.get('type', 'event').replace('.', '_')}_{notification.get('device_id') or 'general'}"
        notify_service = entry.data.get("notify_service", "").strip()
        if notify_service and "." in notify_service:
            notify_domain, notify_name = notify_service.split(".", 1)
            try:
                await hass.services.async_call(
                    notify_domain, notify_name,
                    {"title": title, "message": message},
                    blocking=True,
                )
                return
            except Exception as err:
                _LOGGER.warning("GeurBot notify-service mislukt; persistent notification als fallback: %s", err)
        await hass.services.async_call(
            "persistent_notification", "create",
            {"title": title, "message": message, "notification_id": notification_id},
            blocking=True,
        )
    notification_manager.set_handler(notification_handler)
    notification_manager.set_now_provider(dt_util.now)
    notification_manager.restore_state(store.data.get("notification_state"))

    async def persist_notification_state(state):
        store.data["notification_state"] = state
        await store.async_save()
    notification_manager.set_persist_handler(persist_notification_state)
    await notification_manager.start()

    fragrance_monitor = FragranceMonitor(manager)

    stored_schedule_keys = [
        tuple(item) for item in store.data.get("metadata", {}).get("schedule_last_executed", [])
        if isinstance(item, list) and len(item) == 3
    ]
    async def persist_schedule_state(executed):
        store.data.setdefault("metadata", {})["schedule_last_executed"] = [list(item) for item in executed]
        await store.async_save()
    schedule_runner = ScheduleRunner(
        manager,
        now_provider=dt_util.now,
        executed_schedules=stored_schedule_keys,
        on_state_changed=persist_schedule_state,
    )
    await fragrance_monitor.start()
    await schedule_runner.start()

    async def stop_background_tasks():
        await fragrance_monitor.stop()
        await schedule_runner.stop()
        await notification_manager.stop()
    entry.async_on_unload(stop_background_tasks)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))

    # Register the built frontend and sidebar panel.
    frontend_dir = Path(__file__).parent / "frontend"
    if not hass.data.get(f"{DOMAIN}_panel_registered"):
        try:
            await hass.http.async_register_static_paths([
                StaticPathConfig("/geurbot_static", str(frontend_dir), False),
                StaticPathConfig("/geurbot_panel", str(frontend_dir / "public"), False),
            ])
            await panel_custom.async_register_panel(
                hass,
                webcomponent_name="ha-panel-geurbot",
                frontend_url_path="geurbot",
                sidebar_title=PANEL_TITLE,
                sidebar_icon=PANEL_ICON,
                module_url="/geurbot_panel/panel.js",
                embed_iframe=False,
                require_admin=False,
            )
            hass.data[f"{DOMAIN}_panel_registered"] = True
        except (OSError, ValueError, RuntimeError) as err:
            _LOGGER.warning("GeurBot frontend-paneel kon niet worden geregistreerd: %s", err)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the integration."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        runtime = hass.data.pop(DOMAIN, None)
        if runtime:
            await runtime["store"].async_save_devices(
                runtime["device_manager"].get_devices()
            )
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)
