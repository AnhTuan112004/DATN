import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.unicode_minus'] = False

OUTPUT_DIR = r'c:\K23CNT1\DANT\DATN\docs\report\images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def draw_actor(ax, x, y, name, color='#1E293B'):
    circle = patches.Circle((x, y + 0.04), 0.022, fc='#E2E8F0', ec=color, lw=1.5)
    ax.add_patch(circle)
    ax.plot([x, x], [y + 0.018, y - 0.025], color=color, lw=1.8)
    ax.plot([x - 0.025, x + 0.025], [y + 0.005, y + 0.005], color=color, lw=1.8)
    ax.plot([x, x - 0.02], [y - 0.025, y - 0.065], color=color, lw=1.8)
    ax.plot([x, x + 0.02], [y - 0.025, y - 0.065], color=color, lw=1.8)
    ax.text(x, y - 0.09, name, ha='center', va='top', fontsize=8.5, fontweight='bold', color=color)

def draw_usecase_diagram(filename, title, subtitle, actor_left, actor_right, ucs, includes, extends):
    fig, ax = plt.subplots(figsize=(11, 6.5), dpi=300)
    ax.axis('off')

    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    ax.text(0.5, 0.95, title, ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.915, subtitle, ha='center', va='center', fontsize=8.2, fontstyle='italic', color='#334155')

    # Boundary
    boundary = patches.FancyBboxPatch((0.22, 0.06), 0.56, 0.82, boxstyle='round,pad=0.01', fc='#FFFFFF', ec='#3B82F6', lw=1.5, linestyle='--')
    ax.add_patch(boundary)

    if actor_left:
        draw_actor(ax, 0.11, actor_left[0], actor_left[1], actor_left[2])
    if actor_right:
        draw_actor(ax, 0.89, actor_right[0], actor_right[1], actor_right[2])

    # Draw UCs
    pos_map = {}
    for (code, name, x, y, fc, ec) in ucs:
        box = patches.FancyBboxPatch((x - 0.13, y - 0.04), 0.26, 0.08, boxstyle='round,pad=0.01', fc=fc, ec=ec, lw=1.2)
        ax.add_patch(box)
        ax.text(x, y, f"{code}\n{name}", ha='center', va='center', fontsize=7.6, fontweight='bold', color=ec)
        pos_map[code] = (x, y)

    # Actor lines
    if actor_left:
        for target in actor_left[3]:
            tx, ty = pos_map[target]
            ax.plot([0.15, tx - 0.13], [actor_left[0], ty], color='#64748B', lw=1.2)
    if actor_right:
        for target in actor_right[3]:
            tx, ty = pos_map[target]
            ax.plot([0.85, tx + 0.13], [actor_right[0], ty], color='#64748B', lw=1.2)

    # <<include>>
    for (src, dst) in includes:
        sx, sy = pos_map[src]
        dx, dy = pos_map[dst]
        ax.annotate("", xy=(dx, dy + 0.04), xytext=(sx, sy - 0.04), arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.2, linestyle='--'))
        mid_x, mid_y = (sx + dx)/2, (sy + dy)/2
        ax.text(mid_x + 0.01, mid_y, "«include»", fontsize=7.2, fontweight='bold', color='#2563EB', ha='left', va='center')

    # <<extend>>
    for (src, dst) in extends:
        sx, sy = pos_map[src]
        dx, dy = pos_map[dst]
        ax.annotate("", xy=(dx, dy + 0.04), xytext=(sx, sy - 0.04), arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.2, linestyle=':'))
        mid_x, mid_y = (sx + dx)/2, (sy + dy)/2
        ax.text(mid_x + 0.01, mid_y, "«extend»", fontsize=7.2, fontweight='bold', color='#DC2626', ha='left', va='center')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

