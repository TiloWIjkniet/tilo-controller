
import asyncio

from ..api.manager import get_data
from ..api.notification_settings import load_settings
from ..notification.notifications import notification_manager


CHECK_INTERVAL = 60


class FragranceMonitor:

    def __init__(self, device_manager):
        self.device_manager = device_manager

        self.running = False
        self.task = None

        self.device_states = {}
        self.fragrance_states = {}

    # ==================================================
    # START / STOP
    # ==================================================

    async def start(self):
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self.run())

        print("[FRAGRANCE MONITOR] Gestart")

    async def stop(self):
        self.running = False

        if self.task is not None:
            self.task.cancel()

            try:
                await self.task
            except asyncio.CancelledError:
                pass

            self.task = None

        print("[FRAGRANCE MONITOR] Gestopt")

    # ==================================================
    # HOOFDLOOP
    # ==================================================

    async def run(self):
        while self.running:
            try:
                await self.check_devices()

            except asyncio.CancelledError:
                raise

            except Exception as error:
                print(
                    f"[FRAGRANCE MONITOR] Algemene controlefout: {error}"
                )

            try:
                await asyncio.sleep(CHECK_INTERVAL)

            except asyncio.CancelledError:
                raise

    # ==================================================
    # NOTIFICATIES
    # ==================================================

    async def notify(
        self,
        notification_type,
        title,
        message,
        device_id=None,
        fragrance_mac=None,
        details=None,
    ):
        notification_details = dict(details or {})

        if fragrance_mac:
            notification_details["fragrance_mac"] = fragrance_mac

        try:
            print(
                f"[FRAGRANCE MONITOR] Notificatie toegevoegd: "
                f"{notification_type}"
            )

            await notification_manager.send_notification(
                notification_type=notification_type,
                title=title,
                message=message,
                device_id=device_id,
                fragrance_mac=fragrance_mac,
                details=notification_details,
            )

        except Exception as error:
            print(
                f"[FRAGRANCE MONITOR] Notificatiefout: {error}"
            )

    # ==================================================
    # APPARATEN CONTROLEREN
    # ==================================================

    async def check_devices(self):
        devices = self.device_manager.get_devices()

        if not isinstance(devices, list):
            print(
                "[FRAGRANCE MONITOR] Ongeldige apparatenlijst"
            )
            return

        print(
            f"[FRAGRANCE MONITOR] Controle gestart: "
            f"{len(devices)} apparaat/apparaten"
        )

        for device in devices:
            if not isinstance(device, dict):
                continue

            device_id = device.get("device_id") or device.get("id")

            if not device_id:
                print(
                    "[FRAGRANCE MONITOR] Apparaat overgeslagen: "
                    "geen device_id"
                )
                continue

            name = device.get("name", device_id)

            try:
                await self.check_device(device, device_id)

                print(
                    f"[FRAGRANCE MONITOR] {name}: controle afgerond"
                )

            except asyncio.CancelledError:
                raise

            except Exception as error:
                print(
                    f"[FRAGRANCE MONITOR] {name}: "
                    f"controle mislukt: {error}"
                )

        print("[FRAGRANCE MONITOR] Alle apparaten verwerkt")

    # ==================================================
    # APPARAAT CONTROLEREN
    # ==================================================

    async def check_device(self, device, device_id):
        name = device.get("name", device_id)

        try:
            result = await get_data(
                device,
                "/api/device/fragrances/get-all"
            )

        except asyncio.CancelledError:
            raise

        except Exception as error:
            print(
                f"[FRAGRANCE MONITOR] Verbinding mislukt "
                f"met {name}: {error}"
            )

            result = {
                "success": False,
                "error": str(error),
            }

        if not isinstance(result, dict):
            print(
                f"[FRAGRANCE MONITOR] Ongeldige response van {name}"
            )

            result = {
                "success": False,
                "error": "Ongeldige API-response",
            }

        reachable = result.get("success") is True
        was_reachable = self.device_states.get(device_id)

        active_device_key = f"device:{device_id}"

        if (
            was_reachable is None
            and active_device_key in notification_manager.active_alerts
        ):
            was_reachable = False

        # ----------------------------------------------
        # APPARAAT NIET BEREIKBAAR
        # ----------------------------------------------

        if not reachable:
            self.device_states[device_id] = False

            print(
                f"[FRAGRANCE MONITOR] {name}: NIET BEREIKBAAR"
            )

            if was_reachable is not False:
                await self.notify(
                    notification_type="devices.offline",
                    title="Apparaat niet bereikbaar",
                    message=f"Apparaat {name} is niet bereikbaar.",
                    device_id=device_id,
                    details={
                        "error": result.get("error")
                    },
                )

            return

        # ----------------------------------------------
        # APPARAAT WEER BEREIKBAAR
        # ----------------------------------------------

        self.device_states[device_id] = True

        if was_reachable is False:
            await self.notify(
                notification_type="devices.online",
                title="Apparaat weer bereikbaar",
                message=f"Apparaat {name} is weer bereikbaar.",
                device_id=device_id,
            )

        # ----------------------------------------------
        # GEURMODULES UIT API HALEN
        # ----------------------------------------------

        data = result.get("data")

        if isinstance(data, list):
            esp_fragrances = data

        elif isinstance(data, dict):
            esp_fragrances = data.get("fragrances", [])

        else:
            esp_fragrances = None

        if not isinstance(esp_fragrances, list):
            print(
                f"[FRAGRANCE MONITOR] Ongeldige geurdata van {name}"
            )
            return

        esp_by_mac = {
            item["mac_address"]: item
            for item in esp_fragrances
            if (
                isinstance(item, dict)
                and isinstance(item.get("mac_address"), str)
                and item.get("mac_address")
            )
        }

        # ----------------------------------------------
        # GEURMODULES CONTROLEREN
        # ----------------------------------------------

        fragrances = device.get("fragrances", [])

        if not isinstance(fragrances, list):
            fragrances = []

        print(
            f"[FRAGRANCE MONITOR] {name}: "
            f"{len(fragrances)} geurmodule(s) gevonden"
        )

        for fragrance in fragrances:
            if not isinstance(fragrance, dict):
                continue

            try:
                mac_address = fragrance.get("mac_address")

                if not mac_address:
                    print(
                        "[FRAGRANCE MONITOR] Geurmodule zonder "
                        "MAC-adres overgeslagen"
                    )
                    continue

                esp_fragrance = esp_by_mac.get(mac_address)

                if esp_fragrance is None:
                    await self.check_availability(
                        device,
                        device_id,
                        fragrance,
                        False,
                    )
                    continue

                await self.check_availability(
                    device,
                    device_id,
                    fragrance,
                    True,
                )

                await self.check_fragrance(
                    device,
                    device_id,
                    fragrance,
                    esp_fragrance,
                )

            except asyncio.CancelledError:
                raise

            except Exception as error:
                print(
                    f"[FRAGRANCE MONITOR] Geurmodule "
                    f"{fragrance.get('name', 'onbekend')} "
                    f"controle mislukt: {error}"
                )

        print(
            f"[FRAGRANCE MONITOR] {name}: "
            f"alle geurmodules gecontroleerd"
        )

    # ==================================================
    # BEREIKBAARHEID GEURMODULE
    # ==================================================

    async def check_availability(
        self,
        device,
        device_id,
        fragrance,
        reachable,
    ):
        mac_address = fragrance.get("mac_address")

        if not mac_address:
            return

        name = fragrance.get("name", mac_address)
        key = (device_id, mac_address)

        was_reachable = self.fragrance_states.get(key)

        active_key = (
            f"fragrance:{device_id}:{mac_address}:availability"
        )

        if (
            was_reachable is None
            and active_key in notification_manager.active_alerts
        ):
            was_reachable = False

        if not reachable:
            self.fragrance_states[key] = False

            print(
                f"[FRAGRANCE MONITOR] "
                f"Geurmodule {name}: NIET BEREIKBAAR"
            )

            if was_reachable is not False:
                await self.notify(
                    notification_type="fragrances.unavailable",
                    title="Geurmodule niet bereikbaar",
                    message=f"Geurmodule {name} is niet bereikbaar.",
                    device_id=device_id,
                    fragrance_mac=mac_address,
                )

        else:
            self.fragrance_states[key] = True

            if was_reachable is False:
                await self.notify(
                    notification_type="fragrances.available",
                    title="Geurmodule weer bereikbaar",
                    message=f"Geurmodule {name} is weer bereikbaar.",
                    device_id=device_id,
                    fragrance_mac=mac_address,
                )

    # ==================================================
    # GEURVOORRAAD CONTROLEREN
    # ==================================================

    async def check_fragrance(
        self,
        device,
        device_id,
        saved_fragrance,
        esp_fragrance,
    ):
        mac_address = saved_fragrance.get("mac_address")

        if not mac_address:
            return

        name = saved_fragrance.get("name", mac_address)

        # ----------------------------------------------
        # BESCHIKBAARHEID
        # ----------------------------------------------

        available = esp_fragrance.get("available", False) is True

        empty_key = (device_id, mac_address, "empty")

        was_available = self.fragrance_states.get(empty_key)

        active_empty_key = (
            f"fragrance:{device_id}:{mac_address}:empty"
        )

        if (
            was_available is None
            and active_empty_key in notification_manager.active_alerts
        ):
            was_available = False

        if not available:
            self.fragrance_states[empty_key] = False

            if was_available is not False:
                await self.notify(
                    notification_type="fragrances.empty",
                    title="Geur niet beschikbaar",
                    message=(
                        f"Er is geen geur meer beschikbaar "
                        f"in flacon {name}."
                    ),
                    device_id=device_id,
                    fragrance_mac=mac_address,
                )

        else:
            self.fragrance_states[empty_key] = True

            if was_available is False:
                await self.notify(
                    notification_type="fragrances.available",
                    title="Geur weer beschikbaar",
                    message=(
                        f"Er is weer geur beschikbaar "
                        f"in flacon {name}."
                    ),
                    device_id=device_id,
                    fragrance_mac=mac_address,
                )

        # ----------------------------------------------
        # FYSIEKE LEEGMETING
        # ----------------------------------------------

        empty_value = esp_fragrance.get("empty_bottle_value")
        threshold = esp_fragrance.get("empty_bottle_threshold")

        if empty_value is not None and threshold is not None:
            try:
                empty_value = float(empty_value)
                threshold = float(threshold)

            except (TypeError, ValueError):
                print(
                    f"[FRAGRANCE MONITOR] Ongeldige "
                    f"leegmeting voor {name}"
                )

            else:
                sensor_key = (
                    device_id,
                    mac_address,
                    "sensor_empty",
                )

                was_empty = self.fragrance_states.get(sensor_key)

                sensor_alert_active = (
                    active_empty_key in notification_manager.active_alerts
                )

                if was_empty is None and sensor_alert_active:
                    was_empty = True

                is_empty = empty_value <= threshold

                self.fragrance_states[sensor_key] = is_empty

                if is_empty and was_empty is not True:
                    await self.notify(
                        notification_type="fragrances.empty",
                        title="Geurflacon fysiek leeg",
                        message=f"De geurflacon {name} is fysiek leeg.",
                        device_id=device_id,
                        fragrance_mac=mac_address,
                        details={
                            "empty_bottle_value": empty_value,
                            "empty_bottle_threshold": threshold,
                        },
                    )

        # ----------------------------------------------
        # VOORSPELLING BIJNA LEEG
        # ----------------------------------------------

        settings = load_settings()

        prediction_days = (
            settings.get("fragrances", {}).get(
                "predictionDays",
                3
            )
        )

        try:
            total_sprays = float(
                esp_fragrance.get("total_sprays", 0)
            )

            estimated_sprays = float(
                esp_fragrance.get("estimated_sprays", 0)
            )

            prediction_days = float(prediction_days)

        except (TypeError, ValueError):
            print(
                f"[FRAGRANCE MONITOR] Ongeldige "
                f"voorraadgegevens voor {name}"
            )
            return

        if prediction_days < 0:
            prediction_days = 0

        remaining_sprays = estimated_sprays - total_sprays

        if remaining_sprays <= 0:
            return

        weekly_sprays = self.calculate_schedule_usage(
            saved_fragrance
        )

        if weekly_sprays <= 0:
            return

        daily_usage = weekly_sprays / 7

        if daily_usage <= 0:
            return

        days_remaining = remaining_sprays / daily_usage

        prediction_key = (
            device_id,
            mac_address,
            "predicted",
        )

        active_prediction_key = (
            f"fragrance:{device_id}:{mac_address}:predicted_empty"
        )

        was_predicted = self.fragrance_states.get(
            prediction_key
        )

        if (
            was_predicted is None
            and active_prediction_key in notification_manager.active_alerts
        ):
            was_predicted = True

        predicted = days_remaining <= prediction_days

        self.fragrance_states[prediction_key] = predicted

        if predicted and was_predicted is not True:
            await self.notify(
                notification_type="fragrances.predictedEmpty",
                title="Geurflacon bijna leeg",
                message=(
                    f"De geurflacon {name} is naar verwachting "
                    f"over {days_remaining:.1f} dagen leeg."
                ),
                device_id=device_id,
                fragrance_mac=mac_address,
                details={
                    "days_remaining": round(days_remaining, 1),
                    "remaining_sprays": remaining_sprays,
                    "daily_usage": round(daily_usage, 2),
                    "weekly_sprays": weekly_sprays,
                },
            )

        elif predicted is False and was_predicted is True:
            await self.notify(
                notification_type="fragrances.available",
                title="Geurflacon weer op voorraad",
                message=(
                    f"De voorspelde bijna-leeg waarschuwing "
                    f"voor {name} is niet meer van toepassing."
                ),
                device_id=device_id,
                fragrance_mac=mac_address,
            )

    # ==================================================
    # VERBRUIK BEREKENEN
    # ==================================================

    def calculate_schedule_usage(self, fragrance):
        schedules = fragrance.get("schedule", [])

        if not isinstance(schedules, list):
            return 0

        weekly_sprays = 0

        for schedule in schedules:
            if not isinstance(schedule, dict):
                continue

            if not schedule.get("enabled", True):
                continue

            days = schedule.get("days", list(range(7)))
            sprays = schedule.get("sprays", 0)

            if not isinstance(days, list):
                continue

            try:
                weekly_sprays += len(days) * float(sprays)

            except (TypeError, ValueError):
                print(
                    "[FRAGRANCE MONITOR] "
                    "Ongeldig schema overgeslagen"
                )

        return weekly_sprays
