import Link from "next/link";
import { ArrowRight, Car } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiServices({ config }: Props) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Dịch vụ của chúng tôi</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Xe riêng, không ghép khách, báo giá trọn gói trước chuyến. Phục vụ mọi tuyến trong và ngoài tỉnh Bắc Ninh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.services.map((svc) => (
            <div
              key={svc.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden group"
            >
              {/* Image area */}
              <div className="relative h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                {svc.image ? (
                  <img src={svc.image} alt={svc.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white/80">
                    <Car className="h-16 w-16 text-white/60" />
                    <span className="text-sm font-medium text-white/70">Xe riêng · Không ghép</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-blue-900/10 transition-colors" />
              </div>

              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">
                  {svc.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{svc.description}</p>
                <Link
                  href={svc.href}
                  className="inline-flex items-center gap-1.5 text-blue-700 text-sm font-semibold hover:gap-2.5 transition-all"
                >
                  Xem chi tiết <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
