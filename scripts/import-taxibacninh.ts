/**
 * Import script: Taxi Bắc Ninh
 * Copies all content from taxibacninh.vn into Growth OS CMS
 * Run: DATABASE_URL="..." npx tsx scripts/import-taxibacninh.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Block helpers ────────────────────────────────────────────────────────────

function heroBlock(headline: string, subheadline: string, ctaLabel: string, ctaHref: string) {
  return { type: "hero", headline, subheadline, ctaLabel, ctaHref };
}

function featureListBlock(heading: string, features: { title: string; description: string; icon: string }[]) {
  return { type: "feature-list", heading, features };
}

function richTextBlock(html: string) {
  return { type: "rich-text", html };
}

function faqBlock(heading: string, items: { question: string; answer: string }[]) {
  return { type: "faq", heading, items };
}

function ctaBlock(heading: string, subheading: string, buttonLabel: string, buttonHref: string) {
  return { type: "cta", heading, subheading, buttonLabel, buttonHref };
}

function contactFormBlock(heading: string, subheading: string) {
  return { type: "contact-form", heading, subheading };
}

// ── Blog post content templates ─────────────────────────────────────────────

function articleContent(
  title: string,
  intro: string,
  route: string,
  vehicleNote: string,
): string {
  return `<h1>${title}</h1>
<p>${intro}</p>

<h2>Vì Sao Nên Chọn Xe Riêng Giá Trọn Gói?</h2>
<p>Với tuyến ${route}, xe riêng mang lại sự linh hoạt cao hơn so với các hình thức di chuyển ghép chuyến. Hành khách không phải chờ gom khách, không cần trung chuyển, và có thể trao đổi trực tiếp về điểm đón/trả. Điều này đặc biệt quan trọng khi đi cùng người cao tuổi, trẻ nhỏ, nhiều hành lý, hoặc cần đúng giờ để bắt chuyến bay, họp hành, tham quan.</p>

<h2>Thông Tin Cần Gửi Để Nhận Giá Trọn Gói</h2>
<p>Để được báo giá chính xác, khách hàng cần cung cấp:</p>
<ul>
  <li>Điểm đón cụ thể: nhà riêng, khách sạn, sân bay, khu công nghiệp hoặc địa chỉ cụ thể</li>
  <li>Điểm trả chi tiết tại điểm đến</li>
  <li>Ngày giờ khởi hành, giờ bay hoặc giờ hẹn nếu có</li>
  <li>Số lượng hành khách, số kiện hành lý, loại xe mong muốn (4/7/16 chỗ)</li>
  <li>Loại chuyến: một chiều, khứ hồi, cùng ngày hay thuê xe theo giờ</li>
</ul>

<h2>Kinh Nghiệm Chọn Loại Xe Phù Hợp</h2>
<p>${vehicleNote} Chính sách giá trọn gói giúp khách biết trước tổng chi phí bao gồm phí cao tốc, không phát sinh thêm nếu hành trình không thay đổi. Đặt xe sớm, đặc biệt dịp cuối tuần, lễ tết, sáng sớm hay đêm muộn, giúp chủ động hơn về loại xe và giờ khởi hành.</p>

<h2>Giá Trọn Gói Đã Bao Gồm Phí Cao Tốc</h2>
<p>Mức giá được báo khi tư vấn đã bao gồm phí cao tốc theo tuyến phù hợp và không phát sinh thêm chi phí ngoài mức giá đã xác nhận nếu hành trình diễn ra đúng như đã thống nhất. Đây là điểm khác biệt so với các hình thức tính giá mơ hồ, báo giá thấp ban đầu rồi cộng thêm sau chuyến.</p>

<h2>Khi Nào Nên Đặt Xe Trước?</h2>
<p>Nên đặt sớm, đặc biệt với các chuyến cuối tuần, ngày lễ, sáng sớm, đêm muộn, hoặc khi cần loại xe cụ thể. Với các chuyến đi sân bay hay có lịch cố định, đặt trước giúp chủ động hơn về thời gian và loại xe.</p>

<h2>Quy Trình Tư Vấn Và Xác Nhận Chuyến Đi</h2>
<p>Khách hàng gửi thông tin điểm đón, điểm đến, ngày giờ khởi hành, số người và loại xe. Đội ngũ tư vấn kiểm tra tuyến đường, ước tính thời gian di chuyển và đề xuất xe phù hợp. Sau khi đủ thông tin, khách nhận báo giá trọn gói bao gồm phí cao tốc. Khi khách đồng ý, thông tin chuyến đi được xác nhận lại để tránh nhầm lẫn, đặc biệt với địa chỉ, số điện thoại liên lạc và giờ có mặt.</p>

<h2>Lưu Ý Để Chuyến Đi Thuận Tiện Hơn</h2>
<p>Với điểm đón tại khu dân cư, chung cư, khách sạn hay khu công nghiệp, hãy cung cấp địa chỉ đầy đủ. Nếu điểm đón nằm trong ngõ hẹp, khu vực hạn chế dừng đỗ hoặc tòa nhà phức tạp, nên sắp xếp điểm gặp dễ nhận biết để xe đến nhanh hơn. Khách đi sân bay nên cung cấp giờ bay, số hiệu chuyến và số kiện hành lý để tài xế chủ động về thời gian.</p>

<h2>Cam Kết Về Giá Trọn Gói Và Chi Phí</h2>
<p>Cam kết chính là báo giá trọn gói trước khi di chuyển. Mức giá bao gồm phí cao tốc theo tuyến phù hợp và không phát sinh thêm ngoài mức đã xác nhận nếu các thông số hành trình không thay đổi. Nếu hành trình có thay đổi như kéo dài tuyến đường, thêm điểm dừng xa hay chuyển từ một chiều sang khứ hồi, đội ngũ sẽ trao đổi và thống nhất trước khi áp dụng chi phí mới.</p>

<h2>Đối Tượng Khách Hàng Phù Hợp</h2>
<p>Dịch vụ phù hợp với cá nhân cần phương tiện riêng tư, gia đình có trẻ nhỏ hoặc người cao tuổi, nhóm bạn đi du lịch, doanh nhân cần đúng giờ và kín đáo, và doanh nghiệp có nhu cầu đưa đón đối tác. Mỗi đối tượng khách hàng đều được tư vấn phù hợp để chọn đúng loại xe và mức giá hợp lý.</p>

<h2>Câu Hỏi Thường Gặp</h2>
<p><strong>Giá đã bao gồm phí cao tốc chưa?</strong><br>Có. Giá trọn gói đã bao gồm phí cao tốc theo tuyến phù hợp, không phát sinh thêm ngoài mức giá đã xác nhận.</p>
<p><strong>Có phát sinh thêm chi phí sau chuyến không?</strong><br>Không, nếu hành trình diễn ra đúng như đã xác nhận. Nếu có thay đổi, đội ngũ sẽ trao đổi trước khi áp dụng chi phí mới.</p>
<p><strong>Có xe 4 chỗ, 7 chỗ và 16 chỗ không?</strong><br>Có. Khách hàng chọn xe theo số người, hành lý và yêu cầu cụ thể.</p>
<p><strong>Có đặt xe đi sân bay Nội Bài được không?</strong><br>Có. Khách cung cấp giờ bay để đội ngũ tư vấn giờ đón phù hợp.</p>
<p><strong>Nên đặt xe trước bao lâu?</strong><br>Đặt sớm càng tốt, đặc biệt cuối tuần, ngày lễ, sáng sớm hoặc đêm muộn.</p>

<p><strong>Liên hệ đặt xe:</strong> Hotline / Zalo <a href="tel:0961657891">0961 657 891</a> · Email: <a href="mailto:info@taxibacninh.vn">info@taxibacninh.vn</a></p>`;
}

// ── Main import ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Bắt đầu import Taxi Bắc Ninh...\n");

  // 1. Tạo Organization nếu chưa có
  let org = await prisma.organization.findFirst({ where: { slug: "30nice-agency" } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "30Nice Agency", slug: "30nice-agency" },
    });
    console.log("✅ Tạo Organization: 30Nice Agency");
  } else {
    console.log("ℹ️  Organization đã tồn tại:", org.name);
  }

  // 2. Tạo Tenant: Taxi Bắc Ninh
  let tenant = await prisma.tenant.findFirst({ where: { slug: "taxi-bac-ninh" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        organizationId: org.id,
        name: "Taxi Bắc Ninh",
        slug: "taxi-bac-ninh",
        primaryDomain: "taxibacninh.vn",
        status: "ACTIVE",
        businessName: "Taxi Bắc Ninh",
        businessPhone: "0961657891",
        businessEmail: "info@taxibacninh.vn",
        businessAddress: "Bắc Ninh, Việt Nam",
        defaultSeoTitle: "Taxi Bắc Ninh - Đặt Xe 24/7, Giá Trọn Gói",
        defaultSeoDescription: "Dịch vụ taxi Bắc Ninh xe riêng, đón tận nơi, giá trọn gói bao gồm phí cao tốc. Hỗ trợ 24/7 qua hotline và Zalo 0961 657 891.",
      },
    });
    console.log("✅ Tạo Tenant: Taxi Bắc Ninh (id:", tenant.id, ")");
  } else {
    console.log("ℹ️  Tenant đã tồn tại:", tenant.id);
  }

  const tenantId = tenant.id;

  // 3. SiteSettings
  const existingSettings = await prisma.siteSettings.findUnique({ where: { tenantId } });
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        tenantId,
        phone: "0961657891",
        email: "info@taxibacninh.vn",
        address: "Bắc Ninh, Việt Nam",
        primaryColor: "#f59e0b",
        secondaryColor: "#0ea5e9",
        defaultSeoTitle: "Taxi Bắc Ninh - Đặt Xe 24/7, Giá Trọn Gói",
        defaultSeoDescription: "Dịch vụ taxi Bắc Ninh xe riêng, đón tận nơi, giá trọn gói bao gồm phí cao tốc.",
        socialLinks: {
          zalo: "https://zalo.me/0961657891",
          phone: "tel:0961657891",
        },
      },
    });
    console.log("✅ Tạo SiteSettings");
  }

  // 4. Categories
  const catMap: Record<string, string> = {};
  for (const [name, slug] of [
    ["Kinh nghiệm đặt xe", "kinh-nghiem-dat-xe"],
    ["Cẩm nang du lịch", "cam-nang-du-lich"],
  ]) {
    let cat = await prisma.category.findFirst({ where: { tenantId, slug } });
    if (!cat) {
      cat = await prisma.category.create({ data: { tenantId, name, slug } });
      console.log("✅ Tạo Category:", name);
    }
    catMap[slug] = cat.id;
  }

  // 5. Blog posts
  const posts = [
    {
      title: "Taxi Hà Nội Bắc Ninh trọn gói: đặt xe riêng không lo phát sinh",
      slug: "taxi-ha-noi-bac-ninh-tron-goi",
      excerpt: "Dịch vụ taxi Hà Nội Bắc Ninh trọn gói, xe riêng đón tận nơi, giá cố định bao gồm phí cao tốc, không phát sinh thêm chi phí.",
      seoTitle: "Taxi Hà Nội Bắc Ninh Trọn Gói - Giá Cố Định, Không Phát Sinh",
      seoDescription: "Đặt xe riêng Hà Nội Bắc Ninh giá trọn gói, bao gồm phí cao tốc. Xe 4/7/16 chỗ, đón tận nơi, hỗ trợ 24/7. Hotline 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-24"),
      content: `<h1>Taxi Hà Nội Bắc Ninh trọn gói: đặt xe riêng không lo phát sinh</h1>
<p>Khi khách hàng tìm kiếm dịch vụ taxi từ Hà Nội đến Bắc Ninh với mức giá cố định, họ thường cần phương tiện đáng tin cậy với giờ đón được đảm bảo, tài xế am hiểu tuyến đường, lộ trình rõ ràng và chi phí được thỏa thuận trước. Dịch vụ tập trung vào xe riêng phù hợp với gia đình, người đi công tác, hành khách sân bay, đoàn du lịch hoặc di chuyển liên tỉnh cần sự chủ động cao hơn xe ghép.</p>

<h2>Vì Sao Nên Chọn Xe Riêng Giá Trọn Gói?</h2>
<p>Với tuyến Hà Nội – Bắc Ninh, xe riêng mang lại sự linh hoạt cao hơn. Hành khách không phải chờ gom khách, không cần trung chuyển, và có thể trao đổi trực tiếp về điểm đón/trả. Điều này đặc biệt quan trọng khi đi cùng người cao tuổi, trẻ nhỏ, nhiều hành lý, hoặc cần đúng giờ để bắt chuyến bay, tham dự họp hành hay sự kiện.</p>

<h2>Thông Tin Cần Gửi Để Nhận Giá Trọn Gói</h2>
<ul>
  <li>Điểm đón cụ thể: nhà riêng, khách sạn, sân bay, khu công nghiệp hoặc địa chỉ cụ thể tại Hà Nội</li>
  <li>Điểm trả chi tiết tại Bắc Ninh hoặc chiều ngược lại về Hà Nội</li>
  <li>Ngày giờ khởi hành, giờ bay hoặc giờ hẹn nếu có</li>
  <li>Số lượng hành khách, số kiện hành lý, loại xe mong muốn (4/7/16 chỗ)</li>
  <li>Loại chuyến: một chiều, khứ hồi, cùng ngày hay thuê xe theo ngày</li>
</ul>

<h2>Kinh Nghiệm Chọn Loại Xe Phù Hợp</h2>
<p>Xe 4 chỗ phù hợp với cá nhân hoặc người đi công tác; xe 7 chỗ dành cho gia đình có nhiều hành lý; xe 16 chỗ phù hợp với nhóm lớn, đoàn công ty hay đoàn du lịch. Chính sách giá trọn gói giúp khách biết trước tổng chi phí bao gồm phí cao tốc, không phát sinh thêm nếu hành trình không thay đổi.</p>

<h2>Giá Tham Khảo Tuyến Hà Nội – Bắc Ninh</h2>
<table>
  <tr><th>Loại xe</th><th>Giá tham khảo</th></tr>
  <tr><td>Xe 4 chỗ</td><td>350.000đ/chuyến</td></tr>
  <tr><td>Xe 7 chỗ</td><td>420.000đ/chuyến</td></tr>
  <tr><td>Xe 16 chỗ</td><td>950.000đ/chuyến</td></tr>
</table>
<p><em>Giá trọn gói tham khảo, đã bao gồm phí cao tốc. Giá thực tế phụ thuộc vào điểm đón/trả cụ thể.</em></p>

<h2>Giá Trọn Gói Đã Bao Gồm Phí Cao Tốc</h2>
<p>Mức giá được báo khi tư vấn đã bao gồm phí cao tốc theo tuyến phù hợp và không phát sinh thêm chi phí ngoài mức giá đã xác nhận nếu hành trình diễn ra đúng như đã thống nhất. Đây là điểm khác biệt so với các hình thức tính giá mơ hồ.</p>

<h2>Khi Nào Nên Đặt Xe Trước?</h2>
<p>Nên đặt sớm, đặc biệt với các chuyến cuối tuần, ngày lễ, sáng sớm, đêm muộn, hoặc khi cần loại xe cụ thể. Đặt trước giúp đảm bảo xe và tài xế sẵn sàng đúng giờ.</p>

<h2>Quy Trình Tư Vấn Và Xác Nhận Chuyến Đi</h2>
<p>Khách hàng gửi thông tin điểm đón, điểm đến, ngày giờ khởi hành, số người và loại xe. Đội ngũ tư vấn kiểm tra tuyến đường, ước tính thời gian và đề xuất xe phù hợp. Sau khi đủ thông tin, khách nhận báo giá trọn gói bao gồm phí cao tốc. Khi khách đồng ý, thông tin chuyến đi được xác nhận để tránh nhầm lẫn.</p>

<h2>Lưu Ý Để Chuyến Đi Thuận Tiện Hơn</h2>
<p>Với điểm đón tại khu dân cư, chung cư hay khách sạn, hãy cung cấp địa chỉ đầy đủ. Nếu điểm đón nằm trong ngõ hẹp hoặc khu vực hạn chế, nên sắp xếp điểm gặp dễ nhận biết. Tính đến giờ cao điểm và kẹt xe trên đường Hà Nội vào cuối tuần hay ngày lễ.</p>

<h2>Câu Hỏi Thường Gặp</h2>
<p><strong>Giá đã bao gồm phí cao tốc chưa?</strong><br>Có. Giá trọn gói đã bao gồm phí cao tốc, không phát sinh thêm nếu hành trình không thay đổi.</p>
<p><strong>Có phát sinh thêm chi phí sau chuyến không?</strong><br>Không, nếu hành trình diễn ra đúng như đã xác nhận. Nếu thay đổi, đội ngũ sẽ trao đổi trước.</p>
<p><strong>Có xe 4 chỗ, 7 chỗ và 16 chỗ không?</strong><br>Có đầy đủ 3 loại xe để khách lựa chọn.</p>
<p><strong>Có đặt xe đi sân bay Nội Bài được không?</strong><br>Có. Cung cấp giờ bay để được tư vấn giờ đón phù hợp.</p>
<p><strong>Nên đặt xe trước bao lâu?</strong><br>Đặt sớm càng tốt, đặc biệt cuối tuần, ngày lễ, sáng sớm hoặc đêm muộn.</p>
<p><strong>Liên hệ:</strong> Hotline / Zalo <a href="tel:0961657891">0961 657 891</a> · <a href="mailto:info@taxibacninh.vn">info@taxibacninh.vn</a></p>`,
    },
    {
      title: "Taxi Nội Bài Bắc Ninh: đón sân bay đúng giờ, hỗ trợ hành lý",
      slug: "taxi-noi-bai-bac-ninh",
      excerpt: "Dịch vụ taxi sân bay Nội Bài đi Bắc Ninh, theo dõi lịch bay, hỗ trợ đón chuyến sớm/muộn, hỗ trợ hành lý. Giá trọn gói bao gồm phí cao tốc.",
      seoTitle: "Taxi Nội Bài Bắc Ninh - Đón Sân Bay Đúng Giờ, Hỗ Trợ Hành Lý",
      seoDescription: "Xe đón sân bay Nội Bài đi Bắc Ninh giá trọn gói từ 390k. Hỗ trợ chuyến sớm, đêm muộn, theo dõi lịch bay. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-25"),
      content: articleContent(
        "Taxi Nội Bài Bắc Ninh: đón sân bay đúng giờ, hỗ trợ hành lý",
        "Dịch vụ taxi sân bay Nội Bài – Bắc Ninh cung cấp phương tiện xe riêng với mức giá trọn gói được xác nhận trước chuyến đi, bao gồm phí cao tốc và không phát sinh thêm nếu hành trình diễn ra đúng như đã thống nhất. Tài xế theo dõi lịch bay và hỗ trợ hành khách ngay tại cửa ra sân bay.",
        "Nội Bài – Bắc Ninh",
        "Xe 4 chỗ phù hợp với hành khách đơn lẻ hoặc công tác 1-2 người; xe 7 chỗ lý tưởng cho gia đình có nhiều hành lý từ sân bay; xe 16 chỗ phù hợp đoàn du lịch hay nhóm công ty cùng chuyến bay.",
      ),
    },
    {
      title: "Giá trọn gói taxi Hà Nội Bắc Ninh: không phát sinh thêm chi phí",
      slug: "gia-taxi-ha-noi-bac-ninh",
      excerpt: "Bảng giá trọn gói taxi Hà Nội Bắc Ninh cập nhật 2026, xe 4/7/16 chỗ, đã bao gồm phí cao tốc, không phát sinh thêm chi phí.",
      seoTitle: "Giá Taxi Hà Nội Bắc Ninh 2026 - Bảng Giá Trọn Gói",
      seoDescription: "Bảng giá taxi Hà Nội Bắc Ninh: xe 4 chỗ từ 350k, xe 7 chỗ từ 420k, xe 16 chỗ từ 950k. Giá trọn gói bao gồm phí cao tốc. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-23"),
      content: `<h1>Giá trọn gói taxi Hà Nội Bắc Ninh: không phát sinh thêm chi phí</h1>
<p>Bảng giá taxi Hà Nội – Bắc Ninh dưới đây là mức tham khảo cho các tuyến phổ biến. Giá thực tế phụ thuộc vào điểm đón/trả cụ thể và được xác nhận khi tư vấn. Tất cả mức giá đã bao gồm phí cao tốc theo tuyến phù hợp.</p>

<h2>Bảng Giá Tham Khảo Tuyến Hà Nội – Bắc Ninh</h2>
<table>
  <tr><th>Loại xe</th><th>Giá tham khảo</th><th>Ghi chú</th></tr>
  <tr><td>Xe 4 chỗ</td><td>350.000đ/chuyến</td><td>Cá nhân, công tác 1-2 người</td></tr>
  <tr><td>Xe 7 chỗ</td><td>420.000đ/chuyến</td><td>Gia đình, nhiều hành lý</td></tr>
  <tr><td>Xe 16 chỗ</td><td>950.000đ/chuyến</td><td>Nhóm lớn, đoàn công ty</td></tr>
</table>

<h2>Bảng Giá Tham Khảo Tuyến Nội Bài – Bắc Ninh</h2>
<table>
  <tr><th>Loại xe</th><th>Giá tham khảo</th><th>Ghi chú</th></tr>
  <tr><td>Xe 4 chỗ</td><td>390.000đ/chuyến</td><td>Đón/trả sân bay</td></tr>
  <tr><td>Xe 7 chỗ</td><td>450.000đ/chuyến</td><td>Gia đình, nhiều hành lý sân bay</td></tr>
  <tr><td>Xe 16 chỗ</td><td>1.000.000đ/chuyến</td><td>Đoàn du lịch, nhóm lớn</td></tr>
</table>

<h2>Giá Trọn Gói Bao Gồm Những Gì?</h2>
<ul>
  <li>Phí cao tốc theo tuyến phù hợp</li>
  <li>Đón tận nơi: nhà riêng, khách sạn, văn phòng, khu công nghiệp</li>
  <li>Trả đúng địa chỉ yêu cầu</li>
  <li>Không ghép khách, xe riêng hoàn toàn</li>
  <li>Tài xế kinh nghiệm, am hiểu tuyến đường</li>
</ul>

<h2>Các Tuyến Đường Phổ Biến Tính Giá Khác</h2>
<p>Ngoài tuyến Hà Nội – Bắc Ninh và Nội Bài – Bắc Ninh, dịch vụ cũng phục vụ các tuyến nội tỉnh Bắc Ninh (Từ Sơn, Tiên Du, Yên Phong, Quế Võ) và các tỉnh lân cận. Giá cho các tuyến này được báo cụ thể khi tư vấn dựa trên khoảng cách và loại xe.</p>

<h2>Lưu Ý Về Giá</h2>
<p>Giá trên là mức tham khảo cho điểm đón/trả trung tâm. Điểm đón/trả xa trung tâm, chuyến khứ hồi có chờ, hoặc thuê xe theo ngày sẽ được tính riêng. Liên hệ hotline để nhận báo giá chính xác cho hành trình cụ thể.</p>

<h2>Câu Hỏi Thường Gặp Về Giá</h2>
<p><strong>Giá có bao gồm phí cao tốc không?</strong><br>Có. Tất cả mức giá đã bao gồm phí cao tốc theo tuyến, không phát sinh thêm.</p>
<p><strong>Giá có thay đổi vào dịp lễ tết không?</strong><br>Một số tuyến có thể điều chỉnh vào cao điểm lễ tết. Liên hệ để xác nhận giá cụ thể.</p>
<p><strong>Đặt khứ hồi có được ưu đãi không?</strong><br>Liên hệ trực tiếp để được tư vấn mức giá khứ hồi phù hợp.</p>
<p><strong>Liên hệ:</strong> Hotline / Zalo <a href="tel:0961657891">0961 657 891</a> · <a href="mailto:info@taxibacninh.vn">info@taxibacninh.vn</a></p>`,
    },
    {
      title: "Taxi Bắc Ninh Hà Nội: xe riêng về Hà Nội đúng giờ, giá trọn gói",
      slug: "taxi-bac-ninh-ha-noi",
      excerpt: "Dịch vụ taxi Bắc Ninh đi Hà Nội xe riêng, đón tận nơi tại Bắc Ninh, giá trọn gói cố định bao gồm phí cao tốc.",
      seoTitle: "Taxi Bắc Ninh Hà Nội - Xe Riêng Đúng Giờ, Giá Trọn Gói",
      seoDescription: "Taxi Bắc Ninh đi Hà Nội xe riêng từ 350k, đón tận nơi, giá trọn gói bao gồm phí cao tốc. Hỗ trợ 24/7. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-22"),
      content: articleContent(
        "Taxi Bắc Ninh Hà Nội: xe riêng về Hà Nội đúng giờ, giá trọn gói",
        "Dịch vụ taxi Bắc Ninh – Hà Nội cung cấp xe riêng đón tận nơi tại Bắc Ninh, đưa khách thẳng đến điểm đến tại Hà Nội. Giá trọn gói được xác nhận trước chuyến đi, bao gồm phí cao tốc và không phát sinh thêm nếu hành trình diễn ra đúng như đã thống nhất.",
        "Bắc Ninh – Hà Nội",
        "Xe 4 chỗ phù hợp với người đi công tác hoặc đơn lẻ; xe 7 chỗ lý tưởng cho gia đình có hành lý; xe 16 chỗ phù hợp với nhóm lớn hoặc đoàn công ty cần di chuyển cùng lúc.",
      ),
    },
    {
      title: "Taxi 4 chỗ Hà Nội Bắc Ninh: lựa chọn gọn nhẹ cho cá nhân, công tác",
      slug: "taxi-4-cho-ha-noi-bac-ninh",
      excerpt: "Dịch vụ taxi 4 chỗ Hà Nội Bắc Ninh giá trọn gói từ 350k, phù hợp cá nhân và công tác. Đón tận nơi, bao phí cao tốc.",
      seoTitle: "Taxi 4 Chỗ Hà Nội Bắc Ninh - Từ 350k, Giá Trọn Gói",
      seoDescription: "Đặt taxi 4 chỗ Hà Nội Bắc Ninh từ 350.000đ/chuyến, giá trọn gói bao gồm phí cao tốc, đón tận nơi. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-26"),
      content: articleContent(
        "Taxi 4 chỗ Hà Nội Bắc Ninh: lựa chọn gọn nhẹ cho cá nhân, công tác",
        "Xe 4 chỗ là lựa chọn phổ biến nhất cho cá nhân di chuyển giữa Hà Nội và Bắc Ninh. Với chi phí từ 350.000đ/chuyến (giá tham khảo, bao gồm phí cao tốc), đây là phương án tiết kiệm và linh hoạt cho người đi công tác, du lịch một mình hoặc cặp đôi.",
        "Hà Nội – Bắc Ninh bằng xe 4 chỗ",
        "Xe 4 chỗ phù hợp nhất với 1-3 hành khách và hành lý gọn nhẹ. Đây là lựa chọn tối ưu về chi phí cho cá nhân. Nếu có nhiều hành lý hoặc đi cùng gia đình, xe 7 chỗ sẽ thoải mái hơn.",
      ),
    },
    {
      title: "Taxi 7 chỗ Hà Nội Bắc Ninh: thoải mái cho gia đình và nhiều hành lý",
      slug: "taxi-7-cho-ha-noi-bac-ninh",
      excerpt: "Dịch vụ taxi 7 chỗ Hà Nội Bắc Ninh giá trọn gói từ 420k, thoải mái cho gia đình, nhiều hành lý. Đón tận nơi, bao phí cao tốc.",
      seoTitle: "Taxi 7 Chỗ Hà Nội Bắc Ninh - Từ 420k, Thoải Mái Cho Gia Đình",
      seoDescription: "Đặt taxi 7 chỗ Hà Nội Bắc Ninh từ 420.000đ/chuyến, giá trọn gói, phù hợp gia đình và nhiều hành lý. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-27"),
      content: articleContent(
        "Taxi 7 chỗ Hà Nội Bắc Ninh: thoải mái cho gia đình và nhiều hành lý",
        "Xe 7 chỗ là lựa chọn lý tưởng cho gia đình hoặc nhóm 4-6 người di chuyển giữa Hà Nội và Bắc Ninh. Với không gian rộng hơn xe 4 chỗ và khoang hành lý lớn, xe 7 chỗ đặc biệt phù hợp khi có trẻ nhỏ, người cao tuổi hoặc nhiều kiện hành lý từ sân bay.",
        "Hà Nội – Bắc Ninh bằng xe 7 chỗ",
        "Xe 7 chỗ phù hợp nhất với gia đình 4-6 người hoặc nhóm bạn có hành lý vừa phải. Khoang sau rộng rãi, ghế ngồi thoải mái cho hành trình khoảng 40-60 phút. Nếu cả nhóm trên 6 người hoặc có đoàn lớn, xe 16 chỗ sẽ là lựa chọn phù hợp hơn.",
      ),
    },
    {
      title: "Xe 16 chỗ Hà Nội Bắc Ninh: thuê xe cho đoàn, công ty, du lịch",
      slug: "xe-16-cho-ha-noi-bac-ninh",
      excerpt: "Thuê xe 16 chỗ Hà Nội Bắc Ninh giá trọn gói từ 950k, phù hợp đoàn du lịch, công ty, nhóm lớn. Đón tận nơi, bao phí cao tốc.",
      seoTitle: "Xe 16 Chỗ Hà Nội Bắc Ninh - Từ 950k, Cho Đoàn Công Ty",
      seoDescription: "Thuê xe 16 chỗ Hà Nội Bắc Ninh từ 950.000đ/chuyến, giá trọn gói, phù hợp đoàn du lịch và công ty. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-28"),
      content: articleContent(
        "Xe 16 chỗ Hà Nội Bắc Ninh: thuê xe cho đoàn, công ty, du lịch",
        "Xe 16 chỗ là lựa chọn tối ưu cho đoàn du lịch, nhóm công ty hay sự kiện tập thể cần di chuyển từ Hà Nội đến Bắc Ninh. Với không gian rộng rãi, hành khách di chuyển thoải mái và không cần chia nhỏ nhóm ra nhiều xe khác nhau.",
        "Hà Nội – Bắc Ninh bằng xe 16 chỗ",
        "Xe 16 chỗ phù hợp với nhóm từ 8-14 người, đoàn du lịch, công ty tổ chức teambuilding, hay hội nhóm cùng di chuyển. Toàn nhóm di chuyển trên một xe giúp dễ quản lý lịch trình và tiết kiệm chi phí hơn so với nhiều xe nhỏ.",
      ),
    },
    {
      title: "Taxi Hà Nội TP Bắc Ninh: xe riêng tận nơi, đi thẳng đúng lịch",
      slug: "taxi-ha-noi-tp-bac-ninh",
      excerpt: "Dịch vụ taxi Hà Nội TP Bắc Ninh giá trọn gói, xe riêng đón tận nơi, đi thẳng không ghép khách. Hỗ trợ 24/7.",
      seoTitle: "Taxi Hà Nội TP Bắc Ninh - Xe Riêng Đúng Lịch, Giá Trọn Gói",
      seoDescription: "Taxi Hà Nội đến TP Bắc Ninh xe riêng, giá trọn gói, đón tận nơi, đi thẳng không ghép. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-29"),
      content: articleContent(
        "Taxi Hà Nội TP Bắc Ninh: xe riêng tận nơi, đi thẳng đúng lịch",
        "Dịch vụ taxi Hà Nội – TP Bắc Ninh cung cấp xe riêng đón tận nơi tại Hà Nội, đưa thẳng đến địa chỉ yêu cầu trong TP Bắc Ninh mà không dừng ghép khách giữa đường. Tuyến đường này có khoảng cách khoảng 30-35 km, thời gian di chuyển trung bình 40-50 phút tùy điểm đón/trả.",
        "Hà Nội – TP Bắc Ninh",
        "Xe 4 chỗ phù hợp cho cá nhân và công tác; xe 7 chỗ lý tưởng cho gia đình đến trung tâm TP Bắc Ninh; xe 16 chỗ cho đoàn lớn. Tất cả loại xe đều phục vụ tuyến này với giá trọn gói.",
      ),
    },
    {
      title: "Taxi Hà Nội Từ Sơn: đặt xe riêng an toàn, giá trọn gói",
      slug: "taxi-ha-noi-tu-son",
      excerpt: "Dịch vụ taxi Hà Nội Từ Sơn giá trọn gói, không phát sinh thêm chi phí. Xe riêng đón tận nơi, hỗ trợ 24/7.",
      seoTitle: "Taxi Hà Nội Từ Sơn - Xe Riêng, Giá Trọn Gói",
      seoDescription: "Taxi Hà Nội đi Từ Sơn Bắc Ninh xe riêng, giá trọn gói, bao gồm phí cao tốc. Đón tận nơi, hỗ trợ 24/7. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-30"),
      content: articleContent(
        "Taxi Hà Nội Từ Sơn: đặt xe riêng an toàn, giá trọn gói",
        "Từ Sơn là thị xã phát triển nhanh của tỉnh Bắc Ninh, là điểm đến phổ biến của nhiều khu công nghiệp và khu đô thị mới. Dịch vụ taxi Hà Nội – Từ Sơn cung cấp xe riêng với giá trọn gói, đón tận nơi tại Hà Nội và đưa thẳng đến điểm đến tại Từ Sơn.",
        "Hà Nội – Từ Sơn (Bắc Ninh)",
        "Từ Sơn có nhiều khu công nghiệp lớn nên nhu cầu xe công tác cao. Xe 4 chỗ phù hợp nhất cho công tác cá nhân; xe 7 chỗ lý tưởng cho nhóm nhân viên cùng đi công tác; xe 16 chỗ cho đoàn lớn đến các khu công nghiệp.",
      ),
    },
    {
      title: "Đặt Taxi Từ Sơn Nội Bài đi công tác: cần gì để chuyến đi gọn và đúng giờ",
      slug: "taxi-tu-son-noi-bai-di-cong-tac-2026-05-25",
      excerpt: "Kinh nghiệm thực tế khi đặt taxi từ Sơn Nội Bài đi công tác: chọn xe, hẹn giờ, chuẩn bị hành lý và những lưu ý để chuyến đi thuận lợi.",
      seoTitle: "Taxi Từ Sơn Nội Bài Đi Công Tác - Kinh Nghiệm Đặt Xe",
      seoDescription: "Hướng dẫn đặt taxi Từ Sơn đi sân bay Nội Bài cho chuyến công tác: chọn xe, giờ đón, lưu ý hành lý. Gọi 0961 657 891.",
      categorySlug: "kinh-nghiem-dat-xe",
      publishedAt: new Date("2026-05-25"),
      content: articleContent(
        "Đặt Taxi Từ Sơn Nội Bài đi công tác: cần gì để chuyến đi gọn và đúng giờ",
        "Khi đặt taxi từ Từ Sơn ra sân bay Nội Bài cho chuyến công tác, sự chuẩn bị kỹ càng từ trước giúp chuyến đi diễn ra suôn sẻ và đúng giờ. Tuyến Từ Sơn – Nội Bài có khoảng cách khoảng 25-30 km, thời gian di chuyển trung bình 35-45 phút tùy thời điểm trong ngày và mức độ giao thông.",
        "Từ Sơn – Nội Bài",
        "Xe 4 chỗ phù hợp nhất cho người đi công tác một mình hoặc 2 người với hành lý công tác gọn nhẹ. Nếu mang nhiều tài liệu hay thiết bị, xe 7 chỗ sẽ thoải mái hơn. Cung cấp số hiệu chuyến bay và giờ bay để được tư vấn giờ đón phù hợp.",
      ),
    },
  ];

  let postCreated = 0;
  for (const p of posts) {
    const exists = await prisma.post.findFirst({ where: { tenantId, slug: p.slug } });
    if (!exists) {
      await prisma.post.create({
        data: {
          tenantId,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          status: "PUBLISHED",
          publishedAt: p.publishedAt,
          categoryId: catMap[p.categorySlug] ?? null,
        },
      });
      postCreated++;
    }
  }
  console.log(`✅ Import ${postCreated} bài viết (${posts.length - postCreated} đã tồn tại)`);

  // 6. Pages
  const pages = [
    {
      title: "Trang chủ",
      slug: "",
      seoTitle: "Taxi Bắc Ninh - Đặt Xe 24/7, Xe Riêng 4-7-16 Chỗ, Giá Trọn Gói",
      seoDescription: "Dịch vụ taxi Bắc Ninh và xe du lịch chuyên nghiệp. Xe riêng 4/7/16 chỗ, đón tận nơi, giá trọn gói bao gồm phí cao tốc. Hỗ trợ hotline và Zalo 24/7: 0961 657 891.",
      uiBlocks: [
        heroBlock(
          "Taxi Bắc Ninh - Đặt Xe 24/7, Xe Riêng 4-7-16 Chỗ, Giá Trọn Gói",
          "Dịch vụ taxi Bắc Ninh và xe du lịch chuyên nghiệp. Đón tận nơi, giá trọn gói bao gồm phí cao tốc, hỗ trợ 24/7 qua hotline và Zalo 0961 657 891.",
          "Đặt Xe & Nhận Báo Giá",
          "/lien-he",
        ),
        featureListBlock("Tại Sao Chọn Taxi Bắc Ninh?", [
          { icon: "⚡", title: "Có mặt nhanh tại Bắc Ninh", description: "Tài xế kinh nghiệm, am hiểu tuyến đường, đến đúng giờ theo lịch hẹn." },
          { icon: "💰", title: "Giá minh bạch trước chuyến đi", description: "Báo giá trọn gói bao gồm phí cao tốc ngay khi tư vấn, không phát sinh thêm." },
          { icon: "📞", title: "Hỗ trợ hotline và Zalo 24/7", description: "Gọi hoặc nhắn Zalo 0961 657 891 bất cứ lúc nào, kể cả sáng sớm và đêm muộn." },
        ]),
        richTextBlock(`
          <h2 style="text-align:center;font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;">Các Tuyến Dịch Vụ</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">
            <div style="border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;">
              <h3 style="font-weight:600;font-size:1.1rem;margin-bottom:0.5rem;">🚖 Taxi Hà Nội ↔ Bắc Ninh</h3>
              <p style="color:#64748b;font-size:0.9rem;">Xe riêng đón tận nơi, không ghép khách, giá trọn gói từ 350.000đ. Phục vụ cá nhân, gia đình, công tác.</p>
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;">
              <h3 style="font-weight:600;font-size:1.1rem;margin-bottom:0.5rem;">✈️ Taxi Nội Bài ↔ Bắc Ninh</h3>
              <p style="color:#64748b;font-size:0.9rem;">Đón/trả sân bay Nội Bài, theo dõi lịch bay, hỗ trợ hành lý. Giá từ 390.000đ/chuyến.</p>
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;">
              <h3 style="font-weight:600;font-size:1.1rem;margin-bottom:0.5rem;">🗺️ Taxi Bắc Ninh Nội Tỉnh</h3>
              <p style="color:#64748b;font-size:0.9rem;">Phục vụ các tuyến nội tỉnh: Từ Sơn, Tiên Du, Yên Phong, Quế Võ. Liên hệ để nhận báo giá.</p>
            </div>
          </div>
        `),
        richTextBlock(`
          <h2 style="text-align:center;font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;">Bảng Giá Tham Khảo</h2>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:0.75rem 1rem;text-align:left;border-bottom:2px solid #e2e8f0;">Tuyến đường</th>
                  <th style="padding:0.75rem 1rem;text-align:center;border-bottom:2px solid #e2e8f0;">Xe 4 chỗ</th>
                  <th style="padding:0.75rem 1rem;text-align:center;border-bottom:2px solid #e2e8f0;">Xe 7 chỗ</th>
                  <th style="padding:0.75rem 1rem;text-align:center;border-bottom:2px solid #e2e8f0;">Xe 16 chỗ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;">Hà Nội ↔ Bắc Ninh</td>
                  <td style="padding:0.75rem 1rem;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600;color:#059669;">350.000đ</td>
                  <td style="padding:0.75rem 1rem;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600;color:#059669;">420.000đ</td>
                  <td style="padding:0.75rem 1rem;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600;color:#059669;">950.000đ</td>
                </tr>
                <tr>
                  <td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;">Nội Bài ↔ Bắc Ninh</td>
                  <td style="padding:0.75rem 1rem;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600;color:#059669;">390.000đ</td>
                  <td style="padding:0.75rem 1rem;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600;color:#059669;">450.000đ</td>
                  <td style="padding:0.75rem 1rem;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600;color:#059669;">1.000.000đ</td>
                </tr>
                <tr>
                  <td style="padding:0.75rem 1rem;">Bắc Ninh nội tỉnh & tỉnh khác</td>
                  <td style="padding:0.75rem 1rem;text-align:center;color:#64748b;" colspan="3">Liên hệ báo giá</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="color:#64748b;font-size:0.8rem;margin-top:0.75rem;text-align:center;">* Giá tham khảo, đã bao gồm phí cao tốc. Giá thực tế phụ thuộc điểm đón/trả cụ thể.</p>
        `),
        faqBlock("Câu Hỏi Thường Gặp", [
          { question: "Có nên đặt xe trước không?", answer: "Nên đặt trước, đặc biệt dịp cuối tuần, ngày lễ, giờ cao điểm hay chuyến bay sáng sớm/đêm muộn để đảm bảo có xe đúng giờ và loại xe phù hợp." },
          { question: "Giá được tính như thế nào?", answer: "Giá trọn gói được báo cụ thể khi tư vấn dựa trên điểm đón, điểm đến, loại xe. Giá đã bao gồm phí cao tốc, không phát sinh thêm nếu hành trình không thay đổi." },
          { question: "Có phục vụ chuyến sáng sớm và đêm muộn không?", answer: "Có. Dịch vụ hoạt động 24/7, kể cả chuyến 3-4 giờ sáng hay đêm muộn, đặc biệt phục vụ các chuyến bay." },
          { question: "Nên đặt xe trước bao lâu?", answer: "Đặt trước 2-4 giờ cho chuyến thường. Với chuyến sáng sớm, ngày lễ hay cần xe cụ thể, nên đặt trước 1 ngày." },
          { question: "Giá có bao gồm phí cao tốc không?", answer: "Có. Tất cả mức giá trọn gói đã bao gồm phí cao tốc theo tuyến. Không phát sinh thêm phí nếu hành trình không thay đổi." },
          { question: "Giá tuyến Nội Bài là bao nhiêu?", answer: "Tuyến Nội Bài – Bắc Ninh: xe 4 chỗ từ 390k, xe 7 chỗ từ 450k, xe 16 chỗ từ 1.000k. Giá đã bao gồm phí cao tốc." },
          { question: "Có xuất hóa đơn VAT không?", answer: "Liên hệ trực tiếp qua hotline để được tư vấn về nhu cầu xuất hóa đơn VAT." },
          { question: "Có thể đặt qua Zalo không?", answer: "Có. Nhắn tin qua Zalo số 0961 657 891 để đặt xe hoặc nhận báo giá nhanh." },
        ]),
        ctaBlock(
          "Đặt Xe Ngay - Nhận Báo Giá Trọn Gói",
          "Gọi hoặc nhắn Zalo 0961 657 891 để được tư vấn và báo giá nhanh chóng, miễn phí.",
          "Gọi 0961 657 891",
          "tel:0961657891",
        ),
        contactFormBlock(
          "Gửi Yêu Cầu Đặt Xe",
          "Điền thông tin chuyến đi để nhận báo giá trọn gói. Chúng tôi phản hồi trong vòng 15 phút.",
        ),
      ],
    },
    {
      title: "Dịch vụ",
      slug: "dich-vu",
      seoTitle: "Dịch Vụ Taxi Bắc Ninh - Hà Nội, Nội Bài, Nội Tỉnh",
      seoDescription: "Các dịch vụ taxi Bắc Ninh: Hà Nội ↔ Bắc Ninh, Nội Bài ↔ Bắc Ninh, nội tỉnh Bắc Ninh. Xe riêng 4/7/16 chỗ, giá trọn gói.",
      uiBlocks: [
        heroBlock(
          "Dịch Vụ Taxi Bắc Ninh",
          "Xe riêng 4/7/16 chỗ phục vụ các tuyến Hà Nội, Nội Bài và nội tỉnh Bắc Ninh. Giá trọn gói, đón tận nơi, hỗ trợ 24/7.",
          "Nhận Báo Giá Ngay",
          "/lien-he",
        ),
        featureListBlock("Các Tuyến Phổ Biến", [
          { icon: "🚖", title: "Taxi Hà Nội ↔ Bắc Ninh", description: "Xe riêng đón tận nơi tại Hà Nội, đưa thẳng đến Bắc Ninh. Giá từ 350.000đ, bao gồm phí cao tốc." },
          { icon: "✈️", title: "Taxi Nội Bài ↔ Bắc Ninh", description: "Đón/trả sân bay Nội Bài, theo dõi lịch bay, hỗ trợ hành lý. Giá từ 390.000đ." },
          { icon: "🗺️", title: "Taxi Bắc Ninh Nội Tỉnh", description: "Phục vụ các tuyến Từ Sơn, Tiên Du, Yên Phong, Quế Võ và liên tỉnh. Liên hệ báo giá." },
        ]),
        ctaBlock("Liên Hệ Để Nhận Báo Giá", "Hotline và Zalo 0961 657 891 · info@taxibacninh.vn", "Đặt Xe Ngay", "tel:0961657891"),
      ],
    },
    {
      title: "Bảng giá",
      slug: "bang-gia",
      seoTitle: "Bảng Giá Taxi Bắc Ninh 2026 - Giá Trọn Gói",
      seoDescription: "Bảng giá taxi Bắc Ninh 2026: Hà Nội từ 350k, Nội Bài từ 390k. Giá trọn gói bao gồm phí cao tốc, xe 4/7/16 chỗ.",
      uiBlocks: [
        heroBlock(
          "Bảng Giá Taxi Bắc Ninh 2026",
          "Giá tham khảo các tuyến phổ biến. Giá trọn gói đã bao gồm phí cao tốc, không phát sinh thêm.",
          "Liên Hệ Nhận Báo Giá",
          "/lien-he",
        ),
        richTextBlock(`
          <h2>Giá Tham Khảo Tuyến Hà Nội – Bắc Ninh</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
            <thead><tr style="background:#f8fafc;">
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid #e2e8f0;">Loại xe</th>
              <th style="padding:0.75rem;text-align:center;border-bottom:2px solid #e2e8f0;">Giá tham khảo</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid #e2e8f0;">Phù hợp cho</th>
            </tr></thead>
            <tbody>
              <tr><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Xe 4 chỗ</td><td style="padding:0.75rem;text-align:center;font-weight:700;color:#059669;border-bottom:1px solid #f1f5f9;">350.000đ/chuyến</td><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Cá nhân, công tác 1-2 người</td></tr>
              <tr><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Xe 7 chỗ</td><td style="padding:0.75rem;text-align:center;font-weight:700;color:#059669;border-bottom:1px solid #f1f5f9;">420.000đ/chuyến</td><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Gia đình, nhiều hành lý</td></tr>
              <tr><td style="padding:0.75rem;">Xe 16 chỗ</td><td style="padding:0.75rem;text-align:center;font-weight:700;color:#059669;">950.000đ/chuyến</td><td style="padding:0.75rem;">Đoàn lớn, công ty, du lịch</td></tr>
            </tbody>
          </table>
          <h2>Giá Tham Khảo Tuyến Nội Bài – Bắc Ninh</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
            <thead><tr style="background:#f8fafc;">
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid #e2e8f0;">Loại xe</th>
              <th style="padding:0.75rem;text-align:center;border-bottom:2px solid #e2e8f0;">Giá tham khảo</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid #e2e8f0;">Ghi chú</th>
            </tr></thead>
            <tbody>
              <tr><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Xe 4 chỗ</td><td style="padding:0.75rem;text-align:center;font-weight:700;color:#059669;border-bottom:1px solid #f1f5f9;">390.000đ/chuyến</td><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Đón/trả sân bay, theo dõi lịch bay</td></tr>
              <tr><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Xe 7 chỗ</td><td style="padding:0.75rem;text-align:center;font-weight:700;color:#059669;border-bottom:1px solid #f1f5f9;">450.000đ/chuyến</td><td style="padding:0.75rem;border-bottom:1px solid #f1f5f9;">Gia đình, nhiều hành lý sân bay</td></tr>
              <tr><td style="padding:0.75rem;">Xe 16 chỗ</td><td style="padding:0.75rem;text-align:center;font-weight:700;color:#059669;">1.000.000đ/chuyến</td><td style="padding:0.75rem;">Đoàn du lịch, nhóm lớn</td></tr>
            </tbody>
          </table>
          <p style="background:#fefce8;border:1px solid #fef08a;padding:1rem;border-radius:8px;font-size:0.875rem;color:#713f12;">
            <strong>Lưu ý:</strong> Giá trên là mức tham khảo cho điểm đón/trả trung tâm. Giá thực tế được xác nhận khi tư vấn dựa trên địa chỉ cụ thể. Tất cả mức giá đã bao gồm phí cao tốc.
          </p>
        `),
        ctaBlock("Nhận Báo Giá Chính Xác", "Cung cấp điểm đón, điểm đến và giờ đi để nhận báo giá trọn gói ngay.", "Gọi 0961 657 891", "tel:0961657891"),
      ],
    },
    {
      title: "Liên hệ",
      slug: "lien-he",
      seoTitle: "Liên Hệ Đặt Xe Taxi Bắc Ninh - 0961 657 891",
      seoDescription: "Liên hệ đặt xe taxi Bắc Ninh qua hotline 0961 657 891 hoặc Zalo. Hỗ trợ 24/7, báo giá nhanh trong 15 phút.",
      uiBlocks: [
        heroBlock(
          "Liên Hệ Đặt Xe",
          "Gọi hoặc nhắn Zalo 0961 657 891 để đặt xe và nhận báo giá trọn gói. Phản hồi trong 15 phút.",
          "Gọi Ngay 0961 657 891",
          "tel:0961657891",
        ),
        featureListBlock("Thông Tin Liên Hệ", [
          { icon: "📞", title: "Hotline / Zalo", description: "0961 657 891 · Hỗ trợ 24/7, kể cả sáng sớm và đêm muộn" },
          { icon: "📧", title: "Email", description: "info@taxibacninh.vn · Phản hồi trong giờ làm việc" },
          { icon: "🗺️", title: "Khu vực phục vụ", description: "Bắc Ninh, Từ Sơn, Tiên Du, Yên Phong, Quế Võ, Hà Nội, Nội Bài" },
        ]),
        contactFormBlock(
          "Gửi Yêu Cầu Đặt Xe",
          "Điền thông tin chuyến đi: điểm đón, điểm đến, giờ đi, loại xe. Chúng tôi sẽ báo giá trọn gói ngay.",
        ),
      ],
    },
  ];

  let pageCreated = 0;
  for (const p of pages) {
    const exists = await prisma.page.findFirst({ where: { tenantId, slug: p.slug } });
    if (!exists) {
      await prisma.page.create({
        data: {
          tenantId,
          title: p.title,
          slug: p.slug,
          status: "PUBLISHED",
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          uiBlocks: p.uiBlocks,
        },
      });
      pageCreated++;
      console.log(`✅ Tạo page: ${p.title} (/${p.slug})`);
    } else {
      console.log(`ℹ️  Page đã tồn tại: ${p.title}`);
    }
  }

  console.log(`\n🎉 Hoàn tất import Taxi Bắc Ninh!`);
  console.log(`   Tenant ID: ${tenantId}`);
  console.log(`   Posts: ${postCreated} bài viết`);
  console.log(`   Pages: ${pageCreated} trang`);
  console.log(`   Domain: taxibacninh.vn`);
  console.log(`\n✅ Vào admin để kiểm tra: /admin/sites`);
}

main()
  .catch((e) => { console.error("❌ Lỗi:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
