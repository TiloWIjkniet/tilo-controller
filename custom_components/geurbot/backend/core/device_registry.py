"""In-memory runtime registry; persistence is owned by the HA Store."""
from copy import deepcopy


class DeviceRegistry:
    def __init__(self):
        self.devices = {}

    def add(self, device):
        device = deepcopy(device)
        device_id = device.get("device_id") or device.get("id")
        if not device_id:
            raise ValueError("Device mist device_id bevatten")
        device["device_id"] = str(device_id)
        # Keep the legacy id alias because older scheduler/frontend code reads it.
        device.setdefault("id", str(device_id))
        device.setdefault("fragrances", [])

        existing = self.devices.get(str(device_id))
        if existing is not None:
            # Preserve object identity so coordinators/entities keep referencing
            # the same runtime record after a discovery refresh.
            existing.clear()
            existing.update(device)
            return existing

        self.devices[str(device_id)] = device
        return device

    def get(self, device_id):
        return self.devices.get(str(device_id))

    def get_all(self):
        return list(self.devices.values())

    def remove(self, device_id):
        return self.devices.pop(str(device_id), None)
