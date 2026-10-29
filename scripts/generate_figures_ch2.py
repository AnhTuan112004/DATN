import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Cấu hình font và hiển thị tiếng Việt
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.unicode_minus'] = False

OUTPUT_DIR = r'c:\K23CNT1\DANT\DATN\docs\report\images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. HÌNH 2.1: SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG PEOPLEINSIGHT AI
def generate_fig2_1_use_case_general():
    fig, ax = plt.subplots(figsize=(14, 10), dpi=300)
    ax.axis('off')

    # Nền tổng thể
    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    # Tiêu đề
    ax.text(0.5, 0.965, 'SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG PEOPLEINSIGHT AI', ha='center', va='center', fontsize=13, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.942, 'Ranh giới hệ thống: Phân định quyền hạn giữa 4 tác nhân nội bộ, Ứng viên tuyển dụng bên ngoài và Thiết bị Kiosk biên', ha='center', va='center', fontsize=8.8, fontstyle='italic', color='#334155')

    # Khung ranh giới hệ thống (System Boundary)
    boundary = patches.FancyBboxPatch((0.18, 0.04), 0.64, 0.88, boxstyle='round,pad=0.01', fc='#FFFFFF', ec='#3B82F6', lw=2, linestyle='--')
    ax.add_patch(boundary)
    ax.text(0.5, 0.905, '«Hệ thống Quản trị Nhân sự & AI PeopleInsight»', ha='center', va='center', fontsize=10.5, fontweight='bold', color='#1D4ED8')

    # Hàm vẽ Actor
    def draw_actor(x, y, name, color='#1E293B'):
        # Đầu
        circle = patches.Circle((x, y + 0.035), 0.018, fc='#E2E8F0', ec=color, lw=1.5)
        ax.add_patch(circle)
        # Thân
        ax.plot([x, x], [y + 0.017, y - 0.02], color=color, lw=1.8)
        # Tay
        ax.plot([x - 0.022, x + 0.022], [y + 0.005, y + 0.005], color=color, lw=1.8)
        # Chân
        ax.plot([x, x - 0.018], [y - 0.02, y - 0.055], color=color, lw=1.8)
        ax.plot([x, x + 0.018], [y - 0.02, y - 0.055], color=color, lw=1.8)
        # Tên
        ax.text(x, y - 0.075, name, ha='center', va='top', fontsize=8.5, fontweight='bold', color=color)

    # Vẽ 6 tác nhân (4 nội bộ, 1 bên ngoài, 1 thiết bị biên)
    draw_actor(0.08, 0.80, 'CEO / Ban Giám đốc\n(Admin Tối cao)', '#B91C1C')
    draw_actor(0.08, 0.52, 'HR Manager\n(Trưởng phòng Nhân sự)', '#C2410C')
    draw_actor(0.08, 0.22, 'Manager\n(Trưởng bộ phận)', '#047857')

    draw_actor(0.92, 0.76, 'Employee\n(Nhân viên thông thường)', '#1D4ED8')
    draw_actor(0.92, 0.46, 'Thiết bị Kiosk\n(Hệ thống biên)', '#475569')
    draw_actor(0.92, 0.16, 'Ứng viên / Khách\n(Candidate bên ngoài)', '#7C3AED')

    # Danh sách Use Case hình ellipse: (x, y, text, color)
    use_cases = [
        # Phân hệ CEO / HR
        (0.35, 0.84, 'UC01: Quản trị cấu hình công ty\n& Thiết lập chính sách 2026', '#FEF2F2', '#B91C1C'),
        (0.35, 0.74, 'UC02: Quản lý nhân sự, hợp đồng\n& Sơ đồ phòng ban 2 cấp', '#FEF2F2', '#B91C1C'),
        (0.35, 0.64, 'UC03: Tính toán & Khóa sổ\nkỳ lương tự động (Payroll 2026)', '#FFF7ED', '#C2410C'),
        (0.35, 0.54, 'UC04: Dự báo nguy cơ thôi việc\n(Machine Learning Retention)', '#FFF7ED', '#C2410C'),
        (0.35, 0.44, 'UC05: Sàng lọc hồ sơ ứng viên\n(AI ATS-lite CV Screening)', '#FFF7ED', '#C2410C'),

        # Phân hệ Duyệt đơn & Phân cấp
        (0.50, 0.34, 'UC06: Phê duyệt đơn từ 2 cấp\n(Manager → HR Manager)', '#F0FDF4', '#047857'),
        (0.50, 0.24, 'UC07: Tra cứu báo cáo phòng ban\n& Lịch sử chấm công cấp dưới', '#F0FDF4', '#047857'),
        (0.50, 0.12, 'UC14: Tra cứu tuyển dụng & Nộp CV\n(Cổng thông tin Landing Page)', '#F5F3FF', '#7C3AED'),

        # Phân hệ Employee / Kiosk
        (0.65, 0.78, 'UC08: Điểm danh khuôn mặt Kiosk\n(Liveness 2 tầng + Nonce 60s)', '#F8FAFC', '#334155'),
        (0.65, 0.66, 'UC09: Chấm công di động\n(GPS Geofencing / Dynamic QR)', '#EFF6FF', '#1D4ED8'),
        (0.65, 0.54, 'UC10: Nộp đơn từ trực tuyến\n(Phép, OT, WFH, Quên checkin)', '#EFF6FF', '#1D4ED8'),
        (0.65, 0.42, 'UC11: Tra cứu phiếu lương cá nhân\n& Số dư phép năm Điều 114', '#EFF6FF', '#1D4ED8'),
        (0.65, 0.28, 'UC12: Hỏi đáp trợ lý ảo HR Chatbot\n(Gemini Function Calling Phương án A)', '#EFF6FF', '#1D4ED8'),
        (0.65, 0.16, 'UC13: Đăng ký & Rút đồng ý FaceID\n(Tuân thủ Luật BVDLCN 2026)', '#EFF6FF', '#1D4ED8'),
    ]

    for (ux, uy, utext, ubg, uborder) in use_cases:
        ellipse = patches.FancyBboxPatch((ux - 0.12, uy - 0.035), 0.24, 0.07, boxstyle='round,pad=0.015', fc=ubg, ec=uborder, lw=1.2)
        ax.add_patch(ellipse)
        ax.text(ux, uy, utext, ha='center', va='center', fontsize=7.5, fontweight='bold', color=uborder)

    # Đường nối Actor -> Use Case
    def connect(x1, y1, x2, y2, color='#94A3B8'):
        ax.plot([x1, x2], [y1, y2], color=color, lw=1.1, linestyle='-')

    # CEO connect
    connect(0.12, 0.80, 0.23, 0.84, '#B91C1C')
    connect(0.12, 0.80, 0.23, 0.74, '#B91C1C')
    connect(0.12, 0.80, 0.23, 0.64, '#B91C1C')
    connect(0.12, 0.80, 0.23, 0.54, '#B91C1C')

    # HR connect
    connect(0.12, 0.52, 0.23, 0.74, '#C2410C')
    connect(0.12, 0.52, 0.23, 0.64, '#C2410C')
    connect(0.12, 0.52, 0.23, 0.54, '#C2410C')
    connect(0.12, 0.52, 0.23, 0.44, '#C2410C')
    connect(0.12, 0.52, 0.38, 0.34, '#C2410C')
    connect(0.12, 0.52, 0.38, 0.12, '#C2410C')

    # Manager connect
    connect(0.12, 0.22, 0.38, 0.34, '#047857')
    connect(0.12, 0.22, 0.38, 0.24, '#047857')

    # Employee connect
    connect(0.88, 0.76, 0.77, 0.78, '#1D4ED8')
    connect(0.88, 0.76, 0.77, 0.66, '#1D4ED8')
    connect(0.88, 0.76, 0.77, 0.54, '#1D4ED8')
    connect(0.88, 0.76, 0.77, 0.42, '#1D4ED8')
    connect(0.88, 0.76, 0.77, 0.28, '#1D4ED8')
    connect(0.88, 0.76, 0.77, 0.16, '#1D4ED8')

    # Kiosk connect
    connect(0.88, 0.46, 0.77, 0.78, '#475569')

    # Candidate connect
    connect(0.88, 0.16, 0.62, 0.12, '#7C3AED')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh2_1_use_case_tong_quat.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

