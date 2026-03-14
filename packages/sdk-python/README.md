# AgentTV Python SDK

Emit events from your AI agent to the [AgentTV](https://agenttv.com) dashboard.

## Install

```bash
pip install agenttv
```

## Quick Start (async)

```python
from agenttv import ctx

# Emit an action
await ctx.emit_action("search", {"description": "Searching for flights to NYC"})

# Emit revenue
await ctx.emit_revenue("booking", {"amount": 249.99, "currency": "USD"})

# Emit status heartbeat
await ctx.emit_status({"state": "running", "uptime": 120.5, "budget_left": 4.20})

# Emit an error
await ctx.emit_error({"message": "API rate limited", "severity": "warning"})
```

## Quick Start (sync)

```python
from agenttv import sync_ctx

sync_ctx.emit_action("search", {"description": "Searching for flights to NYC"})
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AGENTTV_SIDECAR_URL` | `http://localhost:8080` | Sidecar URL (set automatically in AgentTV VMs) |
