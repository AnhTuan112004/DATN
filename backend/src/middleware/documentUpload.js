import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ văn bản đơn từ (Word .docx, .doc, .pdf)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
      .slice(0, 50);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  },
});

// Bộ lọc định dạng file: chấp nhận Word (.docx, .doc), PDF, hình ảnh scan
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.doc', '.docx', '.pdf', '.odt', '.txt', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Định dạng tệp không được hỗ trợ. Vui lòng tải lên tài liệu Word (.docx, .doc), PDF hoặc ảnh scan!'
      ),
      false
    );
  }
};

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // Tối đa 15MB cho tài liệu Word/PDF
  },
  fileFilter,
});

