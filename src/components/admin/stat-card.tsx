import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ElementType;
  trend?: { value: number; label: string };
  className?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconColor = "text-indigo-600",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%{" "}
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
