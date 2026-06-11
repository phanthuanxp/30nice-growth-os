import { Star, CheckCircle } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiTestimonials({ config }: Props) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {config.statsRating}/5 từ hơn {config.statsCount} lượt khách
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Khách hàng nói gì?</h2>
          <p className="text-gray-500">Đánh giá thực từ khách đã sử dụng dịch vụ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {config.testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {t.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{t.name}</p>
                  <p className="text-gray-400 text-xs truncate">{t.location}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
