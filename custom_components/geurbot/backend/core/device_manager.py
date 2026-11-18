
from ..communication.discovery import scan_devices
from .device_registry import DeviceRegistry


class DeviceManager:

    def __init__(self):
        self.registry = DeviceRegistry()
        self.on_device_found = None

    async def scan(self, timeout=10):
        async def handle_device(device):
            self.registry.add(device)

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
