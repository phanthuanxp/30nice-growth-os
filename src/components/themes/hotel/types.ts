export interface HotelNavItem {
  label: string;
  href: string;
}

export interface HotelRoom {
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  size: string;
  capacity: string;
  amenities: string[];
  image?: string;
  badge?: string;
}

export interface HotelAmenity {
  icon: string;
  title: string;
  description: string;
}

export interface HotelTestimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

export interface HotelGalleryImage {
  url: string;
  alt: string;
}

export interface HotelThemeConfig {
  phone: string;
  zaloLink: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  heroBadge: string;
  navItems: HotelNavItem[];
  statsRooms: string;
  statsRating: string;
  statsGuests: string;
  roomsTitle: string;
  roomsSubtitle: string;
  rooms: HotelRoom[];
  amenitiesTitle: string;
  amenities: HotelAmenity[];
  gallery: HotelGalleryImage[];
  testimonials: HotelTestimonial[];
  locationTitle: string;
  locationText: string;
  locationHighlights: string[];
  bookingTitle: string;
  bookingSubtitle: string;
  footerAbout: string;
  footerLinks: { label: string; href: string }[];
  copyrightName: string;
}

export const DEFAULT_HOTEL_CONFIG: HotelThemeConfig = {
  phone: "0901 234 567",
  zaloLink: "https://zalo.me/0901234567",
  heroTitle: "Kỳ nghỉ trọn vẹn — Ngay trung tâm thành phố",
  heroSubtitle:
    "Phòng nghỉ tiện nghi, sạch sẽ, view đẹp. Đặt trực tiếp nhận giá tốt nhất, miễn phí hủy trước 24h và check-in linh hoạt.",
  heroBadge: "Đặt trực tiếp — giá tốt hơn OTA 10%",
  navItems: [
    { label: "Trang chủ", href: "/" },
    { label: "Phòng nghỉ", href: "#rooms" },
    { label: "Tiện nghi", href: "#amenities" },
    { label: "Vị trí", href: "#location" },
    { label: "Blog", href: "/blog" },
    { label: "Đặt phòng", href: "#dat-phong" },
  ],
  statsRooms: "24",
  statsRating: "4.8",
  statsGuests: "12.000+",
  roomsTitle: "Phòng nghỉ & Bảng giá",
  roomsSubtitle: "Giá đã gồm ăn sáng và thuế. Đặt trực tiếp để nhận ưu đãi tốt nhất.",
  rooms: [
    {
      name: "Phòng Standard",
      description: "Lựa chọn tiết kiệm cho cặp đôi hoặc khách công tác, đầy đủ tiện nghi cơ bản.",
      price: "450.000đ",
      priceUnit: "/đêm",
      size: "22m²",
      capacity: "2 khách",
      amenities: ["Giường đôi 1.6m", "Điều hòa", "TV 43\"", "WiFi tốc độ cao", "Nước nóng"],
    },
    {
      name: "Phòng Deluxe",
      description: "Rộng rãi với cửa sổ lớn đón nắng, bàn làm việc và khu vực ngồi thư giãn.",
      price: "650.000đ",
      priceUnit: "/đêm",
      size: "28m²",
      capacity: "2-3 khách",
      amenities: ["Giường King 1.8m", "View thành phố", "Minibar", "Két an toàn", "Ăn sáng miễn phí"],
      badge: "Phổ biến nhất",
    },
    {
      name: "Căn hộ Gia đình",
      description: "Hai phòng ngủ riêng biệt, bếp nhỏ và phòng khách — lý tưởng cho gia đình 4-6 người.",
      price: "1.150.000đ",
      priceUnit: "/đêm",
      size: "45m²",
      capacity: "4-6 khách",
      amenities: ["2 phòng ngủ", "Bếp + máy giặt", "Ban công", "2 TV", "Ăn sáng miễn phí"],
      badge: "Gia đình",
    },
  ],
  amenitiesTitle: "Tiện nghi nổi bật",
  amenities: [
    { icon: "wifi", title: "WiFi tốc độ cao", description: "Phủ sóng toàn bộ khách sạn, phù hợp làm việc online" },
    { icon: "car", title: "Đỗ xe miễn phí", description: "Bãi xe riêng cho ô tô và xe máy, có camera an ninh" },
    { icon: "coffee", title: "Ăn sáng buffet", description: "Món Việt và Âu, phục vụ 6:30 – 9:30 hàng ngày" },
    { icon: "clock", title: "Lễ tân 24/7", description: "Hỗ trợ check-in muộn, gọi xe, tư vấn địa điểm" },
    { icon: "sparkles", title: "Dọn phòng mỗi ngày", description: "Khăn và ga giường thay mới theo yêu cầu" },
    { icon: "map", title: "Tour & thuê xe", description: "Đặt tour địa phương và thuê xe máy ngay tại lễ tân" },
  ],
  gallery: [],
  testimonials: [
    { name: "Chị Mai", location: "Hà Nội", text: "Phòng sạch, giường êm, nhân viên thân thiện. Vị trí đi lại cực kỳ thuận tiện, sẽ quay lại lần sau.", rating: 5 },
    { name: "Anh Đức", location: "TP.HCM", text: "Đặt trực tiếp qua website được giá tốt hơn app. Check-in nhanh, ăn sáng ngon và đa dạng.", rating: 5 },
    { name: "Gia đình cô Lan", location: "Hải Phòng", text: "Căn hộ gia đình rộng rãi, có bếp nấu cho trẻ nhỏ rất tiện. Chủ nhà hỗ trợ nhiệt tình.", rating: 5 },
  ],
  locationTitle: "Vị trí thuận tiện",
  locationText:
    "Nằm ngay trung tâm, cách các điểm tham quan, khu ẩm thực và bến xe chỉ vài phút di chuyển. Thuận tiện cho cả du lịch và công tác.",
  locationHighlights: [
    "5 phút đến trung tâm thành phố",
    "10 phút đến khu phố ẩm thực",
    "15 phút đến bến xe / ga tàu",
    "Gần ngân hàng, siêu thị, hiệu thuốc",
  ],
  bookingTitle: "Đặt phòng ngay — Giá tốt nhất hôm nay",
  bookingSubtitle: "Để lại thông tin, lễ tân gọi xác nhận phòng trống và giá ưu đãi trong 5 phút.",
  footerAbout: "Khách sạn phục vụ lưu trú ngắn và dài ngày với phòng nghỉ tiện nghi, vị trí trung tâm và đội ngũ tận tâm.",
  footerLinks: [
    { label: "Phòng nghỉ", href: "#rooms" },
    { label: "Đặt phòng", href: "#dat-phong" },
    { label: "Blog", href: "/blog" },
  ],
  copyrightName: "Khách sạn",
};
