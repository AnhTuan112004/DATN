import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Tải ảnh đại diện dạng Buffer lên Cloudinary qua upload_stream
 * Tối ưu hóa: crop vuông 400x400 tập trung vào khuôn mặt (gravity: face), xuất định dạng WebP tự động
 * 
 * @param {Buffer} buffer - Buffer dữ liệu tệp ảnh từ Multer memoryStorage
 * @param {Object} options - Tùy chọn folder và publicId
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadAvatarToCloudinary = (buffer, options = {}) => {
  const folder = options.folder || 'peopleinsight/avatars';
  const publicId = options.publicId;

  return new Promise((resolve, reject) => {
    // Nếu trong môi trường test mà không có keys thật hoặc là mock key
    if (
      process.env.NODE_ENV === 'test' &&
      (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.includes('mock'))
    ) {
      return resolve({
        url: `https://res.cloudinary.com/peopleinsight/image/upload/v1234567890/${folder}/${publicId || 'test_avatar'}.webp`,
        publicId: `${folder}/${publicId || 'test_avatar'}`,
        format: 'webp',
        bytes: buffer.length,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'webp' },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

export default cloudinary;
