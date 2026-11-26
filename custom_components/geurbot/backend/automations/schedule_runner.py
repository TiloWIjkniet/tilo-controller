
import asyncio
from datetime import datetime

from ..api.device_status import execute_device_fragrance_spray
from ..notification.notifications import send_notification


CHECK_INTERVAL = 30
SPRAY_INTERVAL = 2


class ScheduleRunner:

    def __init__(
        self,
        device_manager,
        now_provider=None,
        executed_schedules=None,
        on_state_changed=None
    ):
        self.device_manager = device_manager
        self.now_provider = now_provider or datetime.now
        self.on_state_changed = on_state_changed

        self.executed_schedules = set(executed_schedules or [])

        self.running = False
        self.task = None

    # ==================================================
    # START / STOP
    # ==================================================

    async def start(self):
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self.run())

        print("[SCHEDULE] Schedule runner gestart")

    async def stop(self):
        self.running = False

        if self.task:
            self.task.cancel()

            try:
                await self.task
            except asyncio.CancelledError:
                pass

            self.task = None

        print("[SCHEDULE] Schedule runner gestopt")

    # ==================================================
    # MAIN LOOP
    # ==================================================s

    async def run(self):
        while self.running:
            try:
                await self.check_schedules()

            except asyncio.CancelledError:
                raise

            except Exception as error:
                print(f"[SCHEDULE] Controlefout: {error}")

            await asyncio.sleep(CHECK_INTERVAL)

    # ==================================================
    # SCHEDULE CHECKING
    # ==================================================

    async def check_schedules(self):
        now = self.now_provider()

        current_time = now.strftime("%H:%M")
        current_weekday = now.weekday()
        minute_key = now.isoformat(timespec="minutes")

        # Verwijder oude uitvoeringssleutels.
        self.executed_schedules = {
            key
            for key in self.executed_schedules
            if key[2] == minute_key
        }

        for device in self.device_manager.get_devices():

            for fragrance in device.get("fragrances", []):

                # Controleer of de geur is ingeschakeld.
                if not fragrance.get("enabled", True):
                    continue

                for schedule in fragrance.get("schedule", []):

                    # Controleer of het schema is ingeschakeld.
                    if not schedule.get("enabled", True):
                        continue

                    schedule_id = schedule.get("id")

                    schedule_key = (
                        device["id"],
                        schedule_id,
                        minute_key
                    )

                    # Voorkom dubbele uitvoering.
                    if schedule_key in self.executed_schedules:
                        continue

                    # Controleer de ingestelde tijd.
                    if schedule.get("time") != current_time:
                        continue

                    # Controleer de ingestelde dagen.
                    if current_weekday not in schedule.get("days", []):
                        continue

                    # Markeer het schema als uitgevoerd.
                    self.executed_schedules.add(schedule_key)

                    if self.on_state_changed:
                        await self.on_state_changed(
                            self.executed_schedules
                        )

                    await self.execute_schedule(
                        device,
                        fragrance,
                        schedule
                    )

    # ==================================================
    # SCHEDULE EXECUTION
    # ==================================================

    async def execute_schedule(self, device, fragrance, schedule):

        device_id = device["id"]
        mac_address = fragrance["mac_address"]

        amount = int(schedule.get("sprays", 1))
        schedule_id = schedule.get("id")

        fragrance_name = fragrance.get(
            "name",
            "Onbekende geur"
        )

        device_name = device.get(
            "name",
            "Onbekend apparaat"
        )

        if amount <= 0:
            print(
                f"[SCHEDULE] Ongeldig aantal sprays: {amount}"
            )
            return

        print(
            f"[SCHEDULE] Uitvoeren: {fragrance_name} "
            f"op {device_name} ({amount} sprays)"
        )

        # --------------------------------------------------
        # SPRAYS UITVOEREN
        # --------------------------------------------------

        for spray_number in range(amount):

            try:
                print(
                    f"[SCHEDULE] Aanvraag versturen: "
                    f"{spray_number + 1}/{amount} "
                    f"naar {device_name}"
                )

                result = await execute_device_fragrance_spray(
                    device,
                    mac_address
                )

                print(
                    f"[SCHEDULE] ESP antwoord: {result}"
                )

                if not result or not result.get("success"):
                    error_message = (
                        result.get("error", "Spray mislukt")
                        if result
                        else "Geen resultaat ontvangen"
                    )

                    raise Exception(error_message)

                print(
                    f"[SCHEDULE] Spray "
                    f"{spray_number + 1}/{amount} uitgevoerd: "
                    f"{fragrance_name}"
                )

                # Wacht tussen de sprays.
                if spray_number < amount - 1:
                    await asyncio.sleep(SPRAY_INTERVAL)

            except asyncio.CancelledError:
                raise

            except Exception as error:

                print(
                    f"[SCHEDULE] Spray "
                    f"{spray_number + 1}/{amount} mislukt: {error}"
                )

                # --------------------------------------------------
                # FOUTNOTIFICATIE
                # --------------------------------------------------

                try:
                    await send_notification(
                        notification_type="schedule.sprayError",
                        title="Geplande spray mislukt",
                        message=(
                            f"De geplande spray van {fragrance_name} "
                            f"op apparaat {device_name} is mislukt. "
                            f"Spray {spray_number + 1} van {amount}. "
                            f"Fout: {error}"
                        ),
                        device_id=device_id,
                        details={
                            "schedule_id": schedule_id,
                            "spray_number": spray_number + 1,
                            "total_sprays": amount,
                            "device_name": device_name,
                            "fragrance_name": fragrance_name,
                            "error": str(error)
                        }
                    )

                except asyncio.CancelledError:
                    raise

                except Exception as notification_error:
                    print(
                        "[SCHEDULE] Versturen van foutnotificatie "
                        f"mislukt: {notification_error}"
                    )

                return

        # --------------------------------------------------
        # KLAAR
        # --------------------------------------------------

        print(
            f"[SCHEDULE] Uitgevoerd: {fragrance_name} "
            f"op {device_name} ({amount} sprays)"
        )
