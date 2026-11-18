
import asyncio
import sys
from pathlib import Path

communication_path = Path(__file__).parent / "custom_components/geurbot/backend/communication"
sys.path.insert(0, str(communication_path))

from discovery import scan_devices


def device_found(device):
    print(f"\nNieuwe GeurBot gevonden!")
    print(device)


async def main():
    print("Discovery gestart (10 seconden)...")

    devices = await scan_devices(
        timeout=10,
        on_device_found=device_found
    )

    print(f"\nDiscovery afgelopen. {len(devices)} apparaten gevonden.")


if __name__ == "__main__":
    asyncio.run(main())
