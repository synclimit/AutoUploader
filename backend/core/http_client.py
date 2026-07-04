import httpx
from typing import Optional, Dict, Any, AsyncGenerator

import asyncio

class AIHttpClient:
    """
    Singleton wrapper for httpx.AsyncClient to ensure uniform HTTP requests
    across all AI providers, with proper timeouts and error handling.
    """
    _clients: Dict[int, httpx.AsyncClient] = {}

    @classmethod
    def get_client(cls) -> httpx.AsyncClient:
        loop_id = id(asyncio.get_running_loop())
        client = cls._clients.get(loop_id)
        if client is None or client.is_closed:
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0),
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
            )
            cls._clients[loop_id] = client
        return client

    @classmethod
    async def post(cls, url: str, headers: Dict[str, str], json: Dict[str, Any]) -> httpx.Response:
        client = cls.get_client()
        return await client.post(url, headers=headers, json=json)

    @classmethod
    async def get(cls, url: str, headers: Dict[str, str]) -> httpx.Response:
        client = cls.get_client()
        return await client.get(url, headers=headers)

    @classmethod
    async def stream_post(cls, url: str, headers: Dict[str, str], json: Dict[str, Any]) -> AsyncGenerator[httpx.Response, None]:
        client = cls.get_client()
        async with client.stream("POST", url, headers=headers, json=json) as response:
            yield response

    @classmethod
    async def close(cls):
        for client in cls._clients.values():
            if not client.is_closed:
                await client.aclose()
        cls._clients.clear()
