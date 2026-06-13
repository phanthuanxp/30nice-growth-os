import {
  Phone, BedDouble, Star, Users, Ruler, Check, MapPin,
  Wifi, Car, Coffee, Clock, Sparkles, Map as MapIcon,
} from "lucide-react";
import type { HotelThemeConfig, HotelAmenity } from "./types";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  car: Car,
  coffee: Coffee,
  clock: Clock,
  sparkles: Sparkles,
  map: MapIcon,
};

export function HotelHero({ config }: { config: HotelThemeConfig }) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;
  const stats = [
    { value: config.statsRooms, label: "Phòng nghỉ" },
    { value: `★ ${config.statsRating}`, label: "Đánh giá" },
    { value: config.statsGuests, label: "Lượt khách" },
  ];
  return (
    <section
      className="relative min-h-[88vh] flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #083344 0%, #155e75 45%, #0e7490 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-400/10" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-400/10" />
      </div>
      {config.heroImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.heroImage})`, opacity: 0.25 }}
        />
      )}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-20 pt-32">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-cyan-50 text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          {config.heroBadge}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          {config.heroTitle}
        </h1>
        <p className="text-lg sm:text-xl text-cyan-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
          {config.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <a
            href="#dat-phong"
            className="flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-lg rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-100 min-w-[220px] justify-center"
          >
            <BedDouble className="h-5 w-5" />
            Đặt phòng ngay
          </a>
          <a
            href={phoneHref}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-lg rounded-2xl backdrop-blur-sm transition-all min-w-[220px] justify-center"
          >
            <Phone className="h-5 w-5" />
            {config.phone}
          </a>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/10 border border-white/15 rounded-2xl py-3 backdrop-blur-sm">
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-cyan-100/80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HotelRooms({ config }: { config: HotelThemeConfig }) {
  return (
    <section className="py-16 sm:py-20 bg-slate-50" id="rooms">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Phòng nghỉ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{config.roomsTitle}</h2>
          <p className="text-slate-500 mt-3">{config.roomsSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.rooms.map((room) => (
            <article
              key={room.name}
              className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-cyan-100 to-slate-100 overflow-hidden">
                {room.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={room.image} alt={room.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <BedDouble className="h-14 w-14 text-cyan-300" />
                  </div>
                )}
                {room.badge && (
                  <span className="absolute top-3 left-3 text-xs font-bold text-slate-900 bg-amber-400 px-3 py-1 rounded-full shadow">
                    {room.badge}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{room.size}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.capacity}</span>
                </div>
                <p className="text-sm text-slate-500 mt-3">{room.description}</p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {room.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
                <div className="flex items-end justify-between mt-5 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-2xl font-extrabold text-cyan-700">{room.price}</p>
                    <p className="text-xs text-slate-400">{room.priceUnit} · đã gồm thuế</p>
                  </div>
                  <a
                    href="#dat-phong"
                    className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Đặt phòng
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HotelAmenities({ config }: { config: HotelThemeConfig }) {
  if (config.amenities.length === 0) return null;
  return (
    <section className="py-16 sm:py-20 bg-white" id="amenities">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Tiện nghi</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{config.amenitiesTitle}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {config.amenities.map((a: HotelAmenity) => {
            const Icon = AMENITY_ICONS[a.icon] ?? Sparkles;
            return (
              <div key={a.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="h-11 w-11 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-cyan-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{a.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HotelGallery({ config }: { config: HotelThemeConfig }) {
  if (config.gallery.length === 0) return null;
  return (
    <section className="py-16 sm:py-20 bg-slate-50" id="gallery">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Hình ảnh</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Không gian thực tế</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {config.gallery.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.alt}
              loading="lazy"
              className={`w-full h-full object-cover rounded-2xl ${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HotelTestimonials({ config }: { config: HotelThemeConfig }) {
  if (config.testimonials.length === 0) return null;
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Đánh giá</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Khách đã lưu trú nói gì?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {config.testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-6">
              <div className="flex gap-0.5 mb-3" aria-label={`${t.rating}/5 sao`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                ))}
              </div>
              <blockquote className="text-sm text-slate-600 leading-relaxed">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-4">
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-400">{t.location}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HotelLocation({ config }: { config: HotelThemeConfig }) {
  return (
    <section className="py-16 sm:py-20 bg-slate-50" id="location">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Vị trí</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{config.locationTitle}</h2>
            <p className="text-slate-600 leading-relaxed">{config.locationText}</p>
          </div>
          <ul className="space-y-3">
            {config.locationHighlights.map((h) => (
              <li key={h} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
                <MapPin className="h-4 w-4 text-cyan-600 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