# 2. HÌNH 2.2: BIỂU ĐỒ TUẦN TỰ ĐIỂM DANH KIOSK FACEID LIVENESS 2 TẦNG
def generate_fig2_7_sequence_faceid():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.axis('off')

    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    ax.text(0.5, 0.965, 'BIỂU ĐỒ TUẦN TỰ: QUY TRÌNH ĐIỂM DANH KIOSK FACEID LIVENESS 2 TẦNG', ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.938, 'Giao thức bảo mật: TLS 1.3, SHA-256 Kiosk Token, Nonce ngẫu nhiên TTL 60s, Xác thực 2 vector liên tục', ha='center', va='center', fontsize=8.5, fontstyle='italic', color='#334155')

    # 4 Lifeline columns: Nhân viên, Kiosk Frontend (Camera/MediaPipe), Backend API Service, Database MongoDB
    lifelines = [
        (0.12, 'Nhân viên\n(Bona Fide)'),
        (0.38, 'Kiosk Client\n(MediaPipe WebAssembly)'),
        (0.68, 'Backend Service\n(Kiosk / Challenge Controller)'),
        (0.88, 'Cơ sở dữ liệu\n(faceTemplates / attendance)')
    ]

    for (lx, ltitle) in lifelines:
        box = patches.FancyBboxPatch((lx - 0.08, 0.86), 0.16, 0.05, boxstyle='round,pad=0.008', fc='#1E3A8A', ec='#1E3A8A', lw=1)
        ax.add_patch(box)
        ax.text(lx, 0.885, ltitle, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#FFFFFF')
        ax.plot([lx, lx], [0.85, 0.06], color='#94A3B8', lw=1.2, linestyle='--')

    # Các thông điệp tuần tự (y từ 0.80 xuống 0.10)
    steps = [
        (0.80, 0.12, 0.38, '1. Đứng trước camera (Khoảng cách 0.5 - 1.2m)', '#1D4ED8', '->'),
        (0.74, 0.38, 0.68, '2. GET /api/kiosk/challenge (Header: x-kiosk-token)', '#0284C7', '->'),
        (0.68, 0.68, 0.68, '3. Kiểm tra token hash SHA-256 trong company.settings', '#475569', 'self'),
        (0.63, 0.68, 0.38, '4. Trả về Nonce 1 lần (TTL 60s) + Thử thách ("CHỚP MẮT")', '#059669', '-->'),
        (0.57, 0.38, 0.12, '5. Hiển thị UI radar: "Vui lòng chớp mắt trong 5s"', '#D97706', '-->'),
        (0.51, 0.12, 0.38, '6. Thực hiện hành vi sinh lý học (EAR: 0.35 -> 0.12 -> 0.32)', '#1D4ED8', '->'),
        (0.45, 0.38, 0.38, '7. Bắt buộc numFaces == 1; Chụp V_start và V_end (128D)', '#B91C1C', 'self'),
        (0.39, 0.38, 0.68, '8. POST /api/kiosk/verify (nonce, V_start, V_end, challenge)', '#0284C7', '->'),
        (0.33, 0.68, 0.68, '9. Tiêu hủy Nonce ngay lập tức (Chống Replay Attack)', '#B91C1C', 'self'),
        (0.28, 0.68, 0.68, '10. Kiểm tra tính liên tục: d_E(V_start, V_end) <= 0.40', '#475569', 'self'),
        (0.22, 0.68, 0.88, '11. Giải mã AES-256 faceTemplates, so khớp 1:N (d1 <= 0.60 & d2-d1 >= 0.15)', '#4F46E5', '->'),
        (0.16, 0.88, 0.68, '12. Ghi nhận nhật ký chấm công vào attendanceLogs (METHOD: FACE)', '#059669', '-->'),
        (0.10, 0.68, 0.38, '13. Trả về HTTP 200: "Điểm danh thành công: NV0005 - 08:02 AM"', '#059669', '-->'),
    ]

    for (sy, x1, x2, text, color, arrow_type) in steps:
        if arrow_type == 'self':
            # Vòng tự gọi
            arc = patches.Arc((x1 + 0.03, sy), 0.05, 0.03, angle=0, theta1=270, theta2=90, color=color, lw=1.4)
            ax.add_patch(arc)
            ax.annotate("", xy=(x1, sy - 0.015), xytext=(x1 + 0.03, sy - 0.015), arrowprops=dict(arrowstyle="->", color=color, lw=1.4))
            ax.text(x1 + 0.065, sy, text, ha='left', va='center', fontsize=7.4, fontweight='bold', color=color)
        else:
            style = "->" if arrow_type == '->' else "->"
            lstyle = '-' if arrow_type == '->' else '--'
            ax.annotate("", xy=(x2, sy), xytext=(x1, sy), arrowprops=dict(arrowstyle="->", color=color, lw=1.4, linestyle=lstyle))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, sy + 0.015, text, ha='center', va='bottom', fontsize=7.4, fontweight='bold', color=color)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh2_7_sequence_faceid.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

