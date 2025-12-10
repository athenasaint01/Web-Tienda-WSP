import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import multer from 'multer';

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

// Tipos de tamaños de imagen
export const IMAGE_SIZES = {
  thumbnail: { width: 400, height: 400 },
  medium: { width: 800, height: 800 },
  original: { width: 1200, height: 1200 }, // Máximo para original
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * Procesa una imagen y genera 3 versiones (thumbnail, medium, original)
 * @param buffer - Buffer de la imagen original
 * @param filename - Nombre base del archivo (ej: "collar-aurora-1")
 * @returns Array de rutas relativas de las imágenes procesadas
 */
export const processImage = async (
  buffer: Buffer,
  filename: string
): Promise<{ thumbnail: string; medium: string; original: string }> => {
  const ext = 'jpg'; // Siempre convertimos a JPG para optimización
  const uploadsDir = path.join(process.cwd(), 'uploads', 'products');

  // Asegurar que las carpetas existen
  await ensureDirectories();

  const paths = {
    thumbnail: path.join(uploadsDir, 'thumbnails', `${filename}.${ext}`),
    medium: path.join(uploadsDir, 'medium', `${filename}.${ext}`),
    original: path.join(uploadsDir, 'original', `${filename}.${ext}`),
  };

  const relativePaths = {
    thumbnail: `/uploads/products/thumbnails/${filename}.${ext}`,
    medium: `/uploads/products/medium/${filename}.${ext}`,
    original: `/uploads/products/original/${filename}.${ext}`,
  };

  try {
    // Procesar imagen original (optimizada)
    await sharp(buffer)
      .resize(IMAGE_SIZES.original.width, IMAGE_SIZES.original.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(paths.original);

    // Procesar medium
    await sharp(buffer)
      .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
        fit: 'cover',
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(paths.medium);

    // Procesar thumbnail
    await sharp(buffer)
      .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
        fit: 'cover',
      })
      .jpeg({ quality: 75, progressive: true })
      .toFile(paths.thumbnail);

    return relativePaths;
  } catch (error) {
    // Si falla, limpiar archivos parcialmente creados
    await cleanupFiles(Object.values(paths));
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
 * Elimina un conjunto de archivos de imagen (todas las versiones)
 * @param imageUrl - URL relativa de la imagen (medium)
 */
export const deleteImageFiles = async (imageUrl: string): Promise<void> => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'products');

    // Extraer nombre del archivo de la URL
    const filename = path.basename(imageUrl);

    console.log(`[DELETE FILES] Eliminando archivos para: ${imageUrl}`);
    console.log(`[DELETE FILES] Filename extraído: ${filename}`);

    const paths = [
      path.join(uploadsDir, 'thumbnails', filename),
      path.join(uploadsDir, 'medium', filename),
      path.join(uploadsDir, 'original', filename),
    ];

    console.log(`[DELETE FILES] Rutas a eliminar:`, paths);

    await cleanupFiles(paths);
    console.log(`[DELETE FILES] ✅ Archivos eliminados exitosamente`);
  } catch (error) {
    console.error('[DELETE FILES] ❌ Error al eliminar archivos:', error);
    // No lanzar error, solo registrar
  }
};

/**
 * Asegura que las carpetas de uploads existan
 */
const ensureDirectories = async (): Promise<void> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'products');

  const dirs = [
    path.join(uploadsDir, 'thumbnails'),
    path.join(uploadsDir, 'medium'),
    path.join(uploadsDir, 'original'),
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

/**
 * Limpia archivos del sistema de archivos
 */
const cleanupFiles = async (filePaths: string[]): Promise<void> => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      console.log(`[CLEANUP] ✅ Eliminado: ${filePath}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[CLEANUP] ⚠️  Archivo no existe: ${filePath}`);
      } else {
        console.error(`[CLEANUP] ❌ Error eliminando ${filePath}:`, error);
      }
    }
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
    .filter((url: string) => url && url.startsWith('/uploads/'));
};

/**
 * Procesa una imagen para colecciones (solo 1 tamaño: 800x600)
 */
export const processCollectionImage = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const ext = 'jpg';
  const uploadsDir = path.join(process.cwd(), 'uploads', 'collections');

  // Asegurar que la carpeta existe
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, `${filename}.${ext}`);
  const relativeUrl = `/uploads/collections/${filename}.${ext}`;

  try {
    // Procesar imagen (800x600, quality 85%)
    await sharp(buffer)
      .resize(800, 600, {
        fit: 'cover',
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(filePath);

    return relativeUrl;
  } catch (error) {
    // Si hay error, intentar limpiar
    try {
      await fs.unlink(filePath);
    } catch {}
    throw error;
  }
};

/**
 * Elimina archivo de imagen de colección
 */
export const deleteCollectionImage = async (imageUrl: string): Promise<void> => {
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'collections', filename);

    await fs.unlink(filePath);
  } catch (error: any) {
    // Ignorar error si el archivo no existe
    if (error.code !== 'ENOENT') {
      console.error('Error al eliminar imagen de colección:', error);
    }
  }
};
