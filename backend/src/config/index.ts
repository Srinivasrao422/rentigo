import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rentigo_db?schema=public",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "rentigo_super_secret_access_jwt_key_2026_prod_grade",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "rentigo_super_secret_refresh_jwt_key_2026_prod_grade",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@rentigo.com",
    password: process.env.ADMIN_PASSWORD || "Admin@SecurePass2026!",
  },
};
