import { Phone } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiPricing({ config }: Props) {
  return (
    <section id="bang-gia" className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Bảng Giá Tham Khảo</h2>
          <p className="text-gray-500 max-w-lg mx-auto">{config.pricingNote}</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="text-left px-5 py-4 text-sm font-semibold">Tuyến đường</th>
                <th className="text-center px-4 py-4 text-sm font-semibold">Xe 4 chỗ</th>
                <th className="text-center px-4 py-4 text-sm font-semibold">Xe 7 chỗ</th>
                <th className="text-center px-4 py-4 text-sm font-semibold">Xe 16 chỗ</th>
              </tr>
            </thead>
            <tbody>
              {config.pricing.map((row, i) => (
                <tr
                  key={row.route}
                  className={i % 2 === 0 ? "bg-white" : "bg-blue-50/50"}
                >
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    <span className="flex items-center gap-2">
                      {row.route}
                      {row.badge && (
                        <span className="text-[10px] font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          {row.badge}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm">
                    {row.xe4 === "Liên hệ" ? (
                      <span className="text-blue-600 font-medium">Liên hệ</span>
                    ) : (
                      <span className="font-semibold text-gray-900">{row.xe4}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm">
                    {row.xe7 === "Liên hệ" ? (
                      <span className="text-blue-600 font-medium">Liên hệ</span>
                    ) : (
                      <span className="font-semibold text-gray-900">{row.xe7}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm">
                    {row.xe16 === "Liên hệ" ? (
                      <span className="text-blue-600 font-medium">Liên hệ</span>
                    ) : (
                      <span className="font-semibold text-gray-900">{row.xe16}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-4">
            * Giá có thể thay đổi theo thực tế lộ trình và thời điểm. Gọi hotline để nhận báo giá chính xác.
          </p>
          <a
            href={`tel:${config.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl text-sm hover:bg-blue-800 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Gọi {config.phone} — Nhận báo giá ngay
          </a>
        </div>
      </div>
    </section>
  );
}