# 3. HÌNH 2.8: BIỂU ĐỒ TUẦN TỰ TÍNH LƯƠNG & CHỐT SỔ KỲ LƯƠNG NGUYÊN TỬ
def generate_fig2_8_sequence_payroll():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.axis('off')

    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    ax.text(0.5, 0.965, 'BIỂU ĐỒ TUẦN TỰ: QUY TRÌNH TÍNH TOÁN & KHÓA SỔ BẢNG LƯƠNG NGUYÊN TỬ (PAYROLL 2026)', ha='center', va='center', fontsize=11.5, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.938, 'Áp dụng quy trình 3 bước, tra cứu 2 mốc chính sách 2026, Transaction khóa kỳ chống sửa dữ liệu nguồn', ha='center', va='center', fontsize=8.5, fontstyle='italic', color='#334155')

    lifelines = [
        (0.12, 'Trưởng phòng HR\n(HR_MANAGER)'),
        (0.38, 'Payroll Controller\n(REST API Express)'),
        (0.68, 'Payroll Calculation Engine\n(calc.js / Pure Function)'),
        (0.88, 'Cơ sở dữ liệu\n(payrolls / users / logs)')
    ]

    for (lx, ltitle) in lifelines:
        box = patches.FancyBboxPatch((lx - 0.08, 0.86), 0.16, 0.05, boxstyle='round,pad=0.008', fc='#4F46E5', ec='#4F46E5', lw=1)
        ax.add_patch(box)
        ax.text(lx, 0.885, ltitle, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#FFFFFF')
        ax.plot([lx, lx], [0.85, 0.06], color='#94A3B8', lw=1.2, linestyle='--')

    steps = [
        (0.80, 0.12, 0.38, '1. Yêu cầu tính thử kỳ lương: POST /api/payrolls/calculate (period: "2026-10")', '#4F46E5', '->'),
        (0.74, 0.38, 0.88, '2. Kiểm tra periodLockedAt; Trích xuất công, OT, đơn phép & cấu hình lương', '#0284C7', '->'),
        (0.68, 0.88, 0.38, '3. Trả về dữ liệu nguồn của 50 nhân sự trong kỳ công', '#059669', '-->'),
        (0.62, 0.38, 0.68, '4. Truyền tham số chính sách (trần BHXH 50.6M, giảm trừ 15.5M/6.2M)', '#0284C7', '->'),
        (0.56, 0.68, 0.68, '5. [Bước 1] Tính Tổng thu nhập Gross (Lương ngày công, phụ cấp, OT, ăn ca)', '#D97706', 'self'),
        (0.50, 0.68, 0.68, '6. [Bước 2] Miễn thuế toàn bộ tiền OT luật định (<=4h/ngày, <=40h/tháng)', '#059669', 'self'),
        (0.44, 0.68, 0.68, '7. [Bước 3] Tính bảo hiểm 10.5% + Áp biểu thuế TNCN 5 bậc mới', '#4F46E5', 'self'),
        (0.38, 0.68, 0.38, '8. Trả về bảng lương chi tiết (Lương Net, Thuế TNCN, Bảo hiểm)', '#059669', '-->'),
        (0.32, 0.38, 0.12, '9. Hiển thị bảng lương cho HR rà soát đối chiếu', '#1E3A8A', '-->'),
        (0.26, 0.12, 0.38, '10. HR xác nhận chốt sổ: POST /api/payrolls/lock (period: "2026-10")', '#B91C1C', '->'),
        (0.20, 0.38, 0.88, '11. Mở MongoDB Session Transaction: Lưu Snapshot tham số & periodLockedAt', '#B91C1C', '->'),
        (0.14, 0.88, 0.88, '12. Tạo index unique {companyId, userId, period}, chặn sửa kỳ đã khóa', '#475569', 'self'),
        (0.08, 0.38, 0.12, '13. Thông báo chốt kỳ thành công & Tự động gửi thông báo phiếu lương', '#059669', '-->'),
    ]

    for (sy, x1, x2, text, color, arrow_type) in steps:
        if arrow_type == 'self':
            arc = patches.Arc((x1 + 0.03, sy), 0.05, 0.03, angle=0, theta1=270, theta2=90, color=color, lw=1.4)
            ax.add_patch(arc)
            ax.annotate("", xy=(x1, sy - 0.015), xytext=(x1 + 0.03, sy - 0.015), arrowprops=dict(arrowstyle="->", color=color, lw=1.4))
            ax.text(x1 + 0.065, sy, text, ha='left', va='center', fontsize=7.4, fontweight='bold', color=color)
        else:
            lstyle = '-' if arrow_type == '->' else '--'
            ax.annotate("", xy=(x2, sy), xytext=(x1, sy), arrowprops=dict(arrowstyle="->", color=color, lw=1.4, linestyle=lstyle))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, sy + 0.015, text, ha='center', va='bottom', fontsize=7.4, fontweight='bold', color=color)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh2_8_sequence_payroll.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