def draw_chatbot_usecase_diagram(filename):
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.axis('off')

    # Background card
    bg = patches.FancyBboxPatch((0.01, 0.01), 0.98, 0.98, boxstyle='round,pad=0.01', fc='#F8FAFC', ec='#1E293B', lw=1.5)
    ax.add_patch(bg)

    title = 'HÌNH 2.5. SƠ ĐỒ USE CASE PHÂN RÃ: TRỢ LÝ ẢO HR AI ĐA NĂNG & AN TOÀN THÔNG TIN'
    subtitle = 'Trò chuyện tự nhiên, Phân tích tài liệu Word/Excel và Tra cứu dữ liệu cá nhân theo Phương án A'
    ax.text(0.5, 0.955, title, ha='center', va='center', fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.925, subtitle, ha='center', va='center', fontsize=8.5, fontstyle='italic', color='#334155')

    # Boundary
    boundary = patches.FancyBboxPatch((0.17, 0.06), 0.66, 0.82, boxstyle='round,pad=0.01', fc='#FFFFFF', ec='#3B82F6', lw=1.5, linestyle='--')
    ax.add_patch(boundary)

    # Actors
    draw_actor(ax, 0.08, 0.65, 'Người dùng\n(Nhân viên/Quản lý/HR)', '#1D4ED8')
    draw_actor(ax, 0.92, 0.70, 'Mô hình AI\n(Google Gemini)', '#059669')
    draw_actor(ax, 0.92, 0.38, 'Bộ phân tích tệp\n(Mammoth / XLSX)', '#D97706')

    # Use Cases
    ucs = [
        ('UC04', 'Tương tác Trợ lý ảo HR AI\n(Khung chat thời gian thực)', 0.50, 0.78, 0.28, 0.08, '#EFF6FF', '#1D4ED8'),
        ('UC04.1', 'Trò chuyện tự nhiên\n& Tư vấn công việc, nội quy', 0.29, 0.56, 0.20, 0.075, '#F0FDF4', '#047857'),
        ('UC04.2', 'Đọc & Phân tích tài liệu\n(Word .docx, Excel .xlsx)', 0.50, 0.56, 0.20, 0.075, '#FEF3C7', '#D97706'),
        ('UC04.3', 'Tra cứu dữ liệu cá nhân\n(Phiếu lương, phép, công)', 0.71, 0.56, 0.20, 0.075, '#EFF6FF', '#2563EB'),
        ('UC04.3.1', 'Trích xuất tham số hàm\n(Function Calling ANY)', 0.71, 0.36, 0.20, 0.075, '#F5F3FF', '#7C3AED'),
        ('UC04.3.2', 'Render Template tĩnh\n(Bảo vệ PII & Chống ảo giác)', 0.71, 0.16, 0.20, 0.075, '#FEF2F2', '#DC2626'),
    ]

    pos_map = {}
    for (code, name, x, y, w, h, fc, ec) in ucs:
        box = patches.FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle='round,pad=0.01', fc=fc, ec=ec, lw=1.2)
        ax.add_patch(box)
        ax.text(x, y, f"{code}\n{name}", ha='center', va='center', fontsize=7.4, fontweight='bold', color=ec)
        pos_map[code] = (x, y, w, h)

    # Actor lines
    # User to UC04
    ax.plot([0.12, pos_map['UC04'][0] - pos_map['UC04'][2]/2], [0.65, pos_map['UC04'][1]], color='#64748B', lw=1.2)

    # Gemini to UC04.1, UC04.2, UC04.3.1
    ax.plot([0.88, pos_map['UC04.1'][0] + pos_map['UC04.1'][2]/2], [0.70, pos_map['UC04.1'][1] + 0.02], color='#059669', lw=1.0, linestyle=':')
    ax.plot([0.88, pos_map['UC04.2'][0] + pos_map['UC04.2'][2]/2], [0.70, pos_map['UC04.2'][1]], color='#059669', lw=1.0, linestyle=':')
    ax.plot([0.88, pos_map['UC04.3.1'][0] + pos_map['UC04.3.1'][2]/2], [0.70, pos_map['UC04.3.1'][1]], color='#059669', lw=1.2)

    # Parser to UC04.2
    ax.plot([0.88, pos_map['UC04.2'][0] + pos_map['UC04.2'][2]/2], [0.38, pos_map['UC04.2'][1] - 0.02], color='#D97706', lw=1.2)

    # Relationships
    # UC04 -> UC04.1 <<extend>>
    ax.annotate("", xy=(pos_map['UC04.1'][0] + 0.05, pos_map['UC04.1'][1] + pos_map['UC04.1'][3]/2),
                xytext=(pos_map['UC04'][0] - 0.08, pos_map['UC04'][1] - pos_map['UC04'][3]/2),
                arrowprops=dict(arrowstyle="->", color='#047857', lw=1.2, linestyle=':'))
    ax.text(0.36, 0.69, "«extend»", fontsize=7.2, fontweight='bold', color='#047857', ha='center', va='center')

    # UC04 -> UC04.2 <<extend>>
    ax.annotate("", xy=(pos_map['UC04.2'][0], pos_map['UC04.2'][1] + pos_map['UC04.2'][3]/2),
                xytext=(pos_map['UC04'][0], pos_map['UC04'][1] - pos_map['UC04'][3]/2),
                arrowprops=dict(arrowstyle="->", color='#D97706', lw=1.2, linestyle=':'))
    ax.text(0.50, 0.68, "«extend»", fontsize=7.2, fontweight='bold', color='#D97706', ha='center', va='center')

    # UC04 -> UC04.3 <<include>>
    ax.annotate("", xy=(pos_map['UC04.3'][0] - 0.05, pos_map['UC04.3'][1] + pos_map['UC04.3'][3]/2),
                xytext=(pos_map['UC04'][0] + 0.08, pos_map['UC04'][1] - pos_map['UC04'][3]/2),
                arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.2, linestyle='--'))
    ax.text(0.64, 0.69, "«include»", fontsize=7.2, fontweight='bold', color='#2563EB', ha='center', va='center')

    # UC04.3 -> UC04.3.1 <<include>>
    ax.annotate("", xy=(pos_map['UC04.3.1'][0], pos_map['UC04.3.1'][1] + pos_map['UC04.3.1'][3]/2),
                xytext=(pos_map['UC04.3'][0], pos_map['UC04.3'][1] - pos_map['UC04.3'][3]/2),
                arrowprops=dict(arrowstyle="->", color='#7C3AED', lw=1.2, linestyle='--'))
    ax.text(0.71, 0.46, "«include»", fontsize=7.2, fontweight='bold', color='#7C3AED', ha='center', va='center')

    # UC04.3.1 -> UC04.3.2 <<include>>
    ax.annotate("", xy=(pos_map['UC04.3.2'][0], pos_map['UC04.3.2'][1] + pos_map['UC04.3.2'][3]/2),
                xytext=(pos_map['UC04.3.1'][0], pos_map['UC04.3.1'][1] - pos_map['UC04.3.1'][3]/2),
                arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.2, linestyle='--'))
    ax.text(0.71, 0.26, "«include»", fontsize=7.2, fontweight='bold', color='#DC2626', ha='center', va='center')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

