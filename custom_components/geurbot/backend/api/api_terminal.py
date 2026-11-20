
import time
from urllib.parse import unquote

from aiohttp import web

from .manager import send_api_request


ALLOWED_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}

BLOCKED_HEADERS = {
    "host",
    "content-length",
    "connection",
    "transfer-encoding",
    "authorization",
    "x-client-id"
}


def validate_endpoint(endpoint):
    if not isinstance(endpoint, str) or not endpoint.startswith("/"):
        return False

    if endpoint.startswith("//") or "?" in endpoint or "#" in endpoint:
        return False

    decoded = unquote(endpoint)

    if "\\" in decoded or any(ord(char) < 32 for char in decoded):
        return False

    if ".." in decoded.split("/"):
        return False

    return True


async def api_terminal_request(request, device_manager):
    device_id = request.match_info["device_id"]
    device = device_manager.get_device(device_id)

    if not device:
        return web.json_response(
            {"success": False, "error": "Device not found"},
            status=404
        )

    try:
        payload = await request.json()
    except (ValueError, TypeError):
        return web.json_response(
            {"success": False, "error": "Invalid JSON request"},
            status=400
        )

    if not isinstance(payload, dict):
        return web.json_response(
            {"success": False, "error": "Request must be a JSON object"},
            status=400
        )

    method = payload.get("method", "")
    endpoint = payload.get("url", "")
    params = payload.get("params") or {}
    headers = payload.get("headers") or {}
    data = payload.get("body")

    if not isinstance(method, str) or method.upper() not in ALLOWED_METHODS:
        return web.json_response(
            {"success": False, "error": "Invalid HTTP method"},
            status=400
        )

    method = method.upper()

    if not validate_endpoint(endpoint):
        return web.json_response(
            {"success": False, "error": "Invalid or unsafe endpoint"},
            status=400
        )

    if not isinstance(params, dict) or not isinstance(headers, dict):
        return web.json_response(
            {"success": False, "error": "Params and headers must be JSON objects"},
            status=400
        )

    safe_headers = {}

    for name, value in headers.items():
        if not isinstance(name, str) or not isinstance(value, (str, int, float)):
            return web.json_response(
                {"success": False, "error": "Invalid request header"},
                status=400
            )

        if name.lower() in BLOCKED_HEADERS:
            return web.json_response(
                {"success": False, "error": f"Header not allowed: {name}"},
                status=400
            )

        if "\r" in str(value) or "\n" in str(value):
            return web.json_response(
                {"success": False, "error": "Invalid header value"},
                status=400
            )

        safe_headers[name] = str(value)

    start_time = time.perf_counter()

    result = await send_api_request(
        device=device,
        method=method,
        endpoint=endpoint,
        data=data,
        params=params,
        headers=safe_headers
    )

    duration = round((time.perf_counter() - start_time) * 1000)

    if result.get("status") is None:
        return web.json_response(
            {
                "success": False,
                "error": result.get("error", "Could not reach ESP"),
                "duration": duration
            },
            status=502
        )

    raw_body = result.get("body", "")

    return web.json_response({
        "success": result["success"],
        "status": result["status"],
        "statusText": result.get("status_text", ""),
        "duration": duration,
        "size": len(raw_body.encode("utf-8")),
        "body": result.get("data"),
        "rawBody": raw_body,
        "headers": result.get("headers", {})
    })
