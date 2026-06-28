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
  showLabels?: boolean;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, color = "#4f46e5", height = 120, showLabels = true, formatValue }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">Chưa có dữ liệu</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        viewBox={`0 0 ${data.length * 20} 100`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={`bar-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = max === 0 ? 0 : (d.value / max) * 88;
          const x = i * 20 + 2;
          const y = 96 - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={16}
                height={barH}
                rx={2}
                fill={`url(#bar-grad-${color.replace("#", "")})`}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget as SVGElement).closest("svg")!.getBoundingClientRect();
                  const svgX = ((x + 8) / (data.length * 20)) * rect.width;
                  setTooltip({ x: svgX, y: y * (height / 100), point: d });
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* X labels */}
      {showLabels && (
        <div className="flex mt-1" style={{ gap: 0 }}>
          {data.map((d, i) => (
            <div key={i} className="text-center overflow-hidden" style={{ width: `${barWidth}%` }}>
              <span className="text-[9px] text-slate-400 leading-none">{d.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg whitespace-nowrap -translate-x-1/2"
          style={{ left: tooltip.x, top: Math.max(0, tooltip.y - 36) }}
        >
          <p className="font-semibold">{tooltip.point.label}</p>
          <p className="text-slate-300">{formatValue ? formatValue(tooltip.point.value) : tooltip.point.value.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
