
"""API communication for Tilo Controller."""

import aiohttp


class TiloControllerAPI:
    """Handle communication with an ESP."""

    def __init__(self, host: str, session: aiohttp.ClientSession):
        """Initialize the API."""

        self.host = host.rstrip("/")
        self.session = session

    async def get_status(self):
        """Get the ESP status."""

        async with self.session.get(
            f"{self.host}/api/status"
        ) as response:
            response.raise_for_status()
            return await response.json()

    async def spray(self, fragrance_id: str, amount: int = 1):
        """Send a spray command to the ESP."""

        async with self.session.post(
            f"{self.host}/api/spray",
            json={
                "fragrance_id": fragrance_id,
                "amount": amount,
            },
        ) as response:
            response.raise_for_status()
            return await response.json()

    async def update_fragrance(
        self,
        fragrance_id: str,
        changes: dict,
    ):
        """Update fragrance settings on the ESP."""

        async with self.session.post(
            f"{self.host}/api/fragrance",
            json={
                "id": fragrance_id,
                **changes,
            },
        ) as response:
            response.raise_for_status()
            return await response.json()
