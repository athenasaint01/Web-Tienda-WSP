import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Configurar Cloudinary con las credenciales del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary
 * @param fileBuffer - Buffer del archivo a subir
 * @param folder - Carpeta en Cloudinary donde se guardará (opcional)
 * @returns URL pública de la imagen subida
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = 'productos'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `alahas/${folder}`, // Organizar en carpetas
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño máximo
          { quality: 'auto:good' }, // Optimización automática
          { fetch_format: 'auto' }, // Formato automático (WebP si el navegador lo soporta)
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error('No se pudo subir la imagen'));
        } else {
          resolve(result.secure_url); // URL HTTPS de la imagen
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Elimina una imagen de Cloudinary usando su URL
 * @param imageUrl - URL de la imagen a eliminar
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extraer el public_id de la URL de Cloudinary
    // Ejemplo: https://res.cloudinary.com/ded7fgis1/image/upload/v1234567890/alahas/productos/abc123.jpg
    // public_id = alahas/productos/abc123
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      console.warn('URL no es de Cloudinary, no se puede eliminar:', imageUrl);
      return;
    }

    // Obtener el path después de /upload/v123456/
    const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');

    // Remover la extensión del archivo
    const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Imagen eliminada de Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Error al eliminar imagen de Cloudinary:', error);
    // No lanzamos error para que no falle la operación principal
  }
};

/**
 * Elimina múltiples imágenes de Cloudinary
 * @param imageUrls - Array de URLs de imágenes a eliminar
 */
export const deleteImages = async (imageUrls: string[]): Promise<void> => {
  await Promise.all(imageUrls.map((url) => deleteImage(url)));
};

export default cloudinary;
