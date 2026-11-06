import os
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

def set_cell_border(cell, color="000000", sz="4"):
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

def add_ntu_header(doc):
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell_l = table.cell(0, 0)
    cell_r = table.cell(0, 1)
    cell_l.width = Inches(2.8)
    cell_r.width = Inches(3.5)
    
    p_l = cell_l.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.paragraph_format.space_before = Pt(0)
    p_l.paragraph_format.space_after = Pt(2)
    p_l.paragraph_format.line_spacing = 1.15
    r_l1 = p_l.add_run("TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI\n")
    r_l1.font.name = "Times New Roman"
    r_l1.font.size = Pt(11)
    r_l1.font.bold = True
    r_l2 = p_l.add_run("KHOA CNTT & CĐS")
    r_l2.font.name = "Times New Roman"
    r_l2.font.size = Pt(11)
    r_l2.font.bold = True
    
    p_r = cell_r.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_r.paragraph_format.space_before = Pt(0)
    p_r.paragraph_format.space_after = Pt(2)
    p_r.paragraph_format.line_spacing = 1.15
    r_r1 = p_r.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    r_r1.font.name = "Times New Roman"
    r_r1.font.size = Pt(11)
    r_r1.font.bold = True
    r_r2 = p_r.add_run("Độc lập – Tự do – Hạnh phúc")
    r_r2.font.name = "Times New Roman"
    r_r2.font.size = Pt(10.5)
    r_r2.font.bold = True
    r_r2.font.italic = True

    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_date.paragraph_format.space_before = Pt(4)
    p_date.paragraph_format.space_after = Pt(8)
    r_d = p_date.add_run("Hà Nội, ngày 22 tháng 10 năm 2026")
    r_d.font.name = "Times New Roman"
    r_d.font.size = Pt(11)
    r_d.font.italic = True

