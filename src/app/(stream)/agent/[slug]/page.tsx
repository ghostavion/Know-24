"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Menu,
  Radio,
  X,
} from "lucide-react";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AvatarPlaceholder } from "@/components/stream/AvatarPlaceholder";
import { EventLog } from "@/components/stream/EventLog";
import { StatsCard } from "@/components/stream/StatsCard";
import { ReactionBar } from "@/components/stream/ReactionBar";
import { FollowButton } from "@/components/stream/FollowButton";
import { NearDeathOverlay } from "@/components/stream/NearDeathOverlay";

// --- Mock followed agents for the left sidebar ---
const MOCK_FOLLOWED = [
  { slug: "atlas-trader", name: "Atlas Trader", status: "live" as const },
  { slug: "nova-writer", name: "Nova Writer", status: "live" as const },
  { slug: "cipher-scout", name: "Cipher Scout", status: "offline" as const },
  { slug: "vega-analyst", name: "Vega Analyst", status: "live" as const },
  { slug: "orion-builder", name: "Orion Builder", status: "offline" as const },
  { slug: "pulse-monitor", name: "Pulse Monitor", status: "live" as const },
];

function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: -(Math.random() * 200 + 50),
        rotation: Math.random() * 720 - 360,
        color: ["#7C3AED", "#FF4D6D", "#00D4FF", "#FFAB00", "#10B981"][
          Math.floor(Math.random() * 5)
        ],
        size: Math.random() * 6 + 4,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: p.x * 4,
            y: p.y,
            opacity: 0,
            rotate: p.rotation,
            scale: 0.5,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function AgentStreamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { events, latestStatus, isConnected } = useAgentStream(slug);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasSeenRevenue, setHasSeenRevenue] = useState(false);

  // Detect first revenue event for confetti
  useEffect(() => {
    if (hasSeenRevenue) return;
    const revenueEvent = events.find(
      (e) => e.type === "revenue" && (e.data.amount ?? 0) > 0
    );
    if (revenueEvent && revenueEvent.data.first_revenue) {
      setShowConfetti(true);
      setHasSeenRevenue(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [events, hasSeenRevenue]);

  const isNearDeath =
    latestStatus.initial_budget > 0 &&
    latestStatus.budget_left / latestStatus.initial_budget < 0.1 &&
    latestStatus.budget_left > 0;

  const agentName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Sort followed agents: live first, then by name
  const sortedFollowed = [...MOCK_FOLLOWED].sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <NearDeathOverlay isNearDeath={isNearDeath} />
      <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>

      {/* Set agent name in parent layout header via portal-like effect */}
      <AgentNameInjector name={agentName} connected={isConnected} />

      <div className="flex h-full min-h-0">
        {/* === LEFT SIDEBAR (desktop) === */}
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border bg-bg-secondary md:flex">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Followed Agents
            </h3>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {sortedFollowed.map((agent) => (
              <a
                key={agent.slug}
                href={`/agent/${agent.slug}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
                  agent.slug === slug
                    ? "border-l-2 border-violet-electric bg-violet-electric/5"
                    : "border-l-2 border-transparent"
                }`}
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-electric/20 to-cyan-electric/20">
                  <span className="text-xs font-bold text-foreground/70">
                    {agent.name[0]}
                  </span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-secondary ${
                      agent.status === "live"
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <p
                    className={`text-xs ${
                      agent.status === "live"
                        ? "text-emerald-500"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {agent.status === "live" ? "Live" : "Offline"}
                  </p>
                </div>
              </a>
            ))}
          </nav>
        </aside>

        {/* === CENTER MAIN STAGE === */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2 md:hidden">
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="rounded-lg p-1.5 hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold">{agentName}</span>
            <button
              onClick={() => setRightPanelOpen(true)}
              className="rounded-lg p-1.5 hover:bg-white/5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Avatar area (top 40%) */}
          <div className="relative h-[40%] shrink-0 overflow-hidden border-b border-white/5 bg-foreground">
            <AvatarPlaceholder name={agentName} />
            {/* Connection indicator */}
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
              <Radio
                className={`h-3 w-3 ${isConnected ? "text-emerald-400" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium ${isConnected ? "text-emerald-400" : "text-muted-foreground"}`}
              >
                {isConnected ? "CONNECTED" : "CONNECTING"}
              </span>
            </div>
          </div>

          {/* Event log (bottom 60%) */}
          <div className="min-h-0 flex-1 bg-bg-primary">
            <EventLog events={events} />
          </div>

          {/* Mobile reaction bar */}
          <div className="border-t border-border md:hidden">
            <ReactionBar />
          </div>
        </div>

        {/* === RIGHT PANEL (desktop) === */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-border bg-bg-secondary lg:flex">
          <ReactionBar />
          <div className="flex-1 overflow-y-auto">
            <StatsCard status={latestStatus} />
          </div>
          <div className="border-t border-border py-4">
            <FollowButton agentSlug={slug} />
          </div>
        </aside>

        {/* === MOBILE LEFT SIDEBAR OVERLAY === */}
        <AnimatePresence>
          {leftSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setLeftSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-bg-secondary shadow-xl md:hidden"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Followed Agents
                  </h3>
                  <button
                    onClick={() => setLeftSidebarOpen(false)}
                    className="rounded-lg p-1 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto">
                  {sortedFollowed.map((agent) => (
                    <a
                      key={agent.slug}
                      href={`/agent/${agent.slug}`}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
                        agent.slug === slug
                          ? "border-l-2 border-violet-electric bg-violet-electric/5"
                          : "border-l-2 border-transparent"
                      }`}
                    >
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-electric/20 to-cyan-electric/20">
                        <span className="text-xs font-bold text-foreground/70">
                          {agent.name[0]}
                        </span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-secondary ${
                            agent.status === "live"
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {agent.name}
                        </p>
                        <p
                          className={`text-xs ${
                            agent.status === "live"
                              ? "text-emerald-500"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {agent.status === "live" ? "Live" : "Offline"}
                        </p>
                      </div>
                    </a>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* === MOBILE RIGHT PANEL OVERLAY (bottom sheet) === */}
        <AnimatePresence>
          {rightPanelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setRightPanelOpen(false)}
              />
              <motion.aside
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-bg-secondary shadow-xl lg:hidden"
              >
                <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-3">
                  <h3 className="text-sm font-semibold">Agent Stats</h3>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className="rounded-lg p-1 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <StatsCard status={latestStatus} />
                <div className="border-t border-border py-4">
                  <FollowButton agentSlug={slug} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/**
 * Injects the agent name into the parent layout's header via DOM.
 * This avoids needing to lift state or use context across the layout boundary.
 */
function AgentNameInjector({
  name,
  connected,
}: {
  name: string;
  connected: boolean;
}) {
  useEffect(() => {
    const el = document.getElementById("stream-agent-name");
    if (el) {
      el.textContent = name;
    }
  }, [name]);

  return null;
}
