from ..communication.esp_client import EspClient
from ..communication.performance_monitor import performance_monitor


def get_esp_client(device):
    return EspClient(device)


async def _request(device, method, endpoint, data=None, params=None, headers=None):
    esp = get_esp_client(device)

    result = await esp.request(
        method=method,
        endpoint=endpoint,
        data=data,
        params=params,
        headers=headers
    )

    performance_monitor.record(result, device.get("hostname", "unknown"))
    return result


async def get_data(device, endpoint, params=None):
    return await _request(device, "GET", endpoint, params=params)


async def send_data(device, endpoint, data=None, method="POST", params=None):
    return await _request(method=method, device=device, endpoint=endpoint, data=data, params=params)


async def send_api_request(device, method, endpoint, data=None, params=None, headers=None):
    return await _request(device, method, endpoint, data, params, headers)

def get_performance_stats(device_id):
    return performance_monitor.get_stats(device_id)
