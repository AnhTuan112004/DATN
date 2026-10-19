import multer from 'multer';

// Sử dụng memoryStorage để tránh lưu tệp thô tạm thời lên đĩa server (bảo mật & tối ưu I/O)
const storage = multer.memoryStorage();

// Giới hạn dung lượng tối đa 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Danh sách MIME types an toàn được phép tải lên
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error('Định dạng tệp không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
      error.statusCode = 400;
      return cb(error, false);
    }
    cb(null, true);
  },
}).single('avatar');

/**
 * Middleware bọc xử lý tải tệp ảnh đại diện với Multer
 * Bắt lỗi dung lượng vượt quá 2MB và trả mã lỗi HTTP 400 thân thiện
 */
export const uploadAvatarMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Dung lượng ảnh vượt quá giới hạn tối đa cho phép (2MB)',
        });
      }
      return res.status(400).json({
        success: false,
        error: `Lỗi tải tệp: ${err.message}`,
      });
    } else if (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
      });
    }
    next();
  });
};
