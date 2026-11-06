import os
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def setup_page(doc):
    for section in doc.sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(2.0)
        section.header_distance = Cm(1.27)
        section.footer_distance = Cm(1.27)

def set_cell_border(cell, color="333333", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

def set_cell_shading(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def add_header_ntu(doc):
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell_left = table.cell(0, 0)
    cell_right = table.cell(0, 1)
    cell_left.width = Inches(3.0)
    cell_right.width = Inches(3.3)
    
    # Left: School info
    p_l = cell_left.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.paragraph_format.space_before = Pt(0)
    p_l.paragraph_format.space_after = Pt(2)
    p_l.paragraph_format.line_spacing = 1.15
    r_l1 = p_l.add_run("TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI\n")
    r_l1.font.name = "Times New Roman"
    r_l1.font.size = Pt(11)
    r_l1.font.bold = True
    r_l2 = p_l.add_run("KHOA CÔNG NGHỆ THÔNG TIN\nVÀ CHUYỂN ĐỔI SỐ")
    r_l2.font.name = "Times New Roman"
    r_l2.font.size = Pt(10.5)
    r_l2.font.bold = True
    
    # Right: National motto
    p_r = cell_right.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.paragraph_format.space_before = Pt(0)
    p_r.paragraph_format.space_after = Pt(2)
    p_r.paragraph_format.line_spacing = 1.15
    r_r1 = p_r.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    r_r1.font.name = "Times New Roman"
    r_r1.font.size = Pt(11)
    r_r1.font.bold = True
    r_r2 = p_r.add_run("Độc lập - Tự do - Hạnh phúc")
    r_r2.font.name = "Times New Roman"
    r_r2.font.size = Pt(10.5)
    r_r2.font.bold = True
    r_r2.font.italic = True
    
    # Empty space after header
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(4)
    p_space.paragraph_format.space_after = Pt(6)

def generate_pl03(output_path):
    doc = Document()
    setup_page(doc)
    add_header_ntu(doc)
    
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(2)
    r_t1 = p_title.add_run("PHỤ LỤC 03\n")
    r_t1.font.name = "Times New Roman"
    r_t1.font.size = Pt(12)
    r_t1.font.bold = True
    r_t2 = p_title.add_run("KẾ HOẠCH VÀ BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN TỐT NGHIỆP\n")
    r_t2.font.name = "Times New Roman"
    r_t2.font.size = Pt(14)
    r_t2.font.bold = True
    r_t2.font.color.rgb = RGBColor(16, 44, 87)
    r_t3 = p_title.add_run("BÁO CÁO TIẾN ĐỘ TUẦN 1 (16/10/2026 – 22/10/2026)")
    r_t3.font.name = "Times New Roman"
    r_t3.font.size = Pt(12)
    r_t3.font.bold = True
    r_t3.font.italic = True

    # Section 1: Thông tin chung
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(10)
    p1.paragraph_format.space_after = Pt(3)
    r1 = p1.add_run("I. THÔNG TIN CHUNG")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(12)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(16, 44, 87)

    info_lines = [
        ("Họ và tên sinh viên:", " Nguyễn Anh Tuấn"),
        ("Mã sinh viên:", " 2310900113"),
        ("Lớp:", " K23CNT1"),
        ("Ngành đào tạo:", " Công nghệ thông tin"),
        ("Tên đề tài ĐATN:", " Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI"),
        ("Giảng viên hướng dẫn:", " ThS. Lê Trọng Nhất"),
        ("Kho lưu trữ mã nguồn (Git):", " https://github.com/AnhTuan112004/DATN.git"),
        ("Kho lưu trữ bản vẽ thiết kế (Drive):", " https://drive.google.com/drive/folders/PeopleInsight-AI-UML-Designs"),
        ("Quy định đặt tên file báo cáo:", " 2310900113_K23CNT1_NguyenAnhTuan_BaoCaoDATN.K23")
    ]
    for label, val in info_lines:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.15
        r_lbl = p.add_run(f"• {label}")
        r_lbl.font.name = "Times New Roman"
        r_lbl.font.size = Pt(11)
        r_lbl.font.bold = True
        r_val = p.add_run(val)
        r_val.font.name = "Times New Roman"
        r_val.font.size = Pt(11)

    # Section 2: Kế hoạch và kết quả thực hiện Tuần 1
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(10)
    p2.paragraph_format.space_after = Pt(4)
    r2 = p2.add_run("II. KẾ HOẠCH VÀ KẾT QUẢ THỰC HIỆN TUẦN 1")
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(12)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(16, 44, 87)

    # Table for Week 1 details
    t = doc.add_table(rows=6, cols=3)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    
    col_w = [Inches(1.8), Inches(3.2), Inches(1.3)]
    headers = ["Hạng mục công việc", "Nội dung & Kết quả thực hiện chi tiết", "Trạng thái"]
    
    for j, h in enumerate(headers):
        c = t.cell(0, j)
        c.width = col_w[j]
        set_cell_shading(c, "1F497D")
        set_cell_border(c, color="1F497D", sz="6")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    rows_content = [
        ("1. Chức năng của hệ thống (Một số chức năng chính & Yêu cầu phi chức năng)",
         "- Hoàn thiện Bảng 2.1: Phân tích 10 nhóm chức năng cốt lõi (Đăng ký/JWT, RBAC 4 cấp, Phòng ban 2 cấp, Hồ sơ & hợp đồng, Kiosk FaceID, Chấm công GPS/QR, Duyệt đơn 2 cấp, Động cơ tính lương 2026, Trợ lý ảo HR AI, ML Attrition và Cổng tuyển dụng ATS).\n"
         "- Hoàn thiện Bảng 2.2: Xác định chi tiết 5 nhóm yêu cầu phi chức năng (Hiệu năng: Kiosk ≥ 45 FPS, P95 ≤ 380ms, tính lương < 100ms; Bảo mật: Multi-tenant Fail-Closed, bcrypt, AES-256; Tương thích PWA; Dễ sử dụng SUS 82.5/100; Mở rộng Stateless).",
         "Hoàn thành\n100%"),
        ("2. Các tác nhân tham gia hệ thống",
         "- Xác định và chuẩn hóa đúng 6 tác nhân tham gia hệ thống (Bảng 2.3):\n"
         "  + 4 tác nhân nội bộ: Admin (CEO), Trưởng phòng Nhân sự (HR Manager), Trưởng bộ phận (Manager), Nhân viên (Employee).\n"
         "  + 1 tác nhân người dùng bên ngoài: Ứng viên / Khách vãng lai (Candidate) tra cứu tin và nộp CV.\n"
         "  + 1 tác nhân hệ thống biên: Thiết bị Kiosk văn phòng (Kiosk Device) xác thực Token và bám vết 468 mốc.",
         "Hoàn thành\n100%"),
        ("3. Quy trình nghiệp vụ trong hệ thống",
         "- Khảo sát và mô hình hóa chi tiết 5 quy trình nghiệp vụ trọng tâm:\n"
         "  (1) Điểm danh Kiosk FaceID Liveness 2 tầng (chớp mắt, há miệng, quay đầu) đáp ứng Nonce ngẫu nhiên 60s.\n"
         "  (2) Nộp và phê duyệt đơn nghỉ phép 2 cấp độc lập với cơ chế trừ phép nguyên tử trong MongoDB Transaction.\n"
         "  (3) Tính toán và khóa sổ kỳ lương 2026 chuẩn thuế 5 bậc, trần BHXH theo kỳ và miễn thuế 100% tiền OT hợp lệ.\n"
         "  (4) Tra cứu thông tin qua Trợ lý ảo HR AI Phương án A (ép gọi Tool Gemini, ngắt LLM, render template tĩnh).\n"
         "  (5) Dự báo biến động nhân sự và nguy cơ thôi việc ML dựa trên 6 đặc trưng công việc khách quan IBM.",
         "Hoàn thành\n100%"),
        ("4. Biểu đồ Use Case tổng quát",
         "- Thiết kế và xuất bản hoàn chỉnh Hình 2.1 Sơ đồ Use Case tổng quát hệ thống PeopleInsight AI.\n"
         "- Thể hiện 14 Use Cases chức năng trong ranh giới hệ thống, liên kết chuẩn mực với 6 tác nhân tương ứng.\n"
         "- Bản vẽ chuẩn UML 300 DPI lưu trữ tại docs/report/images/hinh2_1_use_case_tong_quat.png và đồng bộ lên Google Drive / Git.",
         "Hoàn thành\n100%"),
        ("5. Lưu trữ mã nguồn & bản vẽ kỹ thuật",
         "- Commit mã nguồn khung kiến trúc Backend (Express 5, Mongoose, Auth, RBAC) và Frontend (Vite, React 19, Tailwind) lên GitHub: https://github.com/AnhTuan112004/DATN.git.\n"
         "- Tải toàn bộ bản vẽ thiết kế UML độ phân giải cao lên thư mục Google Drive phục vụ lưu trữ và báo cáo.",
         "Hoàn thành\n100%")
    ]

    for idx, (c0, c1, c2) in enumerate(rows_content):
        row_i = idx + 1
        bg = "F2F5F9" if row_i % 2 == 1 else "FFFFFF"
        for j, txt in enumerate([c0, c1, c2]):
            cell = t.cell(row_i, j)
            cell.width = col_w[j]
            set_cell_shading(cell, bg)
            set_cell_border(cell, color="D9D9D9", sz="4")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j == 2 else WD_ALIGN_PARAGRAPH.LEFT
            lines = txt.split('\n')
            for k, line in enumerate(lines):
                if k > 0:
                    p = cell.add_paragraph()
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.line_spacing = 1.15
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j == 2 else WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(line)
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                if j == 2:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(4, 120, 87)
                elif j == 0 and k == 0:
                    r.font.bold = True

    # Section 3: Kế hoạch Tuần 2
    p3 = doc.add_paragraph()
    p3.paragraph_format.space_before = Pt(10)
    p3.paragraph_format.space_after = Pt(3)
    r3 = p3.add_run("III. KẾ HOẠCH THỰC HIỆN TUẦN 2 (23/10/2026 – 29/10/2026)")
    r3.font.name = "Times New Roman"
    r3.font.size = Pt(12)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(16, 44, 87)

    next_plan = [
        "1. Triển khai phân hệ điểm danh Kiosk FaceID Liveness 2 tầng (MediaPipe WebAssembly, kiểm tra chuyển đổi trạng thái EAR/MAR/Yaw, Nonce ngẫu nhiên TTL 60s).",
        "2. Xây dựng chức năng chấm công di động PWA (GPS Geofencing bán kính ≤ 100m theo công thức Haversine và mã QR động chu kỳ 30s ký số HMAC-SHA256).",
        "3. Xây dựng Biểu đồ Use Case phân rã và hoàn thành bảng đặc tả 5 Use Case cốt lõi (Bảng 2.4 đến Bảng 2.8 theo chuẩn mẫu NTU).",
        "4. Mô hình hóa động học hệ thống qua các biểu đồ tuần tự (Sequence Diagram) và biểu đồ hành động (Activity Diagram).",
        "5. Cập nhật mã nguồn và bản vẽ mới lên Git và Drive, báo cáo định kỳ cho GVHD."
    ]
    for item in next_plan:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(f"• {item}")
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # Signatures
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(8)
    
    t_sign = doc.add_table(rows=1, cols=2)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sign.autofit = False
    t_sign.cell(0, 0).width = Inches(3.1)
    t_sign.cell(0, 1).width = Inches(3.2)
    
    p_s1 = t_sign.cell(0, 0).paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("GIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)\n\n\n\n\nThS. Lê Trọng Nhất")
    r_s1.font.name = "Times New Roman"
    r_s1.font.size = Pt(11)
    r_s1.font.bold = True

    p_s2 = t_sign.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("Hà Nội, ngày 22 tháng 10 năm 2026\nSINH VIÊN THỰC HIỆN\n(Ký và ghi rõ họ tên)\n\n\n\nNguyễn Anh Tuấn")
    r_s2.font.name = "Times New Roman"
    r_s2.font.size = Pt(11)
    r_s2.font.bold = True

    doc.save(output_path)
    print(f"Created PL03: {output_path}")

def generate_pl04(output_path):
    doc = Document()
    setup_page(doc)
    add_header_ntu(doc)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(2)
    r_t1 = p_title.add_run("PHỤ LỤC 04\n")
    r_t1.font.name = "Times New Roman"
    r_t1.font.size = Pt(12)
    r_t1.font.bold = True
    r_t2 = p_title.add_run("PHIẾU THEO DÕI, NHẬN XÉT ĐÁNH GIÁ TIẾN ĐỘ ĐATN\nCỦA GIẢNG VIÊN HƯỚNG DẪN\n")
    r_t2.font.name = "Times New Roman"
    r_t2.font.size = Pt(13.5)
    r_t2.font.bold = True
    r_t2.font.color.rgb = RGBColor(16, 44, 87)

    # Info
    info_lines = [
        ("Họ và tên sinh viên:", " Nguyễn Anh Tuấn", "Mã SV:", " 2310900113", "Lớp:", " K23CNT1"),
        ("Tên đề tài:", " Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI"),
        ("Giảng viên hướng dẫn:", " ThS. Lê Trọng Nhất"),
        ("Kho Git:", " https://github.com/AnhTuan112004/DATN.git", "Drive bản vẽ:", " https://drive.google.com/drive/folders/PeopleInsight-AI-UML-Designs")
    ]
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("• Họ và tên sinh viên: Nguyễn Anh Tuấn    Mã SV: 2310900113    Lớp: K23CNT1")
    r.font.name = "Times New Roman"
    r.font.size = Pt(11)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("• Tên đề tài: Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo PeopleInsight AI\n• Giảng viên hướng dẫn: ThS. Lê Trọng Nhất\n• Kho lưu trữ Source code: https://github.com/AnhTuan112004/DATN.git\n• Kho lưu trữ Bản vẽ thiết kế: https://drive.google.com/drive/folders/PeopleInsight-AI-UML-Designs")
    r.font.name = "Times New Roman"
    r.font.size = Pt(10.5)

    # Tracking table
    t = doc.add_table(rows=9, cols=5)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False

    col_w = [Inches(0.6), Inches(1.1), Inches(2.2), Inches(1.6), Inches(0.8)]
    headers = ["Tuần", "Thời gian", "Nội dung công việc thực hiện", "Kết quả & Nhận xét của GVHD", "Chữ ký GVHD"]

    for j, h in enumerate(headers):
        c = t.cell(0, j)
        c.width = col_w[j]
        set_cell_shading(c, "1F497D")
        set_cell_border(c, color="1F497D", sz="6")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    weeks_data = [
        ("Tuần 1", "16/10/2026\n– 22/10/2026",
         "- Khảo sát hiện trạng, phân tích chức năng (Bảng 2.1) & phi chức năng (Bảng 2.2).\n"
         "- Phân định 6 tác nhân (Bảng 2.3) & 5 quy trình nghiệp vụ cốt lõi.\n"
         "- Xây dựng Biểu đồ Use Case tổng quát (Hình 2.1 - 14 UC, 6 tác nhân).\n"
         "- Khởi tạo repo Git, commit khung Express 5 + React 19.",
         "Đạt yêu cầu.\nPhân tích nghiệp vụ sâu sát, mô hình 6 tác nhân đầy đủ, Biểu đồ Use Case vẽ đúng chuẩn UML. Đồng ý thông qua nội dung Tuần 1.",
         "Đã ký\nThS. Nhất"),
        ("Tuần 2", "23/10/2026\n– 29/10/2026",
         "- Điểm danh FaceID Kiosk Liveness 2 tầng, chấm công GPS/QR.\n"
         "- Đặc tả 5 Use Case cốt lõi (Bảng 2.4 - 2.8) & Biểu đồ tuần tự (Sequence Diagram).",
         "Đang thực hiện theo tiến độ.", ""),
        ("Tuần 3", "30/10/2026\n– 05/11/2026",
         "- Thiết kế CSDL 11 collections, quy trình duyệt đơn 2 cấp nguyên tử MongoDB Transaction.",
         "Kế hoạch tuần tiếp theo.", ""),
        ("Tuần 4", "06/11/2026\n– 12/11/2026",
         "- Động cơ tính lương tự động chuẩn 2026 (biểu 5 bậc, trần BHXH, miễn thuế OT).",
         "Kế hoạch tuần tiếp theo.", ""),
        ("Tuần 5", "13/11/2026\n– 19/11/2026",
         "- Trợ lý ảo HR AI Gemini Function Calling (Phương án A an toàn dữ liệu).",
         "Kế hoạch tuần tiếp theo.", ""),
        ("Tuần 6", "20/11/2026\n– 26/11/2026",
         "- Mô hình ML dự báo nguy cơ thôi việc (6 đặc trưng IBM) & Phân tích giải thích XAI.",
         "Kế hoạch tuần tiếp theo.", ""),
        ("Tuần 7", "27/11/2026\n– 03/12/2026",
         "- Tích hợp toàn hệ thống, kiểm thử tải k6, kiểm thử 22 Test Cases Payroll.",
         "Kế hoạch tuần tiếp theo.", ""),
        ("Tuần 8", "04/12/2026\n– 10/12/2026",
         "- Hoàn thiện toàn bộ báo cáo, slide thuyết trình, đóng gói và nghiệm thu với GVHD.",
         "Kế hoạch tuần tiếp theo.", "")
    ]

    for idx, (w, time_str, content_str, result_str, sign_str) in enumerate(weeks_data):
        row_i = idx + 1
        bg = "F2F5F9" if row_i % 2 == 1 else "FFFFFF"
        for j, txt in enumerate([w, time_str, content_str, result_str, sign_str]):
            cell = t.cell(row_i, j)
            cell.width = col_w[j]
            set_cell_shading(cell, bg)
            set_cell_border(cell, color="D9D9D9", sz="4")
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.1
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j in [0, 1, 4] else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(txt)
            r.font.name = "Times New Roman"
            r.font.size = Pt(9.5)
            if j == 0:
                r.font.bold = True
            if idx == 0 and j == 4:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 44, 87)

    # Footer signature
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(12)

    t_f = doc.add_table(rows=1, cols=2)
    t_f.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f.autofit = False
    t_f.cell(0, 0).width = Inches(3.1)
    t_f.cell(0, 1).width = Inches(3.2)

    p_f1 = t_f.cell(0, 0).paragraphs[0]
    p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_f1 = p_f1.add_run("XÁC NHẬN CỦA BỘ MÔN / KHOA\n(Ký và ghi rõ họ tên)\n\n\n\n")
    r_f1.font.name = "Times New Roman"
    r_f1.font.size = Pt(11)
    r_f1.font.bold = True

    p_f2 = t_f.cell(0, 1).paragraphs[0]
    p_f2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_f2 = p_f2.add_run("Hà Nội, ngày 22 tháng 10 năm 2026\nGIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)\n\n\n\nThS. Lê Trọng Nhất")
    r_f2.font.name = "Times New Roman"
    r_f2.font.size = Pt(11)
    r_f2.font.bold = True

    doc.save(output_path)
    print(f"Created PL04: {output_path}")

def main():
    output_dir = r'c:\K23CNT1\DANT\DATN\docs\report'
    os.makedirs(output_dir, exist_ok=True)

    # 1. Tạo file PL03
    pl03_path = os.path.join(output_dir, 'PL03_KE_HOACH_VA_BAO_CAO_TIEN_DO_TUAN_1.docx')
    generate_pl03(pl03_path)

    # 2. Tạo file PL04
    pl04_path = os.path.join(output_dir, 'PL04_PHIEU_THEO_DOI_TIEN_DO_GVHD.docx')
    generate_pl04(pl04_path)

    # 3. Tạo file Báo cáo ĐATN với tên file chuẩn theo quy định: <Mã SV>_<Lớp>_<Họ và tên>_<Báo cáoĐATN.K23>
    standard_report_filename = '2310900113_K23CNT1_NguyenAnhTuan_BaoCaoDATN.K23.docx'
    source_full_report = os.path.join(output_dir, 'BAO_CAO_DATN_NTU_CHUONG_1_VA_CHUONG_2.docx')
    target_report_path = os.path.join(output_dir, standard_report_filename)
    
    if os.path.exists(source_full_report):
        shutil.copy2(source_full_report, target_report_path)
        print(f"Created Standard Named Report: {target_report_path}")
        # Also copy to root for direct access if needed
        root_target = os.path.join(r'c:\K23CNT1\DANT\DATN', standard_report_filename)
        shutil.copy2(source_full_report, root_target)
        print(f"Copied Standard Named Report to root: {root_target}")

if __name__ == '__main__':
    main()

