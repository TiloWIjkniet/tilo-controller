
import asyncio
from datetime import datetime

from ..api.notification_settings import load_settings


BUFFER_DELAY = 120       # Seconden
REPEAT_INTERVAL = 360    # Minuten


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
        if self.persist_handler is None:
            return

        try:
            await self.persist_handler(self.export_state())

        except Exception as error:
            print(
                "[NOTIFICATIONS] Status opslaan mislukt:",
                error
            )

    # ==================================================
    # STARTEN EN STOPPEN
    # ==================================================

    async def start(self):
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self.run())

        print("[NOTIFICATIONS] Manager gestart")

        # Direct een startmelding versturen.
        await self.send_startup_notification()

    async def stop(self):
        self.running = False

        if self.task:
            self.task.cancel()

            try:
                await self.task

            except asyncio.CancelledError:
                pass

            self.task = None

        print("[NOTIFICATIONS] Manager gestopt")

    async def send_startup_notification(self):
        """Send a notification when the manager starts."""

        if self.handler is None:
            print(
                "[NOTIFICATIONS] Geen handler voor startmelding"
            )
            return

        try:
            settings = load_settings()

            if not settings.get("enabled", True):
                print(
                    "[NOTIFICATIONS] Startmelding overgeslagen: "
                    "notificaties zijn uitgeschakeld"
                )
                return

            if not settings.get("destinations", []):
                print(
                    "[NOTIFICATIONS] Startmelding overgeslagen: "
                    "geen bestemmingen geselecteerd"
                )
                return

            result = await self.handler(
                notification_type="system.started",
                title="GeurBot",
                message="GeurBot is succesvol gestart en klaar voor gebruik.",
                device_id=None,
                details=[]
            )

            if result is False:
                print(
                    "[NOTIFICATIONS] Startmelding kon niet "
                    "naar alle bestemmingen worden verstuurd"
                )
            else:
                print(
                    "[NOTIFICATIONS] Startmelding verstuurd"
                )

        except Exception as error:
            print(
                "[NOTIFICATIONS] Startmelding mislukt:",
                error
            )

    async def run(self):
        while self.running:
            try:
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

                if not self.running:
                    break

                await self.flush()

            except asyncio.CancelledError:
                raise

            except Exception as error:
                print(
                    "[NOTIFICATIONS] Fout in achtergrondtaak:",
                    error
                )

                await asyncio.sleep(5)

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

        state, _ = self.get_notification_state(
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
        quiet = settings.get(
            "general", {}
        ).get(
            "quietHours", {}
        )

        if not quiet.get("enabled", False):
            return False

        now = self.now_provider().time()

        start = datetime.strptime(
            quiet.get("start", "22:00"),
            "%H:%M"
        ).time()

        end = datetime.strptime(
            quiet.get("end", "08:00"),
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
            try:
                await self.process_notification(group)

            except Exception as error:
                print(
                    "[NOTIFICATIONS] Verwerken van melding mislukt:",
                    error
                )

                await self.requeue_notification(group)

        await self._persist_state()

    async def requeue_notification(self, group):
        key = (
            group.get("type"),
            group.get("device_id")
        )

        async with self.lock:
            if key not in self.pending:
                self.pending[key] = group
            else:
                # Voeg berichten toe aan een reeds bestaande groep.
                existing = self.pending[key]

                existing.setdefault("items", {}).update(
                    group.get("items", {})
                )

                existing.setdefault("details", []).extend(
                    group.get("details", [])
                )

    # ==================================================
    # NOTIFICATIE VERWERKEN
    # ==================================================

    async def process_notification(self, group):
        settings = load_settings()

        if not settings.get("enabled", True):
            return

        notification_type = group["type"]

        state, _ = self.get_notification_state(
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

            await self.requeue_notification(group)
            return

        # ----------------------------------------------
        # HERHAALINTERVAL
        # ----------------------------------------------

        now = self.now_provider().timestamp()

        repeat_settings = settings.get("repeat", {})

        repeat_enabled = repeat_settings.get(
            "enabled",
            True
        )

        repeat_interval = int(
            repeat_settings.get(
                "intervalMinutes",
                REPEAT_INTERVAL
            )
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

        message = "\n".join(
            str(item) for item in messages
        )

        if len(messages) > 1:
            message = (
                f"{len(messages)} meldingen:\n"
                + message
            )

        # ----------------------------------------------
        # VERZENDEN
        # ----------------------------------------------

        if self.handler is None:
            print(
                "[NOTIFICATIONS] Geen notificatie-handler ingesteld"
            )

            await self.requeue_notification(group)
            return

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

                await self.requeue_notification(group)
                return

        except Exception as error:
            print(
                "[NOTIFICATIONS] Versturen mislukt:",
                error
            )

            await self.requeue_notification(group)
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

    if not settings.get("enabled", True):
        print(
            "[NOTIFICATIONS] Notificaties zijn uitgeschakeld"
        )
        return False

    destinations = settings.get("destinations", [])

    if not destinations:
        print(
            "[NOTIFICATIONS] Geen bestemmingen geselecteerd"
        )
        return False

    successful_destinations = []
    failed_destinations = []

    for entity_id in destinations:

        if (
            not isinstance(entity_id, str)
            or not entity_id.startswith("notify.")
        ):
            failed_destinations.append(str(entity_id))
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

    return (
        len(successful_destinations) == len(destinations)
        and len(failed_destinations) == 0
    )
