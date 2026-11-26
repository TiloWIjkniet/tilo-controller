
import asyncio
from datetime import datetime

from ..api.notification_settings import load_settings


BUFFER_DELAY = 120
REPEAT_INTERVAL = 360


class NotificationManager:

    def __init__(self):
        self.pending = {}
        self.active_alerts = set()
        self.last_sent = {}

        self.running = False
        self.task = None
        self.handler = None

        self.lock = asyncio.Lock()
        self.now_provider = datetime.now
        self.persist_handler = None

    # ==================================================
    # CONFIGURATIE
    # ==================================================

    def set_handler(self, handler):
        self.handler = handler

    def set_now_provider(self, provider):
        self.now_provider = provider

    def set_persist_handler(self, handler):
        self.persist_handler = handler

    # ==================================================
    # STATUS OPSLAAN EN HERSTELLEN
    # ==================================================

    def export_state(self):
        return {
            "active_alerts": list(self.active_alerts),

            "last_sent": [
                [list(key), value]
                for key, value in self.last_sent.items()
            ],

            "pending": [
                [list(key), value]
                for key, value in self.pending.items()
            ],
        }

    def restore_state(self, state):
        if not isinstance(state, dict):
            return

        self.active_alerts = set(
            state.get("active_alerts", [])
        )

        self.last_sent = {
            tuple(key): value
            for key, value in state.get("last_sent", [])
            if isinstance(key, list) and len(key) == 2
        }

        self.pending = {
            tuple(key): value
            for key, value in state.get("pending", [])
            if (
                isinstance(key, list)
                and len(key) == 2
                and isinstance(value, dict)
            )
        }

    async def _persist_state(self):
        if self.persist_handler:
            await self.persist_handler(self.export_state())

    # ==================================================
    # STARTEN EN STOPPEN
    # ==================================================

    async def start(self):
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self.run())

        print("[NOTIFICATIONS] Manager gestart")

    async def stop(self):
        self.running = False

        if self.task:
            self.task.cancel()

            try:
                await self.task
            except asyncio.CancelledError:
                pass

        print("[NOTIFICATIONS] Manager gestopt")

    async def run(self):
        while self.running:
            settings = load_settings()

            delay = max(
                1,
                int(
                    settings.get("buffer", {}).get(
                        "delaySeconds",
                        BUFFER_DELAY
                    )
                )
            )

            await asyncio.sleep(delay)
            await self.flush()

    # ==================================================
    # NOTIFICATIE TOEVOEGEN
    # ==================================================

    async def send_notification(
        self,
        notification_type,
        title,
        message,
        device_id=None,
        fragrance_mac=None,
        details=None
    ):
        settings = load_settings()

        if not settings.get("enabled", True):
            return

        state, category = self.get_notification_state(
            notification_type
        )

        if not self.is_enabled(settings, notification_type):
            return

        alert_key = self.get_alert_key(
            notification_type,
            device_id,
            fragrance_mac
        )

        async with self.lock:

            # ------------------------------------------
            # HERSTEL VAN EEN EERDER GEMELDE STORING
            # ------------------------------------------

            if state == "recovered":
                recovery_keys = [alert_key]

                if notification_type == "fragrances.available":
                    recovery_keys.extend([
                        self.get_alert_key(
                            "fragrances.empty",
                            device_id,
                            fragrance_mac
                        ),

                        self.get_alert_key(
                            "fragrances.predictedEmpty",
                            device_id,
                            fragrance_mac
                        )
                    ])

                active_keys = [
                    key
                    for key in recovery_keys
                    if key in self.active_alerts
                ]

                if not active_keys:
                    return

                for key in active_keys:
                    self.active_alerts.discard(key)

            # ------------------------------------------
            # NIEUWE STORING
            # ------------------------------------------

            elif state == "problem":
                self.active_alerts.add(alert_key)

            # ------------------------------------------
            # MELDING GROEPEREN
            # ------------------------------------------

            group_key = (
                notification_type,
                device_id
            )

            if group_key not in self.pending:
                self.pending[group_key] = {
                    "type": notification_type,
                    "title": title,
                    "device_id": device_id,
                    "items": {},
                    "details": []
                }

            item_key = (
                fragrance_mac
                or device_id
                or notification_type
            )

            self.pending[group_key]["items"][item_key] = message

            if details:
                self.pending[group_key]["details"].append(
                    details
                )

        await self._persist_state()

        if not settings.get("buffer", {}).get("enabled", True):
            await self.flush()

    # ==================================================
    # NOTIFICATIESTATUS
    # ==================================================

    def get_notification_state(self, notification_type):
        states = {
            "devices.offline": ("problem", "devices"),
            "devices.online": ("recovered", "devices"),

            "fragrances.unavailable": ("problem", "fragrances"),
            "fragrances.available": ("recovered", "fragrances"),

            "fragrances.empty": ("problem", "fragrances"),
            "fragrances.predictedEmpty": ("problem", "fragrances")
        }

        return states.get(
            notification_type,
            ("normal", notification_type)
        )

    # ==================================================
    # ALERT IDENTIFICATIE
    # ==================================================

    def get_alert_key(
        self,
        notification_type,
        device_id,
        fragrance_mac
    ):
        if notification_type.startswith("devices."):
            return f"device:{device_id}"

        if notification_type in {
            "fragrances.unavailable",
            "fragrances.available"
        }:
            kind = "availability"

        elif notification_type == "fragrances.empty":
            kind = "empty"

        elif notification_type == "fragrances.predictedEmpty":
            kind = "predicted_empty"

        else:
            kind = notification_type

        return (
            f"fragrance:{device_id}:"
            f"{fragrance_mac}:{kind}"
        )

    # ==================================================
    # INSTELLINGEN CONTROLEREN
    # ==================================================

    def is_enabled(self, settings, category):
        mapping = {
            "devices.offline": ("devices", "offline"),
            "devices.online": ("devices", "online"),

            "fragrances.unavailable": (
                "fragrances",
                "unavailable"
            ),

            "fragrances.available": (
                "fragrances",
                "available"
            ),

            "fragrances.empty": (
                "fragrances",
                "empty"
            ),

            "fragrances.predictedEmpty": (
                "fragrances",
                "predictedEmpty"
            ),

            "schedule.sprayError": (
                "schedule",
                "sprayError"
            ),

            "schedule.scheduleError": (
                "schedule",
                "scheduleError"
            ),

            "firmware.available": (
                "firmware",
                "available"
            ),
        }

        path = mapping.get(category)

        if path is None:
            return True

        return bool(
            settings.get(path[0], {}).get(path[1], False)
        )

    # ==================================================
    # STILLE UREN
    # ==================================================

    def is_quiet_hours(self, settings):
        quiet = settings["general"]["quietHours"]

        if not quiet["enabled"]:
            return False

        now = self.now_provider().time()

        start = datetime.strptime(
            quiet["start"],
            "%H:%M"
        ).time()

        end = datetime.strptime(
            quiet["end"],
            "%H:%M"
        ).time()

        if start <= end:
            return start <= now < end

        return now >= start or now < end

    # ==================================================
    # BUFFER VERWERKEN
    # ==================================================

    async def flush(self):
        async with self.lock:
            notifications = self.pending
            self.pending = {}

        for group in notifications.values():
            await self.process_notification(group)

        await self._persist_state()

    # ==================================================
    # NOTIFICATIE VERWERKEN
    # ==================================================

    async def process_notification(self, group):
        settings = load_settings()

        if not settings.get("enabled", True):
            return

        notification_type = group["type"]

        state, category = self.get_notification_state(
            notification_type
        )

        if not self.is_enabled(settings, notification_type):
            return

        # ----------------------------------------------
        # STILLE UREN
        # ----------------------------------------------

        if self.is_quiet_hours(settings):
            print(
                "[NOTIFICATIONS] Melding uitgesteld vanwege stille uren"
            )

            async with self.lock:
                key = (
                    notification_type,
                    group["device_id"]
                )

                self.pending[key] = group

            return

        # ----------------------------------------------
        # HERHAALINTERVAL
        # ----------------------------------------------

        now = self.now_provider().timestamp()

        repeat_enabled = settings.get(
            "repeat", {}
        ).get("enabled", True)

        repeat_interval = settings.get(
            "repeat", {}
        ).get(
            "intervalMinutes",
            REPEAT_INTERVAL
        ) * 60

        repeat_key = (
            notification_type,
            group["device_id"]
        )

        last_sent = self.last_sent.get(
            repeat_key,
            0
        )

        if state == "problem" and repeat_enabled:
            if now - last_sent < repeat_interval:
                return

        # ----------------------------------------------
        # BERICHT OPBOUWEN
        # ----------------------------------------------

        messages = list(
            group["items"].values()
        )

        message = "\n".join(messages)

        if len(messages) > 1:
            message = (
                f"{len(messages)} meldingen:\n"
                + message
            )

      
        # ----------------------------------------------
        # VERZENDEN
        # ----------------------------------------------

        if self.handler:
            try:
                result = await self.handler(
                    notification_type=notification_type,
                    title=group["title"],
                    message=message,
                    device_id=group["device_id"],
                    details=group["details"]
                )

                if result is False:
                    print(
                        "[NOTIFICATIONS] Niet alle bestemmingen "
                        "hebben de melding ontvangen"
                    )

                    async with self.lock:
                        key = (
                            notification_type,
                            group["device_id"]
                        )

                        self.pending[key] = group

                    return

            except Exception as error:
                print(
                    "[NOTIFICATIONS] Versturen mislukt:",
                    error
                )

                async with self.lock:
                    key = (
                        notification_type,
                        group["device_id"]
                    )

                    self.pending[key] = group

                return

        else:
            print(
                "[NOTIFICATIONS] Geen notificatie-handler ingesteld"
            )
            return

        # ----------------------------------------------
        # VERZENDSTATUS BIJWERKEN
        # ----------------------------------------------

        self.last_sent[repeat_key] = now

        print(
            f"[NOTIFICATIONS] Verstuurd: {notification_type}"
        )

        await self._persist_state()



