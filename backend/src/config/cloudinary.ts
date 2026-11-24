import { v2 as cloudinary } from "cloudinary";
import { config } from "./index.js";

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export { cloudinary };

/**
 * Upload an image buffer or file path to Cloudinary
 * Falls back to mock high-resolution vehicle image if Cloudinary not configured
 */
export const uploadVehicleImage = async (
  fileBuffer: Buffer,
  folder: string = "rentigo/vehicles"
): Promise<{ url: string; publicId: string }> => {
  if (config.cloudinary.cloudName && config.cloudinary.apiKey) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 1200, height: 800, crop: "fill", quality: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // Fallback high-res sample vehicle images when Cloudinary credentials are empty
  const fallbackImages = [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
  ];
  const randomUrl = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  return {
    url: randomUrl,
    publicId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };
};
