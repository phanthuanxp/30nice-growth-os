"use client";

import { useState } from "react";
import { MapPin, Calendar, Car, Phone, User, Loader2, CheckCircle } from "lucide-react";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiBooking({ config }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      pickup: fd.get("pickup") as string,
      destination: fd.get("destination") as string,
      datetime: fd.get("datetime") as string,
      carType: fd.get("carType") as string,
      roundTrip: fd.get("roundTrip") === "on",
      vatInvoice: fd.get("vatInvoice") === "on",
      desiredPrice: fd.get("desiredPrice") as string,
      message: `Đặt xe từ: ${fd.get("pickup")} → ${fd.get("destination")} | Xe: ${fd.get("carType")} | Ngày: ${fd.get("datetime")}${fd.get("desiredPrice") ? " | Giá: " + fd.get("desiredPrice") : ""}${fd.get("roundTrip") === "on" ? " | Hai chiều" : ""}`,
    };

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gửi thất bại");
      setSuccess(true);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng gọi trực tiếp hotline để đặt xe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="dat-xe" className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Nhận báo giá nhanh</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Đặt Xe & Nhận Báo Giá</h2>
        <p className="mt-1 text-sm text-slate-500">Điền thông tin — Nhận báo giá trong 2 phút qua Zalo/điện thoại</p>
      </div>

      <div>
        <div>
          {success ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-bold text-gray-900">Đã nhận yêu cầu!</h3>
              <p className="text-gray-500 max-w-sm">
                Chúng tôi sẽ liên hệ xác nhận và báo giá qua số điện thoại/Zalo bạn đã cung cấp.
              </p>
              <a
                href={`tel:${config.phone.replace(/\s/g, "")}`}
                className="mt-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl text-sm hover:bg-blue-800 transition-colors"
              >
                Gọi ngay: {config.phone}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Điểm đón <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <input
                      name="pickup"
                      required
                      placeholder="Địa chỉ đón..."
                      className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Điểm đến <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                    <input
                      name="destination"
                      required
                      placeholder="Điểm đến..."
                      className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Date/Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Ngày giờ đón <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="datetime"
                      required
                      className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Car type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Loại xe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      name="carType"
                      required
                      className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all appearance-none"
                    >
                      <option value="">-- Chọn loại xe --</option>
                      <option value="Xe 4 chỗ">Xe 4 chỗ</option>
                      <option value="Xe 7 chỗ">Xe 7 chỗ</option>
                      <option value="Xe 16 chỗ">Xe 16 chỗ</option>
                      <option value="Limousine">Limousine</option>
                      <option value="Xe khác">Xe khác</option>
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Tên của bạn <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="name"
                      required
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Số điện thoại / Zalo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Desired price */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Giá cước mong muốn (VNĐ) <span className="text-gray-400 font-normal">— tùy chọn</span>
                </label>
                <input
                  name="desiredPrice"
                  placeholder="Ví dụ: 350.000"
                  className="w-full px-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" name="roundTrip" className="w-4 h-4 rounded accent-blue-600" />
                  Hai chiều (khứ hồi)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" name="vatInvoice" className="w-4 h-4 rounded accent-blue-600" />
                  Xuất hóa đơn VAT
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-13 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-base rounded-2xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.01] active:scale-100"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Đang gửi...</>
                ) : (
                  <><Car className="h-5 w-5" />Đặt Giá & Nhận Báo Giá</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Hoặc gọi trực tiếp{" "}
                <a href={`tel:${config.phone.replace(/\s/g, "")}`} className="text-blue-600 font-semibold">
                  {config.phone}
                </a>{" "}
                để được báo giá ngay
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
