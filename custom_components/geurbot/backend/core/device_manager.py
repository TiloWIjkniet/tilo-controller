
from ..communication.discovery import scan_devices
from .device_registry import DeviceRegistry


class DeviceManager:

    def __init__(self):
        self.registry = DeviceRegistry()
        self.on_device_found = None
        self.on_devices_changed = None

   
    async def scan(self, timeout=10):
        async def handle_device(device):
            device_id = device.get("device_id")

            if not device_id:
                print("Discovery: device has no device_id:", device)
                return

            existing = self.registry.get(device_id)

            if existing:
                for key, value in existing.items():
                    if key == "fragrances":
                        device[key] = value
                    elif key not in device or device[key] is None:
                        device[key] = value

            registered_device = self.registry.add(device)

            print("Device registered:", registered_device.get("name"), registered_device.get("ip"))

            if self.on_device_found:
                await self.on_device_found(registered_device)

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

    
    def update_device_fragrances(self, device_id, fragrances):
        device = self.get_device(device_id)
        if not device:
            return None

        device["fragrances"] = fragrances
        return device

    def remove_device_fragrance(self, device_id, mac_address):
        device = self.get_device(device_id)

        if not device:
            return False

        fragrances = device.get("fragrances", [])

        original_count = len(fragrances)

        device["fragrances"] = [
            fragrance for fragrance in fragrances
            if fragrance.get("mac_address") != mac_address
        ]

        return len(device["fragrances"]) < original_count

    async def async_save(self):
        if self.on_devices_changed:
            await self.on_devices_changed()