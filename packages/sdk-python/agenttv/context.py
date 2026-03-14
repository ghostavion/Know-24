"""Async AgentTV context — thin wrapper for emitting events to the sidecar.

Zero external dependencies — uses only Python stdlib (urllib + json).
"""

from __future__ import annotations

import json
import os
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class AgentTVContext:
    """Thin wrapper — under 100 lines — with zero framework dependencies.

    Sends events to the local sidecar process via HTTP POST.
    The sidecar handles validation, forwarding, and budget enforcement.
    """

    def __init__(self) -> None:
        self._base_url = os.environ.get("AGENTTV_SIDECAR_URL", "http://localhost:8080")
        self._run_token = os.environ.get("AGENTTV_RUN_TOKEN", "")
        self._start_time = time.time()
        self._timeout = 10.0

    @property
    def elapsed(self) -> float:
        """Seconds since agent started."""
        return time.time() - self._start_time

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
        """POST to sidecar using stdlib urllib (zero-deps)."""
        url = f"{self._base_url}/emit"
        payload = json.dumps({
            "event_type": event_type,
            "event_name": event_name,
            "data": data,
        }).encode("utf-8")

        req = Request(url, data=payload, method="POST")
        req.add_header("Content-Type", "application/json")
        if self._run_token:
            req.add_header("Authorization", f"Bearer {self._run_token}")

        try:
            with urlopen(req, timeout=self._timeout) as resp:
                resp.read()
        except HTTPError as exc:
            if exc.code == 403:
                raise RuntimeError("AgentTV budget exceeded — agent will be terminated") from exc
            raise
        except (URLError, OSError):
            print("[agenttv] Warning: sidecar not reachable, event dropped", file=sys.stderr)

    async def close(self) -> None:
        """No-op — stdlib doesn't need explicit cleanup."""
        pass