# ==================================================
# GLOBALE NOTIFICATION MANAGER
# ==================================================

notification_manager = NotificationManager()


# ==================================================
# HOME ASSISTANT NOTIFICATIES VERZENDEN
# ==================================================



# ==================================================
# HOME ASSISTANT NOTIFICATIES VERZENDEN
# ==================================================

async def send_notification(
    hass,
    notification_type,
    title,
    message,
    device_id=None,
    details=None
):
    """Send a notification to all selected HA targets."""

    settings = load_settings()

    destinations = settings.get("destinations", [])

    if not destinations:
        print(
            "[NOTIFICATIONS] Geen bestemmingen geselecteerd"
        )
        return False

    successful_destinations = []
    failed_destinations = []

    for entity_id in destinations:

        if not isinstance(entity_id, str):
            failed_destinations.append(str(entity_id))
            continue

        if not entity_id.startswith("notify."):
            failed_destinations.append(entity_id)
            continue

        try:
            # ------------------------------------------
            # MODERNE NOTIFY-ENTITEIT
            # ------------------------------------------

            state = hass.states.get(entity_id)

            if state is not None:
                await hass.services.async_call(
                    "notify",
                    "send_message",
                    {
                        "title": title,
                        "message": message
                    },
                    target={
                        "entity_id": entity_id
                    },
                    blocking=True
                )

            # ------------------------------------------
            # OUDE NOTIFY-SERVICE
            # ------------------------------------------

            else:
                service_name = entity_id.removeprefix(
                    "notify."
                )

                if not hass.services.has_service(
                    "notify",
                    service_name
                ):
                    raise RuntimeError(
                        f"Notify-service bestaat niet: {service_name}"
                    )

                await hass.services.async_call(
                    "notify",
                    service_name,
                    {
                        "title": title,
                        "message": message
                    },
                    blocking=True
                )

            successful_destinations.append(entity_id)

            print(
                f"[NOTIFICATIONS] Verzonden naar {entity_id}"
            )

        except Exception as error:
            failed_destinations.append(entity_id)

            print(
                f"[NOTIFICATIONS] Verzenden naar "
                f"{entity_id} mislukt: {error}"
            )

    # ----------------------------------------------
    # RESULTAAT
    # ----------------------------------------------

    if failed_destinations:
        print(
            "[NOTIFICATIONS] Mislukte bestemmingen:",
            ", ".join(failed_destinations)
        )

    if successful_destinations:
        print(
            "[NOTIFICATIONS] Succesvol verzonden:",
            ", ".join(successful_destinations)
        )

    # Alleen True als iedere geselecteerde bestemming
    # succesvol een bericht heeft ontvangen.

    return (
        len(successful_destinations) == len(destinations)
        and len(failed_destinations) == 0
    )