# 4. HÌNH 2.9: BIỂU ĐỒ TUẦN TỰ XỬ LÝ CHATBOT AI PHƯƠNG ÁN A
def generate_fig2_9_sequence_chatbot():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.axis('off')

    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    ax.text(0.5, 0.965, 'BIỂU ĐỒ TUẦN TỰ: XỬ LÝ TRỢ LÝ ẢO HR AI PHƯƠNG ÁN A (TEMPLATE RENDERING)', ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.938, 'Quy tắc vàng: Ngắt luồng LLM tuyệt đối sau functionCall, cấm đưa dữ liệu tài chính/lương ngược lại cho AI', ha='center', va='center', fontsize=8.5, fontstyle='italic', color='#334155')

    lifelines = [
        (0.12, 'Nhân viên\n(Client Web)'),
        (0.38, 'Backend AI Router\n(RBAC / Limiter)'),
        (0.68, 'Google Gemini 3.x\n(Function Calling ANY)'),
        (0.88, 'Cơ sở dữ liệu & Template\n(Internal DB / Markdown)')
    ]

    for (lx, ltitle) in lifelines:
        box = patches.FancyBboxPatch((lx - 0.08, 0.86), 0.16, 0.05, boxstyle='round,pad=0.008', fc='#059669', ec='#059669', lw=1)
        ax.add_patch(box)
        ax.text(lx, 0.885, ltitle, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#FFFFFF')
        ax.plot([lx, lx], [0.85, 0.06], color='#94A3B8', lw=1.2, linestyle='--')

    steps = [
        (0.80, 0.12, 0.38, '1. Gửi tin nhắn: POST /api/ai/chat {"message": "Xem phiếu lương tháng 10 của tôi"}', '#1D4ED8', '->'),
        (0.74, 0.38, 0.38, '2. Xác thực JWT, lấy userId/companyId; Lọc tool theo Role (RBAC Pre-filtering)', '#475569', 'self'),
        (0.68, 0.38, 0.68, '3. Gửi prompt + Schema 4 tools P0 (Chế độ mode: "ANY", cấm tham số userId)', '#0284C7', '->'),
        (0.62, 0.68, 0.38, '4. Gemini trả về: functionCall: get_payslip({ year: 2026, month: 10 })', '#059669', '-->'),
        (0.56, 0.38, 0.38, '5. [DỪNG LUỒNG LLM] Ngắt kết nối Gemini ngay lập tức, không gửi PII', '#B91C1C', 'self'),
        (0.50, 0.38, 0.88, '6. Kiểm tra quyền sở hữu IDOR; Truy vấn bảng lương đã khóa từ payrolls', '#4F46E5', '->'),
        (0.44, 0.88, 0.38, '7. Trả về số liệu lương nội bộ (Gross: 25M, BH: 2.62M, Thuế: 487K, Net: 21.88M)', '#059669', '-->'),
        (0.38, 0.38, 0.38, '8. Đổ dữ liệu vào Template Markdown 2 khối tĩnh (Net & Tham chiếu TNCN)', '#D97706', 'self'),
        (0.32, 0.38, 0.88, '9. Ghi vết kiểm toán auditLogs (action: "AI_CHATBOT_CALL", latencyMs: 18ms)', '#475569', '->'),
        (0.24, 0.38, 0.12, '10. Trả về Markdown cho client (DOMPurify làm sạch chống XSS)', '#059669', '-->'),
    ]

    for (sy, x1, x2, text, color, arrow_type) in steps:
        if arrow_type == 'self':
            arc = patches.Arc((x1 + 0.03, sy), 0.05, 0.03, angle=0, theta1=270, theta2=90, color=color, lw=1.4)
            ax.add_patch(arc)
            ax.annotate("", xy=(x1, sy - 0.015), xytext=(x1 + 0.03, sy - 0.015), arrowprops=dict(arrowstyle="->", color=color, lw=1.4))
            ax.text(x1 + 0.065, sy, text, ha='left', va='center', fontsize=7.4, fontweight='bold', color=color)
        else:
            lstyle = '-' if arrow_type == '->' else '--'
            ax.annotate("", xy=(x2, sy), xytext=(x1, sy), arrowprops=dict(arrowstyle="->", color=color, lw=1.4, linestyle=lstyle))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, sy + 0.015, text, ha='center', va='bottom', fontsize=7.4, fontweight='bold', color=color)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh2_9_sequence_chatbot.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

