"use client";

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparklineChart({
  data,
  width = 80,
  height = 24,
  color = "#7C3AED",
}: SparklineChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  // Create area fill path
  const firstX = padding;
  const lastX = padding + usableWidth;
  const bottomY = height;
  const areaPath = `M${firstX},${bottomY} L${points.map((p) => `L${p}`).join(" ")} L${lastX},${bottomY} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={padding + usableWidth}
          cy={
            padding +
            usableHeight -
            ((data[data.length - 1] - min) / range) * usableHeight
          }
          r="2"
          fill={color}
        />
      )}
    </svg>
  );
}