def main():
    # 2.2: FaceID Use case
    draw_usecase_diagram(
        'hinh2_2_usecase_faceid.png',
        'HÌNH 2.2. SƠ ĐỒ USE CASE PHÂN RÃ: ĐIỂM DANH KHUÔN MẶT KIOSK FACEID LIVENESS',
        'Quan hệ phụ thuộc giữa nhận diện thực thể sống và so khớp đặc trưng 128 chiều',
        (0.50, 'Nhân viên\n(Employee)', '#1D4ED8', ['UC01']),
        (0.50, 'Thiết bị Kiosk\n(Camera/WASM)', '#475569', ['UC01.1']),
        [
            ('UC01', 'Điểm danh Kiosk FaceID', 0.50, 0.72, '#EFF6FF', '#1D4ED8'),
            ('UC01.1', 'Kiểm tra độ sống (Liveness)\nMediaPipe Blendshapes', 0.50, 0.48, '#F0FDF4', '#047857'),
            ('UC01.2', 'Trích xuất & So khớp\nVector 128D (d <= 0.60)', 0.50, 0.24, '#FEF2F2', '#B91C1C'),
        ],
        [('UC01', 'UC01.1'), ('UC01.1', 'UC01.2')],
        []
    )

    # 2.3: Leave Use case
    draw_usecase_diagram(
        'hinh2_3_usecase_leave.png',
        'HÌNH 2.3. SƠ ĐỒ USE CASE PHÂN RÃ: NỘP VÀ DUYỆT ĐƠN NGHỈ PHÉP 2 CẤP',
        'Luồng kiểm soát số dư phép năm theo Điều 113, 114 BLLĐ và trừ phép nguyên tử',
        (0.65, 'Nhân viên\n(Employee)', '#1D4ED8', ['UC02']),
        (0.35, 'Trưởng bộ phận\n& HR Manager', '#C2410C', ['UC02.2']),
        [
            ('UC02', 'Nộp đơn nghỉ phép\n(ANNUAL, SICK, OT, WFH)', 0.50, 0.72, '#EFF6FF', '#1D4ED8'),
            ('UC02.1', 'Kiểm tra số dư phép\nleaveBalance còn lại', 0.50, 0.48, '#F0FDF4', '#047857'),
            ('UC02.2', 'Phê duyệt 2 cấp\nManager -> HR Manager', 0.50, 0.24, '#FFF7ED', '#C2410C'),
        ],
        [('UC02', 'UC02.1')],
        [('UC02.2', 'UC02')]
    )

    # 2.4: Payroll Use case
    draw_usecase_diagram(
        'hinh2_4_usecase_payroll.png',
        'HÌNH 2.4. SƠ ĐỒ USE CASE PHÂN RÃ: TÍNH TOÁN VÀ KHÓA KỲ LƯƠNG TỰ ĐỘNG 2026',
        'Quy trình 3 bước, áp trần BHXH 2 mốc và khóa kỳ nguyên tử periodLockedAt',
        (0.50, 'HR Manager\n(Cán bộ C&B)', '#C2410C', ['UC03']),
        (0.50, 'Tổng Giám đốc\n(CEO)', '#B91C1C', ['UC03.2']),
        [
            ('UC03', 'Tính toán bảng lương\nQuy trình 3 bước chuẩn 2026', 0.50, 0.72, '#FFF7ED', '#C2410C'),
            ('UC03.1', 'Tra cứu tham số động\n(Trần BHXH & Ăn ca miễn thuế)', 0.50, 0.48, '#F0FDF4', '#047857'),
            ('UC03.2', 'Khóa sổ kỳ lương nguyên tử\n(Chặn sửa dữ liệu nguồn)', 0.50, 0.24, '#FEF2F2', '#B91C1C'),
        ],
        [('UC03', 'UC03.1')],
        [('UC03.2', 'UC03')]
    )

    # 2.5: Chatbot Use case
    draw_chatbot_usecase_diagram('hinh2_5_usecase_chatbot.png')

    # 2.6: ML Attrition Use case
    draw_usecase_diagram(
        'hinh2_6_usecase_attrition.png',
        'HÌNH 2.6. SƠ ĐỒ USE CASE PHÂN RÃ: DỰ BÁO NGUY CƠ THÔI VIỆC MACHINE LEARNING',
        'Phân tích 6 biến định lượng khách quan và hiển thị bảng phân tích rủi ro XAI',
        (0.50, 'HR Manager\n& Ban Giám đốc', '#C2410C', ['UC05']),
        None,
        [
            ('UC05', 'Xem Dashboard rủi ro\n(Phân tích biến động nhân sự)', 0.50, 0.72, '#FFF7ED', '#C2410C'),
            ('UC05.1', 'Trích xuất 6 đặc trưng\n(OT, thâm niên, thu nhập,...)', 0.50, 0.48, '#EFF6FF', '#1D4ED8'),
            ('UC05.2', 'Suy luận Logistic Regression\n& Bóc tách nguyên nhân XAI', 0.50, 0.24, '#F0FDF4', '#047857'),
        ],
        [('UC05', 'UC05.1'), ('UC05.1', 'UC05.2')],
        []
    )

    # 2.7: Recruitment & AI ATS Use case
    draw_usecase_diagram(
        'hinh2_7_usecase_recruitment.png',
        'HÌNH 2.7. SƠ ĐỒ USE CASE PHÂN RÃ: TUYỂN DỤNG VÀ SÀNG LỌC CV ỨNG VIÊN AI ATS',
        'Cổng thông tin việc làm công khai, tự động chấm điểm AI Match % và gửi email phỏng vấn',
        (0.65, 'Ứng viên\n(Candidate)', '#1D4ED8', ['UC06']),
        (0.35, 'HR Manager\n& Tổng Giám đốc', '#C2410C', ['UC06.2']),
        [
            ('UC06', 'Ứng tuyển & Nộp CV trực tuyến\n(Cổng thông tin việc làm công khai)', 0.50, 0.72, '#EFF6FF', '#1D4ED8'),
            ('UC06.1', 'AI ATS-lite Sàng lọc tự động\n(Chấm điểm Match % & Nhận xét)', 0.50, 0.48, '#F0FDF4', '#047857'),
            ('UC06.2', 'Lên lịch & Gửi thư mời phỏng vấn\n(Gửi Email tự động qua SMTP)', 0.50, 0.24, '#FFF7ED', '#C2410C'),
        ],
        [('UC06', 'UC06.1')],
        [('UC06.2', 'UC06')]
    )
    print("ALL SUB USE CASE FIGURES GENERATED SUCCESSFULLY!")

if __name__ == '__main__':
    main()

