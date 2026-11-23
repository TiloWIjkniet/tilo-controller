"""Asynchronous ESP32 client using Home Assistant's shared HTTP session."""
from __future__ import annotations

import json
import time
from typing import Any
from urllib.parse import urlsplit

import aiohttp
from homeassistant.helpers.aiohttp_client import async_get_clientsession


class EspClient:
    """Communicate with one discovered and registered GeurBot device."""

    def __init__(self, hass, device: dict[str, Any], timeout: int = 5) -> None:
        self.hass = hass
        self.device = device
        self.session = async_get_clientsession(hass)
        host = device.get("ip") or device.get("hostname")
        if not host:
            raise ValueError("Apparaat heeft geen IP-adres of hostname")
        if "://" in str(host):
            parsed = urlsplit(str(host))
            host = parsed.hostname
        port = int(device.get("port") or 80)
        self.base_url = f"http://{host}:{port}"
        self.timeout = aiohttp.ClientTimeout(total=timeout)

    async def request(
        self,
        method: str,
        endpoint: str,
        data: Any = None,
        params: dict | None = None,
        headers: dict | None = None,
    ) -> dict[str, Any]:
        started = time.perf_counter()
        method = method.upper()
        if not endpoint.startswith("/") or endpoint.startswith("//"):
            raise ValueError("Endpoint moet een relatief API-pad zijn")
        request_headers = {"Content-Type": "application/json", **(headers or {})}
        client_id = self.device.get("client_id")
        token = self.device.get("token")
        if client_id and token:
            request_headers["X-Client-ID"] = str(client_id)
            request_headers["Authorization"] = f"Bearer {token}"
        try:
            async with self.session.request(
                method, f"{self.base_url}{endpoint}", json=data, params=params,
                headers=request_headers, timeout=self.timeout,
            ) as response:
                raw = await response.text()
                try:
                    parsed = json.loads(raw) if raw else None
                except (ValueError, TypeError):
                    parsed = {"response": raw}
                return {
                    "success": response.ok,
                    "status": response.status,
                    "status_text": response.reason or "",
                    "headers": dict(response.headers),
                    "data": parsed,
                    "body": raw,
                    "method": method,
                    "endpoint": endpoint,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                    "response_size": len(raw.encode("utf-8")),
                }
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            return {
                "success": False, "status": None, "error": str(err),
                "method": method, "endpoint": endpoint,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                "response_size": 0,
            }
