"use client";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({ segments, size = 96, thickness = 18, centerLabel, centerValue }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="rounded-full border-[18px] border-slate-100" style={{ width: size, height: size }} />
      </div>
    );
  }

  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total;
    const dash = fraction * circ;
    const arc = { seg, dash, offset, fraction };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {arcs.map(({ seg, dash, offset: off }, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-off}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          ))}
        </svg>
        {(centerLabel || centerValue !== undefined) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <p className="text-lg font-bold text-slate-800 leading-none">{centerValue}</p>
            )}
            {centerLabel && (
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{centerLabel}</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate-600">{seg.label}</span>
            <span className="text-xs font-semibold text-slate-800 ml-auto pl-2">
              {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SingleDonutProps {
  percent: number;
  size?: number;
  color?: string;
  label?: string;
}

export function SingleDonut({ percent, size = 80, color = "#4f46e5", label }: SingleDonutProps) {
  const thickness = Math.max(8, size * 0.18);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(percent, 100) / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={thickness}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-bold text-slate-800" style={{ fontSize: size * 0.2 }}>{percent}%</p>
        {label && <p className="text-slate-400 leading-none" style={{ fontSize: size * 0.11 }}>{label}</p>}
      </div>
    </div>
  );
}
