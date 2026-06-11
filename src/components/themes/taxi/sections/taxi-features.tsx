import { Clock, Tag, Headphones } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

const ICONS: Record<string, React.ElementType> = {
  clock: Clock,
  tag: Tag,
  headphones: Headphones,
};

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiFeatures({ config }: Props) {
  return (
    <section className="py-14 bg-blue-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {config.benefits.map((b) => {
            const Icon = ICONS[b.icon] ?? Clock;
            return (
              <div
                key={b.title}
                className="flex items-start gap-4 bg-white/10 rounded-2xl px-6 py-5 backdrop-blur-sm border border-white/10"
              >
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold mb-1">{b.title}</p>
                  <p className="text-blue-100 text-sm leading-relaxed">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
