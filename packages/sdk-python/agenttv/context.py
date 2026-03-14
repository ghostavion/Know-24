"""Async AgentTV context — thin wrapper for emitting events to the sidecar."""

from __future__ import annotations

import os
import time
from typing import Any

import httpx


class AgentTVContext:
    """Thin wrapper — under 100 lines — with zero framework dependencies.

    Sends events to the local sidecar process via HTTP POST.
    The sidecar handles validation, forwarding, and budget enforcement.
    """

    def __init__(self) -> None:
        self._base_url = os.environ.get("AGENTTV_SIDECAR_URL", "http://localhost:8080")
        self._start_time = time.time()
        self._client: httpx.AsyncClient | None = None

    @property
    def elapsed(self) -> float:
        """Seconds since agent started."""
        return time.time() - self._start_time

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(base_url=self._base_url, timeout=5.0)
        return self._client

    async def emit_action(self, name: str, data: dict[str, Any]) -> None:
        """Emit an action event. Required: data['description']."""
        if "description" not in data:
            raise ValueError("action events require 'description' in data")
        await self._emit("action", name, data)

    async def emit_revenue(self, name: str, data: dict[str, Any]) -> None:
        """Emit a revenue event. Required: data['amount'], data['currency']."""
        if "amount" not in data or "currency" not in data:
            raise ValueError("revenue events require 'amount' and 'currency' in data")
        await self._emit("revenue", name, data)

    async def emit_status(self, data: dict[str, Any]) -> None:
        """Emit a status heartbeat. Required: data['state'], data['uptime'], data['budget_left']."""
        for key in ("state", "uptime", "budget_left"):
            if key not in data:
                raise ValueError(f"status events require '{key}' in data")
        await self._emit("status", "heartbeat", data)

    async def emit_error(self, data: dict[str, Any]) -> None:
        """Emit an error event. Required: data['message'], data['severity']."""
        if "message" not in data or "severity" not in data:
            raise ValueError("error events require 'message' and 'severity' in data")
        if data["severity"] not in ("warning", "critical", "fatal"):
            raise ValueError("severity must be 'warning', 'critical', or 'fatal'")
        await self._emit("error", "error", data)

    async def _emit(self, event_type: str, event_name: str, data: dict[str, Any]) -> None:
        """POST to sidecar."""
        client = await self._get_client()
        payload = {
            "event_type": event_type,
            "event_name": event_name,
            "data": data,
        }
        try:
            resp = await client.post("/emit", json=payload)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            # 403 means budget exceeded — let the caller know
            if exc.response.status_code == 403:
                raise RuntimeError("AgentTV budget exceeded — agent will be terminated") from exc
            raise
        except httpx.ConnectError:
            # Sidecar not running — silently drop (agent shouldn't crash)
            pass

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
