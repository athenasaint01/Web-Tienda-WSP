import multer from 'multer';
import { uploadImage, deleteImage as deleteCloudinaryImage } from './cloudinary';

// Configuración de multer para almacenamiento temporal en memoria
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

// Tipos de tamaños de imagen (mantenidos para compatibilidad, pero no se usan)
export const IMAGE_SIZES = {
  thumbnail: { width: 400, height: 400 },
  medium: { width: 800, height: 800 },
  original: { width: 1200, height: 1200 },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Procesa una imagen y la sube a Cloudinary
 * Cloudinary maneja automáticamente las transformaciones y optimizaciones
 * @param buffer - Buffer de la imagen original
 * @param filename - Nombre base del archivo (ej: "collar-aurora-1")
 * @returns URL de la imagen subida a Cloudinary
 */
export const processImage = async (
  buffer: Buffer,
  filename: string
): Promise<{ thumbnail: string; medium: string; original: string }> => {
  try {
    // Subir imagen a Cloudinary
    const imageUrl = await uploadImage(buffer, 'productos');

    // Cloudinary permite transformaciones on-the-fly agregando parámetros a la URL
    // En lugar de generar 3 archivos, devolvemos la misma URL
    // El frontend puede agregar parámetros de transformación cuando lo necesite
    return {
      thumbnail: imageUrl, // Cloudinary optimizará automáticamente
      medium: imageUrl,
      original: imageUrl,
    };
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    throw error;
  }
};

/**
 * Genera un nombre único para el archivo basado en timestamp y random
 * @param originalName - Nombre original del archivo
 * @param productSlug - Slug del producto (opcional)
 * @returns Nombre único sin extensión
 */
export const generateUniqueFilename = (originalName: string, productSlug?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const base = productSlug || 'product';

  return `${base}-${timestamp}-${random}`;
};

/**
 * Elimina una imagen de Cloudinary
 * @param imageUrl - URL de Cloudinary de la imagen
 */
export const deleteImageFiles = async (imageUrl: string): Promise<void> => {
  try {
    // Si la URL es de Cloudinary, eliminar de allí
    if (imageUrl.includes('cloudinary.com')) {
      await deleteCloudinaryImage(imageUrl);
      console.log(`[DELETE] ✅ Imagen eliminada de Cloudinary: ${imageUrl}`);
    } else {
      // Si es una URL local antigua, solo registrar (no hacer nada)
      console.log(`[DELETE] ⚠️  URL local detectada (legacy), no se elimina: ${imageUrl}`);
    }
  } catch (error) {
    console.error('[DELETE] ❌ Error al eliminar imagen:', error);
    // No lanzar error, solo registrar
  }
};

/**
 * Extrae rutas de imágenes de un producto para poder eliminarlas
 * @param product - Objeto producto con imágenes
 * @returns Array de URLs de imágenes
 */
export const extractImageUrls = (product: any): string[] => {
  if (!product || !product.images) return [];

  return product.images
    .map((img: any) => img.image_url)
    .filter((url: string) => url && url.trim() !== '');
};

/**
 * Procesa una imagen para colecciones
 * @param buffer - Buffer de la imagen
 * @param filename - Nombre del archivo
 * @returns URL de Cloudinary
 */
export const processCollectionImage = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  try {
    // Subir a Cloudinary en carpeta "colecciones"
    const imageUrl = await uploadImage(buffer, 'colecciones');
    return imageUrl;
  } catch (error) {
    console.error('Error al subir imagen de colección a Cloudinary:', error);
    throw error;
  }
};

/**
 * Elimina archivo de imagen de colección
 * @param imageUrl - URL de Cloudinary
 */
export const deleteCollectionImage = async (imageUrl: string): Promise<void> => {
  try {
    if (imageUrl.includes('cloudinary.com')) {
      await deleteCloudinaryImage(imageUrl);
      console.log(`[DELETE COLLECTION] ✅ Imagen eliminada: ${imageUrl}`);
    }
  } catch (error: any) {
    console.error('Error al eliminar imagen de colección:', error);
  }
};
