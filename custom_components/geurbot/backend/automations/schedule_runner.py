
import asyncio
from datetime import datetime

from ..api.device_status import execute_device_fragrance_spray
from ..notification.notifications import send_notification


CHECK_INTERVAL = 30
SPRAY_INTERVAL = 2


class ScheduleRunner:

    def __init__(self, device_manager, now_provider=None, executed_schedules=None, on_state_changed=None):
        self.device_manager = device_manager
        self.now_provider = now_provider or datetime.now
        self.on_state_changed = on_state_changed
        self.executed_schedules = set(executed_schedules or [])
        self.running = False
        self.task = None

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

        print("[SCHEDULE] Schedule runner gestopt")

    async def run(self):
        while self.running:
            try:
                await self.check_schedules()
            except Exception as error:
                print(f"[SCHEDULE] Controlefout: {error}")

            await asyncio.sleep(CHECK_INTERVAL)

    async def check_schedules(self):
        now = self.now_provider()
        current_time = now.strftime("%H:%M")
        current_weekday = now.weekday()

        minute_key = now.isoformat(timespec="minutes")

        # Keep only the current minute's de-duplication keys; old keys are not useful.
        self.executed_schedules = {
            key for key in self.executed_schedules if key[2] == minute_key
        }

        for device in self.device_manager.get_devices():

            for fragrance in device.get("fragrances", []):

                for schedule in fragrance.get("schedule", []):

                    schedule_id = schedule.get("id")
                    schedule_key = (device["id"], schedule_id, minute_key)

                    if schedule_key in self.executed_schedules:
                        continue

                    if schedule.get("time") != current_time:
                        continue

                    if current_weekday not in schedule.get("days", []):
                        continue

                    self.executed_schedules.add(schedule_key)
                    if self.on_state_changed:
                        await self.on_state_changed(self.executed_schedules)

                    await self.execute_schedule(
                        device,
                        fragrance,
                        schedule
                    )

    async def execute_schedule(self, device, fragrance, schedule):
        device_id = device["id"]
        mac_address = fragrance["mac_address"]
        amount = schedule.get("sprays", 1)

        print(
            f"[SCHEDULE] Uitvoeren: {fragrance.get('name')} "
            f"op {device.get('name')} ({amount} sprays)"
        )

        for spray_number in range(amount):

            try:
                result = await execute_device_fragrance_spray(
                    device,
                    mac_address
                )

                if not result.get("success"):
                    raise Exception(result.get("error", "Spray mislukt"))

                if spray_number < amount - 1:
                    await asyncio.sleep(SPRAY_INTERVAL)

            except Exception as error:

                print(f"[SCHEDULE] Spray mislukt: {error}")

                await send_notification(
                    notification_type="schedule.sprayError",
                    title="Spray mislukt",
                    message=f"De geplande spray van {fragrance.get('name')} is mislukt.",
                    device_id=device_id,
                    fragrance_mac=mac_address,
                    details={
                        "schedule_id": schedule.get("id"),
                        "spray_number": spray_number + 1,
                        "error": str(error)
                    }
                )

                return

        print(f"[SCHEDULE] Uitgevoerd: {fragrance.get('name')}")
