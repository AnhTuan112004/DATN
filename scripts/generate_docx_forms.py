import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def disable_spellcheck(doc):
    """Disable red wavy spellcheck underlines across document"""
    settings = doc.settings.element
    if settings.find(qn('w:hideSpellingErrors')) is None:
        settings.append(OxmlElement('w:hideSpellingErrors'))
    if settings.find(qn('w:hideGrammaticalErrors')) is None:
        settings.append(OxmlElement('w:hideGrammaticalErrors'))

    styles = doc.styles
    for style_name in ['Normal', 'Table Grid']:
        if style_name in styles:
            rPr = styles[style_name].element.get_or_add_rPr()
            if rPr.find(qn('w:noProof')) is None:
                rPr.append(OxmlElement('w:noProof'))
            lang = rPr.find(qn('w:lang'))
            if lang is None:
                lang = OxmlElement('w:lang')
                rPr.append(lang)
            lang.set(qn('w:val'), 'vi-VN')

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for b_name, b_val in borders.items():
        if b_val:
            node = parse_xml(f'<w:{b_name} {nsdecls("w")} w:val="{b_val.get("val", "single")}" w:sz="{b_val.get("sz", "4")}" w:space="0" w:color="{b_val.get("color", "000000")}"/>')
            tcBorders.append(node)
        else:
            node = parse_xml(f'<w:{b_name} {nsdecls("w")} w:val="none"/>')
            tcBorders.append(node)
    tcPr.append(tcBorders)

