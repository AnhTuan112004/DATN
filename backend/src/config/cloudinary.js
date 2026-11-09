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

  const dataUri = Buffer.isBuffer(buffer)
    ? `data:image/jpeg;base64,${buffer.toString('base64')}`
    : String(buffer);

  return new Promise((resolve) => {
    // Nếu trong môi trường test, hoặc không có keys thật hoặc là mock key
    const isMock =
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY.includes('mock') ||
      !process.env.CLOUDINARY_API_SECRET ||
      process.env.CLOUDINARY_API_SECRET.includes('mock') ||
      process.env.NODE_ENV === 'test';

    if (isMock) {
      return resolve({
        url: dataUri,
        publicId: `${folder}/${publicId || 'avatar'}`,
        format: 'jpeg',
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
          console.warn('[Cloudinary Warning] Upload thất bại, tự động chuyển về fallback Data URI:', error.message);
          return resolve({
            url: dataUri,
            publicId: `${folder}/${publicId || 'avatar'}`,
            format: 'jpeg',
            bytes: buffer.length,
          });
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