def generate_pl04_tracking(output_path):
    doc = Document()
    setup_page(doc)
    add_ntu_header(doc)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    r1 = p_title.add_run("BẢNG THEO DÕI TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN TỐT NGHIỆP\n")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(14)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(16, 44, 87)
    r2 = p_title.add_run("(Phiếu dành cho giảng viên hướng dẫn/ sinh viên)")
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(11)
    r2.font.italic = True

    p_info = doc.add_paragraph()
    p_info.paragraph_format.space_before = Pt(6)
    p_info.paragraph_format.space_after = Pt(6)
    p_info.paragraph_format.line_spacing = 1.15
    r_i = p_info.add_run(
        "• Họ và tên sinh viên: Nguyễn Anh Tuấn      Mã SV: 2310900113      Lớp: 23CNT1\n"
        "• Đề tài: Phát triển hệ thống quản lý nhân sự doanh nghiệp tích hợp trí tuệ nhân tạo (PeopleInsight AI)\n"
        "• Giảng viên hướng dẫn: ThS. Lê Trọng Nhất"
    )
    r_i.font.name = "Times New Roman"
    r_i.font.size = Pt(11)

    # Weekly Tracking Table
    # Rows: Header 1, Header 2, then for each week: Task row + Approval row
    # Total rows = 2 (headers) + 8 * 2 (week task + approval) = 18 rows
    table = doc.add_table(rows=18, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(0.6), Inches(1.1), Inches(2.6), Inches(1.2), Inches(0.8)]

    # Header Row 0
    # Cell 0: Tuần (merged vertically with row 1)
    # Cell 1: Ngày (merged vertically with row 1)
    # Cell 2: Nội dung (merged vertically with row 1)
    # Cell 3: Khối lượng (spans col 3 & 4 or has 2 subcols)
    # Cell 4: GVHD (ký tên)
    headers_r0 = [
        ("Tuần", 0), ("Ngày", 1), ("Nội dung", 2),
        ("Khối lượng", 3), ("GVHD\n(ký tên)", 4)
    ]
    for txt, c_idx in headers_r0:
        c = table.cell(0, c_idx)
        set_cell_shading(c, "E5E7EB")
        set_cell_border(c, color="000000", sz="4")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(txt)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9.5)
        r.font.bold = True

    # Header Row 1 (subheaders for Khối lượng)
    # Cell 0, 1, 2, 4 are empty or merged, Cell 3 has "Đã thực hiện (%)", Cell 4 has "Tiếp tục thực hiện (%)"
    # Actually, let's keep it simple: 5 columns: Tuần, Ngày, Nội dung, Khối lượng (Đã làm / Tiếp tục), GVHD ký
    table.cell(0, 0).merge(table.cell(1, 0))
    table.cell(0, 1).merge(table.cell(1, 1))
    table.cell(0, 2).merge(table.cell(1, 2))
    
    # Col 3 & 4 in row 0: merge for "Khối lượng"
    c_kl = table.cell(0, 3).merge(table.cell(0, 4))
    c_kl.paragraphs[0].text = "Khối lượng"
    c_kl.paragraphs[0].runs[0].font.bold = True
    c_kl.paragraphs[0].runs[0].font.name = "Times New Roman"
    c_kl.paragraphs[0].runs[0].font.size = Pt(9.5)
    c_kl.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    c_sub1 = table.cell(1, 3)
    c_sub1.paragraphs[0].text = "Đã thực hiện\n(%)"
    c_sub1.paragraphs[0].runs[0].font.bold = True
    c_sub1.paragraphs[0].runs[0].font.name = "Times New Roman"
    c_sub1.paragraphs[0].runs[0].font.size = Pt(8.5)
    c_sub1.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_cell_shading(c_sub1, "F3F4F6")
    set_cell_border(c_sub1, color="000000", sz="4")

    c_sub2 = table.cell(1, 4)
    c_sub2.paragraphs[0].text = "Tiếp tục\n(%)"
    c_sub2.paragraphs[0].runs[0].font.bold = True
    c_sub2.paragraphs[0].runs[0].font.name = "Times New Roman"
    c_sub2.paragraphs[0].runs[0].font.size = Pt(8.5)
    c_sub2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_cell_shading(c_sub2, "F3F4F6")
    set_cell_border(c_sub2, color="000000", sz="4")

    weeks_content = [
        (1, "15/10/2026 -\n22/10/2026",
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n"
         "- Đề cương chi tiết\n"
         "- Tổng quan về đề tài\n"
         "- Tìm hiểu nền tảng công nghệ: Express 5, React 19, MongoDB Atlas, MediaPipe, Gemini AI.\n"
         "- Xây dựng kiến trúc Backend Multi-tenant Fail-Closed, Auth JWT Refresh Rotation, RBAC 4 cấp, CSDL 11 collections.",
         "100%", "0%", "Duyệt lần 1: Đánh giá khối lượng hoàn thành 100% (Đạt)"),
        
        (2, "23/10/2026 -\n30/10/2026",
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n"
         "Chức năng của hệ thống\n"
         "Một số chức năng chính\n"
         "Yêu cầu phi chức năng\n"
         "Các tác nhân tham gia hệ thống\n"
         "Quy trình nghiệp vụ trong hệ thống\n"
         "Các tác nhân tham gia hệ thống\n"
         "Biểu đồ use case tổng quát",
         "100%", "0%", "Duyệt lần 2: Đánh giá khối lượng hoàn thành 100% (Đạt)"),
         
        (3, "31/10/2026 –\n07/11/2026",
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n"
         "Biểu đồ use case phân rã chức năng\n"
         "Đặc tả use case\n"
         "Sequence diagram\n"
         "Activity diagram",
         "Đang thực hiện", "", "Duyệt lần 3: Đánh giá khối lượng hoàn thành…..%"),
         
        (4, "08/11/2026 –\n15/11/2026",
         "THIẾT KẾ HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU\n"
         "Thiết kế kiến trúc\n"
         "Thiết kế tổng quan\n"
         "Thiết kế chi tiết các gói.\n"
         "Thiết kế giao diện\n"
         "Thiết kế lớp\n"
         "Một số biểu đồ lớp\n"
         "Sơ đồ lớp\n"
         "Thiết kế cơ sở dữ liệu\n"
         "Danh sách bảng\n"
         "Biểu đồ thực thể liên kết",
         "", "", "Duyệt lần 4: Đánh giá khối lượng hoàn thành…..%"),
         
        (5, "16/11/2026 –\n23/11/2026",
         "XÂY DỰNG ỨNG DỤNG\n"
         "Lập trình Front-end",
         "", "", "Duyệt lần 5: Đánh giá khối lượng hoàn thành…..%"),
         
        (6, "24/11/2026 –\n29/11/2026",
         "Lập trình các chức năng:\n"
         "- Điểm danh FaceID Kiosk Liveness 2 tầng, GPS Geofencing, QR Code động.\n"
         "- Phân hệ quản lý đơn từ và phê duyệt 2 cấp nguyên tử.",
         "", "", "Duyệt lần 6: Đánh giá khối lượng hoàn thành…..%"),
         
        (7, "30/11/2026 –\n06/12/2026",
         "Lập trình các chức năng:\n"
         "- Động cơ tính lương tự động 2026 (Payroll Engine 2026) 3 bước, biểu 5 bậc.\n"
         "- Trợ lý ảo HR AI Gemini Function Calling Phương án A.\n"
         "- Mô hình ML dự báo nguy cơ thôi việc IBM HR Attrition.",
         "", "", "Duyệt lần 7: Đánh giá khối lượng hoàn thành…..%"),
         
        (8, "07/12/2026 –\n15/12/2026",
         "Hoàn thành báo cáo ĐATN, Hoàn thành sản phẩm Demo PeopleInsight AI, nghiệm thu bảo vệ.",
         "", "", "Duyệt lần 8: Đánh giá khối lượng hoàn thành…..%")
    ]

    for idx, (w_num, date_str, task_desc, pct_done, pct_next, approval_txt) in enumerate(weeks_content):
        # Row for task
        r_task_idx = 2 + idx * 2
        # Row for approval
        r_appr_idx = r_task_idx + 1

        # Fill task row
        cell_w = table.cell(r_task_idx, 0)
        cell_w.paragraphs[0].text = str(w_num)
        cell_w.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        cell_w.paragraphs[0].runs[0].font.bold = True
        cell_w.paragraphs[0].runs[0].font.name = "Times New Roman"

        cell_d = table.cell(r_task_idx, 1)
        cell_d.paragraphs[0].text = date_str
        cell_d.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        cell_d.paragraphs[0].runs[0].font.name = "Times New Roman"
        cell_d.paragraphs[0].runs[0].font.size = Pt(9)

        cell_t = table.cell(r_task_idx, 2)
        cell_t.paragraphs[0].text = task_desc
        cell_t.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
        cell_t.paragraphs[0].runs[0].font.name = "Times New Roman"
        cell_t.paragraphs[0].runs[0].font.size = Pt(9.5)
        # Bold first line if heading
        if '\n' in task_desc:
            lines = task_desc.split('\n')
            cell_t.paragraphs[0].text = lines[0]
            cell_t.paragraphs[0].runs[0].font.bold = True
            cell_t.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell_t.paragraphs[0].runs[0].font.size = Pt(9.5)
            for extra in lines[1:]:
                p_extra = cell_t.add_paragraph()
                p_extra.paragraph_format.space_before = Pt(1)
                p_extra.paragraph_format.space_after = Pt(1)
                p_extra.paragraph_format.line_spacing = 1.1
                r = p_extra.add_run(extra)
                r.font.name = "Times New Roman"
                r.font.size = Pt(9)

        cell_p1 = table.cell(r_task_idx, 3)
        cell_p1.paragraphs[0].text = pct_done
        cell_p1.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if cell_p1.paragraphs[0].runs:
            cell_p1.paragraphs[0].runs[0].font.bold = True
            cell_p1.paragraphs[0].runs[0].font.name = "Times New Roman"

        cell_p2 = table.cell(r_task_idx, 4)
        cell_p2.paragraphs[0].text = pct_next
        cell_p2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if cell_p2.paragraphs[0].runs:
            cell_p2.paragraphs[0].runs[0].font.name = "Times New Roman"

        for col_i in range(5):
            set_cell_border(table.cell(r_task_idx, col_i), color="000000", sz="4")

        # Fill approval row (merged across all 5 columns!)
        merged_appr = table.cell(r_appr_idx, 0)
        for col_i in range(1, 5):
            merged_appr = merged_appr.merge(table.cell(r_appr_idx, col_i))
        merged_appr.paragraphs[0].text = approval_txt
        merged_appr.paragraphs[0].runs[0].font.name = "Times New Roman"
        merged_appr.paragraphs[0].runs[0].font.size = Pt(9.5)
        merged_appr.paragraphs[0].runs[0].font.italic = True
        merged_appr.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
        set_cell_shading(merged_appr, "F9FAFB")
        set_cell_border(merged_appr, color="000000", sz="4")

    # Set column widths
    for r in table.rows:
        for j, c in enumerate(r.cells):
            c.width = col_widths[j]

    # Signature section
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(12)

    t_sign = doc.add_table(rows=1, cols=2)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sign.autofit = False
    t_sign.cell(0, 0).width = Inches(3.1)
    t_sign.cell(0, 1).width = Inches(3.2)

    p_s1 = t_sign.cell(0, 0).paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("Sinh viên thực hiện\n(Ký và ghi rõ họ tên)\n\n\n\n\nNguyễn Anh Tuấn")
    r_s1.font.name = "Times New Roman"
    r_s1.font.size = Pt(11)
    r_s1.font.bold = True

    p_s2 = t_sign.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("Giảng viên hướng dẫn\n(Ký và ghi rõ họ tên)\n\n\n\n\nThS. Lê Trọng Nhất")
    r_s2.font.name = "Times New Roman"
    r_s2.font.size = Pt(11)
    r_s2.font.bold = True

    doc.save(output_path)
    print(f"Created PL04: {output_path}")

