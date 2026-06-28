"use client";

import { useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
  height?: number;
  fillOpacity?: number;
  formatValue?: (v: number) => string;
}

function buildPath(points: { x: number; y: number }[], smooth = true): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (!smooth) return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cp = (p1.x - p0.x) * 0.4;
    d += ` C${p0.x + cp},${p0.y} ${p1.x - cp},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
}

export function LineChart({ data, color = "#4f46e5", height = 80, fillOpacity = 0.15, formatValue }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">Chưa có dữ liệu</div>;
  }

  const W = 200;
  const H = 80;
  const PAD = 4;
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2),
    y: H - PAD - (d.value / max) * (H - PAD * 2),
  }));

  const linePath = buildPath(points);
  const areaPath = `${linePath} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;
  const gradId = `line-grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className="relative w-full select-none" style={{ height }} onMouseLeave={() => setTooltip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 4} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill="white"
            stroke={color}
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={(e) => {
              const rect = (e.currentTarget as SVGElement).closest("svg")!.getBoundingClientRect();
              setTooltip({
                x: (pt.x / W) * rect.width,
                y: (pt.y / H) * height,
                point: data[i],
              });
            }}
          />
        ))}
      </svg>

      {tooltip && (
        <div
          className="absolute z-10 bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg whitespace-nowrap -translate-x-1/2"
          style={{ left: tooltip.x, top: Math.max(0, tooltip.y - 40) }}
        >
          <p className="font-semibold">{tooltip.point.label}</p>
          <p className="text-slate-300">{formatValue ? formatValue(tooltip.point.value) : tooltip.point.value.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
