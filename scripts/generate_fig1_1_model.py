import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Cấu hình font và hiển thị tiếng Việt
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9.5
plt.rcParams['axes.unicode_minus'] = False

OUTPUT_DIR = r'c:\K23CNT1\DANT\DATN\docs\report\images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_traditional_hrm_model():
    fig, ax = plt.subplots(figsize=(13.2, 9.4), dpi=300)
    ax.axis('off')

    # Khung viền bao quát toàn bộ sơ đồ
    bg = patches.FancyBboxPatch((0.012, 0.012), 0.976, 0.976, boxstyle='round,pad=0.015',
                                fc='#F8FAFC', ec='#1E293B', lw=1.6)
    ax.add_patch(bg)

    # 1. TIÊU ĐỀ CHÍNH
    ax.text(0.5, 0.966, 'SƠ ĐỒ MÔ HÌNH HOẠT ĐỘNG TRUYỀN THỐNG PHÂN MẢNH TRONG QUẢN TRỊ NHÂN SỰ (HRM)',
            ha='center', va='center', fontsize=12.2, fontweight='bold', color='#0F172A')
    ax.text(0.5, 0.940, 'Đặc trưng: Các ốc đảo dữ liệu (Data Silos) cô lập, quy trình tác nghiệp thủ công và các điểm nghẽn rủi ro lớn tại doanh nghiệp',
            ha='center', va='center', fontsize=8.6, fontstyle='italic', color='#334155')

    # ==========================================
    # TẦNG 1: 3 ỐC ĐẢO DỮ LIỆU TÁC NGHIỆP PHÂN MẢNH (DATA SILOS)
    # ==========================================
    # Silo 1: Điểm danh & Chấm công cục bộ
    b1 = patches.FancyBboxPatch((0.035, 0.635), 0.285, 0.285, boxstyle='round,pad=0.012', fc='#FFFFFF', ec='#EA580C', lw=1.5)
    ax.add_patch(b1)
    h1 = patches.FancyBboxPatch((0.035, 0.880), 0.285, 0.040, boxstyle='round,pad=0.008', fc='#EA580C', ec='#EA580C', lw=1)
    ax.add_patch(h1)
    ax.text(0.1775, 0.900, '1. ĐIỂM DANH & CHẤM CÔNG CỤC BỘ', ha='center', va='center', fontsize=8.4, fontweight='bold', color='#FFFFFF')

    t1 = (
        "• Thiết bị: Máy vân tay / Thẻ từ RFID tại cửa\n"
        "• Thao tác: Quẹt thẻ nhựa hoặc áp vân tay\n"
        "• Lưu trữ: Bộ nhớ cục bộ thiết bị (Access DB)\n"
        "• Trích xuất: Cắm USB hoặc kéo dây LAN nội bộ"
    )
    ax.text(0.046, 0.795, t1, ha='left', va='center', fontsize=7.5, color='#1E293B', linespacing=1.35)

    # Cảnh báo Silo 1
    w1 = patches.FancyBboxPatch((0.043, 0.645), 0.269, 0.082, boxstyle='round,pad=0.008', fc='#FEF2F2', ec='#F87171', lw=1)
    ax.add_patch(w1)
    tw1 = (
        "[!] Rủi ro & Hạn chế cố hữu:\n"
        "  - Chấm công hộ (quẹt thẻ giùm đồng nghiệp)\n"
        "  - Vân tay mờ, dính dầu mỡ không nhận diện\n"
        "  - Dữ liệu bị cô lập, ùn tắc đầu ca làm việc"
    )
    ax.text(0.048, 0.686, tw1, ha='left', va='center', fontsize=7.1, color='#991B1B', fontweight='bold', linespacing=1.2)

    # Silo 2: Đơn từ & Phê duyệt rời rạc
    b2 = patches.FancyBboxPatch((0.342, 0.635), 0.285, 0.285, boxstyle='round,pad=0.012', fc='#FFFFFF', ec='#0284C7', lw=1.5)
    ax.add_patch(b2)
    h2 = patches.FancyBboxPatch((0.342, 0.880), 0.285, 0.040, boxstyle='round,pad=0.008', fc='#0284C7', ec='#0284C7', lw=1)
    ax.add_patch(h2)
    ax.text(0.4845, 0.900, '2. ĐƠN TỪ & PHÊ DUYỆT RỜI RẠC', ha='center', va='center', fontsize=8.4, fontweight='bold', color='#FFFFFF')

    t2 = (
        "• Kênh nộp: Giấy in viết tay, chat Zalo, Skype\n"
        "• Phê duyệt: Trưởng bộ phận ký tay hoặc chat\n"
        "• Lưu trữ: Giấy kẹp bìa, tin nhắn phân tán\n"
        "• Đối chiếu: Cán bộ nhân sự đọc và nhập tay"
    )
    ax.text(0.353, 0.795, t2, ha='left', va='center', fontsize=7.5, color='#1E293B', linespacing=1.35)

    # Cảnh báo Silo 2
    w2 = patches.FancyBboxPatch((0.350, 0.645), 0.269, 0.082, boxstyle='round,pad=0.008', fc='#FEF2F2', ec='#F87171', lw=1)
    ax.add_patch(w2)
    tw2 = (
        "[!] Rủi ro & Hạn chế cố hữu:\n"
        "  - Thất lạc đơn từ, không có log kiểm toán\n"
        "  - Không kiểm soát trần OT (Điều 98 BLLĐ)\n"
        "  - Độ trễ phê duyệt lớn, sai số dư ngày phép"
    )
    ax.text(0.355, 0.686, tw2, ha='left', va='center', fontsize=7.1, color='#991B1B', fontweight='bold', linespacing=1.2)

    # Silo 3: Hồ sơ nhân sự & Hợp đồng phân tán
    b3 = patches.FancyBboxPatch((0.649, 0.635), 0.285, 0.285, boxstyle='round,pad=0.012', fc='#FFFFFF', ec='#4F46E5', lw=1.5)
    ax.add_patch(b3)
    h3 = patches.FancyBboxPatch((0.649, 0.880), 0.285, 0.040, boxstyle='round,pad=0.008', fc='#4F46E5', ec='#4F46E5', lw=1)
    ax.add_patch(h3)
    ax.text(0.7915, 0.900, '3. HỒ SƠ & HỢP ĐỒNG PHÂN TÁN', ha='center', va='center', fontsize=8.4, fontweight='bold', color='#FFFFFF')

    t3 = (
        "• Lưu trữ: Tủ hồ sơ giấy + Word/Excel trên PC\n"
        "• Nội dung: Sơ yếu lý lịch, hợp đồng, lương thỏa thuận\n"
        "• Giảm trừ: Bản photo CMND người phụ thuộc\n"
        "• Cập nhật: Sửa đổi thủ công từng file rời rạc"
    )
    ax.text(0.660, 0.795, t3, ha='left', va='center', fontsize=7.5, color='#1E293B', linespacing=1.35)

    # Cảnh báo Silo 3
    w3 = patches.FancyBboxPatch((0.657, 0.645), 0.269, 0.082, boxstyle='round,pad=0.008', fc='#FEF2F2', ec='#F87171', lw=1)
    ax.add_patch(w3)
    tw3 = (
        "[!] Rủi ro & Hạn chế cố hữu:\n"
        "  - Không cảnh báo tự động hết hạn hợp đồng\n"
        "  - Vi phạm bảo mật Luật BVDLCN số 91/2025\n"
        "  - Tra cứu chậm, phân tán, dễ trùng lặp hồ sơ"
    )
    ax.text(0.662, 0.686, tw3, ha='left', va='center', fontsize=7.1, color='#991B1B', fontweight='bold', linespacing=1.2)

    # ==========================================
    # TẦNG 2: MŨI TÊN GOM DỮ LIỆU & NÚT THẮT CỔ CHAI THỦ CÔNG
    # ==========================================
    # Mũi tên 1 (từ Silo 1)
    ax.annotate("", xy=(0.20, 0.540), xytext=(0.1775, 0.635),
                arrowprops=dict(arrowstyle="->", lw=2, color="#EA580C", linestyle="--"))
    ax.text(0.125, 0.585, "Cắm USB chép\nfile .DAT/.CSV", ha='center', va='center', fontsize=7.0, color='#C2410C', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.2', fc='#FFF7ED', ec='#FDBA74', lw=0.8))

    # Mũi tên 2 (từ Silo 2)
    ax.annotate("", xy=(0.4845, 0.540), xytext=(0.4845, 0.635),
                arrowprops=dict(arrowstyle="->", lw=2, color="#0284C7", linestyle="--"))
    ax.text(0.4845, 0.585, "Gom đơn giấy &\nđọc tin nhắn chat", ha='center', va='center', fontsize=7.0, color='#0369A1', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.2', fc='#F0F9FF', ec='#BAE6FD', lw=0.8))

    # Mũi tên 3 (từ Silo 3)
    ax.annotate("", xy=(0.77, 0.540), xytext=(0.7915, 0.635),
                arrowprops=dict(arrowstyle="->", lw=2, color="#4F46E5", linestyle="--"))
    ax.text(0.840, 0.585, "Mở file riêng dò\nlương & phụ cấp", ha='center', va='center', fontsize=7.0, color='#4338CA', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.2', fc='#EEF2FF', ec='#C7D2FE', lw=0.8))

    # Khung Nút thắt cổ chai trung tâm
    bottle = patches.FancyBboxPatch((0.050, 0.445), 0.884, 0.095, boxstyle='round,pad=0.012', fc='#FEF2F2', ec='#DC2626', lw=1.8)
    ax.add_patch(bottle)
    h_bottle = patches.FancyBboxPatch((0.050, 0.510), 0.884, 0.030, boxstyle='round,pad=0.006', fc='#DC2626', ec='#DC2626', lw=1)
    ax.add_patch(h_bottle)
    ax.text(0.492, 0.525, 'THẮT NÚT CỔ CHAI: QUY TRÌNH GOM DỮ LIỆU & ĐỐI CHIẾU THỦ CÔNG (MANUAL BOTTLENECK)',
            ha='center', va='center', fontsize=8.4, fontweight='bold', color='#FFFFFF')

    t_bottle = (
        "• Chuyên viên Nhân sự / C&B phải lọc dữ liệu quét trùng, đối chiếu thủ công từng dòng quẹt thẻ với đơn nghỉ phép / làm thêm giờ giấy tờ.\n"
        "• HẬU QUẢ: Mất 3 đến 5 ngày làm việc cuối mỗi tháng | Nguy cơ sai sót, bỏ sót dữ liệu rất lớn | Dữ liệu không mang tính thời gian thực."
    )
    ax.text(0.065, 0.475, t_bottle, ha='left', va='center', fontsize=7.5, color='#7F1D1D', fontweight='bold', linespacing=1.3)

    # ==========================================
    # TẦNG 3: BẢNG TÍNH MICROSOFT EXCEL TỔNG HỢP (MONOLITHIC SPREADSHEET)
    # ==========================================
    ax.annotate("", xy=(0.492, 0.380), xytext=(0.492, 0.445),
                arrowprops=dict(arrowstyle="->", lw=2.5, color="#16A34A"))
    ax.text(0.575, 0.412, "Copy-paste dữ liệu vào bảng tính", ha='left', va='center', fontsize=7.3, color='#15803D', fontstyle='italic')

    # Thu hẹp Excel box bên phải xuống 0.890 để nhường đường cho mũi tên khiếu nại bên phải
    b_excel = patches.FancyBboxPatch((0.035, 0.200), 0.899, 0.180, boxstyle='round,pad=0.012', fc='#FFFFFF', ec='#16A34A', lw=1.8)
    ax.add_patch(b_excel)
    h_excel = patches.FancyBboxPatch((0.035, 0.345), 0.899, 0.035, boxstyle='round,pad=0.006', fc='#16A34A', ec='#16A34A', lw=1)
    ax.add_patch(h_excel)
    ax.text(0.4845, 0.362, 'BẢNG TÍNH MICROSOFT EXCEL TỔNG HỢP VÀ TÍNH LƯƠNG (C&B SPREADSHEET PHỨC TẠP)',
            ha='center', va='center', fontsize=8.6, fontweight='bold', color='#FFFFFF')

    # Cột trái của Excel: Công thức & Thao tác
    t_ex_left = (
        "XỬ LÝ DỮ LIỆU BẰNG CÔNG THỨC LỒNG GHÉP:\n"
        "• Ghép nối dữ liệu: VLOOKUP, INDEX/MATCH, SUMIFS, IF lồng 4–5 tầng\n"
        "• Tính toán: Công chuẩn, đi muộn, trừ phạt, làm thêm giờ OT (150%, 200%)\n"
        "• Giảm trừ: Trích đóng bảo hiểm bắt buộc 10.5%, người phụ thuộc\n"
        "• Thuế TNCN: Áp dụng công thức biểu lũy tiến thủ công"
    )
    ax.text(0.048, 0.272, t_ex_left, ha='left', va='center', fontsize=7.5, color='#14532D', linespacing=1.3)

    # Cột phải của Excel: Rủi ro pháp lý & tài chính 2026
    t_ex_right = (
        "RỦI RO TÀI CHÍNH & PHÁP LÝ NĂM 2026:\n"
        "[!] Không tự động cập nhật biểu thuế TNCN 5 bậc mới (Giảm trừ 15.5M / 6.2M)\n"
        "[!] Khó quản lý 2 mốc trần BHXH (46.8M / 50.6M) và trần ăn ca (730k / 1.2M)\n"
        "[!] Dễ tính sai tiền làm thêm giờ OT được miễn thuế theo Điều 98 BLLĐ\n"
        "[!] Không có cơ chế khóa sổ (Period Lock) - Dễ bị vô tình sửa đè dữ liệu cũ"
    )
    ax.text(0.490, 0.272, t_ex_right, ha='left', va='center', fontsize=7.4, color='#991B1B', fontweight='bold', linespacing=1.3)

    # Vạch ngăn cách giữa cột trái và cột phải
    ax.plot([0.478, 0.478], [0.210, 0.340], color='#E2E8F0', lw=1.5, linestyle=':')

    # ==========================================
    # TẦNG 4: ĐẦU RA PHÂN PHỐI & VÒNG LẶP KHIẾU NẠI (OUTPUTS & COMPLAINTS)
    # ==========================================
    # Mũi tên từ Excel xuống Output 1
    ax.annotate("", xy=(0.25, 0.145), xytext=(0.25, 0.200),
                arrowprops=dict(arrowstyle="->", lw=2, color="#475569"))
    
    # Mũi tên từ Excel xuống Output 2
    ax.annotate("", xy=(0.71, 0.145), xytext=(0.71, 0.200),
                arrowprops=dict(arrowstyle="->", lw=2, color="#991B1B"))

    # Box Output 1: Phân phối thủ công
    b_out1 = patches.FancyBboxPatch((0.035, 0.050), 0.435, 0.095, boxstyle='round,pad=0.010', fc='#F1F5F9', ec='#64748B', lw=1.4)
    ax.add_patch(b_out1)
    ax.text(0.2525, 0.125, 'PHÂN PHỐI PHIẾU LƯƠNG THỦ CÔNG', ha='center', va='center', fontsize=8.0, fontweight='bold', color='#1E293B')
    t_out1 = (
        "• In phiếu lương giấy đưa tận tay hoặc gửi email tệp Excel không mã hóa\n"
        "• Rủi ro lộ lọt bí mật tiền lương, vi phạm quy định bảo mật dữ liệu nhân sự"
    )
    ax.text(0.046, 0.082, t_out1, ha='left', va='center', fontsize=7.2, color='#334155', linespacing=1.25)

    # Box Output 2: Khiếu nại & Giải trình
    b_out2 = patches.FancyBboxPatch((0.499, 0.050), 0.435, 0.095, boxstyle='round,pad=0.010', fc='#FFF1F2', ec='#BE123C', lw=1.4)
    ax.add_patch(b_out2)
    ax.text(0.7165, 0.125, 'VÒNG LẶP KHIẾU NẠI & TRA CỨU NGƯỢC', ha='center', va='center', fontsize=8.0, fontweight='bold', color='#9F1239')
    t_out2 = (
        "• Nhân viên khiếu nại sai ngày công, đi muộn, thiếu tiền làm thêm giờ (OT)\n"
        "• Cán bộ HR mất nhiều ngày lục lại giấy tờ cũ, tra cứu thủ công để giải trình"
    )
    ax.text(0.510, 0.082, t_out2, ha='left', va='center', fontsize=7.2, color='#881337', linespacing=1.25)

    # Mũi tên khiếu nại vòng ngược lên lại máy chấm công / đơn từ (bên lề phải thông thoáng)
    ax.plot([0.955, 0.955], [0.100, 0.770], color='#BE123C', lw=1.8, linestyle=':')
    ax.annotate("", xy=(0.934, 0.770), xytext=(0.955, 0.770),
                arrowprops=dict(arrowstyle="->", lw=1.8, color="#BE123C", linestyle=":"))
    ax.text(0.970, 0.435, 'Khiếu nại &\nkiểm tra lại\nsổ sách', ha='center', va='center', fontsize=7.0, color='#BE123C', fontweight='bold', rotation=270,
            bbox=dict(boxstyle='round,pad=0.2', fc='#FFF1F2', ec='#FDA4AF', lw=0.8))

    # ==========================================
    # FOOTER: ĐÁNH GIÁ TỔNG QUAN
    # ==========================================
    ax.text(0.5, 0.024, 'ĐÁNH GIÁ CHUNG: Mô hình truyền thống dựa trên các công cụ phân mảnh gây lãng phí 3–5 ngày công mỗi kỳ, độ trễ cao và tiềm ẩn rủi ro tài chính - pháp lý lớn.',
            ha='center', va='center', fontsize=7.8, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'hinh1_1_mo_hinh_truyen_thong.png')
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    print(f"Created: {path}")

    # Đồng thời ghi đè hinh1_1_excel_cham_cong.png để mọi liên kết cũ tự động chuyển sang mô hình mới chuẩn xác
    path_legacy = os.path.join(OUTPUT_DIR, 'hinh1_1_excel_cham_cong.png')
    plt.figure()
    import shutil
    shutil.copyfile(path, path_legacy)
    print(f"Updated legacy link: {path_legacy}")

if __name__ == '__main__':
    generate_traditional_hrm_model()