# 5. HÌNH 2.10: BIỂU ĐỒ HOẠT ĐỘNG PHÊ DUYỆT ĐƠN TỪ 2 CẤP
def generate_fig2_10_activity_leave():
    fig, ax = plt.subplots(figsize=(12, 9), dpi=300)
    ax.axis('off')

    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    ax.text(0.5, 0.965, 'BIỂU ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM): LUỒNG PHÊ DUYỆT ĐƠN TỪ 2 CẤP & TRỪ PHÉP NGUYÊN TỬ', ha='center', va='center', fontsize=11.5, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.940, 'Quy trình: Nhân viên nộp đơn -> Trưởng bộ phận duyệt sơ bộ -> HR Manager duyệt chung cuộc -> Trừ phép Idempotent', ha='center', va='center', fontsize=8.3, fontstyle='italic', color='#334155')

    # 3 Làn bơi (Swimlanes): Nhân viên (0.05 - 0.35), Trưởng bộ phận (0.35 - 0.65), Trưởng phòng HR (0.65 - 0.95)
    lanes = [
        (0.05, 0.35, 'NHÂN VIÊN (EMPLOYEE)', '#EFF6FF', '#1D4ED8'),
        (0.35, 0.65, 'TRƯỞNG BỘ PHẬN (MANAGER)', '#F0FDF4', '#047857'),
        (0.65, 0.95, 'TRƯỞNG PHÒNG NHÂN SỰ (HR_MANAGER)', '#FFF7ED', '#C2410C')
    ]

    for (x1, x2, title, lane_bg, lane_color) in lanes:
        w = x2 - x1
        rect = patches.Rectangle((x1, 0.04), w, 0.88, fc=lane_bg, ec='#CBD5E1', lw=1)
        ax.add_patch(rect)
        hdr = patches.Rectangle((x1, 0.88), w, 0.04, fc=lane_color, ec=lane_color, lw=1)
        ax.add_patch(hdr)
        ax.text((x1 + x2)/2, 0.90, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#FFFFFF')

    # Node bắt đầu
    start_c = patches.Circle((0.20, 0.84), 0.015, fc='#0F172A', ec='#0F172A')
    ax.add_patch(start_c)

    def draw_action(x, y, w, h, text, fc='#FFFFFF', ec='#334155'):
        node = patches.FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle='round,pad=0.01', fc=fc, ec=ec, lw=1.2)
        ax.add_patch(node)
        ax.text(x, y, text, ha='center', va='center', fontsize=7.4, fontweight='bold', color='#0F172A')

    def draw_diamond(x, y, text):
        poly = patches.Polygon([[x, y + 0.03], [x + 0.04, y], [x, y - 0.03], [x - 0.04, y]], fc='#FEF3C7', ec='#D97706', lw=1.2)
        ax.add_patch(poly)
        ax.text(x, y, text, ha='center', va='center', fontsize=7.0, fontweight='bold', color='#92400E')

    # Các bước
    draw_action(0.20, 0.76, 0.22, 0.05, '1. Chọn loại đơn (ANNUAL, SICK, OT)\nKiểm tra số dư phép khả dụng')
    draw_action(0.20, 0.67, 0.22, 0.05, '2. Nhập khoảng thời gian, lý do\nChặn trần OT <= 4h/ngày, 40h/tháng')
    draw_action(0.20, 0.58, 0.22, 0.04, '3. Tạo bản ghi trạng thái PENDING_MGR')

    # Sang Manager
    draw_action(0.50, 0.58, 0.22, 0.04, '4. Nhận thông báo Socket.io\nXem xét công việc phòng ban')
    draw_diamond(0.50, 0.48, 'Duyệt?')

    # Reject ở Manager
    draw_action(0.50, 0.38, 0.18, 0.04, 'Từ chối (REJECTED)\nNhập lý do từ chối', '#FEE2E2', '#EF4444')

    # Phê duyệt ở Manager -> Sang HR
    draw_action(0.80, 0.48, 0.22, 0.04, '5. Cập nhật PENDING_HR\nChuyển hồ sơ lên HR')
    draw_diamond(0.80, 0.38, 'HR duyệt?')

    # Reject ở HR
    draw_action(0.80, 0.28, 0.18, 0.04, 'Từ chối (REJECTED)\nGửi thông báo phản hồi', '#FEE2E2', '#EF4444')

    # Phê duyệt ở HR -> Trừ phép nguyên tử
    draw_action(0.80, 0.18, 0.22, 0.05, '6. MongoDB Transaction:\nCập nhật APPROVED & Trừ $inc phép', '#DCFCE7', '#16A34A')

    # Kết thúc
    draw_action(0.20, 0.18, 0.22, 0.04, '7. Nhận thông báo đã duyệt\nCập nhật số dư phép cá nhân', '#EFF6FF', '#2563EB')
    end_c1 = patches.Circle((0.20, 0.08), 0.016, fc='#FFFFFF', ec='#0F172A', lw=1.5)
    end_c2 = patches.Circle((0.20, 0.08), 0.010, fc='#0F172A', ec='#0F172A')
    ax.add_patch(end_c1)
    ax.add_patch(end_c2)

    # Đường mũi tên
    def connect(x1, y1, x2, y2, label=""):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))
        if label:
            ax.text((x1+x2)/2 + 0.01, (y1+y2)/2, label, fontsize=7.2, fontweight='bold', color='#B91C1C')

    connect(0.20, 0.825, 0.20, 0.785)
    connect(0.20, 0.735, 0.20, 0.69)
    connect(0.20, 0.645, 0.20, 0.60)
    connect(0.31, 0.58, 0.39, 0.58)
    connect(0.50, 0.56, 0.50, 0.51)
    connect(0.50, 0.45, 0.50, 0.40, 'Không')
    connect(0.54, 0.48, 0.69, 0.48, 'Đồng ý')
    connect(0.80, 0.46, 0.80, 0.41)
    connect(0.80, 0.35, 0.80, 0.30, 'Không')
    connect(0.80, 0.35, 0.80, 0.205, 'Đồng ý')
    connect(0.69, 0.18, 0.31, 0.18)
    connect(0.20, 0.16, 0.20, 0.096)

    # Nối reject về kết thúc
    ax.plot([0.50, 0.50, 0.31], [0.36, 0.08, 0.08], color='#EF4444', lw=1.0, linestyle=':')
    ax.plot([0.80, 0.80, 0.31], [0.26, 0.08, 0.08], color='#EF4444', lw=1.0, linestyle=':')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh2_10_activity_leave.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

