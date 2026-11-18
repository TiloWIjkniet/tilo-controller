
from ..communication.esp_client import EspClient


def get_esp_client(device):
    return EspClient(device)


async def get_data(device, endpoint, params=None):
    esp = get_esp_client(device)
    return await esp.request("GET",endpoint,params=params)


async def send_data(device, endpoint, data=None, method="POST", params=None):
    esp = get_esp_client(device)
    return await esp.request(method,endpoint,data=data,params=params)
