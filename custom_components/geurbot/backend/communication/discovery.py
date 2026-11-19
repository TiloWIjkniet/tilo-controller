
import asyncio
import inspect
import aiohttp

from zeroconf import ServiceStateChange
from zeroconf.asyncio import (
    AsyncZeroconf,
    AsyncServiceBrowser,
    AsyncServiceInfo,
)


SERVICE_TYPE = "_geurbot._tcp.local."


async def scan_devices(timeout=10, on_device_found=None):
    zeroconf = AsyncZeroconf()

    devices = {}
    tasks = set()
    discovered = set()

    http_timeout = aiohttp.ClientTimeout(total=3)

    async def resolve_device(name, session):
        info = AsyncServiceInfo(SERVICE_TYPE, name)

        try:
            if not await info.async_request(zeroconf.zeroconf, 3000):
                return

            properties = {
                key.decode(): value.decode()
                for key, value in info.properties.items()
            }

            addresses = info.parsed_addresses()
            ip = next(
                (address for address in addresses if ":" not in address),
                None
            )

            device_id = properties.get("device_id")
            hostname = info.server.rstrip(".")

            if not device_id or not ip:
                return

            device = {
                "device_id": device_id,
                "name": hostname.split(".")[0],
                "hostname": hostname,
                "ip": ip,
                "port": info.port,
                "api_version": properties.get("api_version"),
                "connected": None,
                "ssid": None,
                "rssi": None,
            }

            try:
                url = f"http://{ip}:{info.port}/api/network/status"

                async with session.get(url) as response:
                    if response.ok:
                        network = await response.json(content_type=None)

                        device["connected"] = network.get("connected")
                        device["ssid"] = network.get("ssid")
                        device["rssi"] = network.get("rssi")

            except (aiohttp.ClientError, asyncio.TimeoutError, ValueError):
                pass

            devices[device_id] = device

            # Direct doorgeven zodra het apparaat gevonden is
            if on_device_found:
                result = on_device_found(device)

                if inspect.isawaitable(result):
                    await result

        except asyncio.CancelledError:
            raise

        except Exception as error:
            print(f"Discovery error bij {name}: {error}")

    async with aiohttp.ClientSession(timeout=http_timeout) as session:

        def on_service_state_change(
            zeroconf,
            service_type,
            name,
            state_change,
        ):
            if state_change != ServiceStateChange.Added:
                return

            if name in discovered:
                return

            discovered.add(name)

            task = asyncio.create_task(resolve_device(name, session))
            tasks.add(task)
            task.add_done_callback(tasks.discard)

        browser = AsyncServiceBrowser(
            zeroconf.zeroconf,
            SERVICE_TYPE,
            handlers=[on_service_state_change],
        )

        try:
            # Blijf gedurende de volledige scan zoeken
            await asyncio.sleep(timeout)

        finally:
            await browser.async_cancel()

            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

            await zeroconf.async_close()

    return list(devices.values())
