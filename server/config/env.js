const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * Validates that all required environment variables are present.
 * Throws an error if any are missing.
 */
const validateEnv = () => {
  const coreRequired = [
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'CLIENT_URL'
  ];

  const servicesRequired = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ];

  const missingCore = coreRequired.filter(key => !process.env[key]);
  if (missingCore.length > 0) {
    console.error('MISSING CORE ENVS:', missingCore);
    throw new Error(`Critical core environment variables are missing: ${missingCore.join(', ')}. Please check your .env file.`);
  }

  const missingServices = servicesRequired.filter(key => !process.env[key]);
  if (missingServices.length > 0) {
    if (nodeEnv === 'production') {
      throw new Error(`Production-required service environment variables are missing: ${missingServices.join(', ')}.`);
    } else {
      console.warn(`\n⚠️  WARNING: Missing service environment variables: ${missingServices.join(', ')}.`);
      console.warn(`Features relying on Cloudinary or Razorpay will fail until these are provided in .env\n`);
    }
  }
};

// Validate variables at startup
validateEnv();

module.exports = {
  NODE_ENV: nodeEnv,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL,
  
  // Redis
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || '"IMS Portal" <noreply@ims.example.com>',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};
