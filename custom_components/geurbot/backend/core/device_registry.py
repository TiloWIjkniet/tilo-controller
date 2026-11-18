
class DeviceRegistry:

    def __init__(self):
        self.devices = {}

    def add(self, device):
        device_id = device["device_id"]
        self.devices[device_id] = device
        return device

    def get(self, device_id):
        return self.devices.get(device_id)

    def get_all(self):
        return list(self.devices.values())

    def remove(self, device_id):
        return self.devices.pop(device_id, None)
