import { COMPANY } from "./site";
import { PublicLayout } from "./public-layout";

type LegalSection = { title: string; body: string[] };
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return <PublicLayout><article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Legal</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{title}</h1><p className="mt-4 text-slate-600">Cập nhật lần cuối: {updated}</p><div className="mt-10 space-y-8">{sections.map((section) => <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-950">{section.title}</h2>{section.body.map((p) => <p key={p} className="mt-3 leading-7 text-slate-600">{p}</p>)}</section>)}</div><div className="mt-10 rounded-3xl bg-slate-50 p-6 text-sm leading-6 text-slate-600">Liên hệ về pháp lý và dữ liệu: <a className="font-semibold text-indigo-700" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> · {COMPANY.company}</div></article></PublicLayout>;
}

export const privacySections: LegalSection[] = [
  { title: "1. Phạm vi áp dụng", body: ["Chính sách này áp dụng cho website gfvgo.com và nền tảng GFVGO Growth Platform do CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ 30 NICE vận hành.", "Nền tảng phục vụ quản lý website, nội dung, SEO, social media, Facebook Pages và dữ liệu vận hành marketing cho doanh nghiệp."] },
  { title: "2. Dữ liệu chúng tôi xử lý", body: ["Chúng tôi có thể xử lý thông tin tài khoản, thông tin liên hệ, nội dung do người dùng tạo, dữ liệu cấu hình website/social, dữ liệu tương tác, log kỹ thuật và dữ liệu cần thiết để vận hành dịch vụ.", "Nếu người dùng kết nối Facebook Page, hệ thống có thể xử lý Page ID, tên Page, quyền truy cập được Facebook cấp, lịch đăng bài, nội dung bài viết, bình luận và chỉ số hiệu suất theo phạm vi quyền được phê duyệt."] },
  { title: "3. Mục đích sử dụng", body: ["Dữ liệu được dùng để cung cấp dịch vụ, xác thực người dùng, vận hành tính năng CMS/social/SEO, hỗ trợ khách hàng, cải thiện hệ thống, đảm bảo an toàn và tuân thủ yêu cầu pháp lý."] },
  { title: "4. Chia sẻ dữ liệu", body: ["Chúng tôi không bán dữ liệu cá nhân. Dữ liệu có thể được chia sẻ với nhà cung cấp hạ tầng, dịch vụ phân tích hoặc nền tảng tích hợp khi cần để vận hành dịch vụ và theo cấu hình của người dùng.", "Dữ liệu liên quan Facebook/Meta chỉ được sử dụng theo chính sách nền tảng Meta và quyền mà người dùng đã cấp."] },
  { title: "5. Lưu trữ và bảo mật", body: ["Chúng tôi áp dụng biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ dữ liệu, bao gồm kiểm soát truy cập, mã hóa token nhạy cảm khi phù hợp, log vận hành và phân quyền hệ thống.", "Không có hệ thống nào an toàn tuyệt đối; chúng tôi khuyến nghị người dùng bảo mật tài khoản và thông tin đăng nhập của mình."] },
  { title: "6. Quyền của người dùng", body: ["Người dùng có thể yêu cầu truy cập, chỉnh sửa, xuất hoặc xóa dữ liệu theo phạm vi pháp luật áp dụng và nghĩa vụ lưu trữ hợp lệ.", "Yêu cầu xóa dữ liệu có thể gửi qua trang /xoa-du-lieu hoặc email liên hệ."] },
];

export const termsSections: LegalSection[] = [
  { title: "1. Chấp nhận điều khoản", body: ["Bằng việc truy cập hoặc sử dụng GFVGO Growth Platform, người dùng đồng ý tuân thủ các điều khoản này và các chính sách liên quan."] },
  { title: "2. Mô tả dịch vụ", body: ["GFVGO Growth Platform là nền tảng quản lý website, CMS, SEO, social media, AI content assistance, publishing workflow và analytics cho doanh nghiệp.", "Một số tính năng có thể đang ở giai đoạn thử nghiệm, giới hạn theo tài khoản hoặc phụ thuộc cấu hình tích hợp bên thứ ba."] },
  { title: "3. Trách nhiệm người dùng", body: ["Người dùng chịu trách nhiệm về nội dung tạo, nhập, xuất bản hoặc đồng bộ qua hệ thống; phải đảm bảo nội dung không vi phạm pháp luật, bản quyền, quyền riêng tư hoặc chính sách nền tảng bên thứ ba.", "Người dùng không được lạm dụng hệ thống để spam, phát tán mã độc, truy cập trái phép hoặc gây ảnh hưởng tới hạ tầng."] },
  { title: "4. Tích hợp bên thứ ba", body: ["Các tích hợp như Meta/Facebook hoạt động theo quyền do người dùng cấp và chính sách của nhà cung cấp tương ứng. Nhà cung cấp bên thứ ba có thể thay đổi API, quyền hoặc điều kiện sử dụng."] },
  { title: "5. Giới hạn trách nhiệm", body: ["Dịch vụ được cung cấp theo hiện trạng phù hợp phạm vi hợp đồng/thỏa thuận. Chúng tôi không cam kết kết quả SEO, doanh thu hoặc hiệu suất social cụ thể."] },
  { title: "6. Chấm dứt và thay đổi", body: ["Chúng tôi có thể cập nhật điều khoản khi cần thiết. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa với việc chấp nhận phiên bản mới."] },
];

export const deletionSections: LegalSection[] = [
  { title: "1. Cách yêu cầu xóa dữ liệu", body: ["Người dùng có thể yêu cầu xóa dữ liệu bằng cách gửi email tới địa chỉ liên hệ hoặc sử dụng biểu mẫu liên hệ trên website với tiêu đề 'Yêu cầu xóa dữ liệu GFVGO'.", "Vui lòng cung cấp email tài khoản, tên doanh nghiệp và mô tả dữ liệu cần xóa để chúng tôi xác minh."] },
  { title: "2. Dữ liệu Facebook/Meta", body: ["Nếu bạn đã kết nối Facebook Page, bạn có thể ngắt kết nối ứng dụng trong phần cài đặt tài khoản Facebook/Meta hoặc yêu cầu chúng tôi xóa token/kết nối liên quan trong hệ thống.", "Sau khi xác minh, chúng tôi sẽ xóa hoặc vô hiệu hóa dữ liệu kết nối theo phạm vi yêu cầu hợp lệ."] },
  { title: "3. Thời gian xử lý", body: ["Yêu cầu hợp lệ thường được xử lý trong thời gian hợp lý sau khi xác minh danh tính và quyền đại diện. Một số dữ liệu có thể được giữ lại nếu cần cho bảo mật, pháp lý, sao lưu hoặc nghĩa vụ kế toán/hợp đồng."] },
  { title: "4. Liên hệ", body: [`Email: ${COMPANY.email}. Công ty vận hành: ${COMPANY.company}.`] },
];
