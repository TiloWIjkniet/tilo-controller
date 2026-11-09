
"""Schedule manager for Tilo Controller."""


class ScheduleManager:
    """Manage schedules for ESP controllers."""

    def __init__(self):
        """Initialize the schedule manager."""

        self.schedules = {}

    def add_event(
        self,
        esp_id: str,
        event_id: str,
        fragrance_id: str,
        time: str,
        amount: int = 1,
        days: list = None,
    ):
        """Add an event to an ESP schedule."""

        if esp_id not in self.schedules:
            self.schedules[esp_id] = {}

        self.schedules[esp_id][event_id] = {
            "id": event_id,
            "fragrance_id": fragrance_id,
            "time": time,
            "amount": amount,
            "days": days if days is not None else [
                "ma", "di", "wo", "do", "vr", "za", "zo"
            ],
        }

    def update_event(self, esp_id: str, event_id: str, changes: dict):
        """Update an existing schedule event."""

        schedule = self.schedules.get(esp_id)

        if schedule is None or event_id not in schedule:
            return False

        schedule[event_id].update(changes)
        return True

    def remove_event(self, esp_id: str, event_id: str):
        """Remove an event from an ESP schedule."""

        if esp_id in self.schedules:
            self.schedules[esp_id].pop(event_id, None)

    def get_schedule(self, esp_id: str):
        """Get the schedule for one ESP."""

        return self.schedules.get(esp_id, {})
