
import asyncio
import time

from ..api.manager import get_data
from ..notification.notifications import send_notification, notification_manager
from ..api.notification_settings import load_settings

CHECK_INTERVAL = 60


class FragranceMonitor:

    def __init__(self, device_manager):
        self.device_manager = device_manager
        self.running = False
        self.task = None
        self.device_states = {}
        self.fragrance_states = {}

    async def start(self):
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self.run())

        print("[FRAGRANCE MONITOR] Gestart")

    async def stop(self):
        self.running = False

        if self.task:
            self.task.cancel()

            try:
                await self.task
            except asyncio.CancelledError:
                pass

        print("[FRAGRANCE MONITOR] Gestopt")

    async def run(self):
        while self.running:
            try:
                await self.check_devices()
            except Exception as error:
                print("[FRAGRANCE MONITOR] Controlefout:", error)

            await asyncio.sleep(CHECK_INTERVAL)

    async def check_devices(self):
        for device in self.device_manager.get_devices():
            device_id = device.get("device_id") or device.get("id")

            if not device_id:
                continue

            await self.check_device(device, device_id)

    async def check_device(self, device, device_id):
        try:
            result = await get_data(device, "/api/device/fragrances/get-all")
        except Exception as error:
            print(f"[FRAGRANCE MONITOR] Verbinding mislukt met {device_id}: {error}")
            result = {"success": False, "error": str(error)}

        reachable = result.get("success", False)
        was_reachable = self.device_states.get(device_id)
        if was_reachable is None and f"device:{device_id}" in notification_manager.active_alerts:
            was_reachable = False

        if not reachable:
            self.device_states[device_id] = False

            if was_reachable is not False:
                await send_notification(
                    notification_type="devices.offline",
                    title="Apparaat niet bereikbaar",
                    message=f"Apparaat {device.get('name', device_id)} is niet bereikbaar.",
                    device_id=device_id,
                    details={"error": result.get("error")}
                )

            return

        self.device_states[device_id] = True

        if was_reachable is False:
            await send_notification(
                notification_type="devices.online",
                title="Apparaat weer bereikbaar",
                message=f"Apparaat {device.get('name', device_id)} is weer bereikbaar.",
                device_id=device_id
            )

        data = result.get("data")

        esp_fragrances = (
            data if isinstance(data, list)
            else data.get("fragrances", []) if isinstance(data, dict)
            else None
        )

        if not isinstance(esp_fragrances, list):
            print(f"[FRAGRANCE MONITOR] Ongeldige response: {device_id}")
            return

        esp_by_mac = {
            item["mac_address"]: item
            for item in esp_fragrances
            if isinstance(item, dict) and item.get("mac_address")
        }

        for fragrance in device.get("fragrances", []):
            mac_address = fragrance.get("mac_address")

            if not mac_address:
                continue

            esp_fragrance = esp_by_mac.get(mac_address)

            if esp_fragrance is None:
                await self.check_availability(
                    device,
                    device_id,
                    fragrance,
                    False
                )
                continue

            await self.check_availability(
                device,
                device_id,
                fragrance,
                True
            )

            await self.check_fragrance(
                device,
                device_id,
                fragrance,
                esp_fragrance
            )

        print(
            f"[FRAGRANCE MONITOR] {device.get('name', device_id)} gecontroleerd"
        )

    async def check_availability(
        self,
        device,
        device_id,
        fragrance,
        reachable
    ):
        mac_address = fragrance["mac_address"]
        key = (device_id, mac_address)

        was_reachable = self.fragrance_states.get(key)
        active_key = f"fragrance:{device_id}:{mac_address}:availability"
        if was_reachable is None and active_key in notification_manager.active_alerts:
            was_reachable = False

        if not reachable:
            self.fragrance_states[key] = False

            if was_reachable is not False:
                await send_notification(
                    notification_type="fragrances.unavailable",
                    title="Geurmodule niet bereikbaar",
                    message=f"Geurmodule {fragrance.get('name', mac_address)} is niet bereikbaar.",
                    device_id=device_id,
                    fragrance_mac=mac_address
                )

        else:
            self.fragrance_states[key] = True

            if was_reachable is False:
                await send_notification(
                    notification_type="fragrances.available",
                    title="Geurmodule weer bereikbaar",
                    message=f"Geurmodule {fragrance.get('name', mac_address)} is weer bereikbaar.",
                    device_id=device_id,
                    fragrance_mac=mac_address
                )

    async def check_fragrance(
        self,
        device,
        device_id,
        saved_fragrance,
        esp_fragrance
    ):
        mac_address = saved_fragrance["mac_address"]
        name = saved_fragrance.get("name", mac_address)

        # Controleer of er nog geur beschikbaar is.
        available = esp_fragrance.get("available", False)
        empty_key = (device_id, mac_address, "empty")
        was_available = self.fragrance_states.get(empty_key)
        if was_available is None and f"fragrance:{device_id}:{mac_address}:empty" in notification_manager.active_alerts:
            was_available = False

        if not available:
            self.fragrance_states[empty_key] = False

            if was_available is not False:
                await send_notification(
                    notification_type="fragrances.empty",
                    title="Geur niet beschikbaar",
                    message=f"Er is geen geur meer beschikbaar in flacon {name}.",
                    device_id=device_id,
                    fragrance_mac=mac_address
                )

        else:
            self.fragrance_states[empty_key] = True

            if was_available is False:
                await send_notification(
                    notification_type="fragrances.available",
                    title="Geur weer beschikbaar",
                    message=f"Er is weer geur beschikbaar in flacon {name}.",
                    device_id=device_id,
                    fragrance_mac=mac_address
                )

        # Controleer de fysieke leegmeting.
        empty_value = esp_fragrance.get("empty_bottle_value")
        threshold = esp_fragrance.get("empty_bottle_threshold")

        if empty_value is not None and threshold is not None:
            sensor_key = (device_id, mac_address, "sensor_empty")
            was_empty = self.fragrance_states.get(sensor_key)
            is_empty = float(empty_value) <= float(threshold)

            self.fragrance_states[sensor_key] = is_empty

            if is_empty and was_empty is not True:
                await send_notification(
                    notification_type="fragrances.empty",
                    title="Geurflacon fysiek leeg",
                    message=f"De geurflacon {name} is fysiek leeg.",
                    device_id=device_id,
                    fragrance_mac=mac_address,
                    details={
                        "empty_bottle_value": empty_value,
                        "empty_bottle_threshold": threshold
                    }
                )

            # Voorspel wanneer de flacon leeg raakt.
        settings = load_settings()
        prediction_days = settings["fragrances"]["predictionDays"]

        total_sprays = esp_fragrance.get("total_sprays", 0)
        estimated_sprays = esp_fragrance.get("estimated_sprays", 0)

        remaining_sprays = estimated_sprays - total_sprays

        if remaining_sprays <= 0:
            return

        weekly_sprays = self.calculate_schedule_usage(saved_fragrance)

        if weekly_sprays <= 0:
            return

        daily_usage = weekly_sprays / 7
        days_remaining = remaining_sprays / daily_usage

        prediction_key = (device_id, mac_address, "predicted")
        was_predicted = self.fragrance_states.get(
            prediction_key,
            f"fragrance:{device_id}:{mac_address}:predicted_empty" in notification_manager.active_alerts,
        )

        predicted = days_remaining <= prediction_days

        self.fragrance_states[prediction_key] = predicted

        if predicted and not was_predicted:
            await send_notification(
                notification_type="fragrances.predictedEmpty",
                title="Geurflacon bijna leeg",
                message=f"De geurflacon {name} is naar verwachting over {days_remaining:.1f} dagen leeg.",
                device_id=device_id,
                fragrance_mac=mac_address,
                details={
                    "days_remaining": round(days_remaining, 1),
                    "remaining_sprays": remaining_sprays,
                    "daily_usage": round(daily_usage, 2),
                    "weekly_sprays": weekly_sprays
                }
            )
        elif not predicted and was_predicted:
            await send_notification(
                notification_type="fragrances.available",
                title="Geurflacon weer op voorraad",
                message=f"De voorspelde bijna-leeg waarschuwing voor {name} is niet meer van toepassing.",
                device_id=device_id,
                fragrance_mac=mac_address,
            )
    def calculate_schedule_usage(self, fragrance):
        schedules = fragrance.get("schedule", [])
        weekly_sprays = 0

        for schedule in schedules:
            if not schedule.get("enabled", True):
                continue

            days = schedule.get("days", list(range(7)))
            sprays = schedule.get("sprays", 0)

            weekly_sprays += len(days) * sprays

        return weekly_sprays
