
from typing import Any
import aiohttp


class EspClient:

    def __init__(self, device: dict):
        self.device = device
        self.base_url = f"http://{device['ip']}"
        self.client_id = device.get("client_id")
        self.token = device.get("token")

    async def request(self,method: str,endpoint: str,data: dict | None = None,params: dict | None = None,) -> dict[str, Any]:

        url = f"{self.base_url}{endpoint}"

        headers = {"Content-Type": "application/json",}

        if self.client_id and self.token:
            headers["X-Client-ID"] = self.client_id
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            timeout = aiohttp.ClientTimeout(total=5)

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=headers,
                ) as response:

                    try:
                        result = await response.json(content_type=None)
                    except (ValueError, aiohttp.ContentTypeError):
                        result = {"response": await response.text()}

                    return {
                        "success": response.ok,
                        "status": response.status,
                        "data": result,
                    }

        except aiohttp.ClientError as error:
            return {
                "success": False,
                "status": None,
                "error": str(error),
            }

        except TimeoutError:
            return {
                "success": False,
                "status": None,
                "error": "Connection timed out",
            }
