
from typing import Any
import aiohttp
import json
import time


class EspClient:
    def __init__(self, device: dict):
        self.device = device
        self.base_url = f"http://{device['hostname']}"
        self.client_id = device.get("client_id")
        self.token = device.get("token")

    async def request(
        self,
        method: str,
        endpoint: str,
        data: Any = None,
        params: dict | None = None,
        headers: dict | None = None
    ) -> dict[str, Any]:

        start = time.perf_counter()
        method = method.upper()
        url = f"{self.base_url}{endpoint}"

        request_headers = {
            "Content-Type": "application/json",
            **(headers or {})
        }

        if self.client_id and self.token:
            request_headers["X-Client-ID"] = self.client_id
            request_headers["Authorization"] = f"Bearer {self.token}"

        try:
            timeout = aiohttp.ClientTimeout(total=5)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=request_headers
                ) as response:

                    response_text = await response.text()

                    try:
                        response_data = json.loads(response_text)
                    except (ValueError, TypeError):
                        response_data = {"response": response_text}

                    return {
                        "success": response.ok,
                        "status": response.status,
                        "status_text": response.reason,
                        "headers": dict(response.headers),
                        "data": response_data,
                        "body": response_text,
                        "method": method,
                        "endpoint": endpoint,
                        "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                        "response_size": len(response_text.encode("utf-8"))
                    }

        except (aiohttp.ClientError, TimeoutError, ValueError) as error:
            return {
                "success": False,
                "status": None,
                "error": str(error),
                "method": method,
                "endpoint": endpoint,
                "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                "response_size": 0
            }
