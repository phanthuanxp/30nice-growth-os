import { Phone, CalendarCheck, Star, Clock, Leaf, ChefHat } from "lucide-react";
import type { RestaurantThemeConfig } from "./types";

export function RestaurantHero({ config }: { config: RestaurantThemeConfig }) {
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;
  return (
    <section
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 45%, #991b1b 100%)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10" />
      </div>
      {config.heroImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.heroImage})`, opacity: 0.22 }}
        />
      )}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center py-20 pt-32">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-amber-50 text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {config.heroBadge}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          {config.heroTitle}
        </h1>
        <p className="text-lg sm:text-xl text-amber-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
          {config.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#dat-ban"
            className="flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-lg rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-100 min-w-[220px] justify-center"
          >
            <CalendarCheck className="h-5 w-5" />
            Đặt bàn ngay
          </a>
          <a
            href={phoneHref}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-lg rounded-2xl backdrop-blur-sm transition-all min-w-[220px] justify-center"
          >
            <Phone className="h-5 w-5" />
            {config.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

export function RestaurantAbout({ config }: { config: RestaurantThemeConfig }) {
  const stats = [
    { icon: Clock, value: config.statsYears, label: "Năm phục vụ" },
    { icon: ChefHat, value: config.statsDishes, label: "Món trong thực đơn" },
    { icon: Leaf, value: config.statsCustomers, label: "Lượt khách hài lòng" },
  ];
  return (
    <section className="py-16 sm:py-20 bg-amber-50/60" id="about">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Về chúng tôi</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-5">{config.aboutTitle}</h2>
            <p className="text-stone-600 leading-relaxed text-base sm:text-lg">{config.aboutText}</p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center bg-white rounded-2xl border border-amber-100 p-4">
                  <s.icon className="h-5 w-5 text-red-700 mx-auto mb-1.5" />
                  <p className="text-2xl font-extrabold text-stone-900">{s.value}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center">
            {config.aboutImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.aboutImage} alt={config.aboutTitle} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <UtensilsIllustration />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function UtensilsIllustration() {
  return (
    <div className="text-center p-10">
      <ChefHat className="h-20 w-20 text-red-300 mx-auto mb-3" />
      <p className="text-sm text-red-400 font-medium">Thêm ảnh không gian nhà hàng trong Theme Editor</p>
    </div>
  );
}

export function RestaurantMenu({ config }: { config: RestaurantThemeConfig }) {
  return (
    <section className="py-16 sm:py-20 bg-white" id="menu">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Thực đơn</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">{config.menuTitle}</h2>
          <p className="text-stone-500 mt-3">{config.menuSubtitle}</p>
        </div>

        <div className="space-y-12">
          {config.menuCategories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-red-800 shrink-0">{cat.name}</h3>
                <div className="h-px bg-amber-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {cat.dishes.map((dish) => (
                  <div key={dish.name} className="flex gap-4">
                    {dish.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dish.image}
                        alt={dish.name}
                        loading="lazy"
                        className="h-16 w-16 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-semibold text-stone-900">{dish.name}</h4>
                        {dish.badge && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                            {dish.badge}
                          </span>
                        )}
                        <div className="flex-1 border-b border-dotted border-stone-300 min-w-[20px]" />
                        <span className="font-bold text-red-700 shrink-0">{dish.price}</span>
                      </div>
                      <p className="text-sm text-stone-500 mt-1">{dish.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#dat-ban"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-2xl transition-colors"
          >
            <CalendarCheck className="h-5 w-5" />
            Đặt bàn để thưởng thức
          </a>
        </div>
      </div>
    </section>
  );
}

export function RestaurantGallery({ config }: { config: RestaurantThemeConfig }) {
  if (config.gallery.length === 0) return null;
  return (
    <section className="py-16 sm:py-20 bg-stone-50" id="gallery">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Không gian</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Hình ảnh nhà hàng</h2>
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

export function RestaurantTestimonials({ config }: { config: RestaurantThemeConfig }) {
  if (config.testimonials.length === 0) return null;
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Đánh giá</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Khách hàng nói gì?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {config.testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
              <div className="flex gap-0.5 mb-3" aria-label={`${t.rating}/5 sao`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}`}
                  />
                ))}
              </div>
              <blockquote className="text-sm text-stone-600 leading-relaxed">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="text-sm font-semibold text-stone-900 mt-4">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
