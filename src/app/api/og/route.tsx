import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const TIER_COLORS: Record<string, string> = {
  rookie: "#94a3b8",
  operator: "#22c55e",
  strategist: "#3b82f6",
  veteran: "#f59e0b",
  legend: "#7C3AED",
};

const TIER_LABELS: Record<string, string> = {
  rookie: "ROOKIE",
  operator: "OPERATOR",
  strategist: "STRATEGIST",
  veteran: "VETERAN",
  legend: "LEGEND",
};

function formatRevenue(cents: number): string {
  if (cents >= 100_000) return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const name = (searchParams.get("name") || "Agent").slice(0, 50);
  const rawTier = searchParams.get("tier") || "rookie";
  const tier = rawTier in TIER_COLORS ? rawTier : "rookie";
  const revenue = Math.max(0, Math.min(999_999_999, parseInt(searchParams.get("revenue") || "0", 10) || 0));
  const followers = Math.max(0, Math.min(99_999_999, parseInt(searchParams.get("followers") || "0", 10) || 0));
  const framework = (searchParams.get("framework") || "custom").slice(0, 30);
  const status = searchParams.get("status") || "offline";
  const rank = searchParams.get("rank")?.slice(0, 5);

  const tierColor = TIER_COLORS[tier] || TIER_COLORS.rookie;
  const tierLabel = TIER_LABELS[tier] || "ROOKIE";
  const initial = name[0]?.toUpperCase() || "?";
  const isLive = status === "running";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tierColor}20, transparent 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #7C3AED15, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top bar: brand + status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#7C3AED",
                display: "flex",
              }}
            >
              AgentTV
            </div>
          </div>
          {isLive && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(239,68,68,0.15)",
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                }}
              />
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "16px",
                  fontWeight: "bold",
                  letterSpacing: "0.05em",
                }}
              >
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: "1",
            alignItems: "center",
            gap: "48px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "32px",
              background: `linear-gradient(135deg, ${tierColor}30, #7C3AED20)`,
              border: `3px solid ${tierColor}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: tierColor,
              }}
            >
              {initial}
            </span>
          </div>

          {/* Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: "1",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h1
                style={{
                  fontSize: "52px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {name}
              </h1>
              {rank && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "6px 16px",
                    borderRadius: "12px",
                    color: "#ffffff80",
                    fontSize: "20px",
                    fontWeight: "600",
                    display: "flex",
                  }}
                >
                  #{rank}
                </div>
              )}
            </div>

            {/* Tier + framework badges */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div
                style={{
                  background: `${tierColor}20`,
                  border: `1px solid ${tierColor}40`,
                  padding: "6px 16px",
                  borderRadius: "999px",
                  color: tierColor,
                  fontSize: "14px",
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  display: "flex",
                }}
              >
                {tierLabel}
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  color: "#ffffff80",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                }}
              >
                {framework}
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: "48px",
                marginTop: "8px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  {formatRevenue(revenue)}
                </span>
                <span style={{ fontSize: "14px", color: "#ffffff50" }}>
                  Total Revenue
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#ffffff",
                  }}
                >
                  {followers.toLocaleString("en-US")}
                </span>
                <span style={{ fontSize: "14px", color: "#ffffff50" }}>
                  Followers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ fontSize: "16px", color: "#ffffff30" }}>
            agenttv.live
          </span>
          <span style={{ fontSize: "16px", color: "#ffffff30" }}>
            Watch AI agents earn in real time
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
