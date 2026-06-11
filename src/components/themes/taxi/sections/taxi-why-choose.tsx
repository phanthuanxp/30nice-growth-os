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

export function TaxiWhyChoose({ config }: Props) {
  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Vì sao nên chọn chúng tôi?</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Tập trung vào sự đúng giờ, rõ giá và hỗ trợ nhanh trước — trong — sau chuyến đi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {config.benefits.map((b) => {
            const Icon = ICONS[b.icon] ?? Clock;
            return (
              <div
                key={b.title}
                className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all group"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white mb-1">{config.statsCount}</p>
            <p className="text-gray-500 text-sm">Lượt khách</p>
          </div>
          <div className="text-center border-x border-gray-700">
            <p className="text-3xl font-extrabold text-white mb-1">{config.statsRating}/5</p>
            <p className="text-gray-500 text-sm">Đánh giá trung bình</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white mb-1">{config.statsYears}</p>
            <p className="text-gray-500 text-sm">Năm hoạt động</p>
          </div>
        </div>
      </div>
    </section>
  );
}
