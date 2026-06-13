export interface RestaurantNavItem {
  label: string;
  href: string;
}

export interface RestaurantDish {
  name: string;
  description: string;
  price: string;
  badge?: string;
  image?: string;
}

export interface RestaurantMenuCategory {
  name: string;
  dishes: RestaurantDish[];
}

export interface RestaurantTestimonial {
  name: string;
  text: string;
  rating: number;
}

export interface RestaurantGalleryImage {
  url: string;
  alt: string;
}

export interface RestaurantThemeConfig {
  phone: string;
  zaloLink: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  heroBadge: string;
  openHours: string;
  navItems: RestaurantNavItem[];
  aboutTitle: string;
  aboutText: string;
  aboutImage?: string;
  statsYears: string;
  statsDishes: string;
  statsCustomers: string;
  menuTitle: string;
  menuSubtitle: string;
  menuCategories: RestaurantMenuCategory[];
  gallery: RestaurantGalleryImage[];
  testimonials: RestaurantTestimonial[];
  reservationTitle: string;
  reservationSubtitle: string;
  footerAbout: string;
  footerLinks: { label: string; href: string }[];
  copyrightName: string;
}

export const DEFAULT_RESTAURANT_CONFIG: RestaurantThemeConfig = {
  phone: "0901 234 567",
  zaloLink: "https://zalo.me/0901234567",
  heroTitle: "Hương vị truyền thống — Không gian ấm cúng",
  heroSubtitle:
    "Thực đơn đa dạng từ món Việt truyền thống đến đặc sản vùng miền, nguyên liệu tươi mỗi ngày. Đặt bàn trước để được phục vụ chu đáo nhất.",
  heroBadge: "Đang mở cửa — phục vụ đến 22:00",
  openHours: "10:00 – 22:00 (cả tuần)",
  navItems: [
    { label: "Trang chủ", href: "/" },
    { label: "Thực đơn", href: "#menu" },
    { label: "Không gian", href: "#gallery" },
    { label: "Đặt bàn", href: "#dat-ban" },
    { label: "Blog", href: "/blog" },
    { label: "Liên hệ", href: "#lien-he" },
  ],
  aboutTitle: "Câu chuyện của chúng tôi",
  aboutText:
    "Khởi đầu từ một quán ăn gia đình nhỏ, chúng tôi gìn giữ công thức truyền thống qua nhiều thế hệ. Mỗi món ăn được chuẩn bị từ nguyên liệu chọn lọc trong ngày, chế biến bởi đội ngũ đầu bếp giàu kinh nghiệm — để mỗi bữa ăn của bạn đều trọn vẹn hương vị quê nhà.",
  statsYears: "10+",
  statsDishes: "80+",
  statsCustomers: "50.000+",
  menuTitle: "Thực đơn đặc sắc",
  menuSubtitle: "Món ngon được yêu thích nhất, giá đã bao gồm VAT",
  menuCategories: [
    {
      name: "Món khai vị",
      dishes: [
        { name: "Gỏi cuốn tôm thịt", description: "Tôm tươi, thịt ba chỉ, rau sống, chấm mắm nêm", price: "65.000đ" },
        { name: "Chả giò hải sản", description: "Nhân tôm mực, cuốn giòn rụm, kèm rau sống", price: "75.000đ", badge: "Bán chạy" },
        { name: "Súp hải sản", description: "Tôm, mực, nấm tuyết, trứng bắc thảo", price: "55.000đ" },
      ],
    },
    {
      name: "Món chính",
      dishes: [
        { name: "Cá lăng nướng riềng mẻ", description: "Cá lăng tươi 1.2kg, nướng than hoa, kèm bún và rau thơm", price: "385.000đ", badge: "Đặc sản" },
        { name: "Gà ta hấp lá chanh", description: "Gà ta thả vườn, hấp nguyên con, chấm muối tiêu chanh", price: "320.000đ" },
        { name: "Bò lúc lắc khoai tây", description: "Thăn bò mềm, sốt tiêu đen, khoai tây chiên", price: "165.000đ" },
        { name: "Lẩu riêu cua bắp bò", description: "Riêu cua đồng, bắp bò, đậu rán, rau theo mùa (2-4 người)", price: "350.000đ", badge: "Mùa lạnh" },
      ],
    },
    {
      name: "Đồ uống & Tráng miệng",
      dishes: [
        { name: "Nước sấu đá", description: "Sấu ngâm nhà làm, vị chua ngọt thanh mát", price: "25.000đ" },
        { name: "Chè khúc bạch", description: "Khúc bạch hạnh nhân, nhãn lồng, hạt é", price: "35.000đ" },
      ],
    },
  ],
  gallery: [],
  testimonials: [
    { name: "Anh Tuấn — Hà Nội", text: "Đồ ăn đậm vị, không gian sạch sẽ, nhân viên nhiệt tình. Đặt bàn trước nên được xếp chỗ đẹp, rất hài lòng.", rating: 5 },
    { name: "Chị Hương — Bắc Ninh", text: "Cá lăng nướng ở đây ngon nhất khu vực. Giá hợp lý, phục vụ nhanh dù cuối tuần khá đông.", rating: 5 },
    { name: "Gia đình anh Nam", text: "Tổ chức sinh nhật cho con ở đây, nhà hàng hỗ trợ trang trí và bánh kem chu đáo. Sẽ quay lại.", rating: 5 },
  ],
  reservationTitle: "Đặt bàn ngay hôm nay",
  reservationSubtitle: "Để lại thông tin, nhà hàng gọi xác nhận trong 5 phút. Đặt trước được ưu tiên chỗ ngồi đẹp và món đặc sản.",
  footerAbout: "Nhà hàng phục vụ ẩm thực Việt truyền thống với nguyên liệu tươi mỗi ngày, không gian phù hợp gia đình, liên hoan và tiếp khách.",
  footerLinks: [
    { label: "Thực đơn", href: "#menu" },
    { label: "Đặt bàn", href: "#dat-ban" },
    { label: "Blog", href: "/blog" },
  ],
  copyrightName: "Nhà hàng",
};
