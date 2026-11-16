
from __future__ import annotations

from typing import Any

import aiohttp


class GeurBotAPI:
    """HTTP communication with one GeurBot."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        host: str,
        port: int = 80,
        timeout: int = 10,
    ) -> None:
        self.session = session
        self.base_url = f"http://{host}:{port}"
        self.timeout = aiohttp.ClientTimeout(total=timeout)

    # ============================================================
    # GENERAL REQUEST
    # ============================================================

    async def async_request(
        self,
        method: str,
        endpoint: str,
        data: dict | None = None,
        params: dict | None = None,
    ) -> dict[str, Any]:

        url = f"{self.base_url}{endpoint}"

        try:
            async with self.session.request(
                method,
                url,
                json=data,
                params=params,
                timeout=self.timeout,
            ) as response:

                response.raise_for_status()

                if response.status == 204:
                    return {}

                result = await response.json()

                if not isinstance(result, dict):
                    raise GeurBotAPIError(
                        "Invalid response format"
                    )

                return result

        except aiohttp.ClientResponseError as err:
            raise GeurBotAPIError(
                f"HTTP error: {err.status}"
            ) from err

        except (aiohttp.ClientError, TimeoutError) as err:
            raise GeurBotAPIError(
                f"Connection error: {err}"
            ) from err

        except (ValueError, aiohttp.ContentTypeError) as err:
            raise GeurBotAPIError(
                "Invalid JSON response"
            ) from err

    # ============================================================
    # GET REQUESTS
    # ============================================================

    async def async_get_data(self) -> dict:
        return await self.async_request(
            "GET",
            "/api/diagnostics/data"
        )

    async def async_get_security_status(
        self,
        client_id: str,
        token: str,
    ) -> dict:
        return await self.async_request(
            "GET",
            "/api/security/status",
            params={
                "client_id": client_id,
                "token": token,
            }
        )

    # ============================================================
    # POST REQUESTS
    # ============================================================

    async def async_send_data(self, data: dict) -> dict:
        return await self.async_request(
            "POST",
            "/api/data",
            data
        )

    # ============================================================
    # SECURITY REQUESTS
    # ============================================================

    async def async_pair(
        self,
        client_id: str,
        pairing_code: str,
        home_assistant_url: str,
        access_token: str,
    ) -> dict:
        return await self.async_request(
            "POST",
            "/api/security/pair",
            {
                "action": "pair",
                "client_id": client_id,
                "pairing_code": pairing_code,
                "home_assistant_url": home_assistant_url,
                "access_token": access_token,
            }
        )

    async def async_unpair(
        self,
        client_id: str,
        token: str,
    ) -> dict:
        return await self.async_request(
            "POST",
            "/api/security/unpair",
            {
                "action": "unpair",
                "client_id": client_id,
                "token": token,
            }
        )


class GeurBotAPIError(Exception):
    """GeurBot API communication error."""
