"""Synchronous wrapper for the AgentTV SDK.

For users who don't use async/await, this provides a blocking API
that internally runs the async methods via asyncio.
"""

from __future__ import annotations

import asyncio
from typing import Any

from .context import AgentTVContext


def _run(coro: Any) -> Any:
    """Run an async coroutine synchronously."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # Already inside an event loop — create a new one in a thread
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result(timeout=10)
    else:
        return asyncio.run(coro)


class SyncAgentTVContext:
    """Synchronous AgentTV context. Same API as AgentTVContext but blocking."""

    def __init__(self) -> None:
        self._ctx = AgentTVContext()

    @property
    def elapsed(self) -> float:
        """Seconds since agent started."""
        return self._ctx.elapsed

    def emit_action(self, name: str, data: dict[str, Any]) -> None:
        """Emit an action event. Required: data['description']."""
        _run(self._ctx.emit_action(name, data))

    def emit_revenue(self, name: str, data: dict[str, Any]) -> None:
        """Emit a revenue event. Required: data['amount'], data['currency']."""
        _run(self._ctx.emit_revenue(name, data))

    def emit_status(self, data: dict[str, Any]) -> None:
        """Emit a status heartbeat. Required: data['state'], data['uptime'], data['budget_left']."""
        _run(self._ctx.emit_status(data))

    def emit_error(self, data: dict[str, Any]) -> None:
        """Emit an error event. Required: data['message'], data['severity']."""
        _run(self._ctx.emit_error(data))

    def close(self) -> None:
        """Close the underlying HTTP client."""
        _run(self._ctx.close())
