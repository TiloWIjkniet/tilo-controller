
from ..communication.discovery import scan_devices
from .device_registry import DeviceRegistry


class DeviceManager:

    def __init__(self):
        self.registry = DeviceRegistry()
        self.on_device_found = None

   
    async def scan(self, timeout=10):
        async def handle_device(device):
            device_id = device.get("device_id")

            if not device_id:
                print("Discovery: device has no device_id:", device)
                return

            existing = self.registry.get(device_id)

            if existing:
                for key, value in existing.items():
                    if key not in device or device[key] is None:
                        device[key] = value

            self.registry.add(device)

            print("Device registered:", device.get("name"), device.get("ip"))

            if self.on_device_found:
                await self.on_device_found(device)

        return await scan_devices(
            timeout=timeout,
            on_device_found=handle_device
        )


    def get_device(self, device_id):
        return self.registry.get(device_id)

    def get_devices(self):
        return self.registry.get_all()

    def remove_device(self, device_id):
        return self.registry.remove(device_id)

    def update_device_name(self, device_id, name):
        device = self.get_device(device_id)

        if not device:
            return None

        device["name"] = name.strip()
        return device