def set_table_borders(table, color="D3D3D3", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_header_table(doc, date_text="Hà Nội, ngày 15 tháng 10 năm 2026"):
    tbl = doc.add_table(rows=1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    # Left: School info
    c0 = tbl.cell(0, 0)
    c0.width = Inches(3.0)
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.line_spacing = 1.15
    p0.paragraph_format.space_after = Pt(2)
    r = p0.add_run("TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI\n")
    r.font.name = "Times New Roman"
    r.font.size = Pt(12)
    r.font.bold = True
    r2 = p0.add_run("KHOA CNTT & CĐS")
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(12)
    r2.font.bold = True
    
    # Right: National motto
    c1 = tbl.cell(0, 1)
    c1.width = Inches(3.5)
    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.line_spacing = 1.15
    p1.paragraph_format.space_after = Pt(2)
    r3 = p1.add_run("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    r3.font.name = "Times New Roman"
    r3.font.size = Pt(12)
    r3.font.bold = True
    r4 = p1.add_run("Độc lập - Tự do - Hạnh phúc\n")
    r4.font.name = "Times New Roman"
    r4.font.size = Pt(12)
    r4.font.bold = True
    r5 = p1.add_run("---------------")
    r5.font.name = "Times New Roman"
    r5.font.size = Pt(10)
    
    # Remove borders from header table
    for row in tbl.rows:
        for cell in row.cells:
            set_cell_borders(cell)
            set_cell_margins(cell, top=0, bottom=40, left=0, right=0)
            
    # Date
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_date.paragraph_format.space_before = Pt(8)
    p_date.paragraph_format.space_after = Pt(14)
    r_date = p_date.add_run(date_text)
    r_date.font.name = "Times New Roman"
    r_date.font.size = Pt(12)
    r_date.font.italic = True

def generate_form_1():
    doc = Document()
    
    # Page setup: A4, 2cm top/bottom/right, 3cm left
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.79)     # 2cm
    section.bottom_margin = Inches(0.79)  # 2cm
    section.left_margin = Inches(1.18)    # 3cm
    section.right_margin = Inches(0.79)   # 2cm
    
    disable_spellcheck(doc)
    
    # Header
    add_header_table(doc, "Hà Nội, ngày 15 tháng 10 năm 2026")
    
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(14)
    r_title = p_title.add_run("ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(15)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0)
    
    def add_sec_h(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.2
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(13)
        r.font.bold = True
        return p
        
    def add_sub_h(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.2
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12.5)
        r.font.bold = True
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Times New Roman"
            rb.font.size = Pt(12)
            rb.font.bold = True
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        return p

    def add_body(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        return p

    # I. Thông tin chung
    add_sec_h("I. Thông tin chung")
    add_sub_h("1. Sinh viên")
    add_body("Họ và tên: Nguyễn Anh Tuấn            Ngày sinh: 11/11/2004            Giới tính: Nam")
    add_body("Số điện thoại: 09xxxxxxxx             Email: nguyenanhtuant1124@gmail.com")
    add_body("Mã SV: 2310900113                     Lớp: 23CNT1                      Khóa: 2023 - 2027")
    add_body("Ngành: Công nghệ thông tin            Loại hình đào tạo: Chính quy")

    add_sub_h("2. Thông tin giảng viên hướng dẫn")
    add_body("Họ và tên: TS. Phạm Thế Quế           Đơn vị công tác: Trường Đại học Nguyễn Trãi")
    add_body("Số điện thoại: ............................................      Email: ................................................................")

    # II. Nội dung đề cương chi tiết
    add_sec_h("II. Nội dung đề cương chi tiết")
    add_sub_h("1. Tên đề tài, nền tảng công nghệ")
    add_bullet(" Nghiên cứu và xây dựng hệ thống quản lý nhân sự doanh nghiệp thông minh tích hợp trí tuệ nhân tạo (PeopleInsight AI).", "- Tên đề tài:")
    add_bullet(" Node.js (Express 5); React 19 (Vite, Tailwind CSS); MediaPipe Face Landmarker; Google Gemini API (@google/genai); scikit-learn / ONNX Runtime; MongoDB (Mongoose fail-closed multi-tenancy).", "- Nền tảng công nghệ:")

    add_sub_h("2. Nội dung dự kiến thực hiện")
    add_bullet(" Khảo sát thực trạng quản trị nhân sự (HRM) tại các doanh nghiệp vừa và nhỏ (SME), phân tích các điểm nghẽn về dữ liệu phân mảnh, gian lận chấm công và sai sót tính lương thủ công.", "-")
    add_bullet(" Nghiên cứu cơ sở pháp lý lao động và chính sách tiền lương, thuế thu nhập cá nhân năm 2026 (Nghị quyết 110/2025/UBTVQH15, Luật BHXH mới, Điều 98 Bộ luật Lao động 2019).", "-")
    add_bullet(" Phân tích và thiết kế kiến trúc hệ thống đa khách thuê cô lập (Multi-tenant Fail-Closed), thiết kế cơ sở dữ liệu NoSQL chuẩn hóa đúng 11 collections (9 P0 cốt lõi + 2 P1) trên MongoDB.", "-")
    add_bullet(" Xây dựng mô-đun xác thực phân quyền 4 cấp (CEO, HR_MANAGER, MANAGER, EMPLOYEE) với cơ chế bảo mật chống IDOR, Refresh Token Rotation an toàn và quản lý hồ sơ nhân sự, hợp đồng, phòng ban 2 cấp.", "-")
    add_bullet(" Phát triển mô-đun chấm công Kiosk thông minh 2 tầng: Tầng 1 kiểm tra thực thể sống (Liveness Detection qua chớp mắt, quay đầu) bằng MediaPipe và Tầng 2 xác thực vector khuôn mặt server-side chống giả mạo ảnh/video; kết hợp chấm công vị trí GPS Geofencing và QR Code động.", "-")
    add_bullet(" Phát triển mô-đun quản lý đơn từ và quy trình phê duyệt 2 cấp (Quản lý trực tiếp -> Trưởng phòng Nhân sự) với giao dịch nguyên tử trừ phép và thông báo thời gian thực qua Socket.io.", "-")
    add_bullet(" Xây dựng công cụ tính lương tự động (Payroll Engine 2026) theo công thức 3 bước, tra cứu tham số chính sách động không hard-code, áp dụng biểu thuế lũy tiến 5 bậc mới, phân tách tiền làm thêm giờ (OT) miễn thuế và khóa kỳ lương an toàn.", "-")
    add_bullet(" Tích hợp Chatbot HR AI hỗ trợ tra cứu tự phục vụ qua Google Gemini theo Phương án A (Backend tự kết xuất dữ liệu vào Markdown template tĩnh, triệt tiêu ảo giác và bảo vệ dữ liệu lương).", "-")
    add_bullet(" Huấn luyện và tích hợp mô hình Machine Learning dự báo nguy cơ thôi việc của nhân viên (Retention Predictor) dựa trên 6 đặc trưng định lượng khách quan (IBM HR Analytics), trực quan hóa Dashboard phân tích nhân sự cho HR.", "-")
    add_bullet(" Thực hiện kiểm thử phần mềm toàn diện (Unit test Payroll 22 ca kiểm thử pass 100%, Load test k6, kiểm toán bảo mật OWASP) và đánh giá độ khả dụng người dùng theo thang đo SUS.", "-")

    add_sub_h("3. Kết quả dự kiến")
    add_bullet(" Xây dựng hoàn chỉnh ứng dụng Web và Kiosk PeopleInsight AI với giao diện trực quan, responsive hiện đại trên máy tính và thiết bị di động.", "-")
    add_bullet(" Cơ sở dữ liệu MongoDB được thiết kế chuẩn 11 collections, bảo đảm an toàn dữ liệu và cô lập tuyệt đối giữa các doanh nghiệp khách thuê.", "-")
    add_bullet(" Mô-đun chấm công khuôn mặt FaceID Kiosk có khả năng chống gian lận ảnh tĩnh và video giả mạo, đạt tỷ lệ nhận diện chính xác cao trong điều kiện thực tế văn phòng.", "-")
    add_bullet(" Mô-đun Payroll Engine 2026 tính toán lương tự động, chính xác 100% đối chiếu với bảng tính chuẩn trên bộ 22 ca kiểm thử pháp lý 2026, hỗ trợ xuất phiếu lương và khóa kỳ an toàn.", "-")
    add_bullet(" Chatbot HR AI phản hồi chính xác thắc mắc về số dư phép, phiếu lương, tổng hợp công mà không làm rò rỉ dữ liệu nhạy cảm ra ngoài mô hình ngôn ngữ lớn.", "-")
    add_bullet(" Mô hình ML phân tích dự báo nghỉ việc đạt chỉ số AUC-ROC >= 0.78, trực quan hóa các yếu tố tác động giúp doanh nghiệp chủ động giữ chân nhân tài.", "-")
    add_bullet(" Hoàn thành đầy đủ báo cáo tốt nghiệp 5 chương, các sơ đồ thiết kế hệ thống, nhật ký thực nghiệm và hướng dẫn cài đặt, triển khai hệ thống.", "-")

    add_sub_h("4. Dự kiến tiến độ thực hiện")
    
    # Progress Table
    table = doc.add_table(rows=9, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table, color="7F8C8D", sz="4")
    
    col_widths = [Inches(0.8), Inches(1.8), Inches(3.9)]
    headers = ["Tuần", "Ngày", "Nội dung"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.width = col_widths[i]
        set_cell_background(cell, "EAECEE")
        set_cell_margins(cell, top=120, bottom=120, left=120, right=120)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.font.bold = True
        
    weeks_data = [
        ("1", "15/10/2026 -\n22/10/2026", 
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n- Đề cương chi tiết và tổng quan về đề tài.\n- Tìm hiểu nền tảng công nghệ: Express 5, React 19, MongoDB Atlas, MediaPipe, Gemini AI.\n- Xây dựng khung kiến trúc Backend Multi-tenant Fail-Closed, cơ chế xác thực JWT Refresh Token Rotation và RBAC 4 cấp.\n- Thiết kế cấu trúc CSDL 11 collections và CRUD hồ sơ nhân sự, phòng ban 2 cấp."),
        ("2", "23/10/2026 -\n30/10/2026", 
         "THIẾT KẾ & XÂY DỰNG MÔ-ĐUN CHẤM CÔNG THÔNG MINH\n- Chức năng chấm công FaceID Kiosk 2 tầng: Tầng 1 Liveness MediaPipe (chớp mắt, quay đầu), Tầng 2 trích xuất vector khuôn mặt và so khớp an toàn server-side.\n- Chức năng chấm công GPS Geofencing (bán kính 100m) và mã QR Code động (chu kỳ 30s).\n- Thiết kế giao diện Kiosk chấm công, cơ chế xác thực Kiosk Token và ghi nhận nhật ký chấm công."),
        ("3", "31/10/2026 –\n07/11/2026", 
         "XÂY DỰNG QUẢN LÝ ĐƠN TỪ & PHÊ DUYỆT 2 CẤP\n- Xây dựng chức năng quản lý đơn từ: Nghỉ phép năm, nghỉ ốm, làm thêm giờ OT, làm việc từ xa WFH, giải trình quên chấm công.\n- Luồng phê duyệt cố định 2 cấp: Quản lý trực tiếp -> Trưởng phòng Nhân sự kèm giao dịch nguyên tử trừ phép.\n- Tích hợp thông báo thời gian thực qua Socket.io.\n- Thực nghiệm đo đạc tỷ lệ nhận diện FaceID đợt 1 (đo FPS, độ trễ và khả năng chống giả mạo)."),
        ("4", "08/11/2026 –\n15/11/2026", 
         "THIẾT KẾ VÀ XÂY DỰNG PAYROLL ENGINE 2026 (PHẦN 1)\n- Thiết kế cấu trúc tham số chính sách động (Bảo hiểm, Thuế TNCN lũy tiến 5 bậc, Lương tối thiểu vùng theo NQ 110/2025/UBTVQH15).\n- Xây dựng công thức tính lương 3 bước: Tổng thu nhập -> Thu nhập chịu thuế -> Thu nhập tính thuế và thực nhận Net.\n- Cơ chế khóa kỳ lương nguyên tử (Atomic Lock) chống sửa đổi dữ liệu quá khứ.\n- Thực hiện 10 ca kiểm thử đơn vị đầu tiên của Payroll Engine."),
        ("5", "16/11/2026 –\n23/11/2026", 
         "HOÀN THIỆN PAYROLL ENGINE & GIAO DIỆN BẢNG LƯƠNG\n- Xử lý quy định làm thêm giờ (OT ngày thường, nghỉ tuần, ngày lễ) và phân tách OT miễn thuế / chịu thuế chuẩn 2026.\n- Tính toán phụ cấp ca đêm, tiền ăn ca, bồi thường ngày phép chưa nghỉ.\n- Hoàn thiện trọn bộ 22 ca kiểm thử Payroll khớp 100% với bảng tính Excel.\n- Lập trình giao diện xem phiếu lương nhân viên, quản trị bảng lương và xuất file Excel cho HR."),
        ("6", "24/11/2026 –\n29/11/2026", 
         "TÍCH HỢP CHATBOT HR AI & CẢNH BÁO QUẢN TRỊ\n- Tích hợp Google Gemini Function Calling theo Phương án A (Backend tự render Markdown template, không gửi dữ liệu lương ngược lại cho LLM).\n- Triển khai 4 công cụ tra cứu tự phục vụ: xem số dư phép, phiếu lương cá nhân, tổng hợp công, thống kê đơn từ.\n- Xây dựng hệ thống cảnh báo quản trị (HR Alerts) tự động phát hiện vi phạm chuyên cần và hợp đồng sắp hết hạn.\n- Đánh giá khả năng chống Prompt Injection và độ chính xác phân loại ý định tra cứu."),
        ("7", "30/11/2026 –\n06/12/2026", 
         "XÂY DỰNG MÔ HÌNH ML DỰ BÁO NGHỈ VIỆC & DASHBOARD\n- Tiền xử lý dữ liệu và huấn luyện mô hình dự báo thôi việc (Retention Predictor) với 6 đặc trưng định lượng khách quan.\n- Đóng gói mô hình suy luận trực tiếp trên Node.js qua ONNX Runtime.\n- Xây dựng Dashboard phân tích rủi ro nhân sự trực quan bằng biểu đồ Recharts cho cấp quản lý.\n- Thực nghiệm FaceID đợt 2, đóng băng toàn bộ tính năng phần mềm (Feature Freeze)."),
        ("8", "07/12/2026 –\n15/12/2026", 
         "KIỂM THỬ TOÀN DIỆN, ĐÁNH GIÁ UAT & HOÀN THIỆN BÁO CÁO\n- Kiểm thử tải k6 với 100 người dùng đồng thời, rà soát bảo mật OWASP, kiểm tra phân quyền IDOR.\n- Tổ chức thử nghiệm chấp nhận người dùng (UAT) và đánh giá độ khả dụng theo thang đo chuẩn SUS.\n- Hoàn thiện toàn diện báo cáo tốt nghiệp 5 chương, slide thuyết trình và video demo sản phẩm.\n- Đóng gói mã nguồn, nghiệm thu sản phẩm với Giảng viên hướng dẫn và chuẩn bị bảo vệ.")
    ]
    
    for row_idx, (w, d, c) in enumerate(weeks_data, start=1):
        c_w = table.cell(row_idx, 0)
        c_d = table.cell(row_idx, 1)
        c_c = table.cell(row_idx, 2)
        
        c_w.width = col_widths[0]
        c_d.width = col_widths[1]
        c_c.width = col_widths[2]
        
        for cell in [c_w, c_d, c_c]:
            set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
            
        p_w = c_w.paragraphs[0]
        p_w.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p_w.add_run(w)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        r.font.bold = True
        
        p_d = c_d.paragraphs[0]
        p_d.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p_d.add_run(d)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10.5)
        
        p_c = c_c.paragraphs[0]
        p_c.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_c.paragraph_format.line_spacing = 1.15
        
        # Split title and bullets
        lines = c.split('\n')
        r_head = p_c.add_run(lines[0] + "\n")
        r_head.font.name = "Times New Roman"
        r_head.font.size = Pt(11)
        r_head.font.bold = True
        
        for line in lines[1:]:
            r_bullet = p_c.add_run(line + "\n")
            r_bullet.font.name = "Times New Roman"
            r_bullet.font.size = Pt(10.5)
            
    # Signatures: 3 columns
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    sig_tbl = doc.add_table(rows=2, cols=3)
    sig_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_tbl.autofit = False
    
    sig_widths = [Inches(2.1), Inches(2.2), Inches(2.2)]
    headers_sig = [
        "Sinh viên thực hiện\n(Ký và ghi rõ họ tên)",
        "Giảng viên hướng dẫn\n(Ký và ghi rõ họ tên)",
        "Xác nhận của Khoa\n(Ký và ghi rõ họ tên)"
    ]
    
    for i, h in enumerate(headers_sig):
        cell = sig_tbl.cell(0, i)
        cell.width = sig_widths[i]
        set_cell_borders(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        lines = h.split('\n')
        r1 = p.add_run(lines[0] + "\n")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(11.5)
        r1.font.bold = True
        r2 = p.add_run(lines[1])
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(10.5)
        r2.font.italic = True
        
    names = [
        "\n\n\n\nNguyễn Anh Tuấn",
        "\n\n\n\nTS. Phạm Thế Quế",
        "\n\n\n\nThS. ....................................."
    ]
    for i, name in enumerate(names):
        cell = sig_tbl.cell(1, i)
        cell.width = sig_widths[i]
        set_cell_borders(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(name)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.font.bold = True

    out_path = os.path.abspath("docs/report/DE_CUONG_DO_AN_TOT_NGHIEP_NTU.docx")
    doc.save(out_path)
    print(f"Saved Form 1: {out_path}")

def generate_form_2():
    doc = Document()
    
    # Page setup: A4, 2cm margins, left 2.5cm
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.79)
    section.bottom_margin = Inches(0.79)
    section.left_margin = Inches(0.98)     # 2.5cm
    section.right_margin = Inches(0.79)    # 2cm
    
    disable_spellcheck(doc)
    
    # Header
    add_header_table(doc, "Hà Nội, ngày 19 tháng 10 năm 2026")
    
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("BẢNG THEO DÕI TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN TỐT NGHIỆP")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(14)
    r_title.font.bold = True
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("(Phiếu dành cho giảng viên hướng dẫn/ sinh viên)")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(11.5)
    r_sub.font.italic = True
    
    # Table has:
    # 8 weeks. Each week has:
    # Row A: Tuần | Ngày | Nội dung | Đã thực hiện (%) | Tiếp tục thực hiện (%) | GVHD ký
    # Row B: Merged row across all cols or note: "Duyệt lần X: Đánh giá khối lượng hoàn thành: ... %"
    # Total rows = 1 (header row 1) + 1 (header row 2) + 8 * 2 = 18 rows
    table = doc.add_table(rows=18, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table, color="7F8C8D", sz="4")
    
    col_widths = [Inches(0.6), Inches(1.3), Inches(2.6), Inches(0.9), Inches(0.9), Inches(1.0)]
    
    # Header Row 0
    # Merge Tuần: cell(0,0) and cell(1,0)
    table.cell(0, 0).merge(table.cell(1, 0))
    table.cell(0, 1).merge(table.cell(1, 1))
    table.cell(0, 2).merge(table.cell(1, 2))
    # Col 3 & 4 merged in Row 0 for "Khối lượng"
    table.cell(0, 3).merge(table.cell(0, 4))
    table.cell(0, 5).merge(table.cell(1, 5))
    
    # Header text
    headers_top = [
        (0, 0, "Tuần"),
        (0, 1, "Ngày"),
        (0, 2, "Nội dung"),
        (0, 3, "Khối lượng"),
        (0, 5, "GVHD\n(ký tên)")
    ]
    for r, c, txt in headers_top:
        cell = table.cell(r, c)
        set_cell_background(cell, "EAECEE")
        set_cell_margins(cell, top=80, bottom=80, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(txt)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10.5)
        run.font.bold = True
        
    headers_sub = [
        (1, 3, "Đã thực\nhiện (%)"),
        (1, 4, "Tiếp tục\nthực hiện (%)")
    ]
    for r, c, txt in headers_sub:
        cell = table.cell(r, c)
        set_cell_background(cell, "EAECEE")
        set_cell_margins(cell, top=60, bottom=60, left=40, right=40)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(txt)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.font.bold = True
        
    weeks_data = [
        ("1", "15/10/2026 -\n22/10/2026", 
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n- Đề cương chi tiết\n- Tổng quan về đề tài\n- Tìm hiểu nền tảng công nghệ: Express 5, React 19, MongoDB Atlas, MediaPipe, Gemini AI.\n- Xây dựng kiến trúc Backend Multi-tenant Fail-Closed, Auth JWT Refresh Rotation, RBAC 4 cấp, CSDL 11 collections.",
         "100%", "0%", "Duyệt lần 1: Đánh giá khối lượng hoàn thành: 100%"),
        ("2", "23/10/2026 -\n30/10/2026", 
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n- Chức năng chấm công FaceID Kiosk 2 tầng: Tầng 1 Liveness MediaPipe, Tầng 2 trích xuất vector khuôn mặt & so khớp server-side.\n- Chức năng chấm công GPS Geofencing (100m) và QR Code động (30s).\n- Thiết kế giao diện Kiosk chấm công, xác thực Kiosk Token.",
         "", "", "Duyệt lần 2: Đánh giá khối lượng hoàn thành: ……%"),
        ("3", "31/10/2026 –\n07/11/2026", 
         "KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG\n- Biểu đồ use case phân rã chức năng\n- Đặc tả use case, Sequence diagram, Activity diagram\n- Xây dựng mô-đun quản lý đơn từ và luồng phê duyệt 2 cấp (Manager -> HR Manager) với giao dịch nguyên tử trừ phép.\n- Tích hợp thông báo thời gian thực Socket.io; thực nghiệm FaceID đợt 1.",
         "", "", "Duyệt lần 3: Đánh giá khối lượng hoàn thành: ……%"),
        ("4", "08/11/2026 –\n15/11/2026", 
         "THIẾT KẾ HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU\n- Thiết kế kiến trúc tổng quan, thiết kế gói, thiết kế CSDL 11 collections.\n- Xây dựng Payroll Engine 2026 (Phần 1): Cấu trúc tham số chính sách động, công thức tính lương 3 bước chuẩn NQ 110/2025/UBTVQH15, khóa kỳ lương nguyên tử.\n- Kiểm thử 10 ca unit test đầu tiên của Payroll.",
         "", "", "Duyệt lần 4: Đánh giá khối lượng hoàn thành: ……%"),
        ("5", "16/11/2026 –\n23/11/2026", 
         "XÂY DỰNG ỨNG DỤNG (FRONT-END & PAYROLL)\n- Lập trình Front-end React 19: Giao diện xem phiếu lương nhân viên, quản trị bảng lương và chốt kỳ cho HR.\n- Hoàn thiện Payroll Engine (Phần 2): OT miễn thuế/chịu thuế, phụ cấp ca đêm, ăn ca, hoàn thành 22/22 ca test khớp 100% Excel.\n- Xuất báo cáo Excel bảng lương (SheetJS).",
         "", "", "Duyệt lần 5: Đánh giá khối lượng hoàn thành: ……%"),
        ("6", "24/11/2026 –\n29/11/2026", 
         "XÂY DỰNG ỨNG DỤNG (BACK-END & AI CHATBOT)\n- Lập trình Back-end Chatbot HR AI qua Google Gemini Function Calling Phương án A (Backend tự render Markdown template, không gửi PII cho LLM).\n- Xây dựng 4 công cụ tra cứu tự phục vụ: ngày phép, phiếu lương, tổng hợp công, đơn từ.\n- Hệ thống cảnh báo chuyên cần & hợp đồng tự động (HR Alerts).",
         "", "", "Duyệt lần 6: Đánh giá khối lượng hoàn thành: ……%"),
        ("7", "30/11/2026 –\n06/12/2026", 
         "HOÀN THÀNH ỨNG DỤNG, KIỂM THỬ\n- Huấn luyện và tích hợp mô hình Machine Learning dự báo nguy cơ thôi việc (Retention Predictor) dựa trên 6 đặc trưng định lượng (IBM HR Analytics).\n- Xây dựng Dashboard phân tích nhân sự (Recharts).\n- Thực nghiệm FaceID đợt 2, chốt ngưỡng và đóng băng tính năng (Feature Freeze).",
         "", "", "Duyệt lần 7: Đánh giá khối lượng hoàn thành: ……%"),
        ("8", "07/12/2026 –\n15/12/2026", 
         "HOÀN THÀNH BÁO CÁO, HOÀN THÀNH SẢN PHẨM DEMO\n- Kiểm thử tải k6 với 100 VU, kiểm tra bảo mật OWASP, phân quyền IDOR.\n- Thử nghiệm người dùng UAT và thu thập đánh giá theo thang đo SUS (mục tiêu >= 75).\n- Hoàn thiện toàn diện báo cáo tốt nghiệp 5 chương, slide thuyết trình, video demo.\n- Đóng gói mã nguồn và nghiệm thu ĐATN.",
         "", "", "Duyệt lần 8: Đánh giá khối lượng hoàn thành: ……%")
    ]
    
    current_row = 2
    for w, d, c, p_done, p_cont, review in weeks_data:
        # Row A: Content
        row_cells = [table.cell(current_row, i) for i in range(6)]
        for i, cell in enumerate(row_cells):
            cell.width = col_widths[i]
            set_cell_margins(cell, top=70, bottom=70, left=60, right=60)
            
        # Col 0: Week
        p = row_cells[0].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(w)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10.5)
        r.font.bold = True
        
        # Col 1: Date
        p = row_cells[1].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(d)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        
        # Col 2: Content
        p = row_cells[2].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        lines = c.split('\n')
        r_head = p.add_run(lines[0] + "\n")
        r_head.font.name = "Times New Roman"
        r_head.font.size = Pt(10)
        r_head.font.bold = True
        for line in lines[1:]:
            r_bullet = p.add_run(line + "\n")
            r_bullet.font.name = "Times New Roman"
            r_bullet.font.size = Pt(9.5)
            
        # Col 3: Done %
        p = row_cells[3].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(p_done)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10.5)
        if p_done:
            r.font.bold = True
            
        # Col 4: Cont %
        p = row_cells[4].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(p_cont)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10.5)
        
        # Col 5: GVHD
        p = row_cells[5].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Row B: Review note row
        # Merge all 6 cells of the review row
        cell_rev_start = table.cell(current_row + 1, 0)
        cell_rev_end = table.cell(current_row + 1, 5)
        cell_rev = cell_rev_start.merge(cell_rev_end)
        
        set_cell_background(cell_rev, "F8F9F9")
        set_cell_margins(cell_rev, top=50, bottom=50, left=120, right=60)
        p_rev = cell_rev.paragraphs[0]
        p_rev.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_rev = p_rev.add_run(review)
        r_rev.font.name = "Times New Roman"
        r_rev.font.size = Pt(10)
        r_rev.font.italic = True
        if "100%" in review:
            r_rev.font.bold = True
            
        current_row += 2
        
    # Signatures: 2 columns
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    sig_tbl = doc.add_table(rows=2, cols=2)
    sig_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_tbl.autofit = False
    
    sig_widths = [Inches(3.5), Inches(3.5)]
    headers_sig = [
        "Sinh viên thực hiện\n(Ký và ghi rõ họ tên)",
        "Giảng viên hướng dẫn\n(Ký và ghi rõ họ tên)"
    ]
    
    for i, h in enumerate(headers_sig):
        cell = sig_tbl.cell(0, i)
        cell.width = sig_widths[i]
        set_cell_borders(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        lines = h.split('\n')
        r1 = p.add_run(lines[0] + "\n")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(11.5)
        r1.font.bold = True
        r2 = p.add_run(lines[1])
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(10.5)
        r2.font.italic = True
        
    names = [
        "\n\n\n\nNguyễn Anh Tuấn",
        "\n\n\n\nTS. Phạm Thế Quế"
    ]
    for i, name in enumerate(names):
        cell = sig_tbl.cell(1, i)
        cell.width = sig_widths[i]
        set_cell_borders(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(name)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.font.bold = True

    out_path = os.path.abspath("docs/report/BANG_THEO_DOI_TIEN_DO_DATN_NTU.docx")
    doc.save(out_path)
    print(f"Saved Form 2: {out_path}")

if __name__ == "__main__":
    generate_form_1()
    generate_form_2()