def generate_pl03_outline(output_path):
    doc = Document()
    setup_page(doc)
    add_ntu_header(doc)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(8)
    r1 = p_title.add_run("ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP\n")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(15)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(16, 44, 87)

    # I. THÔNG TIN CHUNG
    p_i = doc.add_paragraph()
    p_i.paragraph_format.space_before = Pt(8)
    p_i.paragraph_format.space_after = Pt(4)
    r_i = p_i.add_run("I. Thông tin chung")
    r_i.font.name = "Times New Roman"
    r_i.font.size = Pt(12)
    r_i.font.bold = True
    r_i.font.color.rgb = RGBColor(16, 44, 87)

    p_sv = doc.add_paragraph()
    p_sv.paragraph_format.left_indent = Inches(0.2)
    p_sv.paragraph_format.space_before = Pt(2)
    p_sv.paragraph_format.space_after = Pt(2)
    p_sv.paragraph_format.line_spacing = 1.15
    r_sv = p_sv.add_run("1. Sinh viên\n")
    r_sv.font.bold = True
    r_sv.font.name = "Times New Roman"
    r_sv_info = p_sv.add_run(
        "• Họ và tên: Nguyễn Anh Tuấn       Ngày sinh: 01/01/2004       Giới tính: Nam\n"
        "• Số điện thoại: 0397568858        Email: nguyenanhtuant1124@gmail.com\n"
        "• Mã SV: 2310900113                Lớp: 23CNT1                 Khóa: 2023-2027\n"
        "• Ngành: Công nghệ thông tin       Loại hình đào tạo: Chính quy"
    )
    r_sv_info.font.name = "Times New Roman"
    r_sv_info.font.size = Pt(11)

    p_gv = doc.add_paragraph()
    p_gv.paragraph_format.left_indent = Inches(0.2)
    p_gv.paragraph_format.space_before = Pt(4)
    p_gv.paragraph_format.space_after = Pt(4)
    p_gv.paragraph_format.line_spacing = 1.15
    r_gv = p_gv.add_run("2. Thông tin giảng viên hướng dẫn\n")
    r_gv.font.bold = True
    r_gv.font.name = "Times New Roman"
    r_gv_info = p_gv.add_run(
        "• Họ và tên: ThS. Lê Trọng Nhất\n"
        "• Đơn vị công tác: Khoa Công nghệ Thông tin và Chuyển đổi số — Trường Đại học Nguyễn Trãi"
    )
    r_gv_info.font.name = "Times New Roman"
    r_gv_info.font.size = Pt(11)

    # II. NỘI DUNG ĐỀ CƯƠNG CHI TIẾT
    p_ii = doc.add_paragraph()
    p_ii.paragraph_format.space_before = Pt(10)
    p_ii.paragraph_format.space_after = Pt(4)
    r_ii = p_ii.add_run("II. Nội dung đề cương chi tiết")
    r_ii.font.name = "Times New Roman"
    r_ii.font.size = Pt(12)
    r_ii.font.bold = True
    r_ii.font.color.rgb = RGBColor(16, 44, 87)

    # 1. Tên đề tài, nền tảng công nghệ
    p_sec1 = doc.add_paragraph()
    p_sec1.paragraph_format.left_indent = Inches(0.2)
    p_sec1.paragraph_format.space_before = Pt(3)
    p_sec1.paragraph_format.space_after = Pt(2)
    r_s1_t = p_sec1.add_run("1. Tên đề tài, nền tảng công nghệ\n")
    r_s1_t.font.bold = True
    r_s1_t.font.name = "Times New Roman"
    r_s1_c = p_sec1.add_run(
        "- Tên đề tài: Nghiên cứu và xây dựng hệ thống quản lý nhân sự doanh nghiệp thông minh tích hợp trí tuệ nhân tạo (PeopleInsight AI).\n"
        "- Nền tảng công nghệ: Node.js (Express 5); React 19 (Vite, Tailwind CSS); MediaPipe Face Landmarker; Google Gemini API (@google/genai); scikit-learn / ONNX Runtime; MongoDB (Mongoose fail-closed multi-tenancy)."
    )
    r_s1_c.font.name = "Times New Roman"
    r_s1_c.font.size = Pt(11)

    # 2. Nội dung dự kiến thực hiện
    p_sec2 = doc.add_paragraph()
    p_sec2.paragraph_format.left_indent = Inches(0.2)
    p_sec2.paragraph_format.space_before = Pt(4)
    p_sec2.paragraph_format.space_after = Pt(2)
    r_s2_t = p_sec2.add_run("2. Nội dung dự kiến thực hiện\n")
    r_s2_t.font.bold = True
    r_s2_t.font.name = "Times New Roman"
    items_sec2 = [
        "- Khảo sát thực trạng quản trị nhân sự (HRM) tại các doanh nghiệp vừa và nhỏ (SME), phân tích các điểm nghẽn về dữ liệu phân mảnh, gian lận chấm công và sai sót tính lương thủ công.",
        "- Nghiên cứu cơ sở pháp lý lao động và chính sách tiền lương, thuế thu nhập cá nhân năm 2026 (Nghị quyết 110/2025/UBTVQH15, Luật BHXH mới, Điều 98 Bộ luật Lao động 2019).",
        "- Phân tích và thiết kế kiến trúc hệ thống đa khách thuê cô lập (Multi-tenant Fail-Closed), thiết kế cơ sở dữ liệu NoSQL chuẩn hóa đúng 11 collections (9 P0 cốt lõi + 2 P1) trên MongoDB.",
        "- Xây dựng mô-đun xác thực phân quyền 4 cấp (CEO, HR_MANAGER, MANAGER, EMPLOYEE) với cơ chế bảo mật chống IDOR, Refresh Token Rotation an toàn và quản lý hồ sơ nhân sự, hợp đồng, phòng ban 2 cấp.",
        "- Phát triển mô-đun chấm công Kiosk thông minh 2 tầng: Tầng 1 kiểm tra thực thể sống (Liveness Detection qua chớp mắt, quay đầu) bằng MediaPipe và Tầng 2 xác thực vector khuôn mặt server-side chống giả mạo ảnh/video; kết hợp chấm công vị trí GPS Geofencing và QR Code động.",
        "- Phát triển mô-đun quản lý đơn từ và quy trình phê duyệt 2 cấp (Quản lý trực tiếp → Trưởng phòng Nhân sự) với giao dịch nguyên tử trừ phép và thông báo thời gian thực qua Socket.io.",
        "- Xây dựng công cụ tính lương tự động (Payroll Engine 2026) theo công thức 3 bước, tra cứu tham số chính sách động không hard-code, áp dụng biểu thuế lũy tiến 5 bậc mới, phân tách tiền làm thêm giờ (OT) miễn thuế và khóa kỳ lương an toàn.",
        "- Tích hợp Chatbot HR AI hỗ trợ tra cứu tự phục vụ qua Google Gemini theo Phương án A (Backend tự kết xuất dữ liệu vào Markdown template tĩnh, triệt tiêu ảo giác và bảo vệ dữ liệu lương).",
        "- Huấn luyện và tích hợp mô hình Machine Learning dự báo nguy cơ thôi việc của nhân viên (Retention Predictor) dựa trên 6 đặc trưng định lượng khách quan (IBM HR Analytics), trực quan hóa Dashboard phân tích nhân sự cho HR.",
        "- Thực hiện kiểm thử phần mềm toàn diện (Unit test Payroll 22 ca kiểm thử pass 100%, Load test k6, kiểm toán bảo mật OWASP) và đánh giá độ khả dụng người dùng theo thang đo SUS."
    ]
    for it in items_sec2:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(it)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # 3. Kết quả dự kiến
    p_sec3 = doc.add_paragraph()
    p_sec3.paragraph_format.left_indent = Inches(0.2)
    p_sec3.paragraph_format.space_before = Pt(4)
    p_sec3.paragraph_format.space_after = Pt(2)
    r_s3_t = p_sec3.add_run("3. Kết quả dự kiến\n")
    r_s3_t.font.bold = True
    r_s3_t.font.name = "Times New Roman"
    items_sec3 = [
        "- Xây dựng hoàn chỉnh ứng dụng Web và Kiosk PeopleInsight AI với giao diện trực quan, responsive hiện đại trên máy tính và thiết bị di động bằng Node.js (Express 5), React 19, Tailwind CSS và MongoDB Atlas.",
        "- Cơ sở dữ liệu MongoDB được thiết kế chuẩn 11 collections, bảo đảm an toàn dữ liệu và cô lập tuyệt đối giữa các doanh nghiệp khách thuê.",
        "- Mô-đun chấm công khuôn mặt FaceID Kiosk có khả năng chống gian lận ảnh tĩnh và video giả mạo, đạt tỷ lệ nhận diện chính xác cao trong điều kiện thực tế văn phòng.",
        "- Mô-đun Payroll Engine 2026 tính toán lương tự động, chính xác 100% đối chiếu với bảng tính chuẩn trên bộ 22 ca kiểm thử pháp lý 2026, hỗ trợ xuất phiếu lương và khóa kỳ an toàn.",
        "- Chatbot HR AI phản hồi chính xác thắc mắc về số dư phép, phiếu lương, tổng hợp công mà không làm rò rỉ dữ liệu nhạy cảm ra ngoài mô hình ngôn ngữ lớn.",
        "- Mô hình ML phân tích dự báo nghỉ việc đạt chỉ số AUC-ROC ≥ 0.78, trực quan hóa các yếu tố tác động giúp doanh nghiệp chủ động giữ chân nhân tài.",
        "- Hoàn thành đầy đủ báo cáo tốt nghiệp đúng quy cách, các sơ đồ thiết kế hệ thống, nhật ký thực nghiệm và hướng dẫn cài đặt, triển khai hệ thống."
    ]
    for it in items_sec3:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(it)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # 4. Dự kiến tiến độ thực hiện (Table 8 weeks)
    p_sec4 = doc.add_paragraph()
    p_sec4.paragraph_format.left_indent = Inches(0.2)
    p_sec4.paragraph_format.space_before = Pt(6)
    p_sec4.paragraph_format.space_after = Pt(4)
    r_s4_t = p_sec4.add_run("4. Dự kiến tiến độ thực hiện\n")
    r_s4_t.font.bold = True
    r_s4_t.font.name = "Times New Roman"

    table_p = doc.add_table(rows=9, cols=3)
    table_p.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_p.autofit = False

    t_widths = [Inches(0.6), Inches(1.3), Inches(4.4)]
    headers_tp = ["Tuần", "Ngày", "Nội dung"]
    for j, h in enumerate(headers_tp):
        c = table_p.cell(0, j)
        set_cell_shading(c, "E5E7EB")
        set_cell_border(c, color="000000", sz="4")
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        r.font.bold = True

    weeks_p_data = [
        ("1", "15/10/2026 -\n22/10/2026",
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n"
         "- Đề cương chi tiết và tổng quan về đề tài.\n"
         "- Tìm hiểu nền tảng công nghệ: Express 5, React 19, MongoDB Atlas, MediaPipe, Gemini AI.\n"
         "- Xây dựng khung kiến trúc Backend Multi-tenant Fail-Closed, cơ chế xác thực JWT Refresh Token Rotation và RBAC 4 cấp.\n"
         "- Thiết kế cấu trúc CSDL 11 collections và CRUD hồ sơ nhân sự, phòng ban 2 cấp."),
        ("2", "23/10/2026 -\n30/10/2026",
         "THIẾT KẾ & XÂY DỰNG MÔ-ĐUN CHẤM CÔNG THÔNG MINH\n"
         "- Chức năng chấm công FaceID Kiosk 2 tầng: Tầng 1 Liveness MediaPipe (chớp mắt, quay đầu), Tầng 2 trích xuất vector khuôn mặt và so khớp an toàn server-side.\n"
         "- Chức năng chấm công GPS Geofencing (bán kính 100m) và mã QR Code động (chu kỳ 30s).\n"
         "- Thiết kế giao diện Kiosk chấm công, cơ chế xác thực Kiosk Token và ghi nhận nhật ký chấm công."),
        ("3", "31/10/2026 –\n07/11/2026",
         "XÂY DỰNG QUẢN LÝ ĐƠN TỪ & PHÊ DUYỆT 2 CẤP\n"
         "- Xây dựng chức năng quản lý đơn từ: Nghỉ phép năm, nghỉ ốm, làm thêm giờ OT, làm việc từ xa WFH, giải trình quên chấm công.\n"
         "- Luồng phê duyệt cố định 2 cấp: Quản lý trực tiếp → Trưởng phòng Nhân sự kèm giao dịch nguyên tử trừ phép.\n"
         "- Tích hợp thông báo thời gian thực qua Socket.io.\n"
         "- Thực nghiệm đo đạc tỷ lệ nhận diện FaceID đợt 1 (đo FPS, độ trễ và khả năng chống giả mạo)."),
        ("4", "08/11/2026 –\n15/11/2026",
         "THIẾT KẾ VÀ XÂY DỰNG PAYROLL ENGINE 2026 (PHẦN 1)\n"
         "- Thiết kế cấu trúc tham số chính sách động (Bảo hiểm, Thuế TNCN lũy tiến 5 bậc, Lương tối thiểu vùng theo NQ 110/2025/UBTVQH15).\n"
         "- Xây dựng công thức tính lương 3 bước: Tổng thu nhập → Thu nhập chịu thuế → Thu nhập tính thuế và thực nhận Net.\n"
         "- Cơ chế khóa kỳ lương nguyên tử (Atomic Lock) chống sửa đổi dữ liệu quá khứ.\n"
         "- Thực hiện 10 ca kiểm thử đơn vị đầu tiên của Payroll Engine."),
        ("5", "16/11/2026 –\n23/11/2026",
         "HOÀN THIỆN PAYROLL ENGINE & GIAO DIỆN BẢNG LƯƠNG\n"
         "- Xử lý quy định làm thêm giờ (OT ngày thường, nghỉ tuần, ngày lễ) và phân tách OT miễn thuế / chịu thuế chuẩn 2026.\n"
         "- Tính toán phụ cấp ca đêm, tiền ăn ca, bồi thường ngày phép chưa nghỉ.\n"
         "- Hoàn thiện trọn bộ 22 ca kiểm thử Payroll khớp 100% với bảng tính Excel.\n"
         "- Lập trình giao diện xem phiếu lương nhân viên, quản trị bảng lương và xuất file Excel cho HR."),
        ("6", "24/11/2026 –\n29/11/2026",
         "TÍCH HỢP CHATBOT HR AI & CẢNH BÁO QUẢN TRỊ\n"
         "- Tích hợp Google Gemini Function Calling theo Phương án A (Backend tự render Markdown template, không gửi dữ liệu lương ngược lại cho LLM).\n"
         "- Triển khai 4 công cụ tra cứu tự phục vụ: xem số dư phép, phiếu lương cá nhân, tổng hợp công, thống kê đơn từ.\n"
         "- Xây dựng hệ thống cảnh báo quản trị (HR Alerts) tự động phát hiện vi phạm chuyên cần và hợp đồng sắp hết hạn.\n"
         "- Đánh giá khả năng chống Prompt Injection và độ chính xác phân loại ý định tra cứu."),
        ("7", "30/11/2026 –\n06/12/2026",
         "XÂY DỰNG MÔ HÌNH ML DỰ BÁO NGHỈ VIỆC & DASHBOARD\n"
         "- Tiền xử lý dữ liệu và huấn luyện mô hình dự báo thôi việc (Retention Predictor) với 6 đặc trưng định lượng khách quan.\n"
         "- Đóng gói mô hình suy luận trực tiếp trên Node.js qua ONNX Runtime.\n"
         "- Xây dựng Dashboard phân tích rủi ro nhân sự trực quan bằng biểu đồ Recharts cho cấp quản lý.\n"
         "- Thực nghiệm FaceID đợt 2, đóng băng toàn bộ tính năng phần mềm (Feature Freeze)."),
        ("8", "07/12/2026 –\n15/12/2026",
         "KIỂM THỬ TOÀN DIỆN, ĐÁNH GIÁ UAT & HOÀN THIỆN BÁO CÁO\n"
         "- Kiểm thử tải k6 với 100 người dùng đồng thời, rà soát bảo mật OWASP, kiểm tra phân quyền IDOR.\n"
         "- Tổ chức thử nghiệm chấp nhận người dùng (UAT) và đánh giá độ khả dụng theo thang đo chuẩn SUS.\n"
         "- Hoàn thiện toàn diện báo cáo tốt nghiệp đúng quy cách, slide thuyết trình và video demo sản phẩm.\n"
         "- Đóng gói mã nguồn, nghiệm thu sản phẩm với Giảng viên hướng dẫn và chuẩn bị bảo vệ.")
    ]

    for idx, (wn, dt, cont) in enumerate(weeks_p_data):
        row_i = idx + 1
        c0 = table_p.cell(row_i, 0)
        c0.paragraphs[0].text = wn
        c0.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.name = "Times New Roman"

        c1 = table_p.cell(row_i, 1)
        c1.paragraphs[0].text = dt
        c1.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        c1.paragraphs[0].runs[0].font.name = "Times New Roman"
        c1.paragraphs[0].runs[0].font.size = Pt(9)

        c2 = table_p.cell(row_i, 2)
        lines = cont.split('\n')
        c2.paragraphs[0].text = lines[0]
        c2.paragraphs[0].runs[0].font.bold = True
        c2.paragraphs[0].runs[0].font.name = "Times New Roman"
        c2.paragraphs[0].runs[0].font.size = Pt(9.5)
        for extra in lines[1:]:
            p_ex = c2.add_paragraph()
            p_ex.paragraph_format.space_before = Pt(1)
            p_ex.paragraph_format.space_after = Pt(1)
            p_ex.paragraph_format.line_spacing = 1.1
            r = p_ex.add_run(extra)
            r.font.name = "Times New Roman"
            r.font.size = Pt(9)

        for col_j in range(3):
            set_cell_border(table_p.cell(row_i, col_j), color="000000", sz="4")

    for r in table_p.rows:
        for j, c in enumerate(r.cells):
            c.width = t_widths[j]

    # Signature section (3 columns: SV, GVHD, Khoa)
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(14)

    t_sign = doc.add_table(rows=1, cols=3)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sign.autofit = False
    for j in range(3):
        t_sign.cell(0, j).width = Inches(2.1)

    p_s1 = t_sign.cell(0, 0).paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("Sinh viên thực hiện\n(Ký và ghi rõ họ tên)\n\n\n\n\nNguyễn Anh Tuấn")
    r_s1.font.name = "Times New Roman"
    r_s1.font.size = Pt(10.5)
    r_s1.font.bold = True

    p_s2 = t_sign.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("Giảng viên hướng dẫn\n(Ký và ghi rõ họ tên)\n\n\n\n\nThS. Lê Trọng Nhất")
    r_s2.font.name = "Times New Roman"
    r_s2.font.size = Pt(10.5)
    r_s2.font.bold = True

    p_s3 = t_sign.cell(0, 2).paragraphs[0]
    p_s3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s3 = p_s3.add_run("Xác nhận của Khoa\n(Ký và ghi rõ họ tên)\n\n\n\n\n")
    r_s3.font.name = "Times New Roman"
    r_s3.font.size = Pt(10.5)
    r_s3.font.bold = True

    doc.save(output_path)
    print(f"Created PL03: {output_path}")

def main():
    output_dir = r'c:\K23CNT1\DANT\DATN\docs\report'
    
    # Generate PL03 (Đề cương & Báo cáo tiến độ Tuần 1)
    pl03_file = os.path.join(output_dir, 'PL03_KE_HOACH_VA_BAO_CAO_TIEN_DO_TUAN_1.docx')
    generate_pl03_outline(pl03_file)

    # Generate PL04 (Phiếu theo dõi tiến độ thực hiện ĐATN dành cho GVHD)
    pl04_file = os.path.join(output_dir, 'PL04_PHIEU_THEO_DOI_TIEN_DO_GVHD.docx')
    generate_pl04_tracking(pl04_file)

    print("ALL NTU PL03 & PL04 DOCUMENTS GENERATED SUCCESSFULLY!")

if __name__ == '__main__':
    main()

