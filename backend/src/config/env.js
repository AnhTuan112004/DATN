import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apexDomain: process.env.APEX_DOMAIN || 'peopleinsight.vn',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/peopleinsight',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_32_chars_min',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_32_chars_min',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  gemini: {
    primaryKey: process.env.GEMINI_API_KEY_PRIMARY || '',
    fallbackKey: process.env.GEMINI_API_KEY_FALLBACK || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    fallbackModel: process.env.GEMINI_MODEL_FALLBACK || 'gemini-3.1-flash-lite',
  },

  security: {
    qrHmacSecret: process.env.QR_HMAC_SECRET || 'default_qr_hmac_secret_32_chars_min',
    kioskSecret: process.env.KIOSK_CHALLENGE_SECRET || 'default_kiosk_challenge_secret_32_chars',
    cronJobApiKey: process.env.CRON_JOB_API_KEY || 'default_cron_job_api_key_secret',
    biometricEncryptionKey: process.env.BIOMETRIC_ENCRYPTION_KEY || 'default_biometric_aes_key_32bytes!!',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};
