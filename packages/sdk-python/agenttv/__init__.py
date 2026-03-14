"""AgentTV SDK — emit events from your AI agent to the AgentTV dashboard."""

from .context import AgentTVContext
from .sync import SyncAgentTVContext

# Singleton instance for convenience
ctx = AgentTVContext()
sync_ctx = SyncAgentTVContext()

__all__ = ["ctx", "sync_ctx", "AgentTVContext", "SyncAgentTVContext"]
