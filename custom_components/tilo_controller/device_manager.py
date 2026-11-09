
"""Device manager for Tilo Controller."""


class DeviceManager:
    """Manage ESP controllers and their fragrances."""

    def __init__(self):
        """Initialize the device manager."""

        self.controllers = {}

    def add_controller(self, esp_id: str, name: str, host: str):
        """Add an ESP controller."""

        self.controllers[esp_id] = {
            "id": esp_id,
            "name": name,
            "host": host.rstrip("/"),
            "fragrances": {},
        }

    def remove_controller(self, esp_id: str):
        """Remove an ESP controller."""

        self.controllers.pop(esp_id, None)

    def get_controller(self, esp_id: str):
        """Get one ESP controller."""

        return self.controllers.get(esp_id)

    def get_controllers(self):
        """Get all ESP controllers."""

        return self.controllers

    def update_controller(self, esp_id: str, changes: dict):
        """Update ESP controller information."""

        controller = self.controllers.get(esp_id)

        if controller is None:
            return False

        controller.update(changes)
        return True

    def update_fragrances(self, esp_id: str, fragrances: list):
        """Replace the fragrances belonging to an ESP."""

        controller = self.controllers.get(esp_id)

        if controller is None:
            return False

        controller["fragrances"] = {
            fragrance["id"]: fragrance
            for fragrance in fragrances
        }

        return True
