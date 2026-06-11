import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
  features?: string[];
  className?: string;
}

export function ComingSoon({
  title,
  description,
  features = [],
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] text-center px-8",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
        <Sparkles className="h-8 w-8 text-indigo-500" />
      </div>
      <div
        className="inline-block mb-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600"
        style={{ background: "rgba(79,70,229,0.08)" }}
      >
        Coming Soon
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">{title}</h2>
      {description && (
        <p className="text-slate-500 max-w-md mb-8">{description}</p>
      )}
      {features.length > 0 && (
        <ul className="space-y-2 text-left max-w-sm w-full">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2.5"
            >
              <span className="text-indigo-400">✦</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