# 6. HÌNH 2.11: BIỂU ĐỒ HOẠT ĐỘNG SUY LUẬN & DỰ BÁO NGUY CƠ THÔI VIỆC ML
def generate_fig2_11_activity_attrition():
    fig, ax = plt.subplots(figsize=(12, 8.5), dpi=300)
    ax.axis('off')

    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    ax.text(0.5, 0.965, 'BIỂU ĐỒ HOẠT ĐỘNG: QUY TRÌNH SUY LUẬN & DỰ BÁO NGUY CƠ THÔI VIỆC MACHINE LEARNING', ha='center', va='center', fontsize=11.5, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.940, 'Mô hình Logistic Regression AUC 71.60%, giải thích XAI, phân loại rủi ro 3 mức & đề xuất can thiệp cho HR', ha='center', va='center', fontsize=8.3, fontstyle='italic', color='#334155')

    def draw_act(x, y, w, h, text, fc='#FFFFFF', ec='#1E3A8A'):
        box = patches.FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle='round,pad=0.01', fc=fc, ec=ec, lw=1.2)
        ax.add_patch(box)
        ax.text(x, y, text, ha='center', va='center', fontsize=7.6, fontweight='bold', color='#0F172A')

    # Luồng dọc
    start_c = patches.Circle((0.5, 0.88), 0.015, fc='#0F172A', ec='#0F172A')
    ax.add_patch(start_c)

    draw_act(0.5, 0.80, 0.62, 0.05, '1. Kích hoạt suy luận: HR truy cập Dashboard hoặc Cron quét đầu tháng')
    draw_act(0.5, 0.70, 0.62, 0.06, '2. Trích xuất đúng 6 đặc trưng khách quan từ MongoDB:\nOverTime, YearsAtCompany, TotalYears, Income, Companies, Distance')
    draw_act(0.5, 0.59, 0.62, 0.05, '3. Chuẩn hóa Min-Max các biến liên tục về đoạn [0, 1]; Gán nhãn nhị phân OT')
    draw_act(0.5, 0.48, 0.62, 0.06, '4. Tính toán hàm Sigmoid với trọng số tối ưu:\nz = -0.3050 + 1.4579*OT + 0.0931*YearsCo - 1.9705*TotalYears - 1.3173*Income...')
    draw_act(0.5, 0.37, 0.62, 0.05, '5. Bóc tách XAI: Tính Log-Odds Contribution (C_i = beta_i * x_i) xác định Top 3 rủi ro')

    # Phân loại rủi ro 3 nhánh
    draw_act(0.20, 0.24, 0.26, 0.06, 'Mức THẤP (P < 0.30)\nNhân sự gắn bó ổn định', '#DCFCE7', '#16A34A')
    draw_act(0.50, 0.24, 0.26, 0.06, 'Mức TRUNG BÌNH (0.30 <= P < 0.50)\nCần theo dõi khối lượng việc', '#FEF3C7', '#D97706')
    draw_act(0.80, 0.24, 0.26, 0.06, 'Mức CAO (P >= 0.50)\nCảnh báo khẩn cấp: nguy cơ nghỉ', '#FEE2E2', '#EF4444')

    draw_act(0.5, 0.12, 0.62, 0.05, '6. Đưa ra khuyến nghị can thiệp hành động cho HR (Điều phối OT, điều chỉnh đãi ngộ)')

    end_c1 = patches.Circle((0.5, 0.05), 0.016, fc='#FFFFFF', ec='#0F172A', lw=1.5)
    end_c2 = patches.Circle((0.5, 0.05), 0.010, fc='#0F172A', ec='#0F172A')
    ax.add_patch(end_c1)
    ax.add_patch(end_c2)

    def connect(x1, y1, x2, y2):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))

    connect(0.5, 0.865, 0.5, 0.825)
    connect(0.5, 0.775, 0.5, 0.73)
    connect(0.5, 0.67, 0.5, 0.615)
    connect(0.5, 0.565, 0.5, 0.51)
    connect(0.5, 0.45, 0.5, 0.395)

    # Từ bước 5 rẽ 3 nhánh
    ax.plot([0.5, 0.20, 0.20], [0.345, 0.345, 0.27], color='#334155', lw=1.2)
    ax.plot([0.5, 0.50], [0.345, 0.27], color='#334155', lw=1.2)
    ax.plot([0.5, 0.80, 0.80], [0.345, 0.345, 0.27], color='#334155', lw=1.2)
    ax.annotate("", xy=(0.20, 0.27), xytext=(0.20, 0.28), arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))
    ax.annotate("", xy=(0.50, 0.27), xytext=(0.50, 0.28), arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))
    ax.annotate("", xy=(0.80, 0.27), xytext=(0.80, 0.28), arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))

    # Từ 3 nhánh về bước 6
    ax.plot([0.20, 0.20, 0.5], [0.21, 0.17, 0.17], color='#334155', lw=1.2)
    ax.plot([0.50, 0.50], [0.21, 0.17], color='#334155', lw=1.2)
    ax.plot([0.80, 0.80, 0.5], [0.21, 0.17, 0.17], color='#334155', lw=1.2)
    ax.annotate("", xy=(0.5, 0.145), xytext=(0.5, 0.17), arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))

    connect(0.5, 0.095, 0.5, 0.066)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh2_11_activity_attrition.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

def main():
    generate_fig2_1_use_case_general()
    generate_fig2_7_sequence_faceid()
    generate_fig2_8_sequence_payroll()
    generate_fig2_9_sequence_chatbot()
    generate_fig2_10_activity_leave()
    generate_fig2_11_activity_attrition()
    print("ALL CHAPTER 2 FIGURES GENERATED SUCCESSFULLY!")

if __name__ == '__main__':
    main()

